import type { Context } from 'hono';

export function data(c: Context, value: unknown, status = 200) {
  return new Response(JSON.stringify({ data: value }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
}

export function paginated(
  c: Context,
  value: unknown,
  page: number,
  pageSize: number,
  totalItems: number,
) {
  return new Response(
    JSON.stringify({
      data: value,
      pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
    }),
    { headers: { 'Content-Type': 'application/json; charset=UTF-8' } },
  );
}
