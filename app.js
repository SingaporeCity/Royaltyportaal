// ============================================
// SUPABASE CLIENT INITIALIZATION
// ============================================

// Initialize Supabase client (config.js must be loaded first)
let supabaseClient = null;
if (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined' && USE_SUPABASE) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized');
}

// Current user data from Supabase
let currentAuthorData = null;
let isSupabaseMode = false;
let adminAuthorsData = {}; // Stores all authors for admin view

// ============================================
// SUPABASE AUTH FUNCTIONS
// ============================================

async function supabaseLogin(email, password) {
    if (!supabaseClient) return { error: 'Supabase not initialized' };

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Supabase login error:', error);
            return { error: error.message };
        }

        console.log('Supabase login successful:', data.user.email);

        // Fetch author profile
        const authorData = await fetchAuthorProfile(data.user.id);
        if (authorData.error) {
            return { error: authorData.error };
        }

        // Record login history
        await recordLoginHistory(data.user.id);

        return { data: authorData.data, user: data.user };
    } catch (err) {
        console.error('Login exception:', err);
        return { error: err.message };
    }
}

async function fetchAuthorProfile(userId) {
    if (!supabaseClient) return { error: 'Supabase not initialized' };

    try {
        // Fetch author data
        const { data: author, error: authorError } = await supabaseClient
            .from('authors')
            .select('*')
            .eq('id', userId)
            .single();

        if (authorError) {
            console.error('Error fetching author:', authorError);
            return { error: authorError.message };
        }

        // Fetch contracts
        const { data: contracts, error: contractsError } = await supabaseClient
            .from('contracts')
            .select('*')
            .eq('author_id', userId);

        if (contractsError) {
            console.error('Error fetching contracts:', contractsError);
        }

        // Fetch payments
        const { data: payments, error: paymentsError } = await supabaseClient
            .from('payments')
            .select('*')
            .eq('author_id', userId)
            .order('year', { ascending: false });

        if (paymentsError) {
            console.error('Error fetching payments:', paymentsError);
        }

        // Fetch forecast
        const { data: forecasts, error: forecastError } = await supabaseClient
            .from('forecasts')
            .select('*')
            .eq('author_id', userId)
            .order('year', { ascending: false })
            .limit(1);

        if (forecastError) {
            console.error('Error fetching forecast:', forecastError);
        }

        // Fetch change requests
        const { data: changeRequests, error: changesError } = await supabaseClient
            .from('change_requests')
            .select('*')
            .eq('author_id', userId)
            .order('requested_at', { ascending: false });

        if (changesError) {
            console.error('Error fetching changes:', changesError);
        }

        // Fetch login history
        const { data: loginHistory, error: loginError } = await supabaseClient
            .from('login_history')
            .select('*')
            .eq('author_id', userId)
            .order('logged_in_at', { ascending: false })
            .limit(10);

        if (loginError) {
            console.error('Error fetching login history:', loginError);
        }

        // Transform to app format
        const authorProfile = {
            id: author.id,
            isAdmin: author.is_admin,
            info: {
                vendorNumber: author.netsuite_vendor_id || '',
                alliantNumber: author.netsuite_internal_id?.toString() || '',
                firstName: author.first_name,
                voorletters: author.voorletters || '',
                lastName: author.last_name,
                bsn: author.bsn || '',
                email: author.email,
                street: author.street || '',
                houseNumber: author.house_number || '',
                postcode: author.postcode || '',
                country: author.country || 'Nederland',
                birthDate: author.birth_date || '',
                phone: author.phone || '',
                bankAccount: author.bank_account || '',
                bic: author.bic || '',
                initials: author.initials || (author.first_name[0] + author.last_name[0]).toUpperCase()
            },
            contracts: (contracts || []).map(c => ({
                number: c.contract_number,
                name: c.contract_name,
                contractPdf: c.contract_pdf
            })),
            payments: (payments || []).map(p => ({
                year: p.year,
                type: p.type,
                title: { nl: p.title_nl, en: p.title_en },
                date: { nl: p.date_nl, en: p.date_en },
                sortDate: p.sort_date,
                amount: parseFloat(p.amount),
                filename: p.filename
            })),
            prediction: forecasts && forecasts.length > 0
                ? { min: parseFloat(forecasts[0].min_amount), max: parseFloat(forecasts[0].max_amount) }
                : { min: 0, max: 0 },
            infoChanges: (changeRequests || []).map(c => ({
                id: c.id,
                date: c.requested_at,
                field: c.field_name,
                old: c.old_value,
                new: c.new_value,
                status: c.status,
                processedDate: c.processed_at,
                rejectionReason: c.rejection_reason
            })),
            loginHistory: (loginHistory || []).map(l => l.logged_in_at)
        };

        return { data: authorProfile };
    } catch (err) {
        console.error('Fetch profile exception:', err);
        return { error: err.message };
    }
}

async function recordLoginHistory(userId) {
    if (!supabaseClient) return;

    try {
        await supabaseClient
            .from('login_history')
            .insert({ author_id: userId });
    } catch (err) {
        console.error('Error recording login:', err);
    }
}

async function supabaseLogout() {
    if (!supabaseClient) return;

    try {
        await supabaseClient.auth.signOut();
        currentAuthorData = null;
        isSupabaseMode = false;
    } catch (err) {
        console.error('Logout error:', err);
    }
}

// ============================================
// PUBLIC SITE NAVIGATION
// ============================================

function showPublicSite() {
    document.getElementById('publicSite').classList.remove('hidden');
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
    document.body.style.overflow = '';
    window.scrollTo(0, 0);
}

function showLoginPage() {
    document.getElementById('publicSite').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('loginPage').style.display = '';
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
    document.body.style.overflow = '';
    // Close mobile menu if open
    const navLinks = document.getElementById('navLinks');
    if (navLinks) navLinks.classList.remove('mobile-open');
    const hamburger = document.getElementById('hamburgerBtn');
    if (hamburger) hamburger.classList.remove('active');
}

function showDashboard(isAdmin) {
    document.getElementById('publicSite').classList.add('hidden');
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('loginPage').style.display = 'none';
    if (isAdmin) {
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('adminDashboard').classList.remove('hidden');
        document.getElementById('adminDashboard').style.display = '';
    } else {
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('dashboard').style.display = '';
        document.getElementById('adminDashboard').classList.add('hidden');
    }
}

// ============================================
// MOBILE MENU
// ============================================

function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburgerBtn');
    navLinks.classList.toggle('mobile-open');
    hamburger.classList.toggle('active');
}

// ============================================
// SMOOTH SCROLL
// ============================================

function initSmoothScroll() {
    document.querySelectorAll('.public-nav-links a, .hero-cta a, .footer-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    // Close mobile menu
                    const navLinks = document.getElementById('navLinks');
                    const hamburger = document.getElementById('hamburgerBtn');
                    if (navLinks) navLinks.classList.remove('mobile-open');
                    if (hamburger) hamburger.classList.remove('active');

                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
}

// ============================================
// STICKY NAV
// ============================================

function initStickyNav() {
    const nav = document.getElementById('publicNav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

// ============================================
// PUBLIC SITE CONTENT
// ============================================

async function initPublicSite() {
    renderPublicFAQ();
    loadPublicEvents();
    loadPublicBlogPosts();
    initSmoothScroll();
    initStickyNav();
    initCounterAnimation();
}

// ===== COUNTER ANIMATION =====

function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number[data-count]');

    const observerOptions = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-count'));
                animateCounter(el, target);
                observer.unobserve(el);
            }
        });
    }, observerOptions);

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(el, target) {
    const duration = 2000;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

        const current = Math.round(eased * target);

        if (target >= 1000000) {
            el.textContent = (current / 1000000).toFixed(1).replace('.0', '') + 'M+';
        } else if (target >= 1000) {
            el.textContent = current.toLocaleString('nl-NL') + '+';
        } else {
            el.textContent = current + '+';
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

async function loadPublicEvents() {
    const container = document.getElementById('publicEventsList');
    if (!container) return;

    try {
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            const now = new Date().toISOString();
            const { data, error } = await supabaseClient
                .from('events')
                .select('*')
                .eq('is_active', true)
                .gte('event_date', now)
                .order('event_date', { ascending: true })
                .limit(3);

            if (!error && data && data.length > 0) {
                renderPublicEvents(data);
                return;
            }
        }
    } catch (e) {
        console.log('Public events: using fallback');
    }

    // Fallback content
    container.innerHTML = '<p class="no-content-message" data-i18n="no_events">' + t('no_events') + '</p>';
}

async function loadPublicBlogPosts() {
    const container = document.getElementById('publicBlogList');
    if (!container) return;

    try {
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            const { data, error } = await supabaseClient
                .from('blog_posts')
                .select('*')
                .eq('is_published', true)
                .order('published_at', { ascending: false })
                .limit(3);

            if (!error && data && data.length > 0) {
                renderPublicBlogPosts(data);
                return;
            }
        }
    } catch (e) {
        console.log('Public blog: using fallback');
    }

    // Fallback content
    container.innerHTML = '<p class="no-content-message" data-i18n="no_news">' + t('no_news') + '</p>';
}

function renderPublicEvents(events) {
    const container = document.getElementById('publicEventsList');
    if (!container) return;

    container.innerHTML = events.map(event => {
        const date = new Date(event.event_date).toLocaleDateString(currentLang === 'nl' ? 'nl-NL' : 'en-US', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        return `
            <div class="public-event-card">
                <span class="event-date">${date}</span>
                <h4>${event.title || ''}</h4>
                <p>${event.description || ''}</p>
                ${event.location ? `<span class="event-location">${event.location}</span>` : ''}
            </div>
        `;
    }).join('');
}

function renderPublicBlogPosts(posts) {
    const container = document.getElementById('publicBlogList');
    if (!container) return;

    container.innerHTML = posts.map(post => {
        const date = new Date(post.published_at).toLocaleDateString(currentLang === 'nl' ? 'nl-NL' : 'en-US', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        return `
            <div class="public-news-card">
                <span class="news-date">${date}</span>
                <h4>${post.title || ''}</h4>
                <p>${(post.content || '').substring(0, 150)}${(post.content || '').length > 150 ? '...' : ''}</p>
            </div>
        `;
    }).join('');
}

function renderPublicFAQ() {
    const container = document.getElementById('publicFaqList');
    if (!container) return;

    const faqs = [
        { q: t('public_faq_q1'), a: t('public_faq_a1') },
        { q: t('public_faq_q2'), a: t('public_faq_a2') },
        { q: t('public_faq_q3'), a: t('public_faq_a3') },
        { q: t('public_faq_q4'), a: t('public_faq_a4') },
        { q: t('public_faq_q5'), a: t('public_faq_a5') },
        { q: t('public_faq_q6'), a: t('public_faq_a6') }
    ];

    container.innerHTML = faqs.map(faq => `
        <div class="public-faq-item">
            <div class="public-faq-question" onclick="this.parentElement.classList.toggle('open')">
                <span>${faq.q}</span>
                <span class="faq-toggle">+</span>
            </div>
            <div class="public-faq-answer">
                <p>${faq.a}</p>
            </div>
        </div>
    `).join('');
}

function handleContactForm(e) {
    e.preventDefault();
    const form = e.target;
    const wrapper = form.parentElement;
    form.style.display = 'none';
    const successMsg = document.createElement('div');
    successMsg.className = 'contact-success';
    successMsg.textContent = t('contact_success');
    wrapper.appendChild(successMsg);

    // Reset after 5 seconds
    setTimeout(() => {
        form.reset();
        form.style.display = '';
        successMsg.remove();
    }, 5000);
}

// ============================================
// EVENTS & BLOG POSTS FUNCTIONS
// ============================================

// Load upcoming events (max 3, only future events)
async function loadEvents() {
    if (!supabaseClient) {
        renderEvents([]);
        return;
    }

    try {
        const now = new Date().toISOString();
        const { data: events, error } = await supabaseClient
            .from('events')
            .select('*')
            .eq('is_active', true)
            .gte('event_date', now)
            .order('event_date', { ascending: true })
            .limit(3);

        if (error) {
            console.error('Error fetching events:', error);
            renderEvents([]);
            return;
        }

        renderEvents(events || []);
    } catch (err) {
        console.error('Load events exception:', err);
        renderEvents([]);
    }
}

function renderEvents(events) {
    const container = document.getElementById('eventsContainer');
    if (!container) return;

    if (!events || events.length === 0) {
        container.innerHTML = '<p class="empty-state">Geen aankomende evenementen</p>';
        return;
    }

    container.innerHTML = events.map(event => {
        const eventDate = new Date(event.event_date);
        const day = eventDate.getDate();
        const month = eventDate.toLocaleDateString('nl-NL', { month: 'short' });
        const time = eventDate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="event-card">
                <div class="event-date-badge">
                    <span class="event-day">${day}</span>
                    <span class="event-month">${month}</span>
                </div>
                <div class="event-details">
                    <h4 class="event-title">${event.title}</h4>
                    ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
                    <div class="event-meta">
                        <span class="event-time">${time}</span>
                        ${event.location ? `<span class="event-location">${event.location}</span>` : ''}
                    </div>
                </div>
                ${event.link ? `<a href="${event.link}" target="_blank" class="event-link">Meer info →</a>` : ''}
            </div>
        `;
    }).join('');
}

// Load latest blog posts (max 3, only published)
async function loadBlogPosts() {
    if (!supabaseClient) {
        renderBlogPosts([]);
        return;
    }

    try {
        const { data: posts, error } = await supabaseClient
            .from('blog_posts')
            .select('*')
            .eq('is_published', true)
            .order('published_at', { ascending: false })
            .limit(3);

        if (error) {
            console.error('Error fetching blog posts:', error);
            renderBlogPosts([]);
            return;
        }

        renderBlogPosts(posts || []);
    } catch (err) {
        console.error('Load blog posts exception:', err);
        renderBlogPosts([]);
    }
}

function renderBlogPosts(posts) {
    const container = document.getElementById('blogPostsContainer');
    if (!container) return;

    if (!posts || posts.length === 0) {
        container.innerHTML = '<p class="empty-state">Geen nieuwsberichten</p>';
        return;
    }

    container.innerHTML = posts.map(post => {
        const pubDate = post.published_at ? new Date(post.published_at).toLocaleDateString('nl-NL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }) : '';

        return `
            <div class="blog-card">
                ${post.image_url ? `<div class="blog-image" style="background-image:url('${post.image_url}')"></div>` : ''}
                <div class="blog-content">
                    <h4 class="blog-title">${post.title}</h4>
                    ${post.summary ? `<p class="blog-summary">${post.summary}</p>` : ''}
                    <div class="blog-meta">
                        <span class="blog-date">${pubDate}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// ADMIN: EVENTS MANAGEMENT
// ============================================

let currentEditingEvent = null;

function openEventsManager() {
    document.getElementById('eventsManagerModal').classList.add('active');
    loadEventsForAdmin();
}

function closeEventsManager() {
    document.getElementById('eventsManagerModal').classList.remove('active');
}

async function loadEventsForAdmin() {
    const container = document.getElementById('eventsManagerList');
    if (!supabaseClient) {
        container.innerHTML = '<p class="empty-state">Supabase niet beschikbaar</p>';
        return;
    }

    try {
        const { data: events, error } = await supabaseClient
            .from('events')
            .select('*')
            .order('event_date', { ascending: false });

        if (error) throw error;

        if (!events || events.length === 0) {
            container.innerHTML = '<p class="empty-state">Geen evenementen</p>';
            return;
        }

        container.innerHTML = events.map(event => {
            const eventDate = new Date(event.event_date);
            const dateStr = eventDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
            const isPast = eventDate < new Date();

            return `
                <div class="manager-item ${!event.is_active ? 'inactive' : ''} ${isPast ? 'past' : ''}">
                    <div class="manager-item-info">
                        <div class="manager-item-title">${event.title}</div>
                        <div class="manager-item-meta">${dateStr} ${event.location ? '• ' + event.location : ''}</div>
                        <div class="manager-item-status">${event.is_active ? 'Actief' : 'Inactief'} ${isPast ? '(verlopen)' : ''}</div>
                    </div>
                    <div class="manager-item-actions">
                        <button class="btn-small" onclick="openEventEditor('${event.id}')">Bewerken</button>
                        <button class="btn-small btn-danger" onclick="deleteEvent('${event.id}')">Verwijderen</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Error loading events for admin:', err);
        container.innerHTML = '<p class="empty-state">Fout bij laden: ' + err.message + '</p>';
    }
}

async function openEventEditor(eventId = null) {
    document.getElementById('eventEditorModal').classList.add('active');
    document.getElementById('editEventId').value = eventId || '';
    document.getElementById('eventEditorTitle').textContent = eventId ? 'Evenement bewerken' : 'Nieuw evenement';

    // Clear form
    document.getElementById('editEventTitle').value = '';
    document.getElementById('editEventDescription').value = '';
    document.getElementById('editEventDate').value = '';
    document.getElementById('editEventTime').value = '';
    document.getElementById('editEventLocation').value = '';
    document.getElementById('editEventLink').value = '';
    document.getElementById('editEventActive').checked = true;

    if (eventId && supabaseClient) {
        try {
            const { data: event, error } = await supabaseClient
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();

            if (error) throw error;

            const eventDate = new Date(event.event_date);
            document.getElementById('editEventTitle').value = event.title || '';
            document.getElementById('editEventDescription').value = event.description || '';
            document.getElementById('editEventDate').value = eventDate.toISOString().split('T')[0];
            document.getElementById('editEventTime').value = eventDate.toTimeString().slice(0, 5);
            document.getElementById('editEventLocation').value = event.location || '';
            document.getElementById('editEventLink').value = event.link || '';
            document.getElementById('editEventActive').checked = event.is_active;
        } catch (err) {
            console.error('Error loading event:', err);
            alert('Fout bij laden evenement: ' + err.message);
        }
    }
}

function closeEventEditor() {
    document.getElementById('eventEditorModal').classList.remove('active');
}

async function saveEvent() {
    if (!supabaseClient) {
        alert('Supabase niet beschikbaar');
        return;
    }

    const eventId = document.getElementById('editEventId').value;
    const title = document.getElementById('editEventTitle').value.trim();
    const dateStr = document.getElementById('editEventDate').value;
    const timeStr = document.getElementById('editEventTime').value || '12:00';

    if (!title || !dateStr) {
        alert('Vul minimaal een titel en datum in');
        return;
    }

    const eventDate = new Date(`${dateStr}T${timeStr}`);

    const eventData = {
        title: title,
        description: document.getElementById('editEventDescription').value.trim() || null,
        event_date: eventDate.toISOString(),
        location: document.getElementById('editEventLocation').value.trim() || null,
        link: document.getElementById('editEventLink').value.trim() || null,
        is_active: document.getElementById('editEventActive').checked
    };

    try {
        if (eventId) {
            const { error } = await supabaseClient
                .from('events')
                .update(eventData)
                .eq('id', eventId);
            if (error) throw error;
        } else {
            const { error } = await supabaseClient
                .from('events')
                .insert(eventData);
            if (error) throw error;
        }

        closeEventEditor();
        loadEventsForAdmin();
    } catch (err) {
        console.error('Error saving event:', err);
        alert('Fout bij opslaan: ' + err.message);
    }
}

async function deleteEvent(eventId) {
    if (!confirm('Weet je zeker dat je dit evenement wilt verwijderen?')) return;
    if (!supabaseClient) return;

    try {
        const { error } = await supabaseClient
            .from('events')
            .delete()
            .eq('id', eventId);

        if (error) throw error;
        loadEventsForAdmin();
    } catch (err) {
        console.error('Error deleting event:', err);
        alert('Fout bij verwijderen: ' + err.message);
    }
}

// ============================================
// ADMIN: BLOG POSTS MANAGEMENT
// ============================================

function openBlogManager() {
    document.getElementById('blogManagerModal').classList.add('active');
    loadBlogPostsForAdmin();
}

function closeBlogManager() {
    document.getElementById('blogManagerModal').classList.remove('active');
}

async function loadBlogPostsForAdmin() {
    const container = document.getElementById('blogManagerList');
    if (!supabaseClient) {
        container.innerHTML = '<p class="empty-state">Supabase niet beschikbaar</p>';
        return;
    }

    try {
        const { data: posts, error } = await supabaseClient
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!posts || posts.length === 0) {
            container.innerHTML = '<p class="empty-state">Geen nieuwsberichten</p>';
            return;
        }

        container.innerHTML = posts.map(post => {
            const createdDate = new Date(post.created_at).toLocaleDateString('nl-NL');

            return `
                <div class="manager-item ${!post.is_published ? 'inactive' : ''}">
                    <div class="manager-item-info">
                        <div class="manager-item-title">${post.title}</div>
                        <div class="manager-item-meta">Aangemaakt: ${createdDate}</div>
                        <div class="manager-item-status">${post.is_published ? 'Gepubliceerd' : 'Concept'}</div>
                    </div>
                    <div class="manager-item-actions">
                        <button class="btn-small" onclick="openBlogEditor('${post.id}')">Bewerken</button>
                        <button class="btn-small btn-danger" onclick="deleteBlogPost('${post.id}')">Verwijderen</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Error loading blog posts for admin:', err);
        container.innerHTML = '<p class="empty-state">Fout bij laden: ' + err.message + '</p>';
    }
}

async function openBlogEditor(postId = null) {
    document.getElementById('blogEditorModal').classList.add('active');
    document.getElementById('editBlogId').value = postId || '';
    document.getElementById('blogEditorTitle').textContent = postId ? 'Bericht bewerken' : 'Nieuw nieuwsbericht';

    // Clear form
    document.getElementById('editBlogTitle').value = '';
    document.getElementById('editBlogSummary').value = '';
    document.getElementById('editBlogContent').value = '';
    document.getElementById('editBlogImageUrl').value = '';
    document.getElementById('editBlogPublished').checked = false;

    if (postId && supabaseClient) {
        try {
            const { data: post, error } = await supabaseClient
                .from('blog_posts')
                .select('*')
                .eq('id', postId)
                .single();

            if (error) throw error;

            document.getElementById('editBlogTitle').value = post.title || '';
            document.getElementById('editBlogSummary').value = post.summary || '';
            document.getElementById('editBlogContent').value = post.content || '';
            document.getElementById('editBlogImageUrl').value = post.image_url || '';
            document.getElementById('editBlogPublished').checked = post.is_published;
        } catch (err) {
            console.error('Error loading blog post:', err);
            alert('Fout bij laden bericht: ' + err.message);
        }
    }
}

function closeBlogEditor() {
    document.getElementById('blogEditorModal').classList.remove('active');
}

async function saveBlogPost() {
    if (!supabaseClient) {
        alert('Supabase niet beschikbaar');
        return;
    }

    const postId = document.getElementById('editBlogId').value;
    const title = document.getElementById('editBlogTitle').value.trim();
    const content = document.getElementById('editBlogContent').value.trim();
    const isPublished = document.getElementById('editBlogPublished').checked;

    if (!title || !content) {
        alert('Vul minimaal een titel en inhoud in');
        return;
    }

    const postData = {
        title: title,
        summary: document.getElementById('editBlogSummary').value.trim() || null,
        content: content,
        image_url: document.getElementById('editBlogImageUrl').value.trim() || null,
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : null
    };

    try {
        if (postId) {
            // Keep original published_at if already published
            if (isPublished) {
                const { data: existing } = await supabaseClient
                    .from('blog_posts')
                    .select('published_at')
                    .eq('id', postId)
                    .single();
                if (existing?.published_at) {
                    postData.published_at = existing.published_at;
                }
            }

            const { error } = await supabaseClient
                .from('blog_posts')
                .update(postData)
                .eq('id', postId);
            if (error) throw error;
        } else {
            const { error } = await supabaseClient
                .from('blog_posts')
                .insert(postData);
            if (error) throw error;
        }

        closeBlogEditor();
        loadBlogPostsForAdmin();
    } catch (err) {
        console.error('Error saving blog post:', err);
        alert('Fout bij opslaan: ' + err.message);
    }
}

async function deleteBlogPost(postId) {
    if (!confirm('Weet je zeker dat je dit bericht wilt verwijderen?')) return;
    if (!supabaseClient) return;

    try {
        const { error } = await supabaseClient
            .from('blog_posts')
            .delete()
            .eq('id', postId);

        if (error) throw error;
        loadBlogPostsForAdmin();
    } catch (err) {
        console.error('Error deleting blog post:', err);
        alert('Fout bij verwijderen: ' + err.message);
    }
}

// ============================================
// SUPABASE ADMIN FUNCTIONS
// ============================================

async function fetchAllAuthors() {
    if (!supabaseClient) return { error: 'Supabase not initialized' };

    try {
        const { data: authors, error } = await supabaseClient
            .from('authors')
            .select('*')
            .eq('is_admin', false)
            .order('last_name');

        if (error) {
            console.error('Error fetching authors:', error);
            return { error: error.message };
        }

        return { data: authors };
    } catch (err) {
        console.error('Fetch authors exception:', err);
        return { error: err.message };
    }
}

// Load all authors with full data for admin dashboard
async function loadAllAuthorsForAdmin() {
    if (!supabaseClient) return { error: 'Supabase not initialized' };

    try {
        // Fetch all non-admin authors
        const { data: authors, error: authorsError } = await supabaseClient
            .from('authors')
            .select('*')
            .eq('is_admin', false)
            .order('last_name');

        if (authorsError) {
            console.error('Error fetching authors:', authorsError);
            return { error: authorsError.message };
        }

        // Fetch all related data in parallel
        const [contractsResult, paymentsResult, forecastsResult, changesResult, loginsResult] = await Promise.all([
            supabaseClient.from('contracts').select('*'),
            supabaseClient.from('payments').select('*').order('year', { ascending: false }),
            supabaseClient.from('forecasts').select('*'),
            supabaseClient.from('change_requests').select('*').order('requested_at', { ascending: false }),
            supabaseClient.from('login_history').select('*').order('logged_in_at', { ascending: false })
        ]);

        const contracts = contractsResult.data || [];
        const payments = paymentsResult.data || [];
        const forecasts = forecastsResult.data || [];
        const changes = changesResult.data || [];
        const logins = loginsResult.data || [];

        // Transform to app format (keyed by email)
        adminAuthorsData = {};
        authors.forEach(author => {
            const authorContracts = contracts.filter(c => c.author_id === author.id);
            const authorPayments = payments.filter(p => p.author_id === author.id);
            const authorForecast = forecasts.find(f => f.author_id === author.id);
            const authorChanges = changes.filter(c => c.author_id === author.id);
            const authorLogins = logins.filter(l => l.author_id === author.id);

            adminAuthorsData[author.email] = {
                id: author.id,
                isAdmin: author.is_admin,
                info: {
                    vendorNumber: author.netsuite_vendor_id || '',
                    alliantNumber: author.netsuite_internal_id?.toString() || '',
                    firstName: author.first_name,
                    voorletters: author.voorletters || '',
                    lastName: author.last_name,
                    bsn: author.bsn || '',
                    email: author.email,
                    street: author.street || '',
                    houseNumber: author.house_number || '',
                    postcode: author.postcode || '',
                    country: author.country || 'Nederland',
                    birthDate: author.birth_date || '',
                    phone: author.phone || '',
                    bankAccount: author.bank_account || '',
                    bic: author.bic || '',
                    initials: author.initials || (author.first_name[0] + author.last_name[0]).toUpperCase()
                },
                contracts: authorContracts.map(c => ({
                    id: c.id,
                    number: c.contract_number,
                    name: c.contract_name,
                    contractPdf: c.contract_pdf
                })),
                payments: authorPayments.map(p => ({
                    id: p.id,
                    year: p.year,
                    type: p.type,
                    title: { nl: p.title_nl, en: p.title_en },
                    date: { nl: p.date_nl, en: p.date_en },
                    sortDate: p.sort_date,
                    amount: parseFloat(p.amount),
                    filename: p.filename
                })),
                prediction: authorForecast
                    ? { min: parseFloat(authorForecast.min_amount), max: parseFloat(authorForecast.max_amount) }
                    : { min: 0, max: 0 },
                infoChanges: authorChanges.map(c => ({
                    id: c.id,
                    date: c.requested_at,
                    field: c.field_name,
                    old: c.old_value,
                    new: c.new_value,
                    status: c.status,
                    processedDate: c.processed_at,
                    rejectionReason: c.rejection_reason
                })),
                loginHistory: authorLogins.map(l => l.logged_in_at)
            };
        });

        console.log('Loaded', Object.keys(adminAuthorsData).length, 'authors for admin');
        return { data: adminAuthorsData };
    } catch (err) {
        console.error('Load authors exception:', err);
        return { error: err.message };
    }
}

// Helper function to get authors data (Supabase or local)
function getAuthorsData() {
    if (isSupabaseMode && Object.keys(adminAuthorsData).length > 0) {
        console.log('📦 Data source: SUPABASE (' + Object.keys(adminAuthorsData).length + ' auteurs)');
        return adminAuthorsData;
    }
    console.log('📦 Data source: LOCAL DATA (' + Object.keys(DATA.authors).length + ' auteurs)');
    return DATA.authors;
}

async function fetchAllPendingChanges() {
    if (!supabaseClient) return { error: 'Supabase not initialized' };

    try {
        const { data: changes, error } = await supabaseClient
            .from('change_requests')
            .select(`
                *,
                authors (
                    first_name,
                    last_name,
                    email
                )
            `)
            .eq('status', 'pending')
            .order('requested_at', { ascending: false });

        if (error) {
            console.error('Error fetching pending changes:', error);
            return { error: error.message };
        }

        return { data: changes };
    } catch (err) {
        console.error('Fetch changes exception:', err);
        return { error: err.message };
    }
}

async function approveChangeRequest(changeId) {
    if (!supabaseClient) return { error: 'Supabase not initialized' };

    try {
        const { error } = await supabaseClient
            .from('change_requests')
            .update({
                status: 'approved',
                processed_at: new Date().toISOString()
            })
            .eq('id', changeId);

        if (error) {
            console.error('Error approving change:', error);
            return { error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Approve change exception:', err);
        return { error: err.message };
    }
}

async function rejectChangeRequest(changeId, reason) {
    if (!supabaseClient) return { error: 'Supabase not initialized' };

    try {
        const { error } = await supabaseClient
            .from('change_requests')
            .update({
                status: 'rejected',
                processed_at: new Date().toISOString(),
                rejection_reason: reason
            })
            .eq('id', changeId);

        if (error) {
            console.error('Error rejecting change:', error);
            return { error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Reject change exception:', err);
        return { error: err.message };
    }
}

async function submitChangeRequest(authorId, fieldName, oldValue, newValue) {
    if (!supabaseClient) return { error: 'Supabase not initialized' };

    try {
        const { error } = await supabaseClient
            .from('change_requests')
            .insert({
                author_id: authorId,
                field_name: fieldName,
                old_value: oldValue,
                new_value: newValue,
                status: 'pending'
            });

        if (error) {
            console.error('Error submitting change:', error);
            return { error: error.message };
        }

        console.log('📝 Change request submitted:', fieldName, oldValue, '→', newValue);
        return { success: true };
    } catch (err) {
        console.error('Submit change exception:', err);
        return { error: err.message };
    }
}

// Update author profile in Supabase (for non-sensitive fields that don't need approval)
async function updateAuthorInSupabase(authorId, updates) {
    if (!supabaseClient) return { error: 'Supabase not initialized' };

    try {
        const { error } = await supabaseClient
            .from('authors')
            .update(updates)
            .eq('id', authorId);

        if (error) {
            console.error('Error updating author:', error);
            return { error: error.message };
        }

        console.log('✅ Author updated in Supabase:', updates);
        return { success: true };
    } catch (err) {
        console.error('Update author exception:', err);
        return { error: err.message };
    }
}

// Refresh current author data from Supabase
async function refreshCurrentAuthorData() {
    if (!supabaseClient || !currentAuthorData) return;

    const result = await fetchAuthorProfile(currentAuthorData.id);
    if (result.data) {
        currentAuthorData = result.data;
        console.log('🔄 Author data refreshed from Supabase');
    }
}

// ============================================
// DATA STORE (FALLBACK FOR LOCAL TESTING)
// ============================================
const DATA = {
    admin: { email: 'admin@noordhoff.nl', password: 'Admin123' },
    authors: {
        'patrick@noordhoff.nl': {
            password: 'Patrick123',
            info: {
                vendorNumber: 'V0024123',
                alliantNumber: '2512345',
                firstName: 'Patrick',
                lastName: 'Jeeninga',
                voorletters: 'P.J.',
                bsn: '123456789',
                email: 'patrick@noordhoff.nl',
                street: 'Herengracht',
                houseNumber: '123',
                postcode: '1015 BH',
                country: 'Nederland',
                birthDate: '15-03-1978',
                phone: '+31 6 12345678',
                bankAccount: 'NL91 ABNA 0123 4567 01',
                bic: 'ABNANL2A',
                initials: 'PJ'
            },
            contracts: [
                { number: 'CC_14000', name: 'Moderne Wiskunde 13-14 BB', contractPdf: 'CC_14000_contract.pdf' },
                { number: 'CC_14001', name: 'Moderne Wiskunde 13-14 OB', contractPdf: 'CC_14001_contract.pdf' }
            ],
            infoChanges: [
                { id: 'test1_ph', date: '2025-01-15T10:30:00.000Z', field: 'Telefoonnummer', old: '+31 6 12345678', new: '+31 6 98765432', status: 'pending' },
                { id: 'test2_pc', date: '2025-01-10T14:20:00.000Z', field: 'Postcode', old: '1015 BH', new: '1016 AB', status: 'approved', processedDate: '2025-01-11T09:00:00.000Z' },
                { id: 'test3_ib', date: '2025-01-05T11:45:00.000Z', field: 'IBAN', old: 'NL91 ABNA 0123 4567 01', new: 'NL00 FAKE 9999 9999 99', status: 'rejected', processedDate: '2025-01-06T16:30:00.000Z', rejectionReason: 'IBAN verificatie mislukt - neem contact op met support.' }
            ],
            loginHistory: [],
            prediction: { min: 15000, max: 20000 },
            historicalRoyalties: [
                { year: 2024, amount: 17641.50 },
                { year: 2023, amount: 15420.00 }
            ],
            payments: [
                { year: 2024, type: 'royalty', title: { nl: 'Royalty-afrekening 2024', en: 'Royalty Statement 2024' }, date: { nl: '15 maart 2025', en: 'March 15, 2025' }, sortDate: '2025-03-15', amount: 17641.50, filename: 'royalty-2024.pdf' },
                { year: 2024, type: 'subsidiary', title: { nl: 'Nevenrechten 2024', en: 'Reader Rights 2024' }, date: { nl: '15 juni 2025', en: 'June 15, 2025' }, sortDate: '2025-06-15', amount: 1764.15, filename: 'nevenrechten-2024.pdf' },
                { year: 2024, type: 'foreign', title: { nl: 'Foreign Rights 2024', en: 'Foreign Rights 2024' }, date: { nl: '15 juli 2025', en: 'July 15, 2025' }, sortDate: '2025-07-15', amount: 705.66, filename: 'foreign-rights-2024.pdf' },
                { year: 2023, type: 'royalty', title: { nl: 'Royalty-afrekening 2023', en: 'Royalty Statement 2023' }, date: { nl: '15 maart 2024', en: 'March 15, 2024' }, sortDate: '2024-03-15', amount: 15420.00, filename: 'royalty-2023.pdf' },
                { year: 2023, type: 'subsidiary', title: { nl: 'Nevenrechten 2023', en: 'Reader Rights 2023' }, date: { nl: '15 juni 2024', en: 'June 15, 2024' }, sortDate: '2024-06-15', amount: 1542.00, filename: 'nevenrechten-2023.pdf' },
                { year: 2023, type: 'foreign', title: { nl: 'Foreign Rights 2023', en: 'Foreign Rights 2023' }, date: { nl: '15 juli 2024', en: 'July 15, 2024' }, sortDate: '2024-07-15', amount: 616.80, filename: 'foreign-rights-2023.pdf' }
            ]
        },
        'suzanna@noordhoff.nl': {
            password: 'Suzanna123',
            info: {
                vendorNumber: 'V0018756',
                alliantNumber: '2534892',
                firstName: 'Suzanna',
                lastName: 'van den Berg',
                voorletters: 'S.',
                bsn: '987654321',
                email: 'suzanna@noordhoff.nl',
                street: 'Keizersgracht',
                houseNumber: '456',
                postcode: '1016 GD',
                country: 'Nederland',
                birthDate: '22-07-1985',
                phone: '+31 6 23456789',
                bankAccount: 'NL45 INGB 0001 2345 67',
                bic: 'INGBNL2A',
                initials: 'SB'
            },
            contracts: [
                { number: 'CC_14000', name: 'Moderne Wiskunde 13-14 BB', contractPdf: 'CC_14000_contract.pdf' },
                { number: 'CC_14001', name: 'Moderne Wiskunde 13-14 OB', contractPdf: 'CC_14001_contract.pdf' }
            ],
            infoChanges: [],
            loginHistory: [],
            prediction: { min: 8000, max: 12000 },
            historicalRoyalties: [
                { year: 2024, amount: 9850.00 },
                { year: 2023, amount: 8720.50 }
            ],
            payments: [
                { year: 2024, type: 'royalty', title: { nl: 'Royalty-afrekening 2024', en: 'Royalty Statement 2024' }, date: { nl: '15 maart 2025', en: 'March 15, 2025' }, sortDate: '2025-03-15', amount: 9850.00, filename: 'royalty-2024.pdf' },
                { year: 2024, type: 'subsidiary', title: { nl: 'Nevenrechten 2024', en: 'Reader Rights 2024' }, date: { nl: '15 juni 2025', en: 'June 15, 2025' }, sortDate: '2025-06-15', amount: 985.00, filename: 'nevenrechten-2024.pdf' },
                { year: 2024, type: 'foreign', title: { nl: 'Foreign Rights 2024', en: 'Foreign Rights 2024' }, date: { nl: '15 juli 2025', en: 'July 15, 2025' }, sortDate: '2025-07-15', amount: 394.00, filename: 'foreign-rights-2024.pdf' },
                { year: 2023, type: 'royalty', title: { nl: 'Royalty-afrekening 2023', en: 'Royalty Statement 2023' }, date: { nl: '15 maart 2024', en: 'March 15, 2024' }, sortDate: '2024-03-15', amount: 8720.50, filename: 'royalty-2023.pdf' },
                { year: 2023, type: 'subsidiary', title: { nl: 'Nevenrechten 2023', en: 'Reader Rights 2023' }, date: { nl: '15 juni 2024', en: 'June 15, 2024' }, sortDate: '2024-06-15', amount: 872.05, filename: 'nevenrechten-2023.pdf' },
                { year: 2023, type: 'foreign', title: { nl: 'Foreign Rights 2023', en: 'Foreign Rights 2023' }, date: { nl: '15 juli 2024', en: 'July 15, 2024' }, sortDate: '2024-07-15', amount: 348.82, filename: 'foreign-rights-2023.pdf' }
            ]
        },
        'anita@noordhoff.nl': {
            password: 'Anita123',
            info: {
                vendorNumber: 'V0031247',
                alliantNumber: '2567034',
                firstName: 'Anita',
                lastName: 'de Vries',
                voorletters: 'A.',
                bsn: '456789123',
                email: 'anita@noordhoff.nl',
                street: 'Prinsengracht',
                houseNumber: '789',
                postcode: '1017 KL',
                country: 'Nederland',
                birthDate: '08-11-1972',
                phone: '+31 6 34567890',
                bankAccount: 'NL82 RABO 0123 9876 54',
                bic: 'RABONL2U',
                initials: 'AV'
            },
            contracts: [
                { number: 'CC_14000', name: 'Moderne Wiskunde 13-14 BB', contractPdf: 'CC_14000_contract.pdf' },
                { number: 'CC_14001', name: 'Moderne Wiskunde 13-14 OB', contractPdf: 'CC_14001_contract.pdf' }
            ],
            infoChanges: [],
            loginHistory: [],
            prediction: { min: 22000, max: 28000 },
            historicalRoyalties: [
                { year: 2024, amount: 24500.00 },
                { year: 2023, amount: 21800.75 }
            ],
            payments: [
                { year: 2024, type: 'royalty', title: { nl: 'Royalty-afrekening 2024', en: 'Royalty Statement 2024' }, date: { nl: '15 maart 2025', en: 'March 15, 2025' }, sortDate: '2025-03-15', amount: 24500.00, filename: 'royalty-2024.pdf' },
                { year: 2024, type: 'subsidiary', title: { nl: 'Nevenrechten 2024', en: 'Reader Rights 2024' }, date: { nl: '15 juni 2025', en: 'June 15, 2025' }, sortDate: '2025-06-15', amount: 2450.00, filename: 'nevenrechten-2024.pdf' },
                { year: 2024, type: 'foreign', title: { nl: 'Foreign Rights 2024', en: 'Foreign Rights 2024' }, date: { nl: '15 juli 2025', en: 'July 15, 2025' }, sortDate: '2025-07-15', amount: 980.00, filename: 'foreign-rights-2024.pdf' },
                { year: 2023, type: 'royalty', title: { nl: 'Royalty-afrekening 2023', en: 'Royalty Statement 2023' }, date: { nl: '15 maart 2024', en: 'March 15, 2024' }, sortDate: '2024-03-15', amount: 21800.75, filename: 'royalty-2023.pdf' },
                { year: 2023, type: 'subsidiary', title: { nl: 'Nevenrechten 2023', en: 'Reader Rights 2023' }, date: { nl: '15 juni 2024', en: 'June 15, 2024' }, sortDate: '2024-06-15', amount: 2180.08, filename: 'nevenrechten-2023.pdf' },
                { year: 2023, type: 'foreign', title: { nl: 'Foreign Rights 2023', en: 'Foreign Rights 2023' }, date: { nl: '15 juli 2024', en: 'July 15, 2024' }, sortDate: '2024-07-15', amount: 872.03, filename: 'foreign-rights-2023.pdf' }
            ]
        }
    },
    faq: [
        { q: { nl: 'Wanneer worden mijn uitbetalingen gedaan?', en: 'When are my payments made?' }, a: { nl: 'Royalty-uitbetalingen vinden plaats voor eind maart van elk jaar, gebaseerd op de verkopen van het voorgaande jaar. Nevenrechten worden uitbetaald in juni, na afronding van de jaarlijkse royalty-afrekening. Foreign rights uitkeringen vinden plaats in juli, na ontvangst van de buitenlandse afdrachten.', en: 'Royalty payments are made before the end of March each year, based on sales from the previous year. Reader rights are paid in June, after completion of the annual royalty statement. Foreign rights payments are made in July, after receipt of foreign remittances.' }},
        { q: { nl: 'Wat zijn nevenrechten?', en: 'What are reader rights?' }, a: { nl: 'Nevenrechten zijn een combinatie van reader- en verhuurgelden. Dit betreft inkomsten ontvangen van Stichting UVO voor readergelden en inkomsten ontvangen van bibliotheken voor verhuurgelden.', en: 'Reader rights are a combination of reader and rental fees. This includes income received from Stichting UVO for reader fees and income received from libraries for rental fees.' }},
        { q: { nl: 'Wat zijn foreign rights?', en: 'What are foreign rights?' }, a: { nl: 'Foreign rights zijn betalingen voor het gebruik van uw werken in internationale (digitale) bibliotheken van hogescholen.', en: 'Foreign rights are payments for the use of your works in international (digital) libraries of universities.' }},
        { q: { nl: 'Hoe wordt mijn royalty berekend?', en: 'How is my royalty calculated?' }, a: { nl: 'Uw royalty wordt berekend op basis van een percentage van de netto-omzet van uw boek(en), zoals vastgelegd in uw auteurscontract.', en: 'Your royalty is calculated based on a percentage of the net revenue from your book(s), as specified in your author contract.' }},
        { q: { nl: 'Kan ik mijn bankgegevens wijzigen?', en: 'Can I change my bank details?' }, a: { nl: 'Ja, u kunt uw bankgegevens wijzigen via het tabblad "Gegevens". Wijzigingen worden verwerkt voor de eerstvolgende uitbetaling.', en: 'Yes, you can change your bank details via the "Info" tab. Changes will be processed before the next payment.' }},
        { q: { nl: 'Wat moet ik doen als een auteur is overleden?', en: 'What should I do if an author has passed away?' }, a: { nl: 'In geval van overlijden van een auteur heeft Noordhoff een verklaring van erfrecht nodig, waarin de contactpersoon als erfgenaam wordt aangewezen. Deze erfgenaam heeft vervolgens het recht om het bankrekeningnummer te wijzigen voor toekomstige uitbetalingen.', en: "In case of an author's death, Noordhoff requires a certificate of inheritance, in which the contact person is designated as heir. This heir then has the right to change the bank account number for future payments." }},
        { q: { nl: 'Waar vind ik mijn auteurscontract?', en: 'Where can I find my author contract?' }, a: { nl: 'Uw auteurscontract is beschikbaar in het tabblad "Contracten". Voor vragen over uw contract kunt u contact opnemen via rights@noordhoff.nl.', en: 'Your author contract is available in the "Contracts" tab. For questions about your contract, please contact rights@noordhoff.nl.' }},
        { q: { nl: 'Hoe kan ik contact opnemen met Noordhoff?', en: 'How can I contact Noordhoff?' }, a: { nl: 'Voor vragen over royalties: rights@noordhoff.nl. Voor het indienen van facturen: crediteuren@noordhoff.nl. Telefonisch: (050) 522 69 22. Of via onze <a href="https://www.noordhoff.nl/klantenservice#services-widget" target="_blank">klantenservice</a>.', en: 'For questions about royalties: rights@noordhoff.nl. For submitting invoices: crediteuren@noordhoff.nl. Phone: (050) 522 69 22. Or via our <a href="https://www.noordhoff.nl/klantenservice#services-widget" target="_blank">customer service</a>.' }}
    ]
};

// ============================================
// TRANSLATIONS
// ============================================
const TRANSLATIONS = {
    nl: {
        portal_subtitle: 'Auteursportaal', tagline: 'Krijg direct inzicht in uw royalties, afrekeningen en prognoses.',
        welcome_back: 'Welkom terug', welcome_login: 'Welkom bij Noordhoff', login_subtitle: 'Log in om uw royalty-informatie te bekijken',
        login_error: 'Ongeldig e-mailadres of wachtwoord.', email_label: 'E-mailadres', password_label: 'Wachtwoord',
        login_btn: 'Inloggen', forgot_password: 'Wachtwoord vergeten?', author: 'Auteur', logout_btn: 'Uitloggen', greeting: 'Welkom',
        dashboard_subtitle: 'Hier vindt u een overzicht van uw royalty-informatie',
        tab_info: 'Gegevens', tab_contracts: 'Contracten', tab_payments: 'Afrekeningen', tab_forecast: 'Prognose', tab_faq: 'FAQ',
        id_numbers_title: 'Auteurs ID', label_vendor: 'Vendor ID', label_alliant: 'Alliant ID',
        info_title: 'Uw gegevens', edit_btn: 'Bewerken', label_firstname: 'Voornaam', label_lastname: 'Achternaam',
        label_initials: 'Voorletters', label_bsn: 'BSN', label_bic: 'BIC',
        label_email: 'E-mailadres', label_street: 'Straat', label_housenumber: 'Huisnummer', label_postcode: 'Postcode',
        label_country: 'Land', label_birthdate: 'Geboortedatum', label_phone: 'Telefoonnummer', label_bank: 'IBAN', payments_title: 'Royalty-afrekeningen',
        contracts_title: 'Uw contracten', contract_number: 'Contractnummer', contract_name: 'Contractnaam', contract_pdf: 'Contract',
        filter_all: 'Alle', historical_title: 'Uitgekeerde royalties', badge_final: 'Definitief',
        prediction_title: 'Verwachte royalties 2025', badge_prediction: 'Prognose', payout_date: 'Uitbetaling maart 2026',
        expected_range: 'Verwacht bedrag', conservative: 'Conservatief', expected: 'Verwacht', optimistic: 'Optimistisch',
        prediction_disclaimer: 'Deze prognose is gebaseerd op de omzet van het prognosejaar. Hierbij worden de contracten, royaltypercentages en bijdragersaandelen van het jaar voor het prognosejaar gebruikt, aangezien deze waarden voor het huidige jaar nog niet definitief zijn.',
        edit_info_title: 'Gegevens bewerken', cancel_btn: 'Annuleren', save_btn: 'Opslaan', total_paid: 'Totaal uitgekeerd',
        faq_title: 'Veelgestelde vragen',
        verify_password_title: 'Wachtwoord bevestigen', verify_password_desc: 'Voor het wijzigen van uw bankgegevens is een wachtwoordbevestiging vereist.',
        password_incorrect: 'Onjuist wachtwoord', confirm_btn: 'Bevestigen',
        iban_invalid: 'Ongeldig IBAN nummer', bank_change_pending: 'Uw bankgegevens wijziging is ingediend ter goedkeuring door de administrator.',
        // Navigation
        nav_about: 'Over Noordhoff', nav_why: 'Waarom auteur?', nav_process: 'Het proces', nav_academy: 'Academy',
        nav_faq: 'FAQ', nav_news: 'Nieuws', nav_contact: 'Contact', nav_login: 'Inloggen',
        // Hero
        hero_title: 'Word auteur bij Noordhoff',
        hero_subtitle: 'Deel je kennis met miljoenen leerlingen en studenten in Nederland. Samen maken we het onderwijs van morgen.',
        hero_cta_learn: 'Ontdek meer', hero_cta_login: 'Inloggen als auteur',
        // About
        about_title: 'Al meer dan 180 jaar partner in onderwijs',
        about_text: 'Noordhoff is de grootste educatieve uitgeverij van Nederland. Samen met onze auteurs ontwikkelen we lesmateriaal dat miljoenen leerlingen en studenten helpt om te groeien.',
        stat_years: 'jaar ervaring', stat_authors: 'auteurs', stat_students: 'leerlingen bereikt',
        // Why section
        why_title: 'Waarom auteur worden bij Noordhoff?',
        why_impact_title: 'Maak impact',
        why_impact_text: 'Jouw kennis bereikt miljoenen leerlingen en studenten door heel Nederland. Draag bij aan de toekomst van het onderwijs.',
        why_support_title: 'Professionele begeleiding',
        why_support_text: 'Ons team van ervaren redacteuren en vormgevers begeleidt je door het hele proces.',
        why_royalties_title: 'Eerlijke royalties',
        why_royalties_text: 'Transparante afspraken en eerlijke vergoedingen. Via ons auteursportaal heb je altijd inzicht in je royalties.',
        // Process
        process_title: 'Hoe word je auteur?',
        process_step1_title: 'Kennismaking', process_step1_text: 'We bespreken je expertise, idee\u00ebn en de mogelijkheden voor samenwerking.',
        process_step2_title: 'Contract', process_step2_text: 'We maken heldere afspraken over inhoud, planning en vergoeding.',
        process_step3_title: 'Schrijven', process_step3_text: 'Je schrijft de content met begeleiding van onze redactie en vakspecialisten.',
        process_step4_title: 'Publicatie', process_step4_text: 'Je werk wordt gepubliceerd en bereikt leerlingen door heel Nederland.',
        // Academy
        academy_title: 'Auteurs Academy',
        academy_text: 'Bekijk onze video\'s over het schrijfproces, tips van ervaren auteurs en meer.',
        academy_video1_title: 'Het schrijfproces bij Noordhoff', academy_video1_desc: 'Leer hoe het schrijfproces eruitziet van begin tot eind.',
        academy_video2_title: 'Tips van ervaren auteurs', academy_video2_desc: 'Auteurs delen hun ervaringen en beste tips.',
        academy_video3_title: 'Werken met de redactie', academy_video3_desc: 'Ontdek hoe onze redacteuren je begeleiden.',
        // FAQ
        faq_public_title: 'Veelgestelde vragen',
        public_faq_q1: 'Hoe kan ik auteur worden bij Noordhoff?',
        public_faq_a1: 'Neem contact met ons op via rights@noordhoff.nl. We bespreken graag de mogelijkheden op basis van je expertise en vakgebied.',
        public_faq_q2: 'Welke vakgebieden zoekt Noordhoff auteurs voor?',
        public_faq_a2: 'We zoeken auteurs voor alle onderwijsniveaus en vakgebieden, van basisonderwijs tot hoger onderwijs. Van wiskunde en taal tot maatschappijleer en beroepsonderwijs.',
        public_faq_q3: 'Hoe worden royalties berekend?',
        public_faq_a3: 'Royalties worden berekend op basis van het type werk, de oplage en de verkoopresultaten. De exacte voorwaarden worden vastgelegd in je auteurscontract.',
        public_faq_q4: 'Moet ik het hele boek alleen schrijven?',
        public_faq_a4: 'Niet noodzakelijk. Veel methodes worden ontwikkeld door auteursteams. Onze redactie begeleidt het hele proces en zorgt voor samenhang.',
        public_faq_q5: 'Hoe lang duurt het schrijfproces?',
        public_faq_a5: 'Dit varieert per project, maar gemiddeld duurt de ontwikkeling van een nieuwe methode 1 tot 2 jaar. Je krijgt een realistische planning van onze redactie.',
        public_faq_q6: 'Wat biedt het auteursportaal?',
        public_faq_a6: 'Via het auteursportaal heb je 24/7 inzicht in je contracten, royalty-afrekeningen en prognoses. Je kunt ook je persoonlijke gegevens beheren.',
        // News
        news_title: 'Nieuws & Evenementen', news_blog_title: 'Laatste nieuws', news_events_title: 'Komende evenementen',
        no_events: 'Er zijn momenteel geen geplande evenementen.', no_news: 'Er zijn momenteel geen nieuwsberichten.', loading: 'Laden...',
        // Contact
        contact_title: 'Neem contact op', contact_info_title: 'Contactgegevens',
        contact_address_label: 'Adres:', contact_phone_label: 'Telefoon:',
        contact_form_title: 'Stuur een bericht', contact_name: 'Naam', contact_email: 'E-mailadres',
        contact_message: 'Bericht', contact_send: 'Verstuur',
        contact_success: 'Bedankt voor je bericht! We nemen zo snel mogelijk contact met je op.',
        // Footer
        footer_tagline: 'Samen maken we het onderwijs van morgen.',
        footer_nav_title: 'Navigatie', footer_help_title: 'Hulp', footer_rights: 'Alle rechten voorbehouden.',
        // Segments
        segments_title: 'Onze onderwijssegmenten',
        segments_text: 'Van kleuter tot professional — wij ontwikkelen lesmateriaal voor alle niveaus van het Nederlandse onderwijs.',
        segment_bao_title: 'Basisonderwijs',
        segment_bao_text: 'Methodes voor groep 1 t/m 8 die aansluiten bij de kerndoelen en kinderen uitdagen om te groeien.',
        segment_vo_title: 'Voortgezet onderwijs',
        segment_vo_text: 'Lesmateriaal voor vmbo, havo en vwo dat leerlingen voorbereidt op hun toekomst.',
        segment_mbo_title: 'Mbo',
        segment_mbo_text: 'Praktijkgerichte leermiddelen die studenten klaarstomen voor de arbeidsmarkt.',
        segment_ho_title: 'Hoger onderwijs',
        segment_ho_text: 'Academische publicaties en studieboeken voor hbo en universiteit.',
        // Financial
        nav_financial: 'Verdienmodel',
        financial_title: 'Het verdienmodel voor auteurs',
        financial_intro: 'Transparante vergoedingen en groeiende royalties. Bekijk wat je als auteur bij Noordhoff kunt verwachten.',
        fin_advance: 'Voorschot per project',
        fin_royalty_pct: 'Royaltypercentage',
        fin_payout: 'Afrekening per jaar',
        fin_duration: 'Gemiddelde looptijd royalties',
        // Testimonials
        nav_testimonials: 'Ervaringen',
        testimonials_title: 'Wat onze auteurs zeggen',
        testimonial1_text: '"Het schrijven voor Noordhoff gaf me de kans om mijn jarenlange ervaring voor de klas om te zetten in materiaal dat duizenden leerlingen bereikt. De redactie denkt echt met je mee."',
        testimonial1_role: 'Auteur Wiskunde VO — 12 jaar bij Noordhoff',
        testimonial2_text: '"De professionele begeleiding is uitmuntend. Van het eerste concept tot de uiteindelijke publicatie werd ik ondersteund door een team dat net zo gepassioneerd is over onderwijs als ik."',
        testimonial2_role: 'Auteur Economie HO — 8 jaar bij Noordhoff',
        testimonial3_text: '"Wat mij het meest aanspreekt is de transparantie over royalties. Via het portaal zie ik precies hoe mijn methode presteert."',
        testimonial3_role: 'Auteur Nederlands BAO — 5 jaar bij Noordhoff',
        testimonial4_text: '"Als mbo-docent wist ik precies wat studenten nodig hadden. Noordhoff gaf me de ruimte om dat te vertalen naar praktijkgericht materiaal."',
        testimonial4_role: 'Auteur Techniek MBO — 3 jaar bij Noordhoff',
        // Why expanded
        why_intro: 'Als auteur bij Noordhoff sta je niet alleen. Je wordt onderdeel van een team van experts dat samen werkt aan kwalitatief hoogwaardig lesmateriaal.',
        why_expertise_title: 'Deel je vakexpertise',
        why_expertise_text: 'Als vakexpert vertaal je je kennis naar praktisch en didactisch verantwoord lesmateriaal.',
        why_digital_title: 'Digitale innovatie',
        why_digital_text: 'Werk mee aan de nieuwste digitale leermiddelen, adaptief leren en interactieve content.',
        why_growth_title: 'Persoonlijke groei',
        why_growth_text: 'Ontwikkel je als auteur via onze Auteurs Academy, workshops en persoonlijke coaching.',
        // Process expanded
        process_intro: 'Het schrijfproces bij Noordhoff is een samenwerking tussen jou als vakexpert en ons team van professionals.',
        // Contact expanded
        contact_intro: 'Interesse in het schrijven voor Noordhoff? Neem vrijblijvend contact op.',
        contact_subject_author: 'Ik wil auteur worden',
        contact_subject_info: 'Informatie aanvragen',
        contact_subject_collab: 'Samenwerking bespreken',
        contact_subject_other: 'Anders',
        // Footer expanded
        stat_schools: 'scholen in Nederland',
        // Back
        back_to_site: 'Terug naar website'
    },
    en: {
        portal_subtitle: 'Author Portal', tagline: 'Get direct insight into your royalties, statements and forecasts.',
        welcome_back: 'Welcome back', welcome_login: 'Welcome to Noordhoff', login_subtitle: 'Sign in to access your royalty information',
        login_error: 'Invalid email or password.', email_label: 'Email Address', password_label: 'Password',
        login_btn: 'Sign In', forgot_password: 'Forgot password?', author: 'Author', logout_btn: 'Sign Out', greeting: 'Welcome',
        dashboard_subtitle: 'Here is an overview of your royalty information',
        tab_info: 'Info', tab_contracts: 'Contracts', tab_payments: 'Statements', tab_forecast: 'Forecast', tab_faq: 'FAQ',
        id_numbers_title: 'Author ID', label_vendor: 'Vendor ID', label_alliant: 'Alliant ID',
        info_title: 'Your Information', edit_btn: 'Edit', label_firstname: 'First Name', label_lastname: 'Last Name',
        label_initials: 'Initials', label_bsn: 'BSN', label_bic: 'BIC',
        label_email: 'Email Address', label_street: 'Street', label_housenumber: 'House Number', label_postcode: 'Postal Code',
        label_country: 'Country', label_birthdate: 'Date of Birth', label_phone: 'Phone Number', label_bank: 'IBAN', payments_title: 'Royalty Statements',
        contracts_title: 'Your Contracts', contract_number: 'Contract Number', contract_name: 'Contract Name', contract_pdf: 'Contract',
        filter_all: 'All', historical_title: 'Paid Royalties', badge_final: 'Final',
        prediction_title: 'Expected Royalties 2025', badge_prediction: 'Forecast', payout_date: 'Payout March 2026',
        expected_range: 'Expected Amount', conservative: 'Conservative', expected: 'Expected', optimistic: 'Optimistic',
        prediction_disclaimer: "This forecast is based on the revenue of the forecast year. The contracts, royalty percentages and contributor shares from the year before the forecast year are used, as these values are not yet finalized for the current year.",
        edit_info_title: 'Edit Information', cancel_btn: 'Cancel', save_btn: 'Save', total_paid: 'Total Paid',
        faq_title: 'Frequently Asked Questions',
        verify_password_title: 'Confirm Password', verify_password_desc: 'Password confirmation is required to change your bank details.',
        password_incorrect: 'Incorrect password', confirm_btn: 'Confirm',
        iban_invalid: 'Invalid IBAN number', bank_change_pending: 'Your bank details change has been submitted for administrator approval.',
        // Navigation
        nav_about: 'About Noordhoff', nav_why: 'Why become an author?', nav_process: 'The process', nav_academy: 'Academy',
        nav_faq: 'FAQ', nav_news: 'News', nav_contact: 'Contact', nav_login: 'Log in',
        // Hero
        hero_title: 'Become an author at Noordhoff',
        hero_subtitle: 'Share your knowledge with millions of students in the Netherlands. Together we shape the education of tomorrow.',
        hero_cta_learn: 'Learn more', hero_cta_login: 'Log in as author',
        // About
        about_title: 'Over 180 years partner in education',
        about_text: 'Noordhoff is the largest educational publisher in the Netherlands. Together with our authors, we develop educational materials that help millions of students grow.',
        stat_years: 'years of experience', stat_authors: 'authors', stat_students: 'students reached',
        // Why section
        why_title: 'Why become an author at Noordhoff?',
        why_impact_title: 'Make an impact',
        why_impact_text: 'Your knowledge reaches millions of students throughout the Netherlands. Contribute to the future of education.',
        why_support_title: 'Professional guidance',
        why_support_text: 'Our team of experienced editors and designers guides you through the entire process.',
        why_royalties_title: 'Fair royalties',
        why_royalties_text: 'Transparent agreements and fair compensation. Through our author portal, you always have insight into your royalties.',
        // Process
        process_title: 'How to become an author?',
        process_step1_title: 'Introduction', process_step1_text: 'We discuss your expertise, ideas, and possibilities for collaboration.',
        process_step2_title: 'Contract', process_step2_text: 'We make clear agreements about content, planning, and compensation.',
        process_step3_title: 'Writing', process_step3_text: 'You write the content with guidance from our editorial team and subject specialists.',
        process_step4_title: 'Publication', process_step4_text: 'Your work is published and reaches students throughout the Netherlands.',
        // Academy
        academy_title: 'Authors Academy',
        academy_text: 'Watch our videos about the writing process, tips from experienced authors, and more.',
        academy_video1_title: 'The writing process at Noordhoff', academy_video1_desc: 'Learn what the writing process looks like from start to finish.',
        academy_video2_title: 'Tips from experienced authors', academy_video2_desc: 'Authors share their experiences and best tips.',
        academy_video3_title: 'Working with the editorial team', academy_video3_desc: 'Discover how our editors guide you.',
        // FAQ
        faq_public_title: 'Frequently asked questions',
        public_faq_q1: 'How can I become an author at Noordhoff?',
        public_faq_a1: 'Contact us at rights@noordhoff.nl. We would love to discuss opportunities based on your expertise and field.',
        public_faq_q2: 'What fields does Noordhoff seek authors for?',
        public_faq_a2: 'We seek authors for all education levels and fields, from primary to higher education. From mathematics and language to social studies and vocational education.',
        public_faq_q3: 'How are royalties calculated?',
        public_faq_a3: 'Royalties are calculated based on the type of work, print run, and sales results. Exact terms are specified in your author contract.',
        public_faq_q4: 'Do I have to write the entire book alone?',
        public_faq_a4: 'Not necessarily. Many methods are developed by author teams. Our editorial team guides the entire process and ensures coherence.',
        public_faq_q5: 'How long does the writing process take?',
        public_faq_a5: 'This varies per project, but on average, developing a new method takes 1 to 2 years. You will receive a realistic timeline from our editorial team.',
        public_faq_q6: 'What does the author portal offer?',
        public_faq_a6: 'Through the author portal, you have 24/7 access to your contracts, royalty statements, and forecasts. You can also manage your personal details.',
        // News
        news_title: 'News & Events', news_blog_title: 'Latest news', news_events_title: 'Upcoming events',
        no_events: 'There are currently no scheduled events.', no_news: 'There are currently no news articles.', loading: 'Loading...',
        // Contact
        contact_title: 'Get in touch', contact_info_title: 'Contact details',
        contact_address_label: 'Address:', contact_phone_label: 'Phone:',
        contact_form_title: 'Send a message', contact_name: 'Name', contact_email: 'Email address',
        contact_message: 'Message', contact_send: 'Send',
        contact_success: 'Thank you for your message! We will get back to you as soon as possible.',
        // Footer
        footer_tagline: 'Together we shape the education of tomorrow.',
        footer_nav_title: 'Navigation', footer_help_title: 'Help', footer_rights: 'All rights reserved.',
        // Segments
        segments_title: 'Our education segments',
        segments_text: 'From kindergarten to professional — we develop educational materials for all levels of Dutch education.',
        segment_bao_title: 'Primary education',
        segment_bao_text: 'Methods for grades 1-8 that align with core objectives and challenge children to grow.',
        segment_vo_title: 'Secondary education',
        segment_vo_text: 'Teaching materials for VMBO, HAVO and VWO that prepare students for their future.',
        segment_mbo_title: 'Vocational education',
        segment_mbo_text: 'Practice-oriented learning resources that prepare students for the job market.',
        segment_ho_title: 'Higher education',
        segment_ho_text: 'Academic publications and textbooks for universities of applied sciences and research universities.',
        // Financial
        nav_financial: 'Earnings model',
        financial_title: 'The earnings model for authors',
        financial_intro: 'Transparent compensation and growing royalties. See what you can expect as an author at Noordhoff.',
        fin_advance: 'Advance per project',
        fin_royalty_pct: 'Royalty percentage',
        fin_payout: 'Settlements per year',
        fin_duration: 'Average royalty duration',
        // Testimonials
        nav_testimonials: 'Experiences',
        testimonials_title: 'What our authors say',
        testimonial1_text: '"Writing for Noordhoff gave me the chance to transform my years of classroom experience into materials that reach thousands of students."',
        testimonial1_role: 'Mathematics Author Secondary Ed. — 12 years at Noordhoff',
        testimonial2_text: '"The professional guidance is outstanding. From the first concept to the final publication, I was supported by a team equally passionate about education."',
        testimonial2_role: 'Economics Author Higher Ed. — 8 years at Noordhoff',
        testimonial3_text: '"What I appreciate most is the transparency about royalties. Through the portal, I can see exactly how my method is performing."',
        testimonial3_role: 'Dutch Language Author Primary Ed. — 5 years at Noordhoff',
        testimonial4_text: '"As a vocational teacher, I knew exactly what students needed. Noordhoff gave me the space to translate that into practical materials."',
        testimonial4_role: 'Technology Author Vocational Ed. — 3 years at Noordhoff',
        // Why expanded
        why_intro: 'As an author at Noordhoff, you are not alone. You become part of a team of experts working together on high-quality educational materials.',
        why_expertise_title: 'Share your expertise',
        why_expertise_text: 'As a subject expert, you translate your knowledge into practical and educationally sound materials.',
        why_digital_title: 'Digital innovation',
        why_digital_text: 'Contribute to the latest digital learning tools, adaptive learning, and interactive content.',
        why_growth_title: 'Personal growth',
        why_growth_text: 'Develop as an author through our Authors Academy, workshops, and personal coaching.',
        // Process expanded
        process_intro: 'The writing process at Noordhoff is a collaboration between you as a subject expert and our team of professionals.',
        // Contact expanded
        contact_intro: 'Interested in writing for Noordhoff? Get in touch. We would love to tell you more.',
        contact_subject_author: 'I want to become an author',
        contact_subject_info: 'Request information',
        contact_subject_collab: 'Discuss collaboration',
        contact_subject_other: 'Other',
        // Footer expanded
        stat_schools: 'schools in the Netherlands',
        // Back
        back_to_site: 'Back to website'
    }
};

let currentLang = 'nl';
let currentUser = null;
let selectedAuthor = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatCurrency(amount) {
    return '€' + amount.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function t(key) { return TRANSLATIONS[currentLang][key] || key; }

function formatDateTime(date) {
    return date.toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function updateLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (TRANSLATIONS[lang][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = TRANSLATIONS[lang][key];
            } else {
                el.textContent = TRANSLATIONS[lang][key];
            }
        }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (TRANSLATIONS[lang][key]) el.placeholder = TRANSLATIONS[lang][key];
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (TRANSLATIONS[lang][key]) el.title = TRANSLATIONS[lang][key];
    });
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
    document.documentElement.lang = lang;
    // Re-render public FAQ with new language
    renderPublicFAQ();
    if (currentUser) {
        renderPayments(document.querySelector('.year-btn.active')?.dataset.year || 'all');
        renderFAQ();
    }
    // Also update admin dashboard if active
    if (selectedAuthor) {
        renderAuthorDetail();
    }
}

// ============================================
// AUTHOR FUNCTIONS
// ============================================
function initAuthorDashboard() {
    try {
        console.log('initAuthorDashboard started');

        // Get author data from Supabase or local DATA
        const author = isSupabaseMode && currentAuthorData
            ? currentAuthorData
            : DATA.authors[currentUser];

        if (!author) {
            console.error('No author data found');
            return;
        }

        const fullName = author.info.firstName + ' ' + author.info.lastName;
        document.getElementById('dashboardUserName').textContent = fullName;
        document.getElementById('userAvatar').textContent = author.info.initials;
        document.getElementById('welcomeName').textContent = author.info.firstName;
        document.getElementById('startWelcomeName').textContent = author.info.firstName;
        document.getElementById('infoVendorNumber').textContent = author.info.vendorNumber || '';
        document.getElementById('infoAlliantNumber').textContent = author.info.alliantNumber || '';
        document.getElementById('infoFirstName').textContent = author.info.firstName;
        document.getElementById('infoInitialsField').textContent = author.info.voorletters || '';
        document.getElementById('infoLastName').textContent = author.info.lastName;
        document.getElementById('infoBSN').textContent = author.info.bsn ? '••••••' + author.info.bsn.slice(-3) : '';
        document.getElementById('infoEmail').textContent = author.info.email;
        document.getElementById('infoAddress').textContent = (author.info.street || '') + ' ' + (author.info.houseNumber || '');
        document.getElementById('infoPostcode').textContent = author.info.postcode || '';
        document.getElementById('infoCountry').textContent = author.info.country || '';
        document.getElementById('infoBirthDate').textContent = author.info.birthDate || '';
        document.getElementById('infoPhone').textContent = author.info.phone || '';
        document.getElementById('infoBankAccount').textContent = author.info.bankAccount || '';
        document.getElementById('infoBIC').textContent = author.info.bic || '';
        initPredictions();
        renderPayments('2024');
        renderContracts();
        renderFAQ();
        loadEvents();
        loadBlogPosts();
        console.log('initAuthorDashboard completed');
    } catch (err) {
        console.error('initAuthorDashboard error:', err);
        alert('Fout bij laden dashboard: ' + err.message);
    }
}

// Helper to get current author data
function getCurrentAuthor() {
    return isSupabaseMode && currentAuthorData
        ? currentAuthorData
        : DATA.authors[currentUser];
}

function renderContracts() {
    const author = getCurrentAuthor();
    if (!author || !author.contracts) return;

    document.getElementById('contractsTableBody').innerHTML = author.contracts.map((contract, i) => `
        <tr>
            <td>${contract.number}</td>
            <td>${contract.name}</td>
            <td>${contract.contractPdf ? `<button class="btn-secondary-small" onclick="downloadAuthorContractPDF(${i})">${currentLang === 'nl' ? 'Download' : 'Download'}</button>` : '-'}</td>
        </tr>
    `).join('');
}

function downloadAuthorContractPDF(index) {
    const author = getCurrentAuthor();
    if (!author || !author.contracts) return;
    const contract = author.contracts[index];
    if (contract.contractPdf) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const fullName = author.info.firstName + ' ' + author.info.lastName;

        // Header
        doc.setFillColor(0, 130, 198);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('Noordhoff', 20, 25);
        doc.setFontSize(12);
        doc.text('Auteurscontract', 20, 35);

        doc.setTextColor(0, 0, 0);

        // Contract details
        doc.setFontSize(16);
        doc.text(contract.name, 20, 60);

        doc.setFontSize(11);
        doc.text('Contractnummer:', 20, 80);
        doc.setFontSize(14);
        doc.text(contract.number, 70, 80);

        doc.setFontSize(11);
        doc.text('Auteur:', 20, 95);
        doc.text(fullName, 70, 95);

        doc.text('E-mail:', 20, 105);
        doc.text(author.info.email, 70, 105);

        doc.setTextColor(128, 128, 128);
        doc.setFontSize(9);
        doc.text('Dit is een digitale kopie van het ondertekende contract.', 20, 130);
        doc.text('Voor vragen kunt u contact opnemen met rights@noordhoff.nl', 20, 137);

        // Footer
        doc.text('Noordhoff Uitgevers B.V. | rights@noordhoff.nl | (050) 522 69 22', 20, 280);

        doc.save(`contract-${contract.number}.pdf`);
    }
}

function initPredictions() {
    const author = getCurrentAuthor();
    if (!author || !author.prediction) return;
    const { min, max } = author.prediction;
    const mid = Math.round((min + max) / 2);
    document.getElementById('predLow').textContent = formatCurrency(min);
    document.getElementById('predMid').textContent = formatCurrency(mid);
    document.getElementById('predHigh').textContent = formatCurrency(max);
    const contractNumbers = author.contracts.map(c => c.number).join(', ');
    document.getElementById('predictionContracts').innerHTML = `<strong>${currentLang === 'nl' ? 'Berekend op basis van contracten' : 'Calculated based on contracts'}:</strong> ${contractNumbers}`;
}


function renderPayments(filterYear = 'all') {
    const author = getCurrentAuthor();
    if (!author || !author.payments) return;
    const filtered = filterYear === 'all' ? author.payments : author.payments.filter(p => p.year.toString() === filterYear);
    const today = new Date().toISOString().split('T')[0];
    const payments = [...filtered].sort((a, b) => {
        const distA = Math.abs(new Date(a.sortDate) - new Date(today));
        const distB = Math.abs(new Date(b.sortDate) - new Date(today));
        return distA - distB;
    });
    const iconColors = {
        royalty: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
        subsidiary: 'linear-gradient(135deg, #00A5A5 0%, #008080 100%)',
        foreign: 'linear-gradient(135deg, #0082C6 0%, #005a8c 100%)',
        annual: 'linear-gradient(135deg, #EDBA27 0%, #d4a520 100%)'
    };
    const typeLabels = {
        royalty: { nl: 'Royalties', en: 'Royalties' },
        subsidiary: { nl: 'Nevenrechten', en: 'Reader Rights' },
        foreign: { nl: 'Foreign Rights', en: 'Foreign Rights' },
        annual: { nl: 'Jaaropgave', en: 'Annual Statement' }
    };

    // Calculate annual statements per year
    const yearlyTotals = {};
    author.payments.forEach(p => {
        if (!yearlyTotals[p.year]) yearlyTotals[p.year] = { royalty: 0, subsidiary: 0, foreign: 0 };
        yearlyTotals[p.year][p.type] = p.amount;
    });

    // Create annual statement items
    const annualStatements = [];
    Object.keys(yearlyTotals).forEach(year => {
        const totals = yearlyTotals[year];
        const totalAmount = totals.royalty + totals.subsidiary + totals.foreign;
        if (totalAmount > 0) {
            annualStatements.push({
                year: parseInt(year),
                type: 'annual',
                title: { nl: `Jaaropgave ${year}`, en: `Annual Statement ${year}` },
                date: { nl: `Totaaloverzicht ${year}`, en: `Total Overview ${year}` },
                sortDate: `${parseInt(year) + 1}-12-31`,
                amount: totalAmount,
                filename: `jaaropgave-${year}.pdf`,
                breakdown: totals
            });
        }
    });

    // Combine and filter
    const allPayments = [...filtered, ...annualStatements.filter(a => filterYear === 'all' || a.year.toString() === filterYear)];
    const sortedPayments = allPayments.sort((a, b) => {
        // Sort annual statements first, then by date
        if (a.type === 'annual' && b.type !== 'annual') return -1;
        if (a.type !== 'annual' && b.type === 'annual') return 1;
        const distA = Math.abs(new Date(a.sortDate) - new Date(today));
        const distB = Math.abs(new Date(b.sortDate) - new Date(today));
        return distA - distB;
    });

    document.getElementById('paymentsList').innerHTML = sortedPayments.map((payment, idx) => `
        <div class="payment-item ${payment.type === 'annual' ? 'annual-statement' : ''}">
            <div class="payment-icon" style="background: ${iconColors[payment.type]}">
                <svg viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,19L12,15H9V10H15V15L13,19H10Z"/></svg>
            </div>
            <div class="payment-details">
                <div class="payment-title">${payment.title[currentLang]}</div>
                <div class="payment-meta">${payment.date[currentLang]}</div>
            </div>
            <div class="payment-amount">
                <div class="payment-amount-value">${formatCurrency(payment.amount)}</div>
                <div class="payment-amount-label">${typeLabels[payment.type][currentLang]}</div>
            </div>
            <button class="payment-download" onclick="downloadPaymentPDF(${idx}, '${filterYear}')">
                <svg viewBox="0 0 24 24"><path d="M12 16l-6-6h4V4h4v6h4l-6 6z"/><path d="M4 18h16v2H4z"/></svg>
            </button>
        </div>
    `).join('');
}

function renderFAQ() {
    document.getElementById('faqList').innerHTML = DATA.faq.map((item, i) => `
        <div class="faq-item" id="faq-${i}">
            <button class="faq-question" onclick="toggleFAQ(${i})">
                ${item.q[currentLang]}
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="faq-answer"><div class="faq-answer-content">${item.a[currentLang]}</div></div>
        </div>
    `).join('');
}

function toggleFAQ(index) {
    document.getElementById('faq-' + index).classList.toggle('open');
}

function downloadPaymentPDF(paymentIndex, filterYear) {
    const { jsPDF } = window.jspdf;
    const author = getCurrentAuthor();
    if (!author || !author.payments) return;
    const filtered = filterYear === 'all' ? author.payments : author.payments.filter(p => p.year.toString() === filterYear);
    const today = new Date().toISOString().split('T')[0];

    // Calculate annual statements
    const yearlyTotals = {};
    author.payments.forEach(p => {
        if (!yearlyTotals[p.year]) yearlyTotals[p.year] = { royalty: 0, subsidiary: 0, foreign: 0 };
        yearlyTotals[p.year][p.type] = p.amount;
    });
    const annualStatements = [];
    Object.keys(yearlyTotals).forEach(year => {
        const totals = yearlyTotals[year];
        const totalAmount = totals.royalty + totals.subsidiary + totals.foreign;
        if (totalAmount > 0) {
            annualStatements.push({
                year: parseInt(year), type: 'annual',
                title: { nl: `Jaaropgave ${year}`, en: `Annual Statement ${year}` },
                date: { nl: `Totaaloverzicht ${year}`, en: `Total Overview ${year}` },
                sortDate: `${parseInt(year) + 1}-12-31`, amount: totalAmount,
                filename: `jaaropgave-${year}.pdf`, breakdown: totals
            });
        }
    });

    const allPayments = [...filtered, ...annualStatements.filter(a => filterYear === 'all' || a.year.toString() === filterYear)];
    const sortedPayments = allPayments.sort((a, b) => {
        if (a.type === 'annual' && b.type !== 'annual') return -1;
        if (a.type !== 'annual' && b.type === 'annual') return 1;
        const distA = Math.abs(new Date(a.sortDate) - new Date(today));
        const distB = Math.abs(new Date(b.sortDate) - new Date(today));
        return distA - distB;
    });

    const payment = sortedPayments[paymentIndex];
    const fullName = author.info.firstName + ' ' + author.info.lastName;

    const doc = new jsPDF();

    // Header
    doc.setFillColor(0, 130, 198);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Noordhoff', 20, 25);
    doc.setFontSize(12);
    doc.text(payment.title[currentLang], 20, 35);

    // Reset color
    doc.setTextColor(0, 0, 0);

    // Author info
    doc.setFontSize(11);
    doc.text(currentLang === 'nl' ? 'Auteur:' : 'Author:', 20, 55);
    doc.setFontSize(14);
    doc.text(fullName, 20, 62);

    doc.setFontSize(11);
    doc.text('Email:', 20, 75);
    doc.text(author.info.email, 50, 75);

    doc.text(currentLang === 'nl' ? 'Datum:' : 'Date:', 20, 85);
    doc.text(payment.date[currentLang], 50, 85);

    // Amount box
    doc.setFillColor(237, 186, 39);
    doc.rect(20, 100, 170, 30, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(currentLang === 'nl' ? 'Totaalbedrag' : 'Total Amount', 25, 112);
    doc.setFontSize(20);
    doc.text(formatCurrency(payment.amount), 25, 124);

    let yPos = 150;

    // For annual statements, show breakdown
    if (payment.type === 'annual' && payment.breakdown) {
        doc.setFontSize(14);
        doc.setTextColor(0, 130, 198);
        doc.text(currentLang === 'nl' ? 'Specificatie' : 'Breakdown', 20, yPos);
        yPos += 15;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);

        if (payment.breakdown.royalty > 0) {
            doc.text(currentLang === 'nl' ? 'Royalties:' : 'Royalties:', 25, yPos);
            doc.text(formatCurrency(payment.breakdown.royalty), 120, yPos);
            yPos += 10;
        }
        if (payment.breakdown.subsidiary > 0) {
            doc.text(currentLang === 'nl' ? 'Nevenrechten:' : 'Reader Rights:', 25, yPos);
            doc.text(formatCurrency(payment.breakdown.subsidiary), 120, yPos);
            yPos += 10;
        }
        if (payment.breakdown.foreign > 0) {
            doc.text('Foreign Rights:', 25, yPos);
            doc.text(formatCurrency(payment.breakdown.foreign), 120, yPos);
            yPos += 10;
        }
        yPos += 10;
    }

    // Contracts section
    doc.setFontSize(14);
    doc.setTextColor(0, 130, 198);
    doc.text(currentLang === 'nl' ? 'Gekoppelde contracten' : 'Linked Contracts', 20, yPos);
    yPos += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos - 5, 170, 8, 'F');
    doc.text(currentLang === 'nl' ? 'Contractnr.' : 'Contract No.', 25, yPos);
    doc.text(currentLang === 'nl' ? 'Naam' : 'Name', 70, yPos);

    yPos += 10;
    author.contracts.forEach(contract => {
        doc.text(contract.number, 25, yPos);
        doc.text(contract.name, 70, yPos);
        yPos += 8;
    });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text('Noordhoff Uitgevers B.V. | rights@noordhoff.nl | (050) 522 69 22', 20, 280);

    doc.save(payment.filename);
}

// ============================================
// ADMIN FUNCTIONS
// ============================================
let adminRefreshInterval = null;

async function initAdminDashboard() {
    // Load data from Supabase if in Supabase mode
    if (isSupabaseMode && supabaseClient) {
        await loadAllAuthorsForAdmin();
    }

    renderAuthorList();
    renderAllChanges();
    updateAdminStats();

    // Auto-refresh elke 30 seconden om data up-to-date te houden
    if (adminRefreshInterval) clearInterval(adminRefreshInterval);
    adminRefreshInterval = setInterval(async () => {
        if (isSupabaseMode && supabaseClient) {
            await loadAllAuthorsForAdmin();
        }
        if (selectedAuthor) {
            renderAuthorDetail();
        }
        renderAllChanges();
        updateAdminStats();
    }, 30000);
}

function showChangesPanel() {
    document.getElementById('authorDetailView').classList.remove('active');
    document.getElementById('changesView').classList.add('active');
    renderAllChanges('pending');
}

function showAuthorDetailPanel() {
    document.getElementById('changesView').classList.remove('active');
    document.getElementById('authorDetailView').classList.add('active');
}

let currentChangesFilter = 'pending';

function renderAllChanges(filter = currentChangesFilter) {
    currentChangesFilter = filter;
    const allChanges = [];
    const authors = getAuthorsData();

    Object.entries(authors).forEach(([email, author]) => {
        const authorName = `${author.info.firstName} ${author.info.lastName}`;
        author.infoChanges.forEach(change => {
            // Default status to 'pending' for legacy changes without status
            const status = change.status || 'pending';
            if (status === filter) {
                allChanges.push({
                    email,
                    authorName,
                    ...change,
                    status
                });
            }
        });
    });

    // Sort by date, newest first
    allChanges.sort((a, b) => new Date(b.date) - new Date(a.date));

    const listEl = document.getElementById('allChangesList');
    const emptyMessages = {
        pending: 'Geen wijzigingen te beoordelen',
        approved: 'Geen goedgekeurde wijzigingen',
        rejected: 'Geen afgewezen wijzigingen'
    };

    if (allChanges.length === 0) {
        listEl.innerHTML = `<div class="empty-state">${emptyMessages[filter]}</div>`;
        return;
    }

    const statusLabels = { pending: 'Te beoordelen', approved: 'Goedgekeurd', rejected: 'Afgewezen' };

    listEl.innerHTML = allChanges.map(change => `
        <div class="all-change-item">
            <div class="all-change-author">
                <span class="author-link" onclick="selectAuthorFromChange('${change.email}')">${change.authorName}</span>
                <span class="change-status-badge ${change.status}">${statusLabels[change.status]}</span>
            </div>
            <div class="all-change-field">${change.field}</div>
            <div class="all-change-values">
                <span style="color:var(--color-danger)">was: ${change.old || '-'}</span>
                <span> → </span>
                <span style="color:var(--color-success)">nieuw: ${change.new}</span>
            </div>
            <div class="all-change-date">Aangevraagd: ${formatDateTime(new Date(change.date))}</div>
            ${change.processedDate ? `<div class="change-processed-date">Verwerkt: ${formatDateTime(new Date(change.processedDate))}</div>` : ''}
            ${change.rejectionReason ? `<div class="change-rejection-reason">Reden: ${change.rejectionReason}</div>` : ''}
            ${change.status === 'pending' ? `
                <div class="change-actions">
                    <button class="btn-approve" onclick="approveChange('${change.email}', '${change.id}')">Goedkeuren</button>
                    <button class="btn-reject" onclick="openRejectModal('${change.email}', '${change.id}')">Afwijzen</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function filterChanges(filter) {
    document.querySelectorAll('.changes-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderAllChanges(filter);
}

async function approveChange(email, changeId) {
    const authors = getAuthorsData();
    const author = authors[email];
    if (!author) return;

    const change = author.infoChanges.find(c => c.id === changeId);
    if (!change) return;

    // Update in Supabase if in Supabase mode
    if (isSupabaseMode && supabaseClient && change.id) {
        const result = await approveChangeRequest(change.id);
        if (result.error) {
            alert('Fout bij goedkeuren: ' + result.error);
            return;
        }
        // Reload data
        await loadAllAuthorsForAdmin();
    } else {
        change.status = 'approved';
        change.processedDate = new Date().toISOString();
    }

    renderAllChanges();
    updateAdminStats();
    if (selectedAuthor === email) {
        renderAuthorDetail();
    }
}

function openRejectModal(email, changeId) {
    document.getElementById('rejectionChangeId').value = changeId;
    document.getElementById('rejectionAuthorEmail').value = email;
    document.getElementById('rejectionReason').value = '';
    document.getElementById('rejectionModal').classList.add('active');
}

function closeRejectionModal() {
    document.getElementById('rejectionModal').classList.remove('active');
}

async function confirmRejectChange() {
    const changeId = document.getElementById('rejectionChangeId').value;
    const email = document.getElementById('rejectionAuthorEmail').value;
    const reason = document.getElementById('rejectionReason').value.trim();

    const authors = getAuthorsData();
    const author = authors[email];
    if (!author) return;

    const change = author.infoChanges.find(c => c.id === changeId);
    if (!change) return;

    // Update in Supabase if in Supabase mode
    if (isSupabaseMode && supabaseClient && change.id) {
        const result = await rejectChangeRequest(change.id, reason);
        if (result.error) {
            alert('Fout bij afwijzen: ' + result.error);
            return;
        }
        // Reload data
        await loadAllAuthorsForAdmin();
    } else {
        change.status = 'rejected';
        change.processedDate = new Date().toISOString();
        if (reason) {
            change.rejectionReason = reason;
        }
    }

    closeRejectionModal();
    renderAllChanges();
    updateAdminStats();
    if (selectedAuthor === email) {
        renderAuthorDetail();
    }
}

function showConfirmationModal(message) {
    document.getElementById('confirmationMessage').textContent = message;
    document.getElementById('confirmationModal').classList.add('active');
}

function closeConfirmationModal() {
    document.getElementById('confirmationModal').classList.remove('active');
}

function selectAuthorFromChange(email) {
    selectedAuthor = email;
    showAuthorDetailPanel();
    renderAuthorList();
    renderAuthorDetail();
}

function updateAdminStats() {
    const authors = Object.values(getAuthorsData());
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

    document.getElementById('statTotalAuthors').textContent = authors.length;

    // Get login period from dropdown
    const loginPeriod = document.getElementById('statLoginPeriod').value;
    let loginPeriodStart = today;
    if (loginPeriod === 'week') loginPeriodStart = weekAgo;
    if (loginPeriod === 'month') loginPeriodStart = monthAgo;
    if (loginPeriod === 'year') loginPeriodStart = yearAgo;

    let loggedInCount = 0;
    authors.forEach(author => {
        if (author.loginHistory.some(login => new Date(login) >= loginPeriodStart)) {
            loggedInCount++;
        }
    });
    document.getElementById('statLoggedInToday').textContent = loggedInCount;

    // Count pending changes
    let pendingChanges = 0;
    authors.forEach(author => {
        author.infoChanges.forEach(change => {
            if (!change.status || change.status === 'pending') pendingChanges++;
        });
    });
    document.getElementById('statPendingChanges').textContent = pendingChanges;
    document.getElementById('statPendingLabel').textContent = pendingChanges === 1
        ? 'Wijziging goed te keuren'
        : 'Wijzigingen goed te keuren';
}

function filterAuthors() {
    const searchTerm = document.getElementById('authorSearchInput').value.toLowerCase();
    renderAuthorList(searchTerm);
}

function renderAuthorList(searchTerm = '') {
    const container = document.getElementById('authorList');
    const authors = getAuthorsData();
    const filteredEmails = Object.keys(authors).filter(email => {
        const author = authors[email];
        const fullName = (author.info.firstName + ' ' + author.info.lastName).toLowerCase();
        return fullName.includes(searchTerm) || email.toLowerCase().includes(searchTerm);
    });

    container.innerHTML = filteredEmails.map(email => {
        const author = authors[email];
        const lastLogin = author.loginHistory && author.loginHistory.length > 0 ? author.loginHistory[0] : null;
        const isOnline = lastLogin && (new Date() - new Date(lastLogin)) < 3600000;
        return `
            <div class="author-item ${selectedAuthor === email ? 'active' : ''}" onclick="selectAuthor('${email}')">
                <div class="author-item-avatar">${author.info.initials}</div>
                <div class="author-item-info">
                    <div class="author-item-name">${author.info.firstName} ${author.info.lastName}</div>
                    <div class="author-item-email">${email}</div>
                </div>
                <div class="author-item-status ${isOnline ? 'online' : ''}"></div>
            </div>
        `;
    }).join('');

    if (filteredEmails.length === 0) {
        container.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--color-text-light);">Geen auteurs gevonden</div>';
    }
}

function selectAuthor(email) {
    selectedAuthor = email;
    showAuthorDetailPanel();
    renderAuthorList();
    renderAuthorDetail();
}

let currentAdminTab = 'personal';

function switchAdminTab(tabName) {
    currentAdminTab = tabName;
    document.querySelectorAll('.admin-detail-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.admin-detail-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === 'admin-tab-' + tabName);
    });
}

function renderAuthorDetail() {
    const authors = getAuthorsData();
    const author = authors[selectedAuthor];
    if (!author) return;
    const iconColors = {
        royalty: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
        subsidiary: 'linear-gradient(135deg, #00A5A5 0%, #008080 100%)',
        foreign: 'linear-gradient(135deg, #0082C6 0%, #005a8c 100%)'
    };
    document.getElementById('authorDetail').innerHTML = `
        <div class="author-detail-header">
            <div class="author-detail-title">
                <div class="user-avatar">${author.info.initials}</div>
                <div><h3>${author.info.firstName} ${author.info.lastName}</h3><div style="font-size:0.85rem;color:var(--color-text-light)">${selectedAuthor}</div></div>
            </div>
        </div>
        <div class="admin-detail-tabs">
            <button class="admin-detail-tab-btn ${currentAdminTab === 'personal' ? 'active' : ''}" data-tab="personal" onclick="switchAdminTab('personal')">Persoonlijk</button>
            <button class="admin-detail-tab-btn ${currentAdminTab === 'history' ? 'active' : ''}" data-tab="history" onclick="switchAdminTab('history')">Wijzigingen & Login</button>
            <button class="admin-detail-tab-btn ${currentAdminTab === 'contracts' ? 'active' : ''}" data-tab="contracts" onclick="switchAdminTab('contracts')">Contracten</button>
            <button class="admin-detail-tab-btn ${currentAdminTab === 'forecast' ? 'active' : ''}" data-tab="forecast" onclick="switchAdminTab('forecast')">Prognose</button>
            <button class="admin-detail-tab-btn ${currentAdminTab === 'payments' ? 'active' : ''}" data-tab="payments" onclick="switchAdminTab('payments')">Afrekeningen</button>
        </div>
        <div class="author-detail-body">
            <!-- Personal Tab -->
            <div class="admin-detail-tab-content ${currentAdminTab === 'personal' ? 'active' : ''}" id="admin-tab-personal">
                <div class="detail-section">
                    <h4>Auteurs ID <button class="edit-btn-small" onclick="openEditRefNumbersModal()">Bewerken</button></h4>
                    <div class="info-grid">
                        <div class="info-card"><div class="info-card-label">Vendor ID</div><div class="info-card-value" style="font-family:monospace">${author.info.vendorNumber}</div></div>
                        <div class="info-card"><div class="info-card-label">Alliant ID</div><div class="info-card-value" style="font-family:monospace">${author.info.alliantNumber}</div></div>
                    </div>
                </div>
                <div class="detail-section">
                    <h4>Persoonlijke gegevens</h4>
                    <div class="info-grid">
                        <div class="info-card"><div class="info-card-label">Voornaam</div><div class="info-card-value">${author.info.firstName}</div></div>
                        <div class="info-card"><div class="info-card-label">Voorletters</div><div class="info-card-value">${author.info.voorletters || '-'}</div></div>
                        <div class="info-card"><div class="info-card-label">Achternaam</div><div class="info-card-value">${author.info.lastName}</div></div>
                        <div class="info-card"><div class="info-card-label">BSN</div><div class="info-card-value">${author.info.bsn ? '••••••' + author.info.bsn.slice(-3) : '-'}</div></div>
                        <div class="info-card"><div class="info-card-label">E-mail</div><div class="info-card-value">${author.info.email}</div></div>
                        <div class="info-card"><div class="info-card-label">Telefoon</div><div class="info-card-value">${author.info.phone || '-'}</div></div>
                        <div class="info-card full-width"><div class="info-card-label">Adres</div><div class="info-card-value">${author.info.street} ${author.info.houseNumber}, ${author.info.postcode}, ${author.info.country}</div></div>
                        <div class="info-card"><div class="info-card-label">Geboortedatum</div><div class="info-card-value">${author.info.birthDate || '-'}</div></div>
                    </div>
                </div>
                <div class="detail-section">
                    <h4>Bankgegevens</h4>
                    <div class="info-grid">
                        <div class="info-card"><div class="info-card-label">IBAN</div><div class="info-card-value">${author.info.bankAccount}</div></div>
                        <div class="info-card"><div class="info-card-label">BIC</div><div class="info-card-value">${author.info.bic || '-'}</div></div>
                    </div>
                </div>
            </div>

            <!-- History Tab -->
            <div class="admin-detail-tab-content ${currentAdminTab === 'history' ? 'active' : ''}" id="admin-tab-history">
                <div class="detail-section">
                    <h4>Recente wijzigingen</h4>
                    ${author.infoChanges.length > 0 ? `
                        <div class="changes-list">
                            ${author.infoChanges.slice(-10).reverse().map(c => `
                                <div class="change-entry">
                                    <div class="change-date">${formatDateTime(new Date(c.date))}</div>
                                    <div class="change-field">${c.field}</div>
                                    <div class="change-values">
                                        <span class="change-old">was: ${c.old || '-'}</span>
                                        <span class="change-arrow">→</span>
                                        <span class="change-new">is nu: ${c.new}</span>
                                    </div>
                                    <span class="change-status-badge ${c.status || 'pending'}">${c.status === 'approved' ? 'Goedgekeurd' : c.status === 'rejected' ? 'Afgewezen' : 'In afwachting'}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<div class="empty-state">Geen wijzigingen</div>'}
                </div>
                <div class="detail-section">
                    <h4>Login geschiedenis</h4>
                    <div class="login-history">
                        ${author.loginHistory.length > 0 ?
                            author.loginHistory.slice(-10).reverse().map(date => `<div class="login-entry"><span>Ingelogd</span><span>${formatDateTime(new Date(date))}</span></div>`).join('') :
                            '<div class="login-entry"><span>Nog niet ingelogd</span></div>'
                        }
                    </div>
                </div>
            </div>

            <!-- Contracts Tab -->
            <div class="admin-detail-tab-content ${currentAdminTab === 'contracts' ? 'active' : ''}" id="admin-tab-contracts">
                <div class="detail-section">
                    <h4>Contracten</h4>
                    <div class="admin-contract-list">
                        ${author.contracts.map((c, i) => `
                            <div class="admin-contract-item">
                                <div class="admin-contract-info">
                                    <div class="admin-contract-number">${c.number}</div>
                                    <div class="admin-contract-name">${c.name}</div>
                                </div>
                                <div class="admin-contract-actions">
                                    <button class="btn-secondary-small" onclick="openEditContractModal(${i})">Bewerken</button>
                                    <button class="btn-danger-small" onclick="deleteContract(${i})">Verwijderen</button>
                                    ${c.contractPdf ? `<button class="btn-secondary-small" onclick="downloadContractPDF(${i})">PDF</button>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="add-payment-btn" onclick="openAddContractModal()">+ Contract toevoegen</button>
                </div>
            </div>

            <!-- Forecast Tab -->
            <div class="admin-detail-tab-content ${currentAdminTab === 'forecast' ? 'active' : ''}" id="admin-tab-forecast">
                <div class="detail-section">
                    <h4>Prognose <button class="edit-btn-small" onclick="openEditPredictionModal()">Bewerken</button></h4>
                    <div class="info-grid">
                        <div class="info-card"><div class="info-card-label">Minimum</div><div class="info-card-value">${formatCurrency(author.prediction.min)}</div></div>
                        <div class="info-card"><div class="info-card-label">Maximum</div><div class="info-card-value">${formatCurrency(author.prediction.max)}</div></div>
                        <div class="info-card"><div class="info-card-label">Verwacht</div><div class="info-card-value">${formatCurrency(Math.round((author.prediction.min + author.prediction.max) / 2))}</div></div>
                    </div>
                </div>
            </div>

            <!-- Payments Tab -->
            <div class="admin-detail-tab-content ${currentAdminTab === 'payments' ? 'active' : ''}" id="admin-tab-payments">
                <div class="detail-section">
                    <h4>Documenten</h4>
                    <div class="admin-payment-list">
                        ${author.payments.map((p, i) => `
                            <div class="admin-payment-item">
                                <div class="admin-payment-order">
                                    <button class="order-btn" onclick="movePayment(${i}, -1)" ${i === 0 ? 'disabled' : ''}>▲</button>
                                    <button class="order-btn" onclick="movePayment(${i}, 1)" ${i === author.payments.length - 1 ? 'disabled' : ''}>▼</button>
                                </div>
                                <div class="admin-payment-info">
                                    <div class="admin-payment-icon" style="background:${iconColors[p.type]}">
                                        <svg viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>
                                    </div>
                                    <div>
                                        <div class="admin-payment-title">${p.title.nl}</div>
                                        <div class="admin-payment-amount">${formatCurrency(p.amount)}</div>
                                    </div>
                                </div>
                                <div class="admin-payment-actions">
                                    <button class="btn-secondary-small" onclick="openEditStatementModal(${i})">Bewerken</button>
                                    <button class="btn-danger-small" onclick="deletePayment('${selectedAuthor}', ${i})">Verwijderen</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="add-payment-btn" onclick="openAddPaymentModal()">+ Document toevoegen</button>
                </div>
            </div>
        </div>
    `;
}

function deletePayment(email, index) {
    if (confirm('Weet u zeker dat u dit document wilt verwijderen?')) {
        getAuthorsData()[email].payments.splice(index, 1);
        renderAuthorDetail();
    }
}

function movePayment(index, direction) {
    const payments = getAuthorsData()[selectedAuthor].payments;
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < payments.length) {
        const temp = payments[index];
        payments[index] = payments[newIndex];
        payments[newIndex] = temp;
        renderAuthorDetail();
    }
}

// Reference Numbers Modal Functions
function openEditRefNumbersModal() {
    const author = getAuthorsData()[selectedAuthor];
    document.getElementById('editVendorNumber').value = author.info.vendorNumber || '';
    document.getElementById('editAlliantNumber').value = author.info.alliantNumber || '';
    document.getElementById('editRefNumbersModal').classList.add('active');
}

function closeEditRefNumbersModal() {
    document.getElementById('editRefNumbersModal').classList.remove('active');
}

function saveRefNumbers() {
    const author = getAuthorsData()[selectedAuthor];
    author.info.vendorNumber = document.getElementById('editVendorNumber').value;
    author.info.alliantNumber = document.getElementById('editAlliantNumber').value;
    closeEditRefNumbersModal();
    renderAuthorDetail();
}

// Statement Modal Functions
let editingStatementIndex = null;

function openEditStatementModal(index) {
    editingStatementIndex = index;
    const payment = getAuthorsData()[selectedAuthor].payments[index];
    document.getElementById('editStatementType').value = payment.type;
    document.getElementById('editStatementYear').value = payment.year;
    document.getElementById('editStatementAmount').value = payment.amount;
    document.getElementById('editStatementFilename').value = payment.filename;
    document.getElementById('editStatementOrder').value = index + 1;
    document.getElementById('statementModalTitle').textContent = 'Document bewerken';
    document.getElementById('editStatementModal').classList.add('active');
}

function closeEditStatementModal() {
    document.getElementById('editStatementModal').classList.remove('active');
    editingStatementIndex = null;
}

function saveStatement() {
    const type = document.getElementById('editStatementType').value;
    const year = parseInt(document.getElementById('editStatementYear').value);
    const amount = parseFloat(document.getElementById('editStatementAmount').value);
    const filename = document.getElementById('editStatementFilename').value;
    const newOrder = parseInt(document.getElementById('editStatementOrder').value) - 1;

    const typeNames = { royalty: 'Royalty-afrekening', subsidiary: 'Nevenrechten', foreign: 'Foreign Rights' };
    const typeNamesEn = { royalty: 'Royalty Statement', subsidiary: 'Reader Rights', foreign: 'Foreign Rights' };
    const months = { royalty: { nl: '15 maart', en: 'March 15' }, subsidiary: { nl: '15 juni', en: 'June 15' }, foreign: { nl: '15 juli', en: 'July 15' }};
    const sortMonths = { royalty: '03-15', subsidiary: '06-15', foreign: '07-15' };

    const updatedPayment = {
        year, type,
        title: { nl: `${typeNames[type]} ${year}`, en: `${typeNamesEn[type]} ${year}` },
        date: { nl: `${months[type].nl} ${year + 1}`, en: `${months[type].en}, ${year + 1}` },
        sortDate: `${year + 1}-${sortMonths[type]}`,
        amount, filename
    };

    const payments = getAuthorsData()[selectedAuthor].payments;
    payments[editingStatementIndex] = updatedPayment;

    // Reorder if necessary
    if (newOrder !== editingStatementIndex && newOrder >= 0 && newOrder < payments.length) {
        payments.splice(editingStatementIndex, 1);
        payments.splice(newOrder, 0, updatedPayment);
    }

    closeEditStatementModal();
    renderAuthorDetail();
}

function openAddPaymentModal() {
    document.getElementById('addPaymentModal').classList.add('active');
}

function closeAddPaymentModal() {
    document.getElementById('addPaymentModal').classList.remove('active');
}

function saveNewPayment() {
    const type = document.getElementById('newPaymentType').value;
    const year = parseInt(document.getElementById('newPaymentYear').value);
    const amount = parseFloat(document.getElementById('newPaymentAmount').value);
    const filename = document.getElementById('newPaymentFilename').value;

    const typeNames = { royalty: 'Royalty-afrekening', subsidiary: 'Nevenrechten', foreign: 'Foreign Rights' };
    const typeNamesEn = { royalty: 'Royalty Statement', subsidiary: 'Reader Rights', foreign: 'Foreign Rights' };
    const months = { royalty: { nl: '15 maart', en: 'March 15' }, subsidiary: { nl: '15 juni', en: 'June 15' }, foreign: { nl: '15 juli', en: 'July 15' }};

    getAuthorsData()[selectedAuthor].payments.push({
        year, type,
        title: { nl: `${typeNames[type]} ${year}`, en: `${typeNamesEn[type]} ${year}` },
        date: { nl: `${months[type].nl} ${year + 1}`, en: `${months[type].en}, ${year + 1}` },
        amount, filename
    });

    closeAddPaymentModal();
    renderAuthorDetail();
}

// Prediction Modal Functions
function openEditPredictionModal() {
    const author = getAuthorsData()[selectedAuthor];
    document.getElementById('editPredMin').value = author.prediction.min;
    document.getElementById('editPredMax').value = author.prediction.max;
    document.getElementById('editPredictionModal').classList.add('active');
}

function closeEditPredictionModal() {
    document.getElementById('editPredictionModal').classList.remove('active');
}

function savePrediction() {
    const min = parseFloat(document.getElementById('editPredMin').value);
    const max = parseFloat(document.getElementById('editPredMax').value);
    getAuthorsData()[selectedAuthor].prediction = { min, max };
    closeEditPredictionModal();
    renderAuthorDetail();
}

// Contract Modal Functions
let editingContractIndex = -1;

function openEditContractModal(index) {
    editingContractIndex = index;
    const contract = getAuthorsData()[selectedAuthor].contracts[index];
    document.getElementById('contractModalTitle').textContent = 'Contract bewerken';
    document.getElementById('editContractNumber').value = contract.number;
    document.getElementById('editContractName').value = contract.name;
    document.getElementById('currentContractPdf').textContent = contract.contractPdf ? `Huidige PDF: ${contract.contractPdf}` : 'Geen PDF geüpload';
    document.getElementById('editContractModal').classList.add('active');
}

function openAddContractModal() {
    editingContractIndex = -1;
    document.getElementById('contractModalTitle').textContent = 'Contract toevoegen';
    document.getElementById('editContractNumber').value = '';
    document.getElementById('editContractName').value = '';
    document.getElementById('currentContractPdf').textContent = '';
    document.getElementById('editContractPdf').value = '';
    document.getElementById('editContractModal').classList.add('active');
}

function closeEditContractModal() {
    document.getElementById('editContractModal').classList.remove('active');
    editingContractIndex = -1;
}

function saveContract() {
    const number = document.getElementById('editContractNumber').value;
    const name = document.getElementById('editContractName').value;
    const pdfInput = document.getElementById('editContractPdf');
    let contractPdf = null;

    if (pdfInput.files.length > 0) {
        contractPdf = pdfInput.files[0].name;
    } else if (editingContractIndex >= 0) {
        contractPdf = getAuthorsData()[selectedAuthor].contracts[editingContractIndex].contractPdf;
    }

    const contract = { number, name, contractPdf };

    if (editingContractIndex >= 0) {
        getAuthorsData()[selectedAuthor].contracts[editingContractIndex] = contract;
    } else {
        getAuthorsData()[selectedAuthor].contracts.push(contract);
    }

    closeEditContractModal();
    renderAuthorDetail();
}

function deleteContract(index) {
    if (confirm('Weet u zeker dat u dit contract wilt verwijderen?')) {
        getAuthorsData()[selectedAuthor].contracts.splice(index, 1);
        renderAuthorDetail();
    }
}

function downloadContractPDF(index) {
    const author = getAuthorsData()[selectedAuthor];
    const contract = author.contracts[index];
    if (contract.contractPdf) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const fullName = author.info.firstName + ' ' + author.info.lastName;

        // Header
        doc.setFillColor(0, 130, 198);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('Noordhoff', 20, 25);
        doc.setFontSize(12);
        doc.text('Auteurscontract', 20, 35);

        doc.setTextColor(0, 0, 0);

        // Contract details
        doc.setFontSize(16);
        doc.text(contract.name, 20, 60);

        doc.setFontSize(11);
        doc.text('Contractnummer:', 20, 80);
        doc.setFontSize(14);
        doc.text(contract.number, 70, 80);

        doc.setFontSize(11);
        doc.text('Auteur:', 20, 95);
        doc.text(fullName, 70, 95);

        doc.text('E-mail:', 20, 105);
        doc.text(author.info.email, 70, 105);

        doc.setTextColor(128, 128, 128);
        doc.setFontSize(9);
        doc.text('Dit is een digitale kopie van het ondertekende contract.', 20, 130);
        doc.text('Voor vragen kunt u contact opnemen met rights@noordhoff.nl', 20, 137);

        // Footer
        doc.text('Noordhoff Uitgevers B.V. | rights@noordhoff.nl | (050) 522 69 22', 20, 280);

        doc.save(`contract-${contract.number}.pdf`);
    }
}

// ============================================
// AUTH & MODAL HANDLERS
// ============================================
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');
    const loginBtn = document.querySelector('.login-btn');

    console.log('Login attempt:', email);

    // Show loading state
    loginBtn.disabled = true;
    loginBtn.textContent = currentLang === 'nl' ? 'Bezig...' : 'Loading...';

    try {
        // Try Supabase first if available
        if (supabaseClient && USE_SUPABASE) {
            console.log('Attempting Supabase login...');
            const result = await supabaseLogin(email, password);

            if (result.error) {
                console.log('Supabase login failed, trying local fallback...');
                // Fall back to local DATA for testing
                await tryLocalLogin(email, password, errorEl);
            } else {
                console.log('Supabase login successful');
                isSupabaseMode = true;
                currentAuthorData = result.data;
                currentUser = email;

                if (result.data.isAdmin) {
                    showDashboard(true);
                    document.getElementById('adminDashboard').classList.add('active');
                    document.body.classList.add('dashboard-active');
                    await initAdminDashboard();
                } else {
                    showDashboard(false);
                    document.getElementById('dashboard').classList.add('active');
                    document.body.classList.add('dashboard-active');
                    initAuthorDashboard();
                }
            }
        } else {
            // Local-only mode
            await tryLocalLogin(email, password, errorEl);
        }
    } catch (err) {
        console.error('Login error:', err);
        errorEl.classList.add('show');
        setTimeout(() => errorEl.classList.remove('show'), 3000);
    } finally {
        // Reset button
        loginBtn.disabled = false;
        loginBtn.textContent = currentLang === 'nl' ? 'Inloggen' : 'Sign In';
    }
});

// Local login fallback (for testing without Supabase)
async function tryLocalLogin(email, password, errorEl) {
    if (email === DATA.admin.email && password === DATA.admin.password) {
        console.log('Local admin login');
        isSupabaseMode = false;
        showDashboard(true);
        document.getElementById('adminDashboard').classList.add('active');
        document.body.classList.add('dashboard-active');
        await initAdminDashboard();
    } else if (DATA.authors[email] && DATA.authors[email].password === password) {
        console.log('Local author login');
        isSupabaseMode = false;
        currentUser = email;
        DATA.authors[email].loginHistory.push(new Date().toISOString());
        showDashboard(false);
        document.getElementById('dashboard').classList.add('active');
        document.body.classList.add('dashboard-active');
        initAuthorDashboard();
    } else {
        console.log('Invalid credentials');
        errorEl.classList.add('show');
        setTimeout(() => errorEl.classList.remove('show'), 3000);
    }
}

async function logout() {
    // Supabase logout if in Supabase mode
    if (isSupabaseMode && supabaseClient) {
        await supabaseLogout();
    }

    currentUser = null;
    selectedAuthor = null;
    currentAuthorData = null;
    isSupabaseMode = false;

    if (adminRefreshInterval) {
        clearInterval(adminRefreshInterval);
        adminRefreshInterval = null;
    }
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('adminDashboard').classList.remove('active');
    document.body.classList.remove('dashboard-active');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    showPublicSite();
}

document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('adminLogoutBtn').addEventListener('click', logout);

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('tab-' + this.dataset.tab).classList.add('active');
    });
});

// Year filter
document.querySelectorAll('.year-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderPayments(this.dataset.year);
    });
});

// Language toggle
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function() { updateLanguage(this.dataset.lang); });
});

// Edit modal
document.getElementById('editInfoBtn').addEventListener('click', function() {
    const author = getCurrentAuthor();
    if (!author) return;

    document.getElementById('editFirstName').value = author.info.firstName || '';
    document.getElementById('editInitials').value = author.info.voorletters || '';
    document.getElementById('editLastName').value = author.info.lastName || '';
    document.getElementById('editBSN').value = author.info.bsn || '';
    document.getElementById('editEmail').value = author.info.email || '';
    document.getElementById('editStreet').value = author.info.street || '';
    document.getElementById('editHouseNumber').value = author.info.houseNumber || '';
    document.getElementById('editPostcode').value = author.info.postcode || '';
    document.getElementById('editCountry').value = author.info.country || '';
    document.getElementById('editBirthDate').value = author.info.birthDate || '';
    document.getElementById('editPhone').value = author.info.phone || '';
    document.getElementById('editBankAccount').value = author.info.bankAccount || '';
    document.getElementById('editBIC').value = author.info.bic || '';
    document.getElementById('editModal').classList.add('active');
});

document.getElementById('modalClose').addEventListener('click', () => document.getElementById('editModal').classList.remove('active'));
document.getElementById('modalCancel').addEventListener('click', () => document.getElementById('editModal').classList.remove('active'));

// IBAN Validation function
function validateIBAN(iban) {
    if (!iban) return true; // Empty is allowed
    const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();
    if (cleanIBAN.length < 15 || cleanIBAN.length > 34) return false;
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleanIBAN)) return false;

    // Move first 4 chars to end
    const rearranged = cleanIBAN.slice(4) + cleanIBAN.slice(0, 4);
    // Convert letters to numbers (A=10, B=11, etc.)
    let numericString = '';
    for (let i = 0; i < rearranged.length; i++) {
        const char = rearranged[i];
        if (char >= 'A' && char <= 'Z') {
            numericString += (char.charCodeAt(0) - 55).toString();
        } else {
            numericString += char;
        }
    }
    // Calculate mod 97 using string chunks to handle large numbers
    let remainder = 0;
    for (let i = 0; i < numericString.length; i++) {
        remainder = (remainder * 10 + parseInt(numericString[i])) % 97;
    }
    return remainder === 1;
}

// Pending save data for password verification
let pendingSaveData = null;

function closePasswordVerifyModal() {
    document.getElementById('passwordVerifyModal').classList.remove('active');
    document.getElementById('verifyPassword').value = '';
    document.getElementById('passwordError').style.display = 'none';
    pendingSaveData = null;
}

async function verifyPasswordAndSave() {
    const password = document.getElementById('verifyPassword').value;

    // Verify password based on mode
    if (isSupabaseMode && supabaseClient) {
        // Re-authenticate with Supabase to verify password
        const { error } = await supabaseClient.auth.signInWithPassword({
            email: currentUser,
            password: password
        });
        if (error) {
            document.getElementById('passwordError').style.display = 'block';
            return;
        }
    } else {
        // Local mode - check against DATA
        const author = DATA.authors[currentUser];
        if (password !== author.password) {
            document.getElementById('passwordError').style.display = 'block';
            return;
        }
    }

    // Password correct - proceed with bank change as pending approval
    if (pendingSaveData) {
        const author = isSupabaseMode && currentAuthorData ? currentAuthorData : DATA.authors[currentUser];

        if (isSupabaseMode && currentAuthorData) {
            console.log('💾 Saving bank changes to SUPABASE...');
            // Submit bank changes to Supabase as change requests
            if (pendingSaveData.newBank !== author.info.bankAccount) {
                await submitChangeRequest(currentAuthorData.id, 'IBAN', author.info.bankAccount, pendingSaveData.newBank);
            }
            if (pendingSaveData.newBIC !== (author.info.bic || '')) {
                await submitChangeRequest(currentAuthorData.id, 'BIC', author.info.bic || '', pendingSaveData.newBIC);
            }

            // Apply non-bank changes to Supabase
            await applyNonBankChangesSupabase(pendingSaveData);

            // Refresh data from Supabase
            await refreshCurrentAuthorData();
            console.log('✅ Bank changes submitted to Supabase (pending approval)');
        } else {
            // Local mode
            const now = new Date().toISOString();
            const changeId = Date.now().toString(36) + Math.random().toString(36).substr(2);

            author.infoChanges.push({
                id: changeId + '_ib',
                date: now,
                field: 'IBAN',
                old: author.info.bankAccount,
                new: pendingSaveData.newBank,
                status: 'pending'
            });

            if (pendingSaveData.newBIC !== author.info.bic) {
                author.infoChanges.push({
                    id: changeId + '_bic',
                    date: now,
                    field: 'BIC',
                    old: author.info.bic || '',
                    new: pendingSaveData.newBIC,
                    status: 'pending'
                });
            }

            applyNonBankChanges(pendingSaveData);
        }

        closePasswordVerifyModal();
        document.getElementById('editModal').classList.remove('active');

        // Refresh dashboard safely
        try {
            initAuthorDashboard();
        } catch (err) {
            console.error('Dashboard refresh error:', err);
        }

        showConfirmationModal(currentLang === 'nl'
            ? 'Uw wijzigingen zijn opgeslagen. De bankgegevens wijziging wordt ter goedkeuring aangeboden aan de administrator.'
            : 'Your changes have been saved. The bank details change has been submitted for administrator approval.');
    }
}

function applyNonBankChanges(data) {
    const author = DATA.authors[currentUser];
    const now = new Date().toISOString();
    const changeId = Date.now().toString(36) + Math.random().toString(36).substr(2);

    // Track and apply non-bank changes
    if (data.newFirstName !== author.info.firstName) {
        author.infoChanges.push({ id: changeId + '_fn', date: now, field: 'Voornaam', old: author.info.firstName, new: data.newFirstName, status: 'pending' });
        author.info.firstName = data.newFirstName;
    }
    if (data.newInitials !== (author.info.voorletters || '')) {
        author.infoChanges.push({ id: changeId + '_in', date: now, field: 'Voorletters', old: author.info.voorletters || '', new: data.newInitials, status: 'pending' });
        author.info.voorletters = data.newInitials;
    }
    if (data.newLastName !== author.info.lastName) {
        author.infoChanges.push({ id: changeId + '_ln', date: now, field: 'Achternaam', old: author.info.lastName, new: data.newLastName, status: 'pending' });
        author.info.lastName = data.newLastName;
    }
    if (data.newBSN !== (author.info.bsn || '')) {
        author.infoChanges.push({ id: changeId + '_bsn', date: now, field: 'BSN', old: author.info.bsn || '', new: data.newBSN, status: 'pending' });
        author.info.bsn = data.newBSN;
    }
    if (data.newStreet !== author.info.street) {
        author.infoChanges.push({ id: changeId + '_st', date: now, field: 'Straat', old: author.info.street, new: data.newStreet, status: 'pending' });
        author.info.street = data.newStreet;
    }
    if (data.newHouseNumber !== author.info.houseNumber) {
        author.infoChanges.push({ id: changeId + '_hn', date: now, field: 'Huisnummer', old: author.info.houseNumber, new: data.newHouseNumber, status: 'pending' });
        author.info.houseNumber = data.newHouseNumber;
    }
    if (data.newPostcode !== author.info.postcode) {
        author.infoChanges.push({ id: changeId + '_pc', date: now, field: 'Postcode', old: author.info.postcode, new: data.newPostcode, status: 'pending' });
        author.info.postcode = data.newPostcode;
    }
    if (data.newCountry !== author.info.country) {
        author.infoChanges.push({ id: changeId + '_co', date: now, field: 'Land', old: author.info.country, new: data.newCountry, status: 'pending' });
        author.info.country = data.newCountry;
    }
    if (data.newBirthDate !== author.info.birthDate) {
        author.infoChanges.push({ id: changeId + '_bd', date: now, field: 'Geboortedatum', old: author.info.birthDate, new: data.newBirthDate, status: 'pending' });
        author.info.birthDate = data.newBirthDate;
    }
    if (data.newPhone !== author.info.phone) {
        author.infoChanges.push({ id: changeId + '_ph', date: now, field: 'Telefoonnummer', old: author.info.phone, new: data.newPhone, status: 'pending' });
        author.info.phone = data.newPhone;
    }

    // Update initials
    if (data.newFirstName && data.newLastName) {
        author.info.initials = (data.newFirstName[0] + data.newLastName[0]).toUpperCase();
    }
}

// Supabase version: submit change requests AND update author record
async function applyNonBankChangesSupabase(data) {
    if (!currentAuthorData) return;

    const author = currentAuthorData;
    const authorId = author.id;
    const updates = {};

    // Track changes and build update object
    if (data.newFirstName !== author.info.firstName) {
        await submitChangeRequest(authorId, 'Voornaam', author.info.firstName, data.newFirstName);
        updates.first_name = data.newFirstName;
    }
    if (data.newInitials !== (author.info.voorletters || '')) {
        await submitChangeRequest(authorId, 'Voorletters', author.info.voorletters || '', data.newInitials);
        updates.voorletters = data.newInitials;
    }
    if (data.newLastName !== author.info.lastName) {
        await submitChangeRequest(authorId, 'Achternaam', author.info.lastName, data.newLastName);
        updates.last_name = data.newLastName;
    }
    if (data.newBSN !== (author.info.bsn || '')) {
        await submitChangeRequest(authorId, 'BSN', author.info.bsn || '', data.newBSN);
        updates.bsn = data.newBSN;
    }
    if (data.newStreet !== author.info.street) {
        await submitChangeRequest(authorId, 'Straat', author.info.street, data.newStreet);
        updates.street = data.newStreet;
    }
    if (data.newHouseNumber !== author.info.houseNumber) {
        await submitChangeRequest(authorId, 'Huisnummer', author.info.houseNumber, data.newHouseNumber);
        updates.house_number = data.newHouseNumber;
    }
    if (data.newPostcode !== author.info.postcode) {
        await submitChangeRequest(authorId, 'Postcode', author.info.postcode, data.newPostcode);
        updates.postcode = data.newPostcode;
    }
    if (data.newCountry !== author.info.country) {
        await submitChangeRequest(authorId, 'Land', author.info.country, data.newCountry);
        updates.country = data.newCountry;
    }
    if (data.newBirthDate !== author.info.birthDate) {
        await submitChangeRequest(authorId, 'Geboortedatum', author.info.birthDate, data.newBirthDate);
        updates.birth_date = data.newBirthDate;
    }
    if (data.newPhone !== author.info.phone) {
        await submitChangeRequest(authorId, 'Telefoonnummer', author.info.phone, data.newPhone);
        updates.phone = data.newPhone;
    }

    // Update initials if name changed
    if (data.newFirstName && data.newLastName) {
        updates.initials = (data.newFirstName[0] + data.newLastName[0]).toUpperCase();
    }

    // Apply updates to Supabase if any
    if (Object.keys(updates).length > 0) {
        await updateAuthorInSupabase(authorId, updates);
    }
}

document.getElementById('modalSave').addEventListener('click', async function() {
    try {
        // Get author from appropriate source
        const author = isSupabaseMode && currentAuthorData ? currentAuthorData : DATA.authors[currentUser];

        const newFirstName = document.getElementById('editFirstName').value.trim();
        const newInitials = document.getElementById('editInitials').value.trim();
        const newLastName = document.getElementById('editLastName').value.trim();
        const newBSN = document.getElementById('editBSN').value.trim();
        const newStreet = document.getElementById('editStreet').value.trim();
        const newHouseNumber = document.getElementById('editHouseNumber').value.trim();
        const newPostcode = document.getElementById('editPostcode').value.trim();
        const newCountry = document.getElementById('editCountry').value.trim();
        const newBirthDate = document.getElementById('editBirthDate').value.trim();
        const newPhone = document.getElementById('editPhone').value.trim();
        const newBank = document.getElementById('editBankAccount').value.trim();
        const newBIC = document.getElementById('editBIC').value.trim();

        // Validate birth date
        if (newBirthDate) {
            const datePattern = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
            const match = newBirthDate.match(datePattern);
            if (!match) {
                alert(currentLang === 'nl' ? 'Ongeldige geboortedatum. Gebruik het formaat dd-mm-jjjj.' : 'Invalid date of birth. Use format dd-mm-yyyy.');
                return;
            }
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10);
            const year = parseInt(match[3], 10);
            const currentYear = new Date().getFullYear();

            if (month < 1 || month > 12) {
                alert(currentLang === 'nl' ? 'Ongeldige maand. Voer een maand tussen 1 en 12 in.' : 'Invalid month. Enter a month between 1 and 12.');
                return;
            }
            if (day < 1 || day > 31) {
                alert(currentLang === 'nl' ? 'Ongeldige dag. Voer een dag tussen 1 en 31 in.' : 'Invalid day. Enter a day between 1 and 31.');
                return;
            }
            if (year < 1900 || year > currentYear) {
                alert(currentLang === 'nl' ? `Ongeldig jaar. Voer een jaar tussen 1900 en ${currentYear} in.` : `Invalid year. Enter a year between 1900 and ${currentYear}.`);
                return;
            }
            const testDate = new Date(year, month - 1, day);
            if (testDate.getDate() !== day || testDate.getMonth() !== month - 1 || testDate.getFullYear() !== year) {
                alert(currentLang === 'nl' ? 'Deze datum bestaat niet.' : 'This date does not exist.');
                return;
            }
        }

        // Validate IBAN if changed
        if (newBank && newBank !== author.info.bankAccount) {
            if (!validateIBAN(newBank)) {
                alert(currentLang === 'nl' ? 'Ongeldig IBAN nummer. Controleer het nummer en probeer opnieuw.' : 'Invalid IBAN number. Please check the number and try again.');
                return;
            }
        }

        const saveData = {
            newFirstName, newInitials, newLastName, newBSN, newStreet, newHouseNumber,
            newPostcode, newCountry, newBirthDate, newPhone, newBank, newBIC
        };

        // Check if bank details changed - require password verification
        const bankChanged = newBank !== author.info.bankAccount || newBIC !== (author.info.bic || '');

        if (bankChanged) {
            pendingSaveData = saveData;
            document.getElementById('passwordVerifyModal').classList.add('active');
            document.getElementById('verifyPassword').focus();
            return;
        }

        // No bank change - apply changes directly
        if (isSupabaseMode && currentAuthorData) {
            console.log('💾 Saving changes to SUPABASE...');
            await applyNonBankChangesSupabase(saveData);
            await refreshCurrentAuthorData();
            console.log('✅ Changes saved to Supabase');
        } else {
            console.log('💾 Saving changes to LOCAL DATA...');
            applyNonBankChanges(saveData);
        }

        document.getElementById('editModal').classList.remove('active');

        // Refresh dashboard safely
        try {
            initAuthorDashboard();
        } catch (err) {
            console.error('Dashboard refresh error:', err);
        }

        showConfirmationModal(currentLang === 'nl'
            ? 'Uw wijzigingen zijn opgeslagen en worden verwerkt.'
            : 'Your changes have been saved and will be processed.');

    } catch (err) {
        console.error('Save error:', err);
        alert(currentLang === 'nl' ? 'Er is een fout opgetreden bij het opslaan. Probeer het opnieuw.' : 'An error occurred while saving. Please try again.');
    }
});

document.getElementById('editModal').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
});

document.getElementById('rejectionModal').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
});

document.getElementById('confirmationModal').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
});

document.getElementById('passwordVerifyModal').addEventListener('click', function(e) {
    if (e.target === this) closePasswordVerifyModal();
});

// Enter key support for password verification
document.getElementById('verifyPassword').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        verifyPasswordAndSave();
    }
});

// ============================================
// CSV IMPORT FUNCTIONS
// ============================================

let importData = [];

function openImportModal() {
    document.getElementById('importModal').classList.add('active');
    document.getElementById('importStep1').style.display = 'block';
    document.getElementById('importStep2').style.display = 'none';
    document.getElementById('importStep3').style.display = 'none';
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('importFile').value = '';
    document.getElementById('importStartBtn').disabled = true;
    importData = [];
}

function closeImportModal() {
    document.getElementById('importModal').classList.remove('active');
}

function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

    // Parse rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === header.length) {
            const row = {};
            header.forEach((h, idx) => {
                row[h] = values[idx]?.trim().replace(/^["']|["']$/g, '') || '';
            });
            rows.push(row);
        }
    }
    return rows;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && !inQuotes) {
            inQuotes = true;
        } else if (char === '"' && inQuotes) {
            if (line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = false;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

function previewImport() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];

    if (!file) {
        document.getElementById('importPreview').style.display = 'none';
        document.getElementById('importStartBtn').disabled = true;
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        importData = parseCSV(text);

        if (importData.length === 0) {
            alert('Geen geldige data gevonden in het CSV bestand.');
            document.getElementById('importPreview').style.display = 'none';
            document.getElementById('importStartBtn').disabled = true;
            return;
        }

        // Show preview
        const previewRows = importData.slice(0, 5);
        const headers = Object.keys(importData[0]);

        let tableHTML = '<thead><tr>';
        headers.forEach(h => {
            tableHTML += `<th>${h}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';

        previewRows.forEach(row => {
            tableHTML += '<tr>';
            headers.forEach(h => {
                const val = row[h] || '';
                tableHTML += `<td>${val.length > 30 ? val.substring(0, 30) + '...' : val}</td>`;
            });
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody>';

        document.getElementById('importPreviewTable').innerHTML = tableHTML;
        document.getElementById('importCount').textContent = `Totaal: ${importData.length} auteurs gevonden`;
        document.getElementById('importPreview').style.display = 'block';
        document.getElementById('importStartBtn').disabled = false;
    };
    reader.readAsText(file);
}

async function startImport() {
    if (importData.length === 0) return;

    // Switch to step 2 (progress)
    document.getElementById('importStep1').style.display = 'none';
    document.getElementById('importStep2').style.display = 'block';
    document.getElementById('importStartBtn').disabled = true;

    const total = importData.length;
    let processed = 0;
    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors = [];

    console.log(`📥 Starting import of ${total} authors...`);

    for (const row of importData) {
        try {
            // Map CSV columns to database columns
            const authorData = {
                email: (row.email || '').toLowerCase(),
                first_name: row.first_name || row.firstname || '',
                last_name: row.last_name || row.lastname || '',
                voorletters: row.voorletters || null,
                phone: row.phone || row.telefoon || null,
                street: row.street || row.straat || null,
                house_number: row.house_number || row.huisnummer || null,
                postcode: row.postcode || row.zip || null,
                country: row.country || row.land || 'Nederland',
                bank_account: row.iban || row.bank_account || null,
                bic: row.bic || null,
                bsn: row.bsn || null,
                birth_date: row.birth_date || row.geboortedatum || null,
                netsuite_vendor_id: row.vendor_id || row.entityid || null,
                netsuite_internal_id: row.internal_id ? parseInt(row.internal_id) : null,
                initials: ((row.first_name || row.firstname || '')[0] + (row.last_name || row.lastname || '')[0]).toUpperCase() || null,
                is_admin: false,
                is_active: true,
            };

            if (!authorData.email) {
                errors.push({ row: processed + 1, error: 'Geen email adres' });
                failed++;
                processed++;
                continue;
            }

            // Check if author exists in Supabase
            const { data: existing, error: checkError } = await supabaseClient
                .from('authors')
                .select('id')
                .eq('email', authorData.email)
                .maybeSingle();

            if (checkError && checkError.code !== 'PGRST116') {
                throw new Error(checkError.message);
            }

            if (existing) {
                // Update existing author
                const { error: updateError } = await supabaseClient
                    .from('authors')
                    .update(authorData)
                    .eq('id', existing.id);

                if (updateError) {
                    errors.push({ email: authorData.email, error: updateError.message });
                    failed++;
                } else {
                    updated++;
                }
            } else {
                // Create new author
                // Generate a random UUID for the author (since they don't have an auth account yet)
                const { error: insertError } = await supabaseClient
                    .from('authors')
                    .insert(authorData);

                if (insertError) {
                    errors.push({ email: authorData.email, error: insertError.message });
                    failed++;
                } else {
                    created++;
                }
            }

            processed++;

            // Update progress UI
            const progress = Math.round((processed / total) * 100);
            document.getElementById('importProgressBar').style.width = progress + '%';
            document.getElementById('importProgressText').textContent = `${processed} / ${total}`;
            document.getElementById('importStatus').textContent = `Importeren... ${authorData.email}`;

        } catch (err) {
            errors.push({ row: processed + 1, error: err.message });
            failed++;
            processed++;
        }
    }

    console.log(`✅ Import completed: ${created} created, ${updated} updated, ${failed} failed`);

    // Log to sync_log table
    if (supabaseClient) {
        await supabaseClient.from('sync_log').insert({
            sync_type: 'csv_import',
            records_processed: processed,
            records_created: created,
            records_updated: updated,
            records_failed: failed,
            errors: errors.length > 0 ? errors.slice(0, 50) : null,
            status: failed > 0 && created === 0 && updated === 0 ? 'failed' : 'completed',
            completed_at: new Date().toISOString()
        });
    }

    // Show results (step 3)
    document.getElementById('importStep2').style.display = 'none';
    document.getElementById('importStep3').style.display = 'block';

    const success = created > 0 || updated > 0;
    document.getElementById('importResultIcon').innerHTML = success ? '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#007A60" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="16 8 10 16 7 13"/></svg>' : '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    document.getElementById('importResultTitle').textContent = success ? 'Import voltooid!' : 'Import mislukt';

    let detailsHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
            <div><strong>Verwerkt:</strong></div><div>${processed}</div>
            <div><strong>Nieuw aangemaakt:</strong></div><div style="color:#2e7d32;">${created}</div>
            <div><strong>Bijgewerkt:</strong></div><div style="color:#1565c0;">${updated}</div>
            <div><strong>Mislukt:</strong></div><div style="color:#c62828;">${failed}</div>
        </div>
    `;

    if (errors.length > 0) {
        detailsHTML += `
            <div style="margin-top:1rem;">
                <strong>Fouten (eerste 10):</strong>
                <ul style="margin:0.5rem 0 0 1rem;font-size:0.85rem;">
                    ${errors.slice(0, 10).map(e => `<li>${e.email || 'Rij ' + e.row}: ${e.error}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    document.getElementById('importResultDetails').innerHTML = detailsHTML;

    // Refresh admin dashboard
    if (isSupabaseMode) {
        await loadAllAuthorsForAdmin();
    }
    renderAuthorList();
    updateAdminStats();
}

// Close import modal on overlay click
document.getElementById('importModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeImportModal();
});

// Initialize public site content on load
initPublicSite();

console.log('Script loaded successfully. Available authors:', Object.keys(DATA.authors));
