import { notFound } from '../../../shared/errors/app-error';
import type { SiteConfigInput } from '../domain/site-config';

export class SiteConfigRepository {
  constructor(private readonly db: D1Database) {}
  async get() {
    const result = await this.db
      .prepare(
        'SELECT business_name as businessName, phone, whatsapp, email, service_region as serviceRegion, default_rental_period_days as defaultRentalPeriodDays, social_links_json as socialLinksJson, contact_message as contactMessage, updated_at as updatedAt FROM site_config WHERE id = 1',
      )
      .first<{
        businessName: string;
        phone: string | null;
        whatsapp: string | null;
        email: string | null;
        serviceRegion: string | null;
        defaultRentalPeriodDays: number;
        socialLinksJson: string;
        contactMessage: string | null;
        updatedAt: string;
      }>();
    if (!result) throw notFound('Site configuration');
    return { ...result, socialLinks: JSON.parse(result.socialLinksJson) as Record<string, string> };
  }
  async save(input: SiteConfigInput) {
    const timestamp = new Date().toISOString();
    await this.db
      .prepare(
        'INSERT INTO site_config (id, business_name, phone, whatsapp, email, service_region, default_rental_period_days, social_links_json, contact_message, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET business_name = excluded.business_name, phone = excluded.phone, whatsapp = excluded.whatsapp, email = excluded.email, service_region = excluded.service_region, default_rental_period_days = excluded.default_rental_period_days, social_links_json = excluded.social_links_json, contact_message = excluded.contact_message, updated_at = excluded.updated_at',
      )
      .bind(
        input.businessName,
        input.phone ?? null,
        input.whatsapp ?? null,
        input.email ?? null,
        input.serviceRegion ?? null,
        input.defaultRentalPeriodDays,
        JSON.stringify(input.socialLinks),
        input.contactMessage ?? null,
        timestamp,
      )
      .run();
    return this.get();
  }
}
