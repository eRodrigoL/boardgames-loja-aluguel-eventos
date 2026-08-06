import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CatalogApiService, type CatalogGame } from '@core/api/catalog-api.service';
import {
  centsFromReais,
  imageValidationError,
  normalizeInteger,
  normalizeSlug,
  normalizeText,
  reaisFromCents,
} from '@core/validation/form-input';
import { environment } from '../../../environments/environment';

type GameDraft = Pick<
  CatalogGame,
  'name' | 'slug' | 'publisher' | 'description' | 'fullDescription' | 'availability' | 'featured'
> & {
  tags: string;
  minPlayers: number | null;
  maxPlayers: number | null;
  averageDurationMinutes: number | null;
  weeklyRentalPriceCents: number | null;
  salePriceCents: number | null;
  availableForSale: boolean;
  availableForRental: boolean;
};
const emptyDraft = (): GameDraft => ({
  name: '',
  slug: '',
  publisher: null,
  description: '',
  fullDescription: '',
  availability: 'available',
  featured: false,
  tags: '',
  minPlayers: 2,
  maxPlayers: 4,
  averageDurationMinutes: 60,
  weeklyRentalPriceCents: null,
  salePriceCents: null,
  availableForSale: false,
  availableForRental: true,
});

type SelectedImage = { readonly file: File; readonly previewUrl: string };

@Component({
  selector: 'app-admin-game-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-game-form.html',
})
export class AdminGameForm {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly api = inject(CatalogApiService);
  protected readonly id = this.route.snapshot.paramMap.get('id');
  protected readonly draft = signal<GameDraft>(emptyDraft());
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly selectedImages = signal<readonly SelectedImage[]>([]);
  protected readonly priceInReais = signal(reaisFromCents(this.draft().weeklyRentalPriceCents));
  protected readonly salePriceInReais = signal(reaisFromCents(this.draft().salePriceCents));
  constructor() {
    if (this.id && this.id !== 'novo') this.api.listGames().subscribe((games) => this.load(games));
  }
  protected update<K extends keyof GameDraft>(key: K, value: GameDraft[K]): void {
    this.draft.update((draft) => ({ ...draft, [key]: this.normalizeValue(key, value) }));
  }
  protected selectImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const existing = this.selectedImages();
    const next: SelectedImage[] = [...existing];
    for (const file of files) {
      const validationError = imageValidationError(file);
      if (validationError) {
        this.error.set(validationError);
        continue;
      }
      if (next.length >= 5) {
        this.error.set('Um jogo pode ter no máximo cinco imagens.');
        break;
      }
      next.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    this.selectedImages.set(next);
    input.value = '';
  }
  protected removeSelectedImage(index: number): void {
    this.selectedImages.update((images) => {
      const image = images[index];
      if (image) URL.revokeObjectURL(image.previewUrl);
      return images.filter((_, imageIndex) => imageIndex !== index);
    });
  }
  protected updatePrice(value: string): void {
    this.priceInReais.set(value);
    this.update('weeklyRentalPriceCents', centsFromReais(value));
  }
  protected formatPrice(): void {
    this.priceInReais.set(reaisFromCents(this.draft().weeklyRentalPriceCents));
  }
  protected updateSalePrice(value: string): void {
    this.salePriceInReais.set(value);
    this.update('salePriceCents', centsFromReais(value));
  }
  protected formatSalePrice(): void {
    this.salePriceInReais.set(reaisFromCents(this.draft().salePriceCents));
  }
  protected checkDuplicateName(): void {
    const name = this.draft().name.trim();
    if (!name) return;
    this.api.findGameByName(name).subscribe((game) => {
      if (!game || game.id === this.id) return;
      if (confirm(`Já existe um jogo chamado “${game.name}”. Deseja abri-lo?`))
        void this.router.navigate(['/jogos', game.slug]);
    });
  }
  protected async save(): Promise<void> {
    const draft = this.draft();
    if (!draft.name.trim() || !draft.slug.trim()) {
      this.error.set('Nome e slug são obrigatórios.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const tags = draft.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const body = environment.production
      ? {
          ...draft,
          tags,
          published: false,
          active: true,
          minimumAge: null,
          boxWidthMm: null,
          boxHeightMm: null,
          boxDepthMm: null,
          boxWeightGrams: null,
          availabilityForecastAt: null,
        }
      : {
          ...draft,
          id: this.id === 'novo' ? crypto.randomUUID() : this.id,
          tags: tags.map((name) => ({
            id: name.toLowerCase().replaceAll(/\W+/g, '-'),
            name,
            slug: name.toLowerCase().replaceAll(/\W+/g, '-'),
          })),
          images: [],
          art: 'forest',
        };
    const resource = environment.production
      ? `${environment.apiBaseUrl}/admin/games${this.id && this.id !== 'novo' ? `/${this.id}` : ''}`
      : `${environment.apiBaseUrl}/games${this.id && this.id !== 'novo' ? `/${this.id}` : ''}`;
    try {
      const saved = await firstValueFrom(
        this.id && this.id !== 'novo'
          ? this.http.put(resource, body)
          : this.http.post(resource, body),
      );
      if (environment.production) {
        const gameId = this.extractId(saved);
        if (gameId) await this.uploadImages(gameId);
      }
      void this.router.navigateByUrl('/');
    } catch {
      this.error.set('Não foi possível salvar o jogo. Tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }
  private load(games: readonly CatalogGame[]): void {
    const game = games.find((item) => item.id === this.id);
    if (game)
      this.draft.set({
        ...emptyDraft(),
        ...game,
        tags: game.tags.map((tag) => tag.name).join(', '),
      });
    if (game) this.priceInReais.set(reaisFromCents(game.weeklyRentalPriceCents));
    if (game) this.salePriceInReais.set(reaisFromCents(game.salePriceCents));
  }
  private normalizeValue<K extends keyof GameDraft>(key: K, value: GameDraft[K]): GameDraft[K] {
    if (key === 'slug') return normalizeSlug(String(value)) as GameDraft[K];
    if (key === 'name') return normalizeText(String(value), 200) as GameDraft[K];
    if (key === 'publisher') return normalizeText(String(value ?? ''), 120) as GameDraft[K];
    if (key === 'description') return normalizeText(String(value ?? ''), 10_000) as GameDraft[K];
    if (key === 'fullDescription')
      return normalizeText(String(value ?? ''), 10_000) as GameDraft[K];
    if (key === 'tags') return normalizeText(String(value), 1_200) as GameDraft[K];
    if (key === 'minPlayers' || key === 'maxPlayers')
      return normalizeInteger(value, 1, 100) as GameDraft[K];
    if (key === 'averageDurationMinutes') return normalizeInteger(value, 1, 1440) as GameDraft[K];
    if (key === 'weeklyRentalPriceCents')
      return normalizeInteger(value, 0, 10_000_000) as GameDraft[K];
    if (key === 'salePriceCents') return normalizeInteger(value, 0, 10_000_000) as GameDraft[K];
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
  private async uploadImages(gameId: string): Promise<void> {
    for (const image of this.selectedImages()) {
      const formData = new FormData();
      formData.append('file', image.file, image.file.name);
      await firstValueFrom(
        this.http.post(`${environment.apiBaseUrl}/admin/games/${gameId}/images`, formData),
      );
    }
  }
}
