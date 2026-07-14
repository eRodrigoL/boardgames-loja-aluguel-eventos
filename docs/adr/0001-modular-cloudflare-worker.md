# ADR 0001: monólito modular em Cloudflare Workers

## Contexto

O volume inicial é baixo e o domínio possui quatro áreas coesas: jogos, eventos, mídia e configuração pública.

## Decisão

O backend é um único Cloudflare Worker TypeScript, organizado por módulos. Hono trata HTTP, D1 persiste dados relacionais e R2 armazena objetos de mídia.

## Consequências

Evita a complexidade operacional de microsserviços e servidores persistentes. As dependências de infraestrutura ficam nas camadas de infraestrutura; rotas não consultam D1/R2 diretamente.
