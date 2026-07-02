create or replace function public.get_public_store_by_slug(_slug text)
returns table (
  store_id uuid,
  name text,
  slug text,
  phone text,
  whatsapp text,
  email text,
  logo_path text,
  theme jsonb,
  seo jsonb,
  contact jsonb,
  social_links jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id as store_id,
    s.name,
    s.slug,
    s.phone,
    s.whatsapp,
    s.email,
    ss.logo_path,
    ss.theme,
    ss.seo,
    ss.contact,
    ss.social_links
  from public.stores s
  left join public.store_settings ss on ss.store_id = s.id
  where s.slug = lower(trim(_slug))
    and s.status = 'active'
  limit 1;
$$;

grant execute on function public.get_public_store_by_slug(text) to anon, authenticated;
