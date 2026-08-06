import { Injectable, computed, inject, signal } from '@angular/core';
import type { CartFulfillment } from '@core/cart/rental-cart.service';
import { AuthService } from '@core/auth/auth.service';

type FavoriteCollection = Record<CartFulfillment, readonly string[]>;

const emptyFavorites = (): FavoriteCollection => ({ sale: [], rental: [] });
const storagePrefix = 'dragao-imaginario:favorites:';

@Injectable({ providedIn: 'root' })
export class FavoriteGamesService {
  private readonly auth = inject(AuthService);
  private readonly collections = signal<FavoriteCollection>(this.restore());
  readonly count = computed(
    () => new Set([...this.collections().sale, ...this.collections().rental]).size,
  );

  has(gameId: string, fulfillment: CartFulfillment): boolean {
    return this.collections()[fulfillment].includes(gameId);
  }

  hasAny(gameId: string): boolean {
    return this.has(gameId, 'sale') || this.has(gameId, 'rental');
  }

  ids(fulfillment: CartFulfillment): readonly string[] {
    return this.collections()[fulfillment];
  }

  toggle(gameId: string, fulfillment: CartFulfillment): void {
    const email = this.auth.user()?.email;
    if (!email) return;
    this.collections.update((collections) => {
      const ids = collections[fulfillment];
      const next = {
        ...collections,
        [fulfillment]: ids.includes(gameId) ? ids.filter((id) => id !== gameId) : [...ids, gameId],
      } satisfies FavoriteCollection;
      this.persist(next, email);
      return next;
    });
  }

  refreshForCurrentUser(): void {
    this.collections.set(this.restore());
  }

  private restore(): FavoriteCollection {
    const email = this.auth.user()?.email;
    if (!email) return emptyFavorites();
    try {
      const value = JSON.parse(localStorage.getItem(this.key(email)) ?? 'null') as unknown;
      if (Array.isArray(value) && value.every((id) => typeof id === 'string')) {
        return { sale: [], rental: value };
      }
      if (
        typeof value === 'object' &&
        value !== null &&
        'sale' in value &&
        'rental' in value &&
        Array.isArray(value.sale) &&
        Array.isArray(value.rental) &&
        value.sale.every((id) => typeof id === 'string') &&
        value.rental.every((id) => typeof id === 'string')
      ) {
        return { sale: value.sale, rental: value.rental };
      }
      return emptyFavorites();
    } catch {
      return emptyFavorites();
    }
  }

  private persist(collections: FavoriteCollection, email: string): void {
    localStorage.setItem(this.key(email), JSON.stringify(collections));
  }

  private key(email: string): string {
    return `${storagePrefix}${email}`;
  }
}
