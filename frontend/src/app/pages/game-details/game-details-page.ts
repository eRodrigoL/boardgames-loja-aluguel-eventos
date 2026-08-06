import { Component, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CatalogApiService } from '@core/api/catalog-api.service';
import { AuthService } from '@core/auth/auth.service';
import { FavoriteGamesService } from '@core/favorites/favorite-games.service';
import { RentalCartService } from '@core/cart/rental-cart.service';
import { type CartFulfillment } from '@core/cart/rental-cart.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-game-details-page',
  imports: [RouterLink],
  templateUrl: './game-details-page.html',
})
export class GameDetailsPage {
  private readonly api = inject(CatalogApiService);
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(RentalCartService);
  protected readonly favorites = inject(FavoriteGamesService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly slug = this.router.url.split('/').pop() ?? '';
  protected readonly game = toSignal(this.api.getGame(this.slug), { initialValue: null });
  protected readonly price = computed(() => {
    const cents = this.game()?.weeklyRentalPriceCents;
    return cents === null || cents === undefined
      ? 'Preço a confirmar'
      : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  });
  protected addToCart(fulfillment: CartFulfillment): void {
    const game = this.game();
    if (!game) return;
    if (!this.auth.isSignedIn()) {
      void this.router.navigate(['/entrar'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.cart.toggle(game, fulfillment);
  }
  protected toggleFavorite(fulfillment: CartFulfillment): void {
    const game = this.game();
    if (!game) return;
    if (!this.auth.isSignedIn()) {
      void this.router.navigate(['/entrar'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.favorites.toggle(game.id, fulfillment);
  }
  protected async deleteGame(): Promise<void> {
    const game = this.game();
    if (!game || !confirm(`Excluir ${game.name}?`)) return;
    const endpoint = environment.production
      ? `${environment.apiBaseUrl}/admin/games/${game.id}`
      : `${environment.apiBaseUrl}/games/${game.id}`;
    await firstValueFrom(this.http.delete(endpoint));
    void this.router.navigateByUrl('/');
  }
}
