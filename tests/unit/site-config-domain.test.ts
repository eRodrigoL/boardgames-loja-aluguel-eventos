import { describe, expect, it } from 'vitest';
import { siteConfigSchema } from '../../src/modules/site-config/domain/site-config';

const validConfig = {
  businessName: 'Empresa de Jogos - Exemplo',
  defaultRentalPeriodDays: 7,
  socialLinks: {},
};

describe('site configuration validation', () => {
  it('ignores developer credit fields from the customer administration input', () => {
    const parsed = siteConfigSchema.parse({
      ...validConfig,
      developerCreditName: 'Dados do Desenvolvedor — TEMPORÁRIO',
      developerCreditUrl: 'https://dados-do-desenvolvedor.example.invalid',
    });

    expect(parsed).not.toHaveProperty('developerCreditName');
    expect(parsed).not.toHaveProperty('developerCreditUrl');
  });
});
