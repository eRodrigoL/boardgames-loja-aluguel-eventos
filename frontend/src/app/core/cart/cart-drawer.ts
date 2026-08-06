import { Component, computed, inject } from '@angular/core';
import { CatalogApiService } from '@core/api/catalog-api.service';
import { RentalCartService } from './rental-cart.service';
import { CartDrawerService } from './cart-drawer.service';
import type { CartItem } from './rental-cart.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({ selector: 'app-cart-drawer', templateUrl: './cart-drawer.html' })
export class CartDrawer {
  private readonly api = inject(CatalogApiService);
  protected readonly cart = inject(RentalCartService);
  protected readonly drawer = inject(CartDrawerService);
  protected readonly config = toSignal(this.api.getPublicConfig(), { initialValue: null });
  protected readonly message = computed(() => {
    const games = this.cart
      .items()
      .map(
        (game) =>
          `${game.quantity}× ${game.name} (${game.fulfillment === 'sale' ? 'compra' : 'locação'})`,
      )
      .join(', ');
    return `Olá, desejo confirmar o preço e a disponibilidade dos jogos ${games} para o período de ${this.config()?.defaultRentalPeriodDays ?? 7} dias.`;
  });
  protected readonly whatsappUrl = computed(() => {
    const number = (this.config()?.whatsapp ?? '').replace(/\D/g, '');
    return number ? `https://wa.me/${number}?text=${encodeURIComponent(this.message())}` : '#';
  });
  protected itemTotal(item: CartItem): number {
    return (item.unitPriceCents ?? 0) * item.quantity;
  }
  protected formatMoney(cents: number | null): string {
    if (cents === null) return 'Preço a confirmar';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      cents / 100,
    );
  }
}
