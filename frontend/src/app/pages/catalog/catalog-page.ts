import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  CatalogApiService,
  type CatalogEvent,
  type CatalogGame,
} from '@core/api/catalog-api.service';
import { type CartFulfillment, RentalCartService } from '@core/cart/rental-cart.service';
import { AuthService } from '@core/auth/auth.service';
import { FavoriteGamesService } from '@core/favorites/favorite-games.service';

type Highlight =
  | { readonly kind: 'game'; readonly item: CatalogGame }
  | { readonly kind: 'event'; readonly item: CatalogEvent };

const artFallback = ['forest', 'castle', 'space', 'tavern', 'ocean', 'desert'] as const;
const boardGameTags = [
  'Todos',
  'Cartas',
  'Tabuleiro',
  'Destreza',
  'Sorte',
  'Euro',
  'De Galera',
  'Solo',
  'Dupla',
  'Curta Duração',
  'Média Duração',
  'Longa Duração',
] as const;
const shopFilters: readonly { readonly key: 'all' | CartFulfillment; readonly label: string }[] = [
  { key: 'all', label: 'Todos os jogos' },
  { key: 'sale', label: 'Jogos para comprar' },
  { key: 'rental', label: 'Jogos para alugar' },
];

@Component({
  selector: 'app-catalog-page',
  imports: [RouterLink],
  templateUrl: './catalog-page.html',
})
export class CatalogPage {
  private readonly api = inject(CatalogApiService);
  private readonly cart = inject(RentalCartService);
  protected readonly auth = inject(AuthService);
  private readonly favorites = inject(FavoriteGamesService);
  private readonly router = inject(Router);
  protected readonly games = toSignal(this.api.listGames(), { initialValue: [] });
  protected readonly events = toSignal(this.api.listEvents(), { initialValue: [] });
  protected readonly search = signal('');
  protected readonly selectedTag = signal('Todos');
  protected readonly selectedShopFilter = signal<'all' | CartFulfillment>('all');
  protected readonly shopFilters = shopFilters;
  protected readonly selectedHighlight = signal(0);
  protected readonly tags = signal(boardGameTags);
  protected readonly filteredGames = computed(() => {
    const term = this.normalizeSearchValue(this.search());
    const tag = this.selectedTag();

    return this.games().filter((game) => this.matches(game, term, tag, this.selectedShopFilter()));
  });
  protected readonly highlights = computed<readonly Highlight[]>(() => [
    ...this.games()
      .filter((game) => game.featured)
      .map((item) => ({ kind: 'game' as const, item })),
    ...this.events()
      .filter((event) => event.featured)
      .map((item) => ({ kind: 'event' as const, item })),
  ]);
  protected readonly activeHighlight = computed(() => {
    const highlights = this.highlights();
    return highlights[this.selectedHighlight() % Math.max(highlights.length, 1)];
  });

  protected updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.search.set(input.value);
  }

  protected selectTag(tag: string): void {
    this.selectedTag.set(tag);
  }

  protected selectShopFilter(filter: 'all' | CartFulfillment): void {
    this.selectedShopFilter.set(filter);
  }

  protected showPreviousHighlight(): void {
    const total = this.highlights().length;
    if (total) this.selectedHighlight.update((index) => (index - 1 + total) % total);
  }

  protected showNextHighlight(): void {
    const total = this.highlights().length;
    if (total) this.selectedHighlight.update((index) => (index + 1) % total);
  }

  protected selectHighlight(index: number): void {
    this.selectedHighlight.set(index);
  }

  protected addToCart(game: CatalogGame, fulfillment: CartFulfillment): void {
    if (!this.auth.isSignedIn()) {
      void this.router.navigate(['/entrar'], { queryParams: { returnUrl: '/' } });
      return;
    }
    this.cart.toggle(game, fulfillment);
  }

  protected isInCart(game: CatalogGame, fulfillment: CartFulfillment): boolean {
    return this.cart.has(game.id, fulfillment);
  }

  protected toggleFavorite(game: CatalogGame): void {
    if (!this.auth.isSignedIn()) {
      void this.router.navigate(['/entrar'], { queryParams: { returnUrl: '/' } });
      return;
    }
    this.favorites.toggle(game.id, this.favoriteFulfillment(game));
  }

  protected isFavorite(game: CatalogGame): boolean {
    return this.favorites.hasAny(game.id);
  }

  private favoriteFulfillment(game: CatalogGame): CartFulfillment {
    return game.availableForRental ? 'rental' : 'sale';
  }

  protected gameArt(game: CatalogGame): string {
    const index = Math.max(
      this.games().findIndex((item) => item.id === game.id),
      0,
    );
    return game.art ?? artFallback[index % artFallback.length];
  }

  protected gamePlayers(game: CatalogGame): string {
    if (!game.minPlayers && !game.maxPlayers) return 'Jogadores a confirmar';
    if (game.minPlayers === game.maxPlayers) return `${game.minPlayers} jogadores`;
    return `${game.minPlayers ?? 1}–${game.maxPlayers ?? '+'} jogadores`;
  }

  protected gameDuration(game: CatalogGame): string {
    return game.averageDurationMinutes
      ? `${game.averageDurationMinutes} min`
      : 'Duração a confirmar';
  }

  protected eventDate(event: CatalogEvent): {
    readonly day: string;
    readonly month: string;
    readonly time: string;
  } {
    const date = new Date(event.startsAt);
    return {
      day: new Intl.DateTimeFormat('pt-BR', { day: '2-digit' }).format(date),
      month: new Intl.DateTimeFormat('pt-BR', { month: 'short' })
        .format(date)
        .replace('.', '')
        .toUpperCase(),
      time: new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date),
    };
  }

  private matches(
    game: CatalogGame,
    term: string,
    tag: string,
    fulfillment: 'all' | CartFulfillment,
  ): boolean {
    const hasTerm =
      !term ||
      this.normalizeSearchValue(
        `${game.name} ${game.publisher ?? ''} ${game.tags.map((item) => item.name).join(' ')}`,
      ).includes(term);
    const hasTag =
      tag === 'Todos' ||
      game.tags.some(
        (item) => this.normalizeSearchValue(item.name) === this.normalizeSearchValue(tag),
      );
    const matchesFulfillment =
      fulfillment === 'all' ||
      (fulfillment === 'sale' ? game.availableForSale : game.availableForRental);

    // A pesquisa precisa corresponder ao título inteiro para revelar um jogo indisponível.
    const isExactUnavailableSearch =
      game.availability !== 'available' && this.normalizeSearchValue(game.name) === term;

    return (
      hasTerm &&
      hasTag &&
      matchesFulfillment &&
      (game.availability === 'available' || isExactUnavailableSearch)
    );
  }

  private normalizeSearchValue(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
  }
}
