# Catálogo de jogos e eventos

API para divulgação de jogos de tabuleiro disponíveis para aluguel presencial e eventos.

## Desenvolvimento

O projeto usa TypeScript, Cloudflare Workers, Hono, D1, R2, Drizzle, Vitest, ESLint, Prettier e npm. Use uma versão de Node.js compatível com `package.json`; os exemplos usam sintaxe de shell comum e podem ser adaptados ao terminal local.

```sh
npm ci
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

O Worker local disponibiliza `GET /api/health`. Migrations remotas, deploy e recursos Cloudflare reais devem ser configurados e executados deliberadamente, fora de dados versionados.

## Verificação

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Não versione segredos, arquivos de ambiente, credenciais ou estados locais de ferramentas.
