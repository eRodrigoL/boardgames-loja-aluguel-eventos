INSERT INTO site_config (id, business_name, default_rental_period_days, social_links_json, updated_at)
VALUES (1, 'Empresa de Jogos - Exemplo', 7, '{}', '2026-01-01T00:00:00.000Z')
ON CONFLICT(id) DO UPDATE SET
  business_name = excluded.business_name,
  default_rental_period_days = excluded.default_rental_period_days,
  social_links_json = excluded.social_links_json,
  updated_at = excluded.updated_at;
