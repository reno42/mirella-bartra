/**
 * Edge Function: api-feeds
 * Serves LLM-friendly JSON structured data feeds.
 * Endpoints:
 *   GET /api/feeds/kg.json       — Knowledge Graph
 *   GET /api/feeds/articles.json — Published articles
 *   GET /api/feeds/courses.json  — Published courses
 *   GET /api/feeds/events.json   — Upcoming events
 *   GET /api/feeds/directory.json— Directory entries
 * Cache: 5 minutes
 */

const SITE_URL = Deno.env.get('SITE_URL') || 'https://mirellabartra.com'

function getSupabaseHeaders() {
  const key = Deno.env.get('SUPABASE_ANON_KEY') || ''
  return { apikey: key, Authorization: `Bearer ${key}` }
}

async function fetchSupabase(endpoint: string) {
  const url = `${Deno.env.get('SUPABASE_URL')}/rest/v1/${endpoint}`
  const resp = await fetch(url, { headers: getSupabaseHeaders() })
  return resp.json()
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export default async function handler(req: Request) {
  const url = new URL(req.url)
  const path = url.pathname.replace('/api/feeds/', '').replace(/\.json$/, '')

  const now = new Date().toISOString()

  switch (path) {
    case 'kg': {
      // Knowledge Graph
      const resp = await fetchSupabase('cms_config?select=*')
      const config = resp.reduce((acc: Record<string,string>, row: {id:string, value:string}) => {
        acc[row.id] = row.value; return acc
      }, {})

      return jsonResponse({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': `${SITE_URL}/#organization`,
            name: config.site_name || 'Mirella Bartra',
            url: SITE_URL,
            description: config.site_description || 'El primer medio oficial para terapeutas de todo el continente.',
            email: config.contact_email || 'contacto@mirellabartra.com',
            sameAs: [
              config.facebook_url, config.instagram_url, config.linkedin_url,
              config.youtube_url, config.tiktok_url,
            ].filter(Boolean),
          },
          {
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            url: SITE_URL,
            name: config.site_name || 'Mirella Bartra',
            inLanguage: 'es-PE',
            potentialAction: {
              '@type': 'SearchAction',
              target: `${SITE_URL}/buscar?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          },
        ],
        lastUpdated: now,
        source: SITE_URL,
      })
    }

    case 'articles': {
      const data = await fetchSupabase('articles?status=eq.published&order=published_at.desc&limit=50&select=id,title,slug,description,keywords,articleSection,published_at,image_url,author_name')
      return jsonResponse({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Artículos de Mirella Bartra',
        numberOfItems: data.length,
        lastUpdated: now,
        itemListElement: data.map((a: Record<string,unknown>, i: number) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Article',
            '@id': `${SITE_URL}/articulos/${a.slug}`,
            headline: a.title,
            description: a.description,
            url: `${SITE_URL}/articulos/${a.slug}`,
            datePublished: a.published_at,
            author: { '@type': 'Person', name: a.author_name || 'Mirella Bartra' },
            keywords: a.keywords,
            articleSection: a.articleSection,
            image: a.image_url,
          },
        })),
      })
    }

    case 'courses': {
      const data = await fetchSupabase('courses?status=eq.published&order=start_date.asc&limit=30&select=id,title,slug,description,start_date,end_date,modality,price,image_url,instructor_name')
      return jsonResponse({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Cursos de Mirella Bartra',
        numberOfItems: data.length,
        lastUpdated: now,
        itemListElement: data.map((c: Record<string,unknown>, i: number) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Course',
            '@id': `${SITE_URL}/cursos/${c.slug}`,
            name: c.title,
            description: c.description,
            url: `${SITE_URL}/cursos/${c.slug}`,
            courseMode: c.modality === 'online' ? 'Online' : 'Onsite',
            startDate: c.start_date,
            endDate: c.end_date,
            instructor: c.instructor_name ? { '@type': 'Person', name: c.instructor_name } : undefined,
            offers: c.price ? { '@type': 'Offer', price: c.price, priceCurrency: 'PEN' } : undefined,
            image: c.image_url,
          },
        })),
      })
    }

    case 'events': {
      const data = await fetchSupabase('events?event_status=in.(upcoming,ongoing)&order=start_date.asc&limit=20&select=id,title,slug,description,start_date,end_date,event_status,location,image_url')
      return jsonResponse({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Eventos de Mirella Bartra',
        numberOfItems: data.length,
        lastUpdated: now,
        itemListElement: data.map((e: Record<string,unknown>, i: number) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Event',
            '@id': `${SITE_URL}/eventos/${e.slug}`,
            name: e.title,
            description: e.description,
            url: `${SITE_URL}/eventos/${e.slug}`,
            startDate: e.start_date,
            endDate: e.end_date,
            eventStatus: e.event_status === 'upcoming' ? 'https://schema.org/EventScheduled' : 'https://schema.org/EventMovedOnline',
            location: e.location ? { '@type': 'Place', name: e.location } : undefined,
            image: e.image_url,
          },
        })),
      })
    }

    case 'directory': {
      const data = await fetchSupabase('directory?status=eq.published&consent_given=eq.true&order=full_name&limit=100&select=id,full_name,slug,specialty,city,description,profile_image_url,website_url,whatsapp_number')
      return jsonResponse({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Directorio de Terapeutas',
        numberOfItems: data.length,
        lastUpdated: now,
        itemListElement: data.map((d: Record<string,unknown>, i: number) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Person',
            '@id': `${SITE_URL}/directorio/${d.slug}`,
            name: d.full_name,
            description: d.description,
            url: `${SITE_URL}/directorio/${d.slug}`,
            knowsAbout: d.specialty,
            homeLocation: d.city ? { '@type': 'City', name: d.city } : undefined,
            image: d.profile_image_url,
            contactPoint: d.whatsapp_number ? {
              '@type': 'ContactPoint',
              contactType: 'WhatsApp',
              telephone: d.whatsapp_number,
            } : undefined,
            sameAs: d.website_url,
          },
        })),
      })
    }

    default:
      return jsonResponse({
        error: 'Not found',
        available: ['kg', 'articles', 'courses', 'events', 'directory'],
      }, 404)
  }
}
