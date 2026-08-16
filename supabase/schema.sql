-- ============================================================================
-- mirellabartra.com — Supabase Database Schema
-- Portal de Noticias + Cursos + Congresos de Terapia de Lenguaje
-- MCP-first design: todas las tablas consultables vía tools MCP
-- ============================================================================
-- Versión: 1.0.0
-- Fecha:   2026-06-12
-- ============================================================================

-- ============================================================================
-- EXTENSIONES
-- ============================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";          -- fuzzy text search
create extension if not exists "unaccent";          -- accent-insensitive search

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Estado de publicación (artículos, cursos, eventos, directorio)
create type publication_status as enum (
  'draft',       -- borrador
  'published',   -- publicado
  'archived'     -- archivado
);

-- Modalidad de curso
create type course_modality as enum (
  'online',
  'presencial',
  'hibrido'
);

-- Estado de evento
create type event_status as enum (
  'upcoming',     -- próximo
  'ongoing',      -- en curso
  'completed',    -- finalizado
  'cancelled'     -- cancelado
);

-- Fuente del lead
create type lead_source as enum (
  'web',          -- formulario web
  'charla',       -- charla/taller
  'congreso',     -- congreso/evento
  'referido',     -- referido por alguien
  'social',       -- redes sociales
  'otro'
);

-- Estado del lead
create type lead_status as enum (
  'nuevo',
  'contactado',
  'inscrito',
  'perdido',
  'spam'
);

-- Estado de reclamación
create type complaint_status as enum (
  'pendiente',
  'en_proceso',
  'resuelta',
  'rechazada'
);

-- Tipo de medio
create type media_type as enum (
  'image',
  'video',
  'pdf',
  'document',
  'audio',
  'other'
);

-- Roles de usuario del CMS
create type cms_role as enum (
  'admin',
  'editor',
  'author',
  'viewer'
);

-- ============================================================================
-- 1. PERFILES / USUARIOS del CMS
-- ============================================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        cms_role not null default 'author',
  full_name   text not null,
  bio         text,
  avatar_url  text,
  website     text,
  social_json jsonb default '{}'::jsonb,  -- { twitter, linkedin, instagram }
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Trigger: auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS: profiles
alter table profiles enable row level security;

create policy "Profiles: select own"
  on profiles for select
  using (auth.uid() = id);

create policy "Profiles: select if admin/editor"
  on profiles for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('admin', 'editor')
    )
  );

create policy "Profiles: update own"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================================
-- 2. CATEGORÍAS (jerárquicas, para artículos y cursos)
-- ============================================================================
create table categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  description text,
  parent_id   uuid references categories(id) on delete set null,
  sort_order  int not null default 0,
  color_hex   text,                              -- color UI (ej: '#FF6B6B')
  icon_name   text,                              -- icono (Lucide/FontAwesome)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint categories_name_not_empty check (length(trim(name)) > 0),
  constraint categories_no_self_parent check (id <> parent_id)
);

alter table categories enable row level security;

create policy "Categories: public read"
  on categories for select
  using (true);

create policy "Categories: admin/editor write"
  on categories for insert, update, delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- ============================================================================
-- 3. TAGS
-- ============================================================================
create table tags (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

alter table tags enable row level security;

create policy "Tags: public read"
  on tags for select using (true);

create policy "Tags: admin/editor write"
  on tags for insert, update, delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- ============================================================================
-- 4. INSTRUCTORES / PONENTES
-- ============================================================================
create table instructors (
  id          uuid primary key default uuid_generate_v4(),
  full_name   text not null,
  slug        text not null unique,
  bio         text,
  photo_url   text,
  credentials text,                               -- ej: "Mg. en Fonoaudiología"
  email       text,
  website     text,
  social_json jsonb default '{}'::jsonb,
  is_mirella  boolean not null default false,     -- true si es la propia Mirella
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table instructors enable row level security;

create policy "Instructors: public read"
  on instructors for select using (true);

create policy "Instructors: admin/editor write"
  on instructors for insert, update, delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- ============================================================================
-- 5. MEDIA LIBRARY
-- ============================================================================
create table media (
  id            uuid primary key default uuid_generate_v4(),
  filename      text not null,
  original_name text not null,
  storage_path  text not null,                    -- path en Supabase Storage
  mime_type     text,
  media_type    media_type not null default 'image',
  size_bytes    bigint,
  width         int,                              -- imágenes
  height        int,                              -- imágenes
  duration_sec  int,                              -- video/audio
  alt_text      text,                             -- accesibilidad
  caption       text,
  credit        text,                             -- atribución
  metadata      jsonb default '{}'::jsonb,        -- EXIF, codec, etc.
  uploaded_by   uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table media enable row level security;

create policy "Media: public read"
  on media for select using (true);

create policy "Media: authenticated read"
  on media for select
  using (auth.role() = 'authenticated');

create policy "Media: authenticated insert"
  on media for insert
  with check (auth.role() = 'authenticated');

create policy "Media: owner/editor update"
  on media for update
  using (
    auth.uid() = uploaded_by
    or exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

create policy "Media: owner/admin delete"
  on media for delete
  using (
    auth.uid() = uploaded_by
    or exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================================
-- 6. ARTÍCULOS / NOTICIAS
-- ============================================================================
create table articles (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  slug            text not null unique,
  subtitle        text,                               -- bajada / dek
  excerpt         text,                               -- extracto para cards
  content         text,                               -- HTML o Markdown
  author_id       uuid references profiles(id) on delete set null,
  author_name     text,                               -- nombre override para invitados
  category_id     uuid references categories(id) on delete set null,
  featured_image  uuid references media(id) on delete set null,
  status          publication_status not null default 'draft',
  is_featured     boolean not null default false,     -- destacado en homepage
  is_breaking     boolean not null default false,     -- noticia urgente
  published_at    timestamptz,
  reading_time    int,                                -- minutos (calculado)
  
  -- SEO
  meta_title      text,
  meta_description text,
  og_image_id     uuid references media(id) on delete set null,
  json_ld         jsonb,                              -- Schema.org JSON-LD (NewsArticle/BlogPosting)
  canonical_url   text,

  -- Métricas
  view_count      int not null default 0,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint articles_title_not_empty check (length(trim(title)) > 0),
  constraint articles_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

-- Tabla pivote artículos ↔ tags
create table article_tags (
  article_id  uuid not null references articles(id) on delete cascade,
  tag_id      uuid not null references tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

-- Tabla pivote artículos ↔ artículos relacionados
create table article_related (
  article_id  uuid not null references articles(id) on delete cascade,
  related_id  uuid not null references articles(id) on delete cascade,
  primary key (article_id, related_id),
  constraint article_related_no_self check (article_id <> related_id)
);

-- RLS: articles
alter table articles enable row level security;
alter table article_tags enable row level security;
alter table article_related enable row level security;

-- Público: solo publicados
create policy "Articles: public read published"
  on articles for select
  using (status = 'published');

-- Autores: leer sus propios borradores
create policy "Articles: author read own drafts"
  on articles for select
  using (auth.uid() = author_id);

-- Admins/editors: lectura total
create policy "Articles: admin/editor full read"
  on articles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- Escritura: autores sus propios, admins/editors todos
create policy "Articles: author insert"
  on articles for insert
  with check (auth.uid() = author_id);

create policy "Articles: author update own"
  on articles for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Articles: admin/editor full write"
  on articles for insert, update, delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- article_tags heredan visibilidad del artículo
create policy "Article_tags: public read published"
  on article_tags for select
  using (
    exists (select 1 from articles where id = article_id and status = 'published')
  );

create policy "Article_tags: authenticated write"
  on article_tags for insert, delete
  using (auth.role() = 'authenticated');

create policy "Article_related: public read published"
  on article_related for select
  using (
    exists (select 1 from articles where id = article_id and status = 'published')
    and exists (select 1 from articles where id = related_id and status = 'published')
  );

create policy "Article_related: authenticated write"
  on article_related for insert, delete
  using (auth.role() = 'authenticated');

-- ============================================================================
-- 7. CURSOS / CAPACITACIONES
-- ============================================================================
create table courses (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  slug            text not null unique,
  description     text not null,
  long_description text,                              -- descripción detallada (markdown)
  modality        course_modality not null default 'online',
  instructor_id   uuid references instructors(id) on delete set null,
  category_id     uuid references categories(id) on delete set null,
  featured_image  uuid references media(id) on delete set null,

  -- Precios
  price           numeric(10,2),                      -- null = gratis
  currency        text not null default 'PEN',         -- ISO 4217
  early_bird_price numeric(10,2),                     -- precio preventa
  early_bird_until timestamptz,                       -- fecha límite preventa

  -- Fechas
  start_date      date,
  end_date        date,
  schedule_text   text,                               -- ej: "Lunes y Miércoles 18:00-20:00"
  duration_hours  int,                                -- horas totales
  timezone        text not null default 'America/Lima',

  -- Capacidad
  max_seats       int,                                -- null = ilimitado
  enrolled_count  int not null default 0,
  
  -- Ubicación (presencial)
  venue_name      text,
  venue_address   text,
  venue_city      text,
  venue_country   text default 'Perú',
  venue_map_url   text,

  -- Estado y visibilidad
  status          publication_status not null default 'draft',
  is_featured     boolean not null default false,
  published_at    timestamptz,

  -- SEO
  meta_title      text,
  meta_description text,
  json_ld         jsonb,                              -- Schema.org Course/Event

  -- Metadatos
  syllabus_url    uuid references media(id) on delete set null,  -- PDF del sílabo
  certificate_info text,                              -- info de certificación

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint courses_title_not_empty check (length(trim(title)) > 0),
  constraint courses_price_positive check (price is null or price >= 0),
  constraint courses_early_bird_positive check (early_bird_price is null or early_bird_price >= 0),
  constraint courses_end_after_start check (end_date is null or start_date is null or end_date >= start_date)
);

-- Inscripciones a cursos
create table course_enrollments (
  id          uuid primary key default uuid_generate_v4(),
  course_id   uuid not null references courses(id) on delete cascade,
  lead_id     uuid,                                   -- si viene de un lead
  full_name   text not null,
  email       text not null,
  phone       text,
  profession  text,                                   -- ej: "Fonoaudióloga"
  institution text,                                   -- donde trabaja/estudia
  notes       text,
  amount_paid numeric(10,2),
  payment_status text not null default 'pending',     -- pending, paid, refunded, free
  payment_method text,                                -- stripe, yape, plin, transferencia
  payment_ref  text,                                  -- referencia de pago
  enrolled_at  timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- RLS: courses
alter table courses enable row level security;
alter table course_enrollments enable row level security;

create policy "Courses: public read published"
  on courses for select
  using (status = 'published');

create policy "Courses: admin/editor full read"
  on courses for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

create policy "Courses: admin/editor write"
  on courses for insert, update, delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- Enrollments: cualquiera puede inscribirse (público)
create policy "Enrollments: public insert"
  on course_enrollments for insert
  with check (true);

create policy "Enrollments: admin/editor read"
  on course_enrollments for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

create policy "Enrollments: admin/editor write"
  on course_enrollments for update, delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- ============================================================================
-- 8. CONGRESOS / EVENTOS
-- ============================================================================
create table events (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  slug            text not null unique,
  description     text,
  start_date      date not null,
  end_date        date,
  country         text not null default 'Perú',
  city            text,
  venue           text,
  website_url     text,

  -- Mirella como ponente
  is_mirella_speaker boolean not null default false,
  speaker_role    text,                               -- ej: "Ponente Principal", "Panelista"
  speaker_topic   text,                               -- tema de la ponencia

  -- Estado
  event_status    event_status not null default 'upcoming',
  is_featured     boolean not null default false,

  -- Media
  featured_image  uuid references media(id) on delete set null,
  gallery_json    jsonb default '[]'::jsonb,          -- array de media IDs
  brochure_url    uuid references media(id) on delete set null,

  -- SEO
  meta_title      text,
  meta_description text,
  json_ld         jsonb,                              -- Schema.org Event

  -- Métricas
  attendee_count  int,                                -- asistentes registrados

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint events_name_not_empty check (length(trim(name)) > 0),
  constraint events_end_after_start check (end_date is null or end_date >= start_date)
);

-- RLS: events
alter table events enable row level security;

create policy "Events: public read"
  on events for select using (true);

create policy "Events: admin/editor write"
  on events for insert, update, delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- ============================================================================
-- 9. DIRECTORIO DE TERAPEUTAS
-- ============================================================================
create table directory (
  id              uuid primary key default uuid_generate_v4(),
  full_name       text not null,
  slug            text not null unique,
  specialty       text not null,                      -- ej: "Trastornos del habla", "Autismo"
  specialties_json jsonb default '[]'::jsonb,         -- múltiples especialidades
  city            text not null,
  region          text,                               -- departamento
  country         text not null default 'Perú',
  email           text,
  phone           text,
  website         text,
  bio             text,
  photo           uuid references media(id) on delete set null,
  
  -- Credenciales
  license_number  text,                               -- colegiatura
  institution     text,                               -- universidad/institución
  years_experience int,
  
  -- Consentimiento (requerido para mostrar datos)
  consent_given   boolean not null default false,
  consent_date    timestamptz,
  consent_ip      text,
  consent_source  text,                               -- cómo dio consentimiento

  -- Atiende a
  accepts_children boolean not null default true,
  accepts_adults   boolean not null default false,
  
  -- Modalidad
  offers_online    boolean not null default false,
  offers_presencial boolean not null default true,

  -- Estado
  status          publication_status not null default 'draft',
  verified        boolean not null default false,     -- verificado por admin
  verified_at     timestamptz,
  verified_by     uuid references auth.users(id) on delete set null,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint directory_consent_required check (
    status = 'published' implies consent_given = true
  )
);

-- RLS: directory
alter table directory enable row level security;

-- Público: solo publicados y con consentimiento
create policy "Directory: public read published consented"
  on directory for select
  using (status = 'published' and consent_given = true);

-- Cualquiera puede registrarse
create policy "Directory: public insert"
  on directory for insert
  with check (true);

-- Admin/editor: lectura total
create policy "Directory: admin/editor full read"
  on directory for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

create policy "Directory: admin/editor write"
  on directory for update, delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- ============================================================================
-- 10. LEADS
-- ============================================================================
create table leads (
  id              uuid primary key default uuid_generate_v4(),
  full_name       text not null,
  email           text not null,
  phone           text,
  profession      text,
  institution     text,
  source          lead_source not null default 'web',
  source_detail   text,                              -- ej: "Charla en UNMSM 2026"
  course_interest uuid references courses(id) on delete set null,
  event_interest  uuid references events(id) on delete set null,
  message         text,
  
  -- GDPR / Consentimiento
  marketing_consent boolean not null default false,
  consent_date      timestamptz,
  consent_ip        text,

  -- Estado
  status          lead_status not null default 'nuevo',
  assigned_to     uuid references profiles(id) on delete set null,
  notes           text,
  last_contact_at timestamptz,

  -- Origen web
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  landing_page    text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- RLS: leads
alter table leads enable row level security;

-- Cualquiera puede enviar el formulario
create policy "Leads: public insert"
  on leads for insert
  with check (true);

-- Solo admins/editors pueden leer/editar leads
create policy "Leads: admin/editor read"
  on leads for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

create policy "Leads: admin/editor write"
  on leads for update, delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- ============================================================================
-- 11. CMS CONFIG (Site Settings & Page Content)
-- ============================================================================
create table cms_config (
  id          text primary key,                      -- key: ej "home_hero", "about_text", "footer"
  value       jsonb not null,                        -- contenido estructurado
  description text,                                  -- para qué sirve esta config
  group_key   text,                                  -- agrupación: "homepage", "seo", "contact"
  updated_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table cms_config enable row level security;

create policy "CMS_config: public read"
  on cms_config for select
  using (true);

create policy "CMS_config: admin/editor write"
  on cms_config for insert, update, delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- Seed data para páginas comunes
-- insert into cms_config (id, value, description, group_key) values
-- ('home_hero', '{"title":"Terapia de Lenguaje", "subtitle":"Noticias, cursos y comunidad profesional", "cta_text":"Ver cursos", "cta_url":"/cursos"}', 'Hero section homepage', 'homepage'),
-- ('about_mirella', '{"name":"Mirella Bartra", "title":"Fonoaudióloga", "bio":"..."}', 'Bio de Mirella', 'about'),
-- ('footer', '{"copyright":"© 2026 Mirella Bartra", "links":[{"label":"Contacto","url":"/contacto"}]}', 'Footer del sitio', 'global'),
-- ('seo_defaults', '{"site_name":"Mirella Bartra","title_template":"%s | Mirella Bartra","description":"Portal de terapia de lenguaje"}', 'SEO defaults', 'seo');

-- ============================================================================
-- 12. LIBRO DE RECLAMACIONES (Ley Peruana Nº 29571)
-- ============================================================================
create table complaints_book (
  id              uuid primary key default uuid_generate_v4(),
  -- Campos obligatorios según Indecopi
  claim_number    text not null unique,              -- número correlativo (ej: "LB-2026-0001")
  claim_date      date not null default current_date,
  
  -- Datos del reclamante
  claimant_name   text not null,
  claimant_doc_type text not null default 'DNI',     -- DNI, CE, Pasaporte
  claimant_doc_number text not null,
  claimant_email  text,
  claimant_phone  text,
  claimant_address text,
  claimant_is_minor boolean not null default false,  -- menor de edad
  parent_name     text,                              -- nombre del padre/tutor si es menor

  -- Datos del bien/servicio contratado
  service_type    text not null,                     -- tipo de servicio reclamado
  service_detail  text,                              -- curso, evento, producto específico
  contract_amount numeric(10,2),                     -- monto del bien/servicio
  claim_amount    numeric(10,2),                     -- monto del reclamo (si aplica)

  -- Detalle del reclamo
  claim_type      text not null,                     -- "reclamo" o "queja"
  claim_detail    text not null,                     -- descripción detallada
  claim_pretension text not null,                    -- qué espera el reclamante
  claim_attachment uuid references media(id) on delete set null, -- adjunto

  -- Respuesta de la empresa
  status          complaint_status not null default 'pendiente',
  response        text,                              -- respuesta de la empresa
  response_date   date,
  response_by     uuid references auth.users(id) on delete set null,
  resolution_days int,                               -- días para resolver (máx 30 por ley)

  -- Metadata
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint complaints_claim_number_format check (claim_number ~ '^LB-\d{4}-\d{4}$'),
  constraint complaints_claim_detail_not_empty check (length(trim(claim_detail)) > 0),
  constraint complaints_pretension_not_empty check (length(trim(claim_pretension)) > 0),
  constraint complaints_resolution_days_max30 check (resolution_days is null or resolution_days <= 30)
);

alter table complaints_book enable row level security;

-- Público: cualquiera puede registrar un reclamo
create policy "Complaints: public insert"
  on complaints_book for insert
  with check (true);

-- Solo admins pueden ver y gestionar reclamos
create policy "Complaints: admin read"
  on complaints_book for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Complaints: admin write"
  on complaints_book for update, delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Función para auto-generar claim_number
create or replace function generate_claim_number()
returns trigger as $$
declare
  year text;
  seq int;
begin
  year := to_char(new.claim_date, 'YYYY');
  select coalesce(max(substring(claim_number from 10)::int), 0) + 1
    into seq
    from complaints_book
    where claim_number like 'LB-' || year || '-%';
  new.claim_number := 'LB-' || year || '-' || lpad(seq::text, 4, '0');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_complaints_claim_number on complaints_book;
create trigger trg_complaints_claim_number
  before insert on complaints_book
  for each row
  when (new.claim_number is null)
  execute function generate_claim_number();

-- ============================================================================
-- 13. NEWSLETTER / SUSCRIPTORES
-- ============================================================================
create table subscribers (
  id              uuid primary key default uuid_generate_v4(),
  email           text not null unique,
  full_name       text,
  is_active       boolean not null default true,
  subscribed_at   timestamptz not null default now(),
  unsubscribed_at timestamptz,
  source          lead_source default 'web',
  utm_source      text,
  utm_medium      text
);

alter table subscribers enable row level security;

create policy "Subscribers: public insert"
  on subscribers for insert
  with check (true);

create policy "Subscribers: admin/editor read"
  on subscribers for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

create policy "Subscribers: admin/editor write"
  on subscribers for update, delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- ============================================================================
-- 14. TESTIMONIALS
-- ============================================================================
create table testimonials (
  id          uuid primary key default uuid_generate_v4(),
  full_name   text not null,
  role        text,                                  -- ej: "Fonoaudióloga", "Madre de paciente"
  institution text,
  content     text not null,
  rating      int check (rating >= 1 and rating <= 5),
  photo_url   uuid references media(id) on delete set null,
  course_id   uuid references courses(id) on delete set null,
  event_id    uuid references events(id) on delete set null,
  is_featured boolean not null default false,
  status      publication_status not null default 'draft',
  created_at  timestamptz not null default now()
);

alter table testimonials enable row level security;

create policy "Testimonials: public read published"
  on testimonials for select
  using (status = 'published');

create policy "Testimonials: public insert"
  on testimonials for insert
  with check (true);

create policy "Testimonials: admin/editor write"
  on testimonials for update, delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Profiles
create index idx_profiles_role on profiles(role);

-- Categories
create index idx_categories_slug on categories(slug);
create index idx_categories_parent on categories(parent_id);
create index idx_categories_sort on categories(sort_order);

-- Tags
create index idx_tags_slug on tags(slug);

-- Instructors
create index idx_instructors_slug on instructors(slug);
create index idx_instructors_is_mirella on instructors(is_mirella) where is_mirella = true;

-- Media
create index idx_media_type on media(media_type);
create index idx_media_uploaded_by on media(uploaded_by);
create index idx_media_created_at on media(created_at desc);

-- Articles
create index idx_articles_slug on articles(slug);
create index idx_articles_status on articles(status);
create index idx_articles_published_at on articles(published_at desc nulls last) where status = 'published';
create index idx_articles_author on articles(author_id);
create index idx_articles_category on articles(category_id);
create index idx_articles_featured on articles(is_featured) where is_featured = true and status = 'published';
create index idx_articles_breaking on articles(is_breaking) where is_breaking = true and status = 'published';
create index idx_articles_search on articles using gin(to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(excerpt, '')));

-- Article tags
create index idx_article_tags_article on article_tags(article_id);
create index idx_article_tags_tag on article_tags(tag_id);

-- Article related
create index idx_article_related_article on article_related(article_id);

-- Courses
create index idx_courses_slug on courses(slug);
create index idx_courses_status on courses(status);
create index idx_courses_modality on courses(modality);
create index idx_courses_start_date on courses(start_date) where status = 'published';
create index idx_courses_instructor on courses(instructor_id);
create index idx_courses_category on courses(category_id);
create index idx_courses_featured on courses(is_featured) where is_featured = true and status = 'published';
create index idx_courses_search on courses using gin(to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(description, '')));

-- Course enrollments
create index idx_enrollments_course on course_enrollments(course_id);
create index idx_enrollments_email on course_enrollments(email);
create index idx_enrollments_payment on course_enrollments(payment_status);

-- Events
create index idx_events_slug on events(slug);
create index idx_events_status on events(event_status);
create index idx_events_start_date on events(start_date);
create index idx_events_country on events(country);
create index idx_events_mirella_speaker on events(is_mirella_speaker) where is_mirella_speaker = true;
create index idx_events_upcoming on events(start_date) where event_status = 'upcoming';

-- Directory
create index idx_directory_slug on directory(slug);
create index idx_directory_specialty on directory(specialty);
create index idx_directory_city on directory(city);
create index idx_directory_country on directory(country);
create index idx_directory_status on directory(status);
create index idx_directory_consented on directory(consent_given) where consent_given = true and status = 'published';
create index idx_directory_verified on directory(verified) where verified = true;
create index idx_directory_search on directory using gin(to_tsvector('spanish', coalesce(full_name, '') || ' ' || coalesce(specialty, '') || ' ' || coalesce(city, '') || ' ' || coalesce(bio, '')));

-- Leads
create index idx_leads_email on leads(email);
create index idx_leads_status on leads(status);
create index idx_leads_source on leads(source);
create index idx_leads_created_at on leads(created_at desc);
create index idx_leads_course_interest on leads(course_interest);
create index idx_leads_assigned_to on leads(assigned_to);

-- CMS Config
create index idx_cms_config_group on cms_config(group_key);

-- Complaints
create index idx_complaints_claim_number on complaints_book(claim_number);
create index idx_complaints_status on complaints_book(status);
create index idx_complaints_claim_date on complaints_book(claim_date desc);
create index idx_complaints_claimant_doc on complaints_book(claimant_doc_number);

-- Subscribers
create index idx_subscribers_email on subscribers(email);
create index idx_subscribers_active on subscribers(is_active) where is_active = true;

-- Testimonials
create index idx_testimonials_status on testimonials(status);
create index idx_testimonials_course on testimonials(course_id);
create index idx_testimonials_featured on testimonials(is_featured) where is_featured = true and status = 'published';

-- ============================================================================
-- FUNCIONES ÚTILES
-- ============================================================================

-- Generar slug automático
create or replace function slugify(text)
returns text as $$
  select lower(regexp_replace(
    regexp_replace(
      regexp_replace(
        unaccent($1),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  ));
$$ language sql immutable;

-- Trigger: auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
do $$
declare
  t text;
begin
  for t in
    select table_name from information_schema.columns
    where column_name = 'updated_at'
      and table_schema = 'public'
      and table_name not like 'pg_%'
  loop
    execute format(
      'drop trigger if exists trg_updated_at on %I; create trigger trg_updated_at before update on %I for each row execute function update_updated_at_column();',
      t, t
    );
  end loop;
end;
$$ language plpgsql;

-- Trigger: auto-calcular reading_time en articles
create or replace function calculate_reading_time()
returns trigger as $$
begin
  if new.content is not null then
    -- ~250 palabras/minuto en español
    new.reading_time := greatest(1, ceil(
      array_length(regexp_split_to_array(new.content, '\s+'), 1)::numeric / 250
    ));
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_reading_time on articles;
create trigger trg_reading_time
  before insert or update of content on articles
  for each row execute function calculate_reading_time();

-- ============================================================================
-- VISTAS (MCP-friendly: se pueden consultar como tablas)
-- ============================================================================

-- Vista: artículos publicados con autor y categoría
create or replace view v_articles_published as
select
  a.id,
  a.title,
  a.slug,
  a.subtitle,
  a.excerpt,
  a.content,
  coalesce(p.full_name, a.author_name) as author,
  c.name as category,
  c.slug as category_slug,
  m.storage_path as featured_image_url,
  a.is_featured,
  a.is_breaking,
  a.published_at,
  a.reading_time,
  a.meta_title,
  a.meta_description,
  a.json_ld,
  a.view_count,
  array_remove(array_agg(distinct t.name), null) as tags
from articles a
left join profiles p on a.author_id = p.id
left join categories c on a.category_id = c.id
left join media m on a.featured_image = m.id
left join article_tags at on a.id = at.article_id
left join tags t on at.tag_id = t.id
where a.status = 'published'
group by a.id, p.full_name, c.name, c.slug, m.storage_path;

-- Vista: cursos disponibles
create or replace view v_courses_available as
select
  co.id,
  co.title,
  co.slug,
  co.description,
  co.modality,
  i.full_name as instructor,
  co.price,
  co.currency,
  co.early_bird_price,
  co.early_bird_until,
  co.start_date,
  co.end_date,
  co.schedule_text,
  co.duration_hours,
  co.max_seats,
  co.enrolled_count,
  case
    when co.max_seats is null then true
    when co.enrolled_count < co.max_seats then true
    else false
  end as has_availability,
  co.venue_city,
  co.venue_country,
  co.certificate_info,
  co.published_at,
  coalesce(m.storage_path, null) as featured_image_url
from courses co
left join instructors i on co.instructor_id = i.id
left join media m on co.featured_image = m.id
where co.status = 'published';

-- Vista: eventos próximos
create or replace view v_events_upcoming as
select
  e.id,
  e.name,
  e.slug,
  e.description,
  e.start_date,
  e.end_date,
  e.country,
  e.city,
  e.venue,
  e.website_url,
  e.is_mirella_speaker,
  e.speaker_role,
  e.speaker_topic,
  e.event_status,
  coalesce(m.storage_path, null) as featured_image_url
from events e
left join media m on e.featured_image = m.id
where e.event_status in ('upcoming', 'ongoing')
order by e.start_date asc;

-- Vista: directorio público
create or replace view v_directory_public as
select
  d.id,
  d.full_name,
  d.slug,
  d.specialty,
  d.specialties_json,
  d.city,
  d.region,
  d.country,
  d.bio,
  d.license_number,
  d.institution,
  d.years_experience,
  d.accepts_children,
  d.accepts_adults,
  d.offers_online,
  d.offers_presencial,
  d.verified,
  coalesce(m.storage_path, null) as photo_url
from directory d
left join media m on d.photo = m.id
where d.status = 'published' and d.consent_given = true;

-- ============================================================================
-- POLÍTICAS DE BÚSQUEDA FULL-TEXT
-- ============================================================================

-- Función: búsqueda unificada en español
create or replace function search_site(search_query text)
returns table(
  result_type text,       -- 'article', 'course', 'event', 'directory'
  result_id   uuid,
  title       text,
  description text,
  slug        text,
  relevance   real
) as $$
  select 'article', id, title, coalesce(excerpt, ''), slug,
    ts_rank(to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(content, '')), plainto_tsquery('spanish', search_query))
  from articles where status = 'published'
    and to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(content, '')) @@ plainto_tsquery('spanish', search_query)
  union all
  select 'course', id, title, coalesce(left(description, 200), ''), slug,
    ts_rank(to_tsvector('spanish', title || ' ' || coalesce(description, '')), plainto_tsquery('spanish', search_query))
  from courses where status = 'published'
    and to_tsvector('spanish', title || ' ' || coalesce(description, '')) @@ plainto_tsquery('spanish', search_query)
  union all
  select 'event', id, name, coalesce(left(description, 200), ''), slug,
    ts_rank(to_tsvector('spanish', name || ' ' || coalesce(description, '')), plainto_tsquery('spanish', search_query))
  from events
    where to_tsvector('spanish', name || ' ' || coalesce(description, '')) @@ plainto_tsquery('spanish', search_query)
  union all
  select 'directory', id, full_name, specialty, slug,
    ts_rank(to_tsvector('spanish', full_name || ' ' || specialty || ' ' || coalesce(city, '')), plainto_tsquery('spanish', search_query))
  from directory where status = 'published' and consent_given = true
    and to_tsvector('spanish', full_name || ' ' || specialty || ' ' || coalesce(city, '')) @@ plainto_tsquery('spanish', search_query)
  order by relevance desc
  limit 50;
$$ language sql stable;

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Nota: Estos buckets se crean desde el dashboard de Supabase o vía API,
-- no con SQL. Se documentan aquí como referencia.

-- Bucket: media
--   - Carpeta pública: /public (imágenes del sitio)
--   - Carpeta privada: /private (documentos, pagos)
--   - Política: public read en /public/*, authenticated read en /private/*
-- 
-- Bucket: avatars
--   - Carpeta: / (raíz)
--   - Política: authenticated read/write own files

-- ============================================================================
-- SEED DATA MÍNIMO
-- ============================================================================

-- Categorías base
insert into categories (name, slug, description, sort_order) values
  ('Noticias', 'noticias', 'Noticias sobre terapia de lenguaje y fonoaudiología', 10),
  ('Trastornos del Habla', 'trastornos-del-habla', 'Artículos sobre tartamudez, dislalia, disartria', 20),
  ('Trastornos del Lenguaje', 'trastornos-del-lenguaje', 'TEL, afasia, trastornos del desarrollo', 30),
  ('Autismo', 'autismo', 'TEA y comunicación', 40),
  ('Deglución', 'deglucion', 'Disfagia y trastornos de la alimentación', 50),
  ('Voz', 'voz', 'Disfonía, cuidados de la voz profesional', 60),
  ('Investigación', 'investigacion', 'Estudios, papers y avances científicos', 70),
  ('Entrevistas', 'entrevistas', 'Conversaciones con expertos', 80),
  ('Opinión', 'opinion', 'Columnas de opinión', 90)
on conflict (slug) do nothing;

-- CMS Config inicial
insert into cms_config (id, value, description, group_key) values
  ('site_name', '"Mirella Bartra"', 'Nombre del sitio', 'seo'),
  ('site_description', '"Portal de terapia de lenguaje: noticias, cursos y comunidad profesional"', 'Descripción del sitio', 'seo'),
  ('site_url', '"https://mirellabartra.com"', 'URL canónica', 'seo'),
  ('home_hero', '{"title":"Terapia de Lenguaje","subtitle":"Noticias, cursos, congresos y comunidad profesional en un solo lugar","cta_primary":{"text":"Ver cursos","url":"/cursos"},"cta_secondary":{"text":"Directorio","url":"/directorio"}}', 'Hero de la homepage', 'homepage'),
  ('social_links', '{"facebook":"https://facebook.com/mirellabartra","instagram":"https://instagram.com/mirellabartra","linkedin":"https://linkedin.com/in/mirellabartra","tiktok":"https://tiktok.com/@mirellabartra"}', 'Links de redes sociales', 'global'),
  ('contact_info', '{"email":"contacto@mirellabartra.com","whatsapp":"+51999999999"}', 'Información de contacto', 'contact')
on conflict (id) do nothing;

-- ============================================================================
-- NOTAS FINALES
-- ============================================================================
-- 
-- 1. JSON-LD: Los campos json_ld en articles, courses y events se llenan
--    desde la app frontend o n8n con el markup Schema.org correspondiente:
--    - articles → NewsArticle / BlogPosting
--    - courses → Course
--    - events  → Event
--
-- 2. MCP-first: Todas las tablas y vistas son consultables vía herramientas MCP.
--    Los índices garantizan buen rendimiento en queries frecuentes.
--
-- 3. Almacenamiento: Las imágenes se guardan en Supabase Storage buckets.
--    La tabla `media` funciona como índice/catálogo de assets.
--
-- 4. RLS: El acceso está segmentado:
--    - Público: lectura de contenido publicado, inserción de leads/reclamos/inscripciones
--    - Authenticated: acceso según rol (admin > editor > author)
--
-- 5. Backup: Configurar pg_dump diario para toda la base de datos.
-- ============================================================================
