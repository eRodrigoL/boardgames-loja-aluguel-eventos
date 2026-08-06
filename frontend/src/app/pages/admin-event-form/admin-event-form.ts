import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CatalogApiService, type CatalogEvent } from '@core/api/catalog-api.service';
import { imageValidationError, normalizeSlug, normalizeText } from '@core/validation/form-input';
import { environment } from '../../../environments/environment';

type EventDraft = Pick<
  CatalogEvent,
  | 'title'
  | 'slug'
  | 'summary'
  | 'description'
  | 'fullDescription'
  | 'location'
  | 'startsAt'
  | 'endsAt'
  | 'featured'
>;
type SelectedImage = { readonly file: File; readonly previewUrl: string };
const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
const emptyDraft = (): EventDraft => ({
  title: '',
  slug: '',
  summary: '',
  description: '',
  fullDescription: '',
  location: '',
  startsAt: futureDate,
  endsAt: null,
  featured: false,
});

@Component({
  selector: 'app-admin-event-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-event-form.html',
})
export class AdminEventForm {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly api = inject(CatalogApiService);
  protected readonly id = this.route.snapshot.paramMap.get('id');
  protected readonly draft = signal<EventDraft>(emptyDraft());
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly selectedCover = signal<SelectedImage | null>(null);
  constructor() {
    if (this.id && this.id !== 'novo')
      this.api.listEvents().subscribe((events) => this.load(events));
  }
  protected update<K extends keyof EventDraft>(key: K, value: EventDraft[K]): void {
    this.draft.update((draft) => ({ ...draft, [key]: this.normalizeValue(key, value) }));
  }
  protected selectCover(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const validationError = imageValidationError(file);
    if (validationError) {
      this.error.set(validationError);
      input.value = '';
      return;
    }
    const oldCover = this.selectedCover();
    if (oldCover) URL.revokeObjectURL(oldCover.previewUrl);
    this.selectedCover.set({ file, previewUrl: URL.createObjectURL(file) });
    input.value = '';
  }
  protected removeCover(): void {
    const cover = this.selectedCover();
    if (cover) URL.revokeObjectURL(cover.previewUrl);
    this.selectedCover.set(null);
  }
  protected checkDuplicateTitle(): void {
    const title = this.draft().title.trim();
    if (!title) return;
    this.api.findEventByTitle(title).subscribe((event) => {
      if (!event || event.id === this.id) return;
      if (confirm(`Já existe um evento chamado “${event.title}”. Deseja abri-lo?`))
        void this.router.navigate(['/eventos', event.slug]);
    });
  }
  protected async save(): Promise<void> {
    const draft = this.draft();
    if (!draft.title.trim() || !draft.slug.trim() || !draft.description.trim()) {
      this.error.set('Título, slug e descrição são obrigatórios.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const body = environment.production
      ? {
          ...draft,
          startsAt: new Date(draft.startsAt).toISOString(),
          endsAt: draft.endsAt ? new Date(draft.endsAt).toISOString() : null,
          contact: null,
          published: false,
          active: true,
        }
      : {
          ...draft,
          id: this.id === 'novo' ? crypto.randomUUID() : this.id,
          startsAt: new Date(draft.startsAt).toISOString(),
          endsAt: draft.endsAt ? new Date(draft.endsAt).toISOString() : null,
          coverImageUrl: null,
        };
    const resource = environment.production
      ? `${environment.apiBaseUrl}/admin/events${this.id && this.id !== 'novo' ? `/${this.id}` : ''}`
      : `${environment.apiBaseUrl}/events${this.id && this.id !== 'novo' ? `/${this.id}` : ''}`;
    try {
      const saved = await firstValueFrom(
        this.id && this.id !== 'novo'
          ? this.http.put(resource, body)
          : this.http.post(resource, body),
      );
      if (environment.production) {
        const eventId = this.extractId(saved);
        if (eventId) await this.uploadCover(eventId);
      }
      void this.router.navigateByUrl('/eventos');
    } catch {
      this.error.set('Não foi possível salvar o evento. Tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }
  private load(events: readonly CatalogEvent[]): void {
    const event = events.find((item) => item.id === this.id);
    if (event)
      this.draft.set({
        ...event,
        startsAt: event.startsAt.slice(0, 16),
        endsAt: event.endsAt?.slice(0, 16) ?? null,
      });
  }
  private normalizeValue<K extends keyof EventDraft>(key: K, value: EventDraft[K]): EventDraft[K] {
    if (key === 'slug') return normalizeSlug(String(value)) as EventDraft[K];
    if (key === 'title') return normalizeText(String(value), 200) as EventDraft[K];
    if (key === 'summary') return normalizeText(String(value ?? ''), 10_000) as EventDraft[K];
    if (key === 'description') return normalizeText(String(value), 20_000) as EventDraft[K];
    if (key === 'fullDescription')
      return normalizeText(String(value ?? ''), 10_000) as EventDraft[K];
    if (key === 'location') return normalizeText(String(value ?? ''), 10_000) as EventDraft[K];
    return value;
  }
  private extractId(value: unknown): string | null {
    if (!value || typeof value !== 'object') return null;
    const record = value as { data?: unknown; id?: unknown };
    const source = record.data && typeof record.data === 'object' ? record.data : record;
    return typeof (source as { id?: unknown }).id === 'string'
      ? (source as { id: string }).id
      : null;
  }
  private async uploadCover(eventId: string): Promise<void> {
    const cover = this.selectedCover();
    if (!cover) return;
    const formData = new FormData();
    formData.append('file', cover.file, cover.file.name);
    await firstValueFrom(
      this.http.post(`${environment.apiBaseUrl}/admin/events/${eventId}/cover`, formData),
    );
  }
}
