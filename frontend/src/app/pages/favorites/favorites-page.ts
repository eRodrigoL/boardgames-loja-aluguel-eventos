import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CatalogApiService } from '@core/api/catalog-api.service';
import { FavoriteGamesService } from '@core/favorites/favorite-games.service';

@Component({
  selector: 'app-favorites-page',
  imports: [RouterLink],
  templateUrl: './favorites-page.html',
})
export class FavoritesPage {
  private readonly api = inject(CatalogApiService);
  protected readonly favorites = inject(FavoriteGamesService);
  protected readonly games = toSignal(this.api.listGames(), { initialValue: [] });
  protected readonly rentalItems = computed(() =>
    this.games().filter((game) => this.favorites.ids('rental').includes(game.id)),
  );
  protected readonly saleItems = computed(() =>
    this.games().filter((game) => this.favorites.ids('sale').includes(game.id)),
  );
}
