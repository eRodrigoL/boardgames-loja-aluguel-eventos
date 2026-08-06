import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CatalogApiService } from '@core/api/catalog-api.service';
import { AuthService } from '@core/auth/auth.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-event-details-page',
  imports: [RouterLink],
  templateUrl: './event-details-page.html',
})
export class EventDetailsPage {
  private readonly api = inject(CatalogApiService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  protected readonly auth = inject(AuthService);
  private readonly slug = this.router.url.split('/').pop() ?? '';
  protected readonly event = toSignal(this.api.getEvent(this.slug), { initialValue: null });
  protected readonly date = (value: string) =>
    new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(
      new Date(value),
    );
  protected async deleteEvent(): Promise<void> {
    const event = this.event();
    if (!event || !confirm(`Excluir ${event.title}?`)) return;
    const endpoint = environment.production
      ? `${environment.apiBaseUrl}/admin/events/${event.id}`
      : `${environment.apiBaseUrl}/events/${event.id}`;
    await firstValueFrom(this.http.delete(endpoint));
    void this.router.navigateByUrl('/eventos');
  }
}
