import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { type PublicSiteConfig } from '@core/api/catalog-api.service';
import { SiteConfigService } from '@core/site-config/site-config.service';

type SiteConfigDraft = {
  businessName: string;
  phone: string;
  whatsapp: string;
  email: string;
  serviceRegion: string;
  defaultRentalPeriodDays: number;
  websiteUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  contactMessage: string;
};

const emptyDraft = (): SiteConfigDraft => ({
  businessName: '',
  phone: '',
  whatsapp: '',
  email: '',
  serviceRegion: '',
  defaultRentalPeriodDays: 7,
  websiteUrl: '',
  instagramUrl: '',
  facebookUrl: '',
  youtubeUrl: '',
  tiktokUrl: '',
  contactMessage: '',
});

function toDraft(config: PublicSiteConfig): SiteConfigDraft {
  return {
    businessName: config.businessName,
    phone: config.phone ?? '',
    whatsapp: config.whatsapp ?? '',
    email: config.email ?? '',
    serviceRegion: config.serviceRegion ?? '',
    defaultRentalPeriodDays: config.defaultRentalPeriodDays,
    websiteUrl: config.socialLinks?.['website'] ?? '',
    instagramUrl: config.socialLinks?.['instagram'] ?? '',
    facebookUrl: config.socialLinks?.['facebook'] ?? '',
    youtubeUrl: config.socialLinks?.['youtube'] ?? '',
    tiktokUrl: config.socialLinks?.['tiktok'] ?? '',
    contactMessage: config.contactMessage ?? '',
  };
}

@Component({
  selector: 'app-site-config-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './site-config-page.html',
})
export class SiteConfigPage {
  private readonly siteConfig = inject(SiteConfigService);
  protected readonly config = this.siteConfig.config;
  protected readonly draft = signal<SiteConfigDraft>(emptyDraft());
  protected readonly saving = signal(false);
  protected readonly success = signal('');
  protected readonly error = signal('');
  protected readonly uploadingAsset = signal<'logo' | 'icon' | null>(null);

  constructor() {
    effect(() => {
      const config = this.config();
      if (config) this.draft.set(toDraft(config));
    });
  }

  protected update<K extends keyof SiteConfigDraft>(key: K, value: SiteConfigDraft[K]): void {
    this.draft.update((draft) => ({ ...draft, [key]: value }));
  }

  protected uploadBrandAsset(asset: 'logo' | 'icon', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.type !== 'image/svg+xml') {
      this.error.set('Envie um arquivo SVG válido para a identidade visual.');
      return;
    }

    this.error.set('');
    this.success.set('');
    this.uploadingAsset.set(asset);
    this.siteConfig.uploadBrandAsset(asset, file).subscribe({
      next: () => {
        this.success.set(asset === 'logo' ? 'Logo atualizado.' : 'Ícone atualizado.');
        this.uploadingAsset.set(null);
      },
      error: () => {
        this.error.set('Não foi possível enviar o SVG. Verifique o arquivo e tente novamente.');
        this.uploadingAsset.set(null);
      },
    });
  }

  protected removeBrandAsset(asset: 'logo' | 'icon'): void {
    this.error.set('');
    this.success.set('');
    this.uploadingAsset.set(asset);
    this.siteConfig.removeBrandAsset(asset).subscribe({
      next: () => {
        this.success.set(asset === 'logo' ? 'Logo removido.' : 'Ícone removido.');
        this.uploadingAsset.set(null);
      },
      error: () => {
        this.error.set('Não foi possível remover o arquivo. Tente novamente.');
        this.uploadingAsset.set(null);
      },
    });
  }

  protected save(): void {
    const draft = this.draft();
    const businessName = draft.businessName.trim();

    if (!businessName) {
      this.error.set('Informe o nome público do negócio.');
      return;
    }
    if (!Number.isInteger(draft.defaultRentalPeriodDays) || draft.defaultRentalPeriodDays < 1) {
      this.error.set('O período padrão deve ser um número inteiro positivo.');
      return;
    }

    const socialLinks = { ...(this.config()?.socialLinks ?? {}) };
    const socialLinksByKey = {
      website: draft.websiteUrl,
      instagram: draft.instagramUrl,
      facebook: draft.facebookUrl,
      youtube: draft.youtubeUrl,
      tiktok: draft.tiktokUrl,
    };
    for (const [key, value] of Object.entries(socialLinksByKey)) {
      const url = value.trim();
      if (url) socialLinks[key] = url;
      else delete socialLinks[key];
    }

    this.saving.set(true);
    this.success.set('');
    this.error.set('');
    this.siteConfig
      .save({
        businessName,
        phone: draft.phone.trim() || null,
        whatsapp: draft.whatsapp.trim() || null,
        email: draft.email.trim() || null,
        serviceRegion: draft.serviceRegion.trim() || null,
        defaultRentalPeriodDays: draft.defaultRentalPeriodDays,
        socialLinks,
        contactMessage: draft.contactMessage.trim() || null,
      })
      .subscribe({
        next: () => {
          this.success.set('Configurações salvas.');
          this.saving.set(false);
        },
        error: () => {
          this.error.set(
            'Não foi possível salvar as configurações. Verifique os campos e tente novamente.',
          );
          this.saving.set(false);
        },
      });
  }
}
