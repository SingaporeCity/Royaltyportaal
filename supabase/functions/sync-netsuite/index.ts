// ============================================
// NETSUITE SYNC EDGE FUNCTION
// Synchroniseert auteurs vanuit NetSuite naar Supabase
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// NetSuite OAuth 1.0 signature generation
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')

  const signatureBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&')

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`

  // HMAC-SHA256
  const encoder = new TextEncoder()
  const keyData = encoder.encode(signingKey)
  const messageData = encoder.encode(signatureBase)

  // Note: In production, use crypto.subtle for HMAC-SHA256
  // This is a simplified version - use a proper OAuth library
  return btoa(signatureBase.slice(0, 32)) // Placeholder
}

// Generate OAuth header for NetSuite
function generateNetSuiteAuthHeader(
  method: string,
  url: string,
  config: {
    accountId: string
    consumerKey: string
    consumerSecret: string
    tokenId: string
    tokenSecret: string
    realm: string
  }
): string {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = crypto.randomUUID().replace(/-/g, '')

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: config.consumerKey,
    oauth_token: config.tokenId,
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
  }

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    config.consumerSecret,
    config.tokenSecret
  )

  oauthParams.oauth_signature = signature

  const headerParts = Object.entries(oauthParams)
    .map(([key, value]) => `${key}="${encodeURIComponent(value)}"`)
    .join(', ')

  return `OAuth realm="${config.realm}", ${headerParts}`
}

// Map NetSuite vendor data to Supabase author format
function mapVendorToAuthor(vendor: any): Record<string, any> {
  // Parse address (format: "Straat 123" -> street: "Straat", house_number: "123")
  let street = ''
  let houseNumber = ''
  if (vendor.address?.addr1) {
    const addressMatch = vendor.address.addr1.match(/^(.+?)\s+(\d+.*)$/)
    if (addressMatch) {
      street = addressMatch[1]
      houseNumber = addressMatch[2]
    } else {
      street = vendor.address.addr1
    }
  }

  return {
    netsuite_internal_id: vendor.id,
    netsuite_vendor_id: vendor.entityid || vendor.entityId,
    email: vendor.email?.toLowerCase(),
    first_name: vendor.firstname || vendor.firstName || '',
    last_name: vendor.lastname || vendor.lastName || '',
    voorletters: vendor.custentity_voorletters || null,
    phone: vendor.phone || null,
    street: street || null,
    house_number: houseNumber || null,
    postcode: vendor.address?.zip || null,
    country: vendor.address?.country || 'Nederland',
    bank_account: vendor.custentity_iban || null,
    bic: vendor.custentity_bic || null,
    bsn: vendor.custentity_bsn || null,
    birth_date: vendor.custentity_geboortedatum || null,
    initials: (vendor.firstname?.[0] || '') + (vendor.lastname?.[0] || '').toUpperCase() || null,
    is_admin: false,
    is_active: true,
    last_synced_at: new Date().toISOString(),
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const body = await req.json().catch(() => ({}))
    const syncType = body.type || 'incremental' // 'full', 'incremental', 'csv_import'
    const csvData = body.csvData || null
    const triggeredBy = body.triggeredBy || null

    console.log(`Starting ${syncType} sync...`)

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await supabase
      .from('sync_log')
      .insert({
        sync_type: syncType,
        triggered_by: triggeredBy,
        status: 'running'
      })
      .select()
      .single()

    if (syncLogError) {
      console.error('Failed to create sync log:', syncLogError)
    }

    let processed = 0
    let created = 0
    let updated = 0
    let failed = 0
    const errors: any[] = []

    // ===== CSV IMPORT MODE =====
    if (syncType === 'csv_import' && csvData) {
      console.log('Processing CSV import...')

      for (const row of csvData) {
        try {
          const authorData = {
            netsuite_internal_id: parseInt(row.internal_id) || null,
            netsuite_vendor_id: row.vendor_id || row.entityid,
            email: row.email?.toLowerCase(),
            first_name: row.first_name || row.firstname || '',
            last_name: row.last_name || row.lastname || '',
            voorletters: row.voorletters || null,
            phone: row.phone || null,
            street: row.street || null,
            house_number: row.house_number || null,
            postcode: row.postcode || row.zip || null,
            country: row.country || 'Nederland',
            bank_account: row.iban || row.bank_account || null,
            bic: row.bic || null,
            bsn: row.bsn || null,
            birth_date: row.birth_date || row.geboortedatum || null,
            initials: ((row.first_name || row.firstname || '')[0] + (row.last_name || row.lastname || '')[0]).toUpperCase() || null,
            is_admin: false,
            is_active: true,
            last_synced_at: new Date().toISOString(),
          }

          if (!authorData.email) {
            errors.push({ row, error: 'Missing email' })
            failed++
            continue
          }

          // Check if author exists
          const { data: existing } = await supabase
            .from('authors')
            .select('id')
            .eq('email', authorData.email)
            .single()

          if (existing) {
            // Update existing
            const { error } = await supabase
              .from('authors')
              .update(authorData)
              .eq('id', existing.id)

            if (error) {
              errors.push({ email: authorData.email, error: error.message })
              failed++
            } else {
              updated++
            }
          } else {
            // Insert new - need to create auth user first
            // Note: In production, you'd create the auth user here
            // For now, just insert into authors table
            const { error } = await supabase
              .from('authors')
              .insert(authorData)

            if (error) {
              errors.push({ email: authorData.email, error: error.message })
              failed++
            } else {
              created++
            }
          }

          processed++
        } catch (err) {
          errors.push({ row, error: err.message })
          failed++
        }
      }
    }

    // ===== NETSUITE API MODE =====
    else if (syncType === 'full' || syncType === 'incremental') {
      // Get NetSuite credentials from environment
      const netsuiteConfig = {
        accountId: Deno.env.get('NETSUITE_ACCOUNT_ID') || '',
        consumerKey: Deno.env.get('NETSUITE_CONSUMER_KEY') || '',
        consumerSecret: Deno.env.get('NETSUITE_CONSUMER_SECRET') || '',
        tokenId: Deno.env.get('NETSUITE_TOKEN_ID') || '',
        tokenSecret: Deno.env.get('NETSUITE_TOKEN_SECRET') || '',
        realm: Deno.env.get('NETSUITE_REALM') || '',
      }

      // Validate credentials
      if (!netsuiteConfig.accountId || !netsuiteConfig.consumerKey) {
        throw new Error('NetSuite credentials not configured. Set environment variables.')
      }

      // Build NetSuite REST API URL
      const baseUrl = `https://${netsuiteConfig.accountId}.suitetalk.api.netsuite.com`
      let apiUrl = `${baseUrl}/services/rest/record/v1/vendor?limit=1000`

      // For incremental sync, only get records modified in last 24 hours
      if (syncType === 'incremental') {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const dateStr = yesterday.toISOString().split('T')[0]
        apiUrl += `&q=lastmodifieddate ON_OR_AFTER "${dateStr}"`
      }

      // Add filter for vendors that are authors (if applicable)
      // apiUrl += ` AND category IS "Author"`

      console.log('Fetching from NetSuite:', apiUrl)

      // Generate OAuth header
      const authHeader = generateNetSuiteAuthHeader('GET', apiUrl, netsuiteConfig)

      // Fetch vendors from NetSuite
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Prefer': 'transient',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`NetSuite API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      const vendors = result.items || []

      console.log(`Found ${vendors.length} vendors to process`)

      // Process each vendor
      for (const vendor of vendors) {
        try {
          const authorData = mapVendorToAuthor(vendor)

          if (!authorData.email) {
            errors.push({ vendor_id: vendor.entityid, error: 'Missing email' })
            failed++
            continue
          }

          // Upsert author
          const { data: existing } = await supabase
            .from('authors')
            .select('id')
            .eq('netsuite_internal_id', vendor.id)
            .single()

          if (existing) {
            const { error } = await supabase
              .from('authors')
              .update(authorData)
              .eq('id', existing.id)

            if (error) {
              errors.push({ vendor_id: vendor.entityid, error: error.message })
              failed++
            } else {
              updated++
            }
          } else {
            const { error } = await supabase
              .from('authors')
              .insert(authorData)

            if (error) {
              errors.push({ vendor_id: vendor.entityid, error: error.message })
              failed++
            } else {
              created++
            }
          }

          processed++
        } catch (err) {
          errors.push({ vendor_id: vendor.entityid, error: err.message })
          failed++
        }
      }
    }

    // Update sync log with results
    if (syncLog) {
      await supabase
        .from('sync_log')
        .update({
          completed_at: new Date().toISOString(),
          records_processed: processed,
          records_created: created,
          records_updated: updated,
          records_failed: failed,
          errors: errors.length > 0 ? errors : null,
          status: failed > 0 && created === 0 && updated === 0 ? 'failed' : 'completed',
        })
        .eq('id', syncLog.id)
    }

    console.log(`Sync completed: ${processed} processed, ${created} created, ${updated} updated, ${failed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        sync_id: syncLog?.id,
        processed,
        created,
        updated,
        failed,
        errors: errors.slice(0, 10), // Return first 10 errors
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Sync error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
