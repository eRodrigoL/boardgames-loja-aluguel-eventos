import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogApiService } from '@core/api/catalog-api.service';
import { RentalCartService } from '@core/cart/rental-cart.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({ selector: 'app-cart-page', imports: [RouterLink], templateUrl: './cart-page.html' })
export class CartPage {
  private readonly api = inject(CatalogApiService);
  protected readonly cart = inject(RentalCartService);
  protected readonly config = toSignal(this.api.getPublicConfig(), { initialValue: null });
  protected readonly message = computed(() => {
    const items = this.cart
      .items()
      .map((game) => game.name)
      .join(', ');
    const period = this.config()?.defaultRentalPeriodDays ?? 7;
    return `Olá, desejo confirmar o preço e a disponibilidade dos jogos ${items} para o período de ${period} dias.`;
  });
  protected readonly whatsappUrl = computed(() => {
    const number = (this.config()?.whatsapp ?? '').replace(/\D/g, '');
    return number ? `https://wa.me/${number}?text=${encodeURIComponent(this.message())}` : '#';
  });
}
