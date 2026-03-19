import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase client with the caller's JWT to verify admin status
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser()
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if caller is admin
    const { data: callerAuthor } = await callerClient
      .from('authors')
      .select('is_admin')
      .eq('id', caller.id)
      .single()

    if (!callerAuthor?.is_admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role client for admin operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const { accounts } = await req.json()
    if (!accounts || !Array.isArray(accounts)) {
      return new Response(JSON.stringify({ error: 'accounts array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let created = 0
    let skipped = 0
    let failed = 0
    const errors: { email: string; error: string }[] = []

    for (const account of accounts) {
      const { email, author_id } = account

      if (!email || !author_id) {
        errors.push({ email: email || 'unknown', error: 'Missing email or author_id' })
        failed++
        continue
      }

      try {
        // Check if auth user already exists for this email
        const { data: existingUsers } = await adminClient.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(
          (u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase()
        )

        if (existingUser) {
          skipped++
          continue
        }

        // Create auth user with the same UUID as the existing author record
        const randomPassword = crypto.randomUUID() + crypto.randomUUID()

        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          id: author_id,
          email,
          password: randomPassword,
          email_confirm: true,
        })

        if (createError) {
          throw createError
        }

        // Generate password recovery link and send email
        const { error: linkError } = await adminClient.auth.admin.generateLink({
          type: 'recovery',
          email,
        })

        if (linkError) {
          console.error('Recovery link error:', linkError)
          // User was created but recovery email failed - still count as created
        }

        created++
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        errors.push({ email, error: errorMessage })
        failed++
      }
    }

    return new Response(
      JSON.stringify({ created, skipped, failed, errors: errors.slice(0, 50) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
