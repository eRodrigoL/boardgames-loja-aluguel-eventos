# ADR 0003: administração via Cloudflare Access

## Decisão

Todas as rotas `/api/admin` exigem Bearer JWT do Cloudflare Access. A aplicação verifica assinatura pela JWKS, emissor, audiência, expiração e apenas os algoritmos RS256/ES256.

## Consequências

Não há contas ou senhas próprias nesta versão. A equipe precisa configurar uma aplicação Access e fornecer emissor, audiência e URL JWKS ao Worker.
