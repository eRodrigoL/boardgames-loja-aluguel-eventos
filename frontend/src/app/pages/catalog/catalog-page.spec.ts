import { TestBed } from '@angular/core/testing';
import { type Signal, type WritableSignal } from '@angular/core';
import { of } from 'rxjs';
import {
  CatalogApiService,
  type CatalogEvent,
  type CatalogGame,
} from '@core/api/catalog-api.service';
import { AuthService } from '@core/auth/auth.service';
import { FavoriteGamesService } from '@core/favorites/favorite-games.service';
import { RentalCartService } from '@core/cart/rental-cart.service';
import { provideRouter } from '@angular/router';
import { CatalogPage } from './catalog-page';

type CatalogPageSignals = {
  readonly search: WritableSignal<string>;
  readonly selectedTag: WritableSignal<string>;
  readonly filteredGames: Signal<readonly CatalogGame[]>;
};

const game = (overrides: Partial<CatalogGame>): CatalogGame => ({
  id: 'game-1',
  slug: 'jogo-teste',
  name: 'Jogo de teste',
  publisher: 'Editora teste',
  minPlayers: 2,
  maxPlayers: 4,
  averageDurationMinutes: 45,
  minimumAge: 10,
  description: 'Descrição de teste',
  fullDescription: null,
  weeklyRentalPriceCents: 2500,
  salePriceCents: null,
  availableForSale: false,
  availableForRental: true,
  availability: 'available',
  featured: false,
  tags: [],
  images: [],
  ...overrides,
});

describe('CatalogPage', () => {
  const games: readonly CatalogGame[] = [
    game({
      id: 'available',
      name: 'A Estalagem do Grifo',
      tags: [{ id: 'cartas', name: 'Cartas', slug: 'cartas' }],
    }),
    game({
      id: 'unavailable',
      slug: 'navegantes-do-eter',
      name: 'Navegantes do Éter',
      availability: 'rented',
      tags: [{ id: 'tabuleiro', name: 'Tabuleiro', slug: 'tabuleiro' }],
    }),
  ];

  let page: CatalogPageSignals;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CatalogApiService,
          useValue: {
            listGames: () => of(games),
            listEvents: () => of([] as readonly CatalogEvent[]),
          },
        },
        { provide: AuthService, useValue: {} },
        { provide: FavoriteGamesService, useValue: {} },
        { provide: RentalCartService, useValue: {} },
        provideRouter([]),
      ],
    });

    page = TestBed.createComponent(CatalogPage).componentInstance as unknown as CatalogPageSignals;
  });

  it('exibe somente os jogos disponíveis por padrão, inclusive em pesquisas parciais', () => {
    expect(page.filteredGames().map((item) => item.id)).toEqual(['available']);

    page.search.set('Navegantes');

    expect(page.filteredGames()).toEqual([]);
  });

  it('exibe um jogo indisponível quando a pesquisa corresponde ao título completo', () => {
    page.search.set('Navegantes do Éter');

    expect(page.filteredGames().map((item) => item.id)).toEqual(['unavailable']);
  });

  it('usa as tags de jogos de tabuleiro para filtrar o acervo', () => {
    page.selectedTag.set('Cartas');

    expect(page.filteredGames().map((item) => item.id)).toEqual(['available']);
  });
});
