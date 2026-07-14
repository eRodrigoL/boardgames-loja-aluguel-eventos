declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database;
    MEDIA: R2Bucket;
    PUBLIC_ORIGINS: string;
    ACCESS_ISSUER: string;
    ACCESS_AUDIENCE: string;
    ACCESS_JWKS_URL: string;
    MAX_IMAGE_BYTES: string;
  }
}
