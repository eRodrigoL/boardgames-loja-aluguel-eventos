import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CatalogApiService, type CatalogEvent } from '@core/api/catalog-api.service';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-events-page',
  imports: [RouterLink],
  templateUrl: './events-page.html',
})
export class EventsPage {
  private readonly api = inject(CatalogApiService);
  protected readonly auth = inject(AuthService);
  protected readonly events = toSignal(this.api.listEvents(), { initialValue: [] });

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
}
