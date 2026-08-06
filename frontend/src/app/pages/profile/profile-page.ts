import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CatalogApiService } from '@core/api/catalog-api.service';
import { AuthService } from '@core/auth/auth.service';
import { FavoriteGamesService } from '@core/favorites/favorite-games.service';

@Component({
  selector: 'app-profile-page',
  imports: [RouterLink],
  templateUrl: './profile-page.html',
})
export class ProfilePage {
  protected readonly auth = inject(AuthService);
  private readonly favorites = inject(FavoriteGamesService);
  private readonly api = inject(CatalogApiService);
  private readonly games = toSignal(this.api.listGames(), { initialValue: [] });
  protected readonly rentalFavorites = computed(() =>
    this.games().filter((game) => this.favorites.ids('rental').includes(game.id)),
  );
  protected readonly saleFavorites = computed(() =>
    this.games().filter((game) => this.favorites.ids('sale').includes(game.id)),
  );

  protected roleName(role: 'member' | 'admin' | 'super_admin'): string {
    return { member: 'Conta comum', admin: 'Administrador', super_admin: 'Acesso total' }[role];
  }
}
