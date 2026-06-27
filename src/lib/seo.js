/**
 * SEO toolkit for mirellabartra.com
 * Generates structured data (JSON-LD) and meta tags for every page.
 */

const SITE_URL = 'https://mirellabartra.com'
const SITE_NAME = 'Mirella Bartra'
const ORG_NAME = 'Mirella Bartra'
const ORG_URL = SITE_URL

// ─── Helpers ─────────────────────────────────────────────────────────────────
function cleanUrl(url) {
  return url.replace(/\/+$/, '')
}

function absoluteUrl(path) {
  return cleanUrl(SITE_URL) + '/' + path.replace(/^\/+/, '')
}

function isoDate(date) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toISOString()
}

function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function normalizePrice(price) {
  return parseFloat(Number(price).toFixed(2))
}

// ─── JSON-LD Generators ──────────────────────────────────────────────────────

export function generateOrganizationLD() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ORG_NAME,
    url: ORG_URL,
    logo: absoluteUrl('favicon.png'),
    sameAs: [
      'https://www.linkedin.com/in/mirella-bartra-3a7b5a1a0/',
    ],
  }
}

export function generatePersonLD() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Mirella Bartra',
    description: 'Fonoaudióloga peruana, docente universitaria en la UNFV, especialista en terapia de lenguaje',
    image: absoluteUrl('favicon.png'),
    url: SITE_URL,
    sameAs: [
      'https://www.linkedin.com/in/mirella-bartra-3a7b5a1a0/',
    ],
    jobTitle: 'Fonoaudióloga y Docente',
    worksFor: {
      '@type': 'Organization',
      name: 'Universidad Nacional Federico Villarreal',
    },
  }
}

export function generateWebSiteLD() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: SITE_URL + '/buscar?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function generateArticleLD(article) {
  if (!article) return null
  return {
    '@context': 'https://schema.org',
    '@type': article.article_type === 'news' ? 'NewsArticle' : 'Article',
    headline: article.title,
    description: article.description || stripHtml(article.content).slice(0, 160),
    image: article.featured_image ? absoluteUrl(article.featured_image) : undefined,
    datePublished: isoDate(article.published_at),
    dateModified: isoDate(article.updated_at),
    author: {
      '@type': 'Person',
      name: article.author_name || 'Mirella Bartra',
    },
    publisher: {
      '@type': 'Organization',
      name: ORG_NAME,
      logo: { '@type': 'ImageObject', url: absoluteUrl('favicon.png') },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl('articulos/' + article.slug),
    },
    articleSection: article.articleSection || article.category || undefined,
    keywords: article.keywords ? article.keywords.split(',').map(k => k.trim()) : undefined,
  }
}

export function generateCourseLD(course) {
  if (!course) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description || stripHtml(course.content).slice(0, 160),
    provider: {
      '@type': 'Organization',
      name: ORG_NAME,
      sameAs: SITE_URL,
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: course.modality === 'virtual' ? 'online' : course.modality === 'presencial' ? 'onsite' : 'blended',
      startDate: isoDate(course.start_date),
      endDate: course.end_date ? isoDate(course.end_date) : undefined,
    },
    image: course.featured_image ? absoluteUrl(course.featured_image) : undefined,
    educationalCredentialAwarded: course.certificate ? 'Certificado de participación' : undefined,
  }
}

export function generateEventLD(event) {
  if (!event) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || stripHtml(event.content).slice(0, 160),
    startDate: isoDate(event.start_date),
    endDate: event.end_date ? isoDate(event.end_date) : undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: event.location_url
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: event.location_url
      ? { '@type': 'VirtualLocation', url: event.location_url }
      : { '@type': 'Place', name: event.location, address: event.location },
    image: event.featured_image ? absoluteUrl(event.featured_image) : undefined,
    organizer: {
      '@type': 'Organization',
      name: ORG_NAME,
      url: SITE_URL,
    },
    offers: event.price > 0 ? {
      '@type': 'Offer',
      price: normalizePrice(event.price),
      priceCurrency: 'PEN',
      availability: 'https://schema.org/InStock',
    } : undefined,
  }
}

export function generateBreadcrumbLD(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url ? absoluteUrl(item.url) : undefined,
    })),
  }
}

export function generateFAQPageLD(faqs, url) {
  if (!faqs || faqs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.pregunta || f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: stripHtml(f.respuesta || f.answer),
      },
    })),
  }
}

// ─── Meta Tags Generator ─────────────────────────────────────────────────────

export function generateMetaTags({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author = 'Mirella Bartra',
  publishedTime,
  modifiedTime,
  noindex = false,
} = {}) {
  const fullTitle = title ? `${title} | Mirella Bartra` : 'Mirella Bartra — Terapia de Lenguaje, Noticias y Cursos'
  const fullDesc = description || 'Portal de terapia de lenguaje: noticias, cursos, congresos y comunidad profesional. Mirella Bartra, fonoaudióloga y docente UNFV.'
  const fullUrl = url ? absoluteUrl(url) : SITE_URL
  const fullImage = image ? absoluteUrl(image) : absoluteUrl('favicon.png')

  return {
    title: fullTitle,
    meta: [
      { name: 'description', content: fullDesc },
      ...(keywords ? [{ name: 'keywords', content: keywords }] : []),
      { name: 'author', content: author },
      { name: 'robots', content: noindex ? 'noindex, follow' : 'index, follow' },
      // Open Graph
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: fullDesc },
      { property: 'og:image', content: fullImage },
      { property: 'og:url', content: fullUrl },
      { property: 'og:type', content: type },
      { property: 'og:locale', content: 'es_PE' },
      { property: 'og:site_name', content: SITE_NAME },
      // Twitter
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: fullDesc },
      { name: 'twitter:image', content: fullImage },
      // Article-specific
      ...(type === 'article' && publishedTime ? [{ property: 'article:published_time', content: isoDate(publishedTime) }] : []),
      ...(type === 'article' && modifiedTime ? [{ property: 'article:modified_time', content: isoDate(modifiedTime) }] : []),
      ...(type === 'article' ? [{ property: 'article:author', content: author }] : []),
    ],
    link: [
      { rel: 'canonical', href: fullUrl },
    ],
  }
}
