import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, type SignedInUser } from '@core/auth/auth.service';
import { FavoriteGamesService } from '@core/favorites/favorite-games.service';
import { RentalCartService } from '@core/cart/rental-cart.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly cart = inject(RentalCartService);
  private readonly favorites = inject(FavoriteGamesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly email = signal('');
  protected readonly error = signal('');

  protected login(provider: SignedInUser['provider']): void {
    const email = this.email().trim();
    if (!email || !email.includes('@')) {
      this.error.set('Informe um e-mail válido para continuar.');
      return;
    }
    this.auth.signIn(email, provider);
    this.finishLogin();
  }

  protected loginAs(role: SignedInUser['role']): void {
    this.auth.signInAs(role);
    this.finishLogin();
  }

  private finishLogin(): void {
    this.cart.refreshForCurrentUser();
    this.favorites.refreshForCurrentUser();
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    void this.router.navigateByUrl(returnUrl?.startsWith('/') ? returnUrl : '/');
  }
}
