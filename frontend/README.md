# Frontend

Aplicação Angular para navegar pelo catálogo, eventos, contatos e áreas administrativas do projeto. O código do frontend vive em um pacote npm independente dentro de `frontend/`.

## Pré-requisitos e instalação

Tenha Node.js e npm compatíveis com `package.json`. A partir de `frontend/`:

```sh
npm ci
```

Os exemplos usam uma sintaxe de shell comum; use o equivalente no seu terminal. Não é necessário instalar Angular CLI ou outras ferramentas globalmente.

## Desenvolvimento local

```sh
npm run dev
```

O comando prepara os dados de desenvolvimento, inicia o Angular em `http://localhost:4200` e a API simulada em `http://localhost:3000`.

Os dados iniciais estão em `src/data/db.seed.json`. Antes de iniciar os processos, eles são copiados para `.local/db.json`; uploads de marca são armazenados em `.local/uploads/`. Esses arquivos são locais, descartáveis e ignorados pelo Git.

## Dados e sessões locais

O modo de desenvolvimento usa uma simulação de sessão no navegador para validar a interface, incluindo favoritos e carrinho. Esse estado pode usar `localStorage` e não substitui autenticação ou autorização de servidor.

O carrinho organiza itens para contato; não realiza pagamento nem cria reserva on-line.

## Integração e produção

O ambiente de produção usa `/api`, pressupondo que o frontend e o Worker sejam servidos no mesmo domínio. Se a API estiver em outro domínio, configure a URL HTTPS correspondente em `src/environments/environment.production.ts` e permita essa origem no Worker.

A administração em produção depende de Cloudflare Access e da validação no Worker. Controles da interface não são uma fronteira de segurança.

## Verificação

```sh
npm run format:check
npm run typecheck
npm test
npm run build
```
