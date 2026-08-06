import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { RentalCartService } from '@core/cart/rental-cart.service';
import { AuthService } from '@core/auth/auth.service';
import { CartDrawerService } from '@core/cart/cart-drawer.service';
import { SiteConfigService } from '@core/site-config/site-config.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly siteConfig = inject(SiteConfigService);
  protected readonly rentalCart = inject(RentalCartService);
  protected readonly auth = inject(AuthService);
  protected readonly cartDrawer = inject(CartDrawerService);
  protected readonly isMenuOpen = signal(false);
  protected readonly isUserMenuOpen = signal(false);
  private readonly router = inject(Router);

  protected signOut(): void {
    this.auth.signOut();
    this.rentalCart.refreshForCurrentUser();
    this.isUserMenuOpen.set(false);
    void this.router.navigateByUrl('/');
  }

  protected toggleMenu(): void {
    this.isMenuOpen.update((isOpen) => !isOpen);
  }

  protected closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  protected toggleUserMenu(): void {
    this.isUserMenuOpen.update((isOpen) => !isOpen);
  }

  protected closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }
}
