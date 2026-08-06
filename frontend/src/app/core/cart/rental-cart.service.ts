import { Injectable, computed, inject, signal } from '@angular/core';
import type { CatalogGame } from '@core/api/catalog-api.service';
import { AuthService } from '@core/auth/auth.service';

const storagePrefix = 'dragao-imaginario:rental-cart:';
export type CartFulfillment = 'sale' | 'rental';
export type CartItem = Pick<CatalogGame, 'id' | 'name' | 'slug'> & {
  readonly fulfillment: CartFulfillment;
  readonly quantity: number;
  readonly unitPriceCents: number | null;
};

@Injectable({ providedIn: 'root' })
export class RentalCartService {
  private readonly auth = inject(AuthService);
  private readonly games = signal<readonly CartItem[]>(this.restore());
  readonly count = computed(() => this.games().reduce((total, game) => total + game.quantity, 0));
  readonly totalCents = computed(() =>
    this.games().reduce((total, game) => total + (game.unitPriceCents ?? 0) * game.quantity, 0),
  );

  has(gameId: string, fulfillment: CartFulfillment): boolean {
    return this.games().some((game) => game.id === gameId && game.fulfillment === fulfillment);
  }

  toggle(
    game: Pick<CatalogGame, 'id' | 'name' | 'slug' | 'salePriceCents' | 'weeklyRentalPriceCents'>,
    fulfillment: CartFulfillment,
  ): void {
    const email = this.auth.user()?.email;
    if (!email) return;
    this.games.update((games) => {
      const next = this.has(game.id, fulfillment)
        ? games.filter((item) => item.id !== game.id || item.fulfillment !== fulfillment)
        : [
            ...games,
            {
              ...game,
              fulfillment,
              quantity: 1,
              unitPriceCents:
                fulfillment === 'sale' ? game.salePriceCents : game.weeklyRentalPriceCents,
            },
          ];
      this.persist(next, email);
      return next;
    });
  }

  remove(gameId: string, fulfillment?: CartFulfillment): void {
    const email = this.auth.user()?.email;
    if (!email) return;
    this.games.update((games) => {
      const next = games.filter(
        (game) =>
          game.id !== gameId || (fulfillment !== undefined && game.fulfillment !== fulfillment),
      );
      this.persist(next, email);
      return next;
    });
  }

  clear(): void {
    const email = this.auth.user()?.email;
    if (!email) return;
    this.games.set([]);
    localStorage.removeItem(this.key(email));
  }

  changeQuantity(gameId: string, fulfillment: CartFulfillment, change: number): void {
    const email = this.auth.user()?.email;
    if (!email) return;
    this.games.update((games) => {
      const next = games.flatMap((game) => {
        if (game.id !== gameId || game.fulfillment !== fulfillment) return [game];
        const quantity = Math.min(Math.max(game.quantity + change, 0), 99);
        return quantity ? [{ ...game, quantity }] : [];
      });
      this.persist(next, email);
      return next;
    });
  }

  items(): readonly CartItem[] {
    return this.games();
  }

  refreshForCurrentUser(): void {
    this.games.set(this.restore());
  }

  private restore(): readonly CartItem[] {
    const email = this.auth.user()?.email;
    if (!email) return [];
    try {
      const value = localStorage.getItem(this.key(email));
      if (!value) return [];
      return (JSON.parse(value) as Partial<CartItem>[]).flatMap((item) =>
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.slug === 'string' &&
        (item.fulfillment === 'sale' || item.fulfillment === 'rental')
          ? [
              {
                ...item,
                quantity: Math.max(1, item.quantity ?? 1),
                unitPriceCents: item.unitPriceCents ?? null,
              } as CartItem,
            ]
          : [],
      );
    } catch {
      return [];
    }
  }

  private persist(games: readonly CartItem[], email: string): void {
    localStorage.setItem(this.key(email), JSON.stringify(games));
  }

  private key(email: string): string {
    return `${storagePrefix}${email}`;
  }
}
