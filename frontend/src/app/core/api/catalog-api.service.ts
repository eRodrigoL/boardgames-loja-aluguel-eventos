import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, of, retry, type Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type GameAvailability = 'available' | 'rented' | 'reserved' | 'maintenance' | 'unavailable';

export interface CatalogGameImage {
  readonly id: string;
  readonly url: string;
  readonly altText: string | null;
}

export interface CatalogGame {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly publisher: string | null;
  readonly minPlayers: number | null;
  readonly maxPlayers: number | null;
  readonly averageDurationMinutes: number | null;
  readonly minimumAge: number | null;
  readonly description: string | null;
  readonly fullDescription: string | null;
  readonly weeklyRentalPriceCents: number | null;
  readonly salePriceCents: number | null;
  readonly availableForSale: boolean;
  readonly availableForRental: boolean;
  readonly availability: GameAvailability;
  readonly featured: boolean;
  readonly tags: readonly { readonly id: string; readonly name: string; readonly slug: string }[];
  readonly images: readonly CatalogGameImage[];
  readonly art?: 'forest' | 'castle' | 'space' | 'tavern' | 'ocean' | 'desert';
}

export interface CatalogEvent {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string | null;
  readonly description: string;
  readonly fullDescription: string | null;
  readonly location: string | null;
  readonly startsAt: string;
  readonly endsAt: string | null;
  readonly featured: boolean;
  readonly coverImageUrl: string | null;
}

export interface PublicSiteConfig {
  readonly businessName: string;
  readonly phone: string | null;
  readonly whatsapp: string | null;
  readonly email: string | null;
  readonly serviceRegion: string | null;
  readonly defaultRentalPeriodDays: number;
  readonly socialLinks: Readonly<Record<string, string>>;
  readonly contactMessage: string | null;
  readonly developerCreditName: string | null;
  readonly developerCreditUrl: string | null;
  readonly logoUrl: string | null;
  readonly iconUrl: string | null;
}

export type SiteConfigUpdate = Omit<
  PublicSiteConfig,
  'developerCreditName' | 'developerCreditUrl' | 'logoUrl' | 'iconUrl'
>;

type CollectionResponse<T> = { readonly data: readonly T[] } | readonly T[];
type CatalogGamePayload = Omit<CatalogGame, 'images'> & {
  readonly images?: readonly (CatalogGameImage | string)[];
};

function normalizeGameImages(images: CatalogGamePayload['images']): readonly CatalogGameImage[] {
  if (!images) return [];

  return images.flatMap((image, index) => {
    if (typeof image === 'string') {
      return image.trim() ? [{ id: `legacy-image-${index}`, url: image, altText: null }] : [];
    }
    return image.url ? [image] : [];
  });
}

function normalizeCatalogGame(game: CatalogGamePayload): CatalogGame {
  return { ...game, images: normalizeGameImages(game.images) };
}

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly http = inject(HttpClient);

  listGames(): Observable<readonly CatalogGame[]> {
    return this.getCollection<CatalogGamePayload>('games').pipe(
      map((games) => games.map(normalizeCatalogGame)),
    );
  }

  listEvents(): Observable<readonly CatalogEvent[]> {
    return this.getCollection<CatalogEvent>('events');
  }

  getGame(slug: string): Observable<CatalogGame | null> {
    return this.getBySlug<CatalogGamePayload>('games', slug).pipe(
      map((game) => (game ? normalizeCatalogGame(game) : null)),
    );
  }

  getEvent(slug: string): Observable<CatalogEvent | null> {
    return this.getBySlug<CatalogEvent>('events', slug);
  }

  findGameByName(name: string): Observable<CatalogGame | null> {
    return this.listGames().pipe(
      map(
        (games) =>
          games.find(
            (game) => game.name.localeCompare(name, 'pt-BR', { sensitivity: 'accent' }) === 0,
          ) ?? null,
      ),
    );
  }

  findEventByTitle(title: string): Observable<CatalogEvent | null> {
    return this.listEvents().pipe(
      map(
        (events) =>
          events.find(
            (event) => event.title.localeCompare(title, 'pt-BR', { sensitivity: 'accent' }) === 0,
          ) ?? null,
      ),
    );
  }

  getPublicConfig(): Observable<PublicSiteConfig | null> {
    return this.http
      .get<{ readonly data: PublicSiteConfig } | PublicSiteConfig>(
        `${environment.apiBaseUrl}/${environment.siteConfigPath}`,
      )
      .pipe(
        map((response) => ('data' in response ? response.data : response)),
        retry({ count: 5, delay: 300 }),
        catchError(() => of(null)),
      );
  }

  private getCollection<T>(resource: string): Observable<readonly T[]> {
    return this.http.get<CollectionResponse<T>>(`${environment.apiBaseUrl}/${resource}`).pipe(
      map((response): readonly T[] =>
        Array.isArray(response)
          ? (response as readonly T[])
          : (response as { readonly data: readonly T[] }).data,
      ),
      retry({ count: 5, delay: 300 }),
      catchError(() => of([] as readonly T[])),
    );
  }

  private getOne<T>(resource: string): Observable<T | null> {
    return this.http.get<{ readonly data: T } | T>(`${environment.apiBaseUrl}/${resource}`).pipe(
      map((response) =>
        typeof response === 'object' && response !== null && 'data' in response
          ? (response as { readonly data: T }).data
          : response,
      ),
      retry({ count: 2, delay: 200 }),
      catchError(() => of(null)),
    );
  }

  private getBySlug<T>(resource: string, slug: string): Observable<T | null> {
    if (environment.production) return this.getOne<T>(`${resource}/${encodeURIComponent(slug)}`);

    return this.http
      .get<readonly T[]>(`${environment.apiBaseUrl}/${resource}`, {
        params: { slug },
      })
      .pipe(
        map((items) => items[0] ?? null),
        retry({ count: 2, delay: 200 }),
        catchError(() => of(null)),
      );
  }
}
