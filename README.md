# Catálogo de jogos e eventos

Aplicação para divulgar e administrar aluguel presencial de jogos de tabuleiro e eventos. O projeto inclui uma API em Cloudflare Workers e um frontend Angular separado. Pagamentos, checkout, reserva on-line e processamento financeiro não fazem parte do escopo atual.

## Arquitetura

- **API:** TypeScript, Cloudflare Workers, Hono, D1, R2, Drizzle, Zod e JOSE.
- **Frontend:** Angular em [`frontend/`](frontend/).
- **Estrutura:** monólito modular em `src/modules`; componentes compartilhados em `src/shared`; migrations em `migrations/`; testes em `tests/`.
- **Dados:** valores monetários em centavos, dimensões em milímetros, peso em gramas e datas UTC. O D1 guarda metadados; imagens ficam no R2.

## Pré-requisitos

- Node.js e npm compatíveis com os `package.json` do repositório;
- Git;
- uma conta Cloudflare apenas para configurar ou implantar recursos remotos.

Os exemplos abaixo usam uma sintaxe de shell comum. Use o equivalente no seu terminal e sistema operacional. Não há caminhos absolutos, configurações globais ou dependências instaladas globalmente.

## Instalação

Clone o repositório e, na raiz, instale as dependências do Worker:

```sh
npm ci
```

Para trabalhar também no frontend, instale o segundo pacote:

```sh
cd frontend
npm ci
```

`npm install` é apropriado quando a intenção for atualizar o lockfile; para uma instalação reprodutível, prefira `npm ci`.

## Desenvolvimento local

### Worker e D1 local

Na raiz do repositório:

```sh
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

O Worker costuma iniciar em `http://localhost:8787`; verifique-o em `GET /api/health`. Os comandos de migration e seed acima atuam somente no estado local do Wrangler. Para testar autenticação administrativa, crie um `.dev.vars` local a partir de `.dev.vars.example` e informe valores válidos do Cloudflare Access. Esse arquivo nunca deve ser versionado.

### Frontend com API simulada

Em outro terminal, dentro de `frontend/`:

```sh
npm run dev
```

Esse modo inicia o Angular em `http://localhost:4200` e uma API simulada em `http://localhost:3000`. Os dados da simulação vêm de `frontend/src/data/db.seed.json`; os arquivos temporários ficam em `frontend/.local/` e são recriados a cada inicialização.

O frontend de desenvolvimento usa a API simulada. Para integrar a interface ao Worker local, ajuste a configuração de ambiente do frontend de forma deliberada; ela não é alterada automaticamente.

## API e segurança

As rotas públicas ficam sob `/api`, incluindo saúde, catálogo, eventos, configuração pública e mídia. Rotas administrativas exigem um JWT Cloudflare Access válido. As respostas usam `{ "data": ... }`; erros têm um `error.code` estável.

CORS é limitado por `PUBLIC_ORIGINS`. Configure, fora do Git, emissor, audiência e JWKS do Access. Não use segredos, IDs de recursos reais ou origens de produção nos arquivos versionados.

## Verificação

Na raiz, para a API:

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

No diretório `frontend/`, para a interface:

```sh
npm run format:check
npm run typecheck
npm test
npm run build
```

## Produção

Antes de qualquer deploy, crie e associe manualmente os recursos D1 e R2, configure Cloudflare Access e atualize bindings/origens com valores do ambiente de destino. Migrations remotas e deploy são ações deliberadas: revise a configuração e execute-as somente com autorização apropriada.

Não versione `.dev.vars`, `.env`, tokens, credenciais, estados locais do Wrangler ou dados reais.
