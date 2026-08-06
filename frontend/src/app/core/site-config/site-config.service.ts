import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { map, tap, type Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CatalogApiService,
  type PublicSiteConfig,
  type SiteConfigUpdate,
} from '../api/catalog-api.service';

type ConfigResponse = { readonly data: PublicSiteConfig } | PublicSiteConfig;

@Injectable({ providedIn: 'root' })
export class SiteConfigService {
  private readonly api = inject(CatalogApiService);
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  readonly config = signal<PublicSiteConfig | null>(null);

  constructor() {
    this.refresh();
    effect(() => this.updateFavicon(this.config()?.iconUrl ?? null));
  }

  refresh(): void {
    this.api.getPublicConfig().subscribe((config) => this.config.set(config));
  }

  save(input: SiteConfigUpdate): Observable<PublicSiteConfig> {
    return this.http.put<ConfigResponse>(this.adminConfigUrl(), input).pipe(
      map((response) => ('data' in response ? response.data : response)),
      tap((config) => this.config.set(config)),
    );
  }

  uploadBrandAsset(asset: 'logo' | 'icon', file: File): Observable<PublicSiteConfig> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ConfigResponse>(`${this.adminConfigUrl()}/${asset}`, form).pipe(
      map((response) => ('data' in response ? response.data : response)),
      tap((config) => this.config.set(config)),
    );
  }

  removeBrandAsset(asset: 'logo' | 'icon'): Observable<PublicSiteConfig> {
    return this.http.delete<ConfigResponse>(`${this.adminConfigUrl()}/${asset}`).pipe(
      map((response) => ('data' in response ? response.data : response)),
      tap((config) => this.config.set(config)),
    );
  }

  private adminConfigUrl(): string {
    return environment.production
      ? `${environment.apiBaseUrl}/admin/config/public`
      : `${environment.apiBaseUrl}/${environment.siteConfigPath}`;
  }

  private updateFavicon(iconUrl: string | null): void {
    const existing = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!iconUrl) {
      existing?.remove();
      return;
    }
    const favicon = existing ?? this.document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/svg+xml';
    favicon.href = iconUrl;
    if (!existing) this.document.head.append(favicon);
  }
}
