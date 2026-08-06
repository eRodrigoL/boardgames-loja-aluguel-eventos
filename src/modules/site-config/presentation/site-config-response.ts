import type { StoredSiteConfig } from '../infrastructure/site-config-repository';

export type PublicSiteConfig = Omit<StoredSiteConfig, 'logoObjectKey' | 'iconObjectKey'> & {
  logoUrl: string | null;
  iconUrl: string | null;
};

export function toPublicSiteConfig(requestUrl: string, config: StoredSiteConfig): PublicSiteConfig {
  const { iconObjectKey, logoObjectKey, ...publicConfig } = config;
  const mediaUrl = (asset: 'logo' | 'icon', objectKey: string | null) =>
    objectKey ? new URL(`/api/media/site-brand/${asset}`, requestUrl).toString() : null;
  return {
    ...publicConfig,
    logoUrl: mediaUrl('logo', logoObjectKey),
    iconUrl: mediaUrl('icon', iconObjectKey),
  };
}
