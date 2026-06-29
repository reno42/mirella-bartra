import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Auth helpers ───────────────────────────────────────────────────────────
export const auth = {
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  },

  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },
}

// ─── Database helpers ────────────────────────────────────────────────────────
export const db = {
  // ── Categories ──
  getCategories: async () => {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order')
    return { data, error }
  },

  // ── Articles ──
  getArticles: async ({ status = 'published', limit = 20, featured, category, specialty } = {}) => {
    let query = supabase.from('articles').select('*').eq('status', status).order('published_at', { ascending: false }).limit(limit)
    if (featured) query = query.eq('is_featured', true)
    if (category) query = query.eq('articleSection', category)
    if (specialty) query = query.eq('category', specialty)
    const { data, error } = await query
    return { data, error }
  },

  getArticleBySlug: async (slug) => {
    const { data, error } = await supabase.from('articles').select('*').eq('slug', slug).eq('status', 'published').single()
    return { data, error }
  },

  getRelatedArticles: async (articleId, limit = 3) => {
    const { data: relations } = await supabase.from('article_related').select('related_id').eq('article_id', articleId)
    const ids = relations?.map(r => r.related_id) || []
    if (ids.length === 0) return { data: [], error: null }
    const { data, error } = await supabase.from('articles').select('*').in('id', ids).eq('status', 'published').limit(limit)
    return { data, error }
  },

  // Admin: all articles
  getAllArticles: async () => {
    const { data, error } = await supabase.from('articles').select('*').order('created_at', { ascending: false })
    return { data, error }
  },

  createArticle: async (article) => {
    const { data, error } = await supabase.from('articles').insert(article).select().single()
    return { data, error }
  },

  updateArticle: async (id, updates) => {
    const { data, error } = await supabase.from('articles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    return { data, error }
  },

  deleteArticle: async (id) => {
    const { error } = await supabase.from('articles').delete().eq('id', id)
    return { error }
  },

  // ── Courses ──
  getCourses: async ({ status = 'published' } = {}) => {
    const { data, error } = await supabase.from('courses').select('*').eq('status', status).order('start_date', { ascending: true })
    return { data, error }
  },

  getCourseBySlug: async (slug) => {
    const { data, error } = await supabase.from('courses').select('*').eq('slug', slug).eq('status', 'published').single()
    return { data, error }
  },

  enrollInCourse: async (enrollment) => {
    const { data, error } = await supabase.from('course_enrollments').insert(enrollment).select().single()
    return { data, error }
  },

  // Admin
  getAllCourses: async () => {
    const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false })
    return { data, error }
  },

  createCourse: async (course) => {
    const { data, error } = await supabase.from('courses').insert(course).select().single()
    return { data, error }
  },

  updateCourse: async (id, updates) => {
    const { data, error } = await supabase.from('courses').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    return { data, error }
  },

  deleteCourse: async (id) => {
    const { error } = await supabase.from('courses').delete().eq('id', id)
    return { error }
  },

  // ── Events ──
  getEvents: async ({ upcoming } = {}) => {
    let query = supabase.from('events').select('*').order('start_date', { ascending: true })
    if (upcoming) query = query.in('event_status', ['upcoming', 'ongoing'])
    const { data, error } = await query
    return { data, error }
  },

  getEventBySlug: async (slug) => {
    const { data, error } = await supabase.from('events').select('*').eq('slug', slug).single()
    return { data, error }
  },

  // Admin
  getAllEvents: async () => {
    const { data, error } = await supabase.from('events').select('*').order('start_date', { ascending: false })
    return { data, error }
  },

  createEvent: async (event) => {
    const { data, error } = await supabase.from('events').insert(event).select().single()
    return { data, error }
  },

  updateEvent: async (id, updates) => {
    const { data, error } = await supabase.from('events').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    return { data, error }
  },

  deleteEvent: async (id) => {
    const { error } = await supabase.from('events').delete().eq('id', id)
    return { error }
  },

  // ── Directory ──
  getDirectory: async ({ specialty, city } = {}) => {
    let query = supabase.from('directory').select('*').eq('status', 'published').eq('consent_given', true).order('full_name')
    if (specialty) query = query.eq('specialty', specialty)
    if (city) query = query.eq('city', city)
    const { data, error } = await query
    return { data, error }
  },

  getTherapistBySlug: async (slug) => {
    const { data, error } = await supabase.from('directory').select('*').eq('slug', slug).eq('status', 'published').eq('consent_given', true).single()
    return { data, error }
  },

  // Admin
  getAllDirectory: async () => {
    const { data, error } = await supabase.from('directory').select('*').order('created_at', { ascending: false })
    return { data, error }
  },

  createDirectoryEntry: async (entry) => {
    const { data, error } = await supabase.from('directory').insert(entry).select().single()
    return { data, error }
  },

  updateDirectoryEntry: async (id, updates) => {
    const { data, error } = await supabase.from('directory').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    return { data, error }
  },

  deleteDirectoryEntry: async (id) => {
    const { error } = await supabase.from('directory').delete().eq('id', id)
    return { error }
  },

  // ── Leads ──
  createLead: async (lead) => {
    const { data, error } = await supabase.from('leads').insert(lead).select().single()
    return { data, error }
  },

  getAllLeads: async () => {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    return { data, error }
  },

  updateLead: async (id, updates) => {
    const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single()
    return { data, error }
  },

  // ── Subscribers ──
  createSubscriber: async (subscriber) => {
    const { data, error } = await supabase.from('subscribers').insert(subscriber).select().single()
    return { data, error }
  },

  getAllSubscribers: async () => {
    const { data, error } = await supabase.from('subscribers').select('*').order('subscribed_at', { ascending: false })
    return { data, error }
  },

  // ── Testimonials ──
  getTestimonials: async () => {
    const { data, error } = await supabase.from('testimonials').select('*').eq('status', 'published').order('created_at', { ascending: false })
    return { data, error }
  },

  getAllTestimonials: async () => {
    const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false })
    return { data, error }
  },

  createTestimonial: async (testimonial) => {
    const { data, error } = await supabase.from('testimonials').insert(testimonial).select().single()
    return { data, error }
  },

  updateTestimonial: async (id, updates) => {
    const { data, error } = await supabase.from('testimonials').update(updates).eq('id', id).select().single()
    return { data, error }
  },

  deleteTestimonial: async (id) => {
    const { error } = await supabase.from('testimonials').delete().eq('id', id)
    return { error }
  },

  // ── FAQs ──
  getFAQs: async (scope = 'page', pageName = 'home') => {
    const { data, error } = await supabase.from('faqs').select('*').eq('scope_type', scope).eq('pagina', pageName).eq('publicado', true).order('orden', { ascending: true })
    return { data, error }
  },

  getAllFAQs: async () => {
    const { data, error } = await supabase.from('faqs').select('*').order('created_at', { ascending: false })
    return { data, error }
  },

  createFAQ: async (faq) => {
    const { data, error } = await supabase.from('faqs').insert(faq).select().single()
    return { data, error }
  },

  updateFAQ: async (id, updates) => {
    const { data, error } = await supabase.from('faqs').update(updates).eq('id', id).select().single()
    return { data, error }
  },

  deleteFAQ: async (id) => {
    const { error } = await supabase.from('faqs').delete().eq('id', id)
    return { error }
  },

  // ── Complaints ──
  createComplaint: async (complaint) => {
    const { data, error } = await supabase.from('complaints_book').insert(complaint).select().single()
    return { data, error }
  },

  getAllComplaints: async () => {
    const { data, error } = await supabase.from('complaints_book').select('*').order('created_at', { ascending: false })
    return { data, error }
  },

  updateComplaint: async (id, updates) => {
    const { data, error } = await supabase.from('complaints_book').update(updates).eq('id', id).select().single()
    return { data, error }
  },

  // ── CMS Config ──
  getCMSConfig: async (key) => {
    const { data, error } = await supabase.from('cms_config').select('*').eq('id', key).single()
    return { data, error }
  },

  getAllCMSConfig: async () => {
    const { data, error } = await supabase.from('cms_config').select('*').order('group_key')
    return { data, error }
  },

  updateCMSConfig: async (key, value) => {
    const { data, error } = await supabase.from('cms_config').upsert({ id: key, value, updated_at: new Date().toISOString() }).select().single()
    return { data, error }
  },

  // ── Media ──
  getMedia: async () => {
    const { data, error } = await supabase.from('media').select('*').order('created_at', { ascending: false })
    return { data, error }
  },

  // ── Search ──
  search: async (query) => {
    const { data, error } = await supabase.rpc('search_site', { search_query: query })
    return { data, error }
  },

  // ── Dashboard metrics ──
  getDashboardMetrics: async () => {
    const [articles, courses, subscribers, leads, events] = await Promise.all([
      supabase.from('articles').select('id', { count: 'exact', head: true }),
      supabase.from('course_enrollments').select('id', { count: 'exact', head: true }),
      supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'nuevo'),
      supabase.from('events').select('id', { count: 'exact', head: true }).in('event_status', ['upcoming', 'ongoing']),
    ])
    return {
      totalArticles: articles.count || 0,
      totalEnrollments: courses.count || 0,
      totalSubscribers: subscribers.count || 0,
      newLeads: leads.count || 0,
      upcomingEvents: events.count || 0,
    }
  },

  // ── Deposits (manual payment tracking) ──
  getDeposits: async ({ status } = {}) => {
    let query = supabase.from('deposits').select('*').order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    return { data, error }
  },

  createDeposit: async (deposit) => {
    const { data, error } = await supabase.from('deposits').insert(deposit).select().single()
    return { data, error }
  },

  updateDepositStatus: async (id, status) => {
    const { data, error } = await supabase.from('deposits').update({
      status,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id).select().single()
    return { data, error }
  },

  // ── B2B Programs ──
  getB2BPrograms: async ({ status = 'published' } = {}) => {
    const { data, error } = await supabase.from('b2b_programs').select('*').eq('status', status).order('created_at', { ascending: false })
    return { data, error }
  },

  getAllB2BPrograms: async () => {
    const { data, error } = await supabase.from('b2b_programs').select('*').order('created_at', { ascending: false })
    return { data, error }
  },

  createB2BProgram: async (program) => {
    const { data, error } = await supabase.from('b2b_programs').insert(program).select().single()
    return { data, error }
  },

  updateB2BProgram: async (id, updates) => {
    const { data, error } = await supabase.from('b2b_programs').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    return { data, error }
  },

  deleteB2BProgram: async (id) => {
    const { error } = await supabase.from('b2b_programs').delete().eq('id', id)
    return { error }
  },

  // ── B2B Leads ──
  createB2BLead: async (lead) => {
    const { data, error } = await supabase.from('b2b_leads').insert(lead).select().single()
    return { data, error }
  },

  getB2BLeads: async () => {
    const { data, error } = await supabase.from('b2b_leads').select('*').order('created_at', { ascending: false })
    return { data, error }
  },
}

// ─── Storage helpers ─────────────────────────────────────────────────────────
export const storage = {
  uploadFile: async (bucket, file, path) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    })
    return { data, error }
  },

  getPublicUrl: (bucket, path) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },

  deleteFile: async (bucket, path) => {
    const { data, error } = await supabase.storage.from(bucket).remove([path])
    return { data, error }
  },
}

// ─── User Management (admin) ──────────────────────────────────────────────────
export const users = {
  getAll: async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    return { data, error }
  },

  updateRole: async (userId, role) => {
    const { data, error } = await supabase.from('profiles').update({ role }).eq('id', userId).select().single()
    return { data, error }
  },
}
