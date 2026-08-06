export const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const maximumImageBytes = 8 * 1024 * 1024;

export function normalizeSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
    .replace(/-+$/g, '');
}

export function normalizeText(value: string, maximumLength: number): string {
  return Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .slice(0, maximumLength);
}

export function normalizeInteger(value: unknown, minimum: number, maximum: number): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(Math.max(Math.trunc(number), minimum), maximum);
}

export function centsFromReais(value: string): number | null {
  const normalized = value.trim().replace(/^R\$\s?/, '');
  if (!normalized) return null;
  const decimal = normalized.includes(',')
    ? normalized.replaceAll('.', '').replace(',', '.')
    : normalized;
  const parsed = Number(decimal);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.min(Math.round(parsed * 100), 10_000_000);
}

export function reaisFromCents(value: number | null): string {
  if (value === null) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function imageValidationError(file: File): string | null {
  if (!allowedImageTypes.has(file.type)) return 'Envie somente imagens JPEG, PNG ou WebP.';
  if (file.size === 0 || file.size > maximumImageBytes)
    return 'Cada imagem deve ter no máximo 8 MB.';
  return null;
}
