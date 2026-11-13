# Guia para agentes

Estas regras são portáveis: aplicam-se a qualquer agente e sistema operacional. Siga-as antes de alterar arquivos. Instruções explícitas do usuário têm prioridade; não relaxam segurança, segredos ou ações remotas sem autorização clara.

## Documentação e convenções

- Leia [CONTRIBUTING.md](CONTRIBUTING.md) para o fluxo de contribuição e continuidade.
- Siga [docs/git-conventions.md](docs/git-conventions.md) para branches e commits.
- Mantenha guias permanentes livres de status de sessões, tarefas temporárias e caminhos de máquinas.

## Contexto e limites

- Produto: catálogo público e administração de aluguel presencial de jogos de tabuleiro e eventos.
- Não implementar por antecipação pagamentos, cobrança, checkout, reserva on-line, contratos, clientes, cupons, notificações, financeiro, múltiplas lojas ou logística.
- Backend: raiz do repositório. Frontend Angular: `frontend/`. Não altere o frontend sem pedido explícito.
- Stack do backend: TypeScript estrito, Cloudflare Workers, Hono, D1, R2, Drizzle, Zod, JOSE, Vitest, ESLint, Prettier e npm. Não introduzir Express, NestJS, Firebase, Supabase, servidor Node persistente ou dependência exclusiva de Node sem confirmar suporte a Workers.
- Arquitetura: monólito modular. Módulos em `src/modules`; infraestrutura compartilhada em `src/shared`. Prefira funções pequenas e dependências explícitas; evite abstrações, interfaces, classes-base, repositórios genéricos e camadas que apenas repassam chamadas.

## Início de toda tarefa

1. Localize a raiz com Git e confira mudanças existentes:

   ```sh
   git rev-parse --show-toplevel
   git status --short
   ```

2. Identifique o ambiente e as ferramentas sem pressupor WSL, Linux, macOS ou Windows:

   ```sh
   node --version
   npm --version
   git --version
   ```

   Em PowerShell, use os equivalentes nativos quando necessário. Nunca codifique caminhos absolutos, UNC, letras de unidade, `.exe`, `.bat` ou comandos de um shell específico em arquivos do projeto.

3. Leia somente os arquivos necessários à tarefa, começando por `package.json` do pacote afetado e usando `rg`/`rg --files`. Não carregue o repositório inteiro nem repita inspeções já suficientes.

4. Trabalhe no menor conjunto coerente de arquivos. Preserve mudanças existentes, inclusive não rastreadas. Não faça commit, push, rebase, reset, clean ou descarte alterações sem pedido explícito.

## Pacotes e comandos

Há dois pacotes npm independentes:

| Área                   | Diretório   | Desenvolvimento | Verificações principais                                                                  |
| ---------------------- | ----------- | --------------- | ---------------------------------------------------------------------------------------- |
| Worker/API             | raiz        | `npm run dev`   | `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build` |
| Frontend Angular local | `frontend/` | `npm run dev`   | `npm run format:check && npm run typecheck && npm test && npm run build`                 |

- Execute comandos no diretório do pacote correspondente. Confira os scripts atuais antes de sugerir ou rodar um comando não listado.
- Em `frontend/`, `npm run dev` prepara o JSON Server local e inicia a API de desenvolvimento em `:3000` e o Angular em `:4200`.
- `npm run dev` na raiz inicia o Worker local (normalmente em `:8787`); a rota de saúde é `/api/health`, não `/`.
- Use npm e dependências locais. Não use `sudo`, instalações globais, alterações de sistema, nem configuração global de Node/npm/Git.
- Antes de `npm install`, confira `package.json` e o gerenciador definido. Mantenha `package-lock.json`; não introduza outro lockfile.
- Prefira comandos reproduzíveis dos scripts. Se um script depender de recursos de um sistema operacional, explique a limitação antes de adaptá-lo; não altere o script só para acomodar a máquina atual.

## Regras de implementação

- TypeScript estrito; não use `any` salvo em uma fronteira externa inevitável, validando e convertendo imediatamente.
- Toda entrada externa é não confiável: valide corpo, rota, query, upload, variáveis de ambiente, JWT e retornos de integrações quando aplicável.
- Use UTC, UUIDs/opacos para IDs expostos, slugs únicos para URLs públicas, SQL parametrizado e códigos de erro estáveis em inglês. Não exponha stack trace, SQL, bindings, tokens, segredos, caminhos locais ou erros brutos.
- Contratos HTTP: sucesso em `{ "data": ... }`; coleções paginadas incluem `pagination`; falhas usam `{ "error": { "code", "message", "details" } }`.
- Handlers não acessam D1 diretamente; regras de domínio não dependem de Hono; acesso a R2 fica no módulo de mídia.
- Não armazene binários/Base64 no D1. Imagens de jogos: JPEG/PNG/WebP, máximo de 8 MB configurável, até cinco por jogo; a primeira é a capa. Upload/R2 e D1 não são uma transação: implemente compensação e não apague metadados se a remoção de R2 falhar.
- Dados públicos de exemplo nunca contêm informações pessoais ou segredos reais.

## Domínio essencial

- Jogo: `name` obrigatório e `slug` único; quando omitido, a API o gera a partir dos dados da edição. Valores monetários em centavos, peso em gramas e dimensões em milímetros; mínimo de jogadores positivo; máximo não menor que mínimo. Estados: `available`, `rented`, `reserved`, `maintenance`, `unavailable`.
- Jogo público precisa ser publicado, ativo e ter ao menos uma imagem. Exclusão administrativa é soft delete; exclusão física requer pedido explícito.
- Tags são únicas após normalização; desfazer associação não remove tag compartilhada.
- Evento: título, slug, descrição e início obrigatórios; término não antecede início; datas em UTC. Somente ativos/publicados são públicos; exclusão padrão é lógica.
- Configuração pública centraliza contato e informações do site; nunca inclui segredos.

## Dados, segurança e operações externas

- Mudança estrutural de D1 exige migration SQL nova e versionada. Nunca edite migration possivelmente aplicada.
- Migrations, seed, fixtures e configuração de produção são separados. Não inclua dados fictícios em migrations de produção.
- Nunca execute migration remota, deploy, criação/alteração de recurso Cloudflare, nem altere/apague dados remotos sem autorização explícita.
- Endpoints administrativos exigem JWT Cloudflare Access validado por assinatura/JWKS, emissor, audiência, expiração, algoritmo e claims necessários. Não confie em header presente, e-mail isolado, frontend ou CORS.
- CORS é restrito a origens configuradas; nunca use origem curinga nos endpoints administrativos. CORS não é autenticação.
- Não versione `.env`, `.dev.vars`, tokens, chaves, cookies, credenciais, dumps reais ou estado local de ferramentas.

## Dependências, documentação e testes

- Antes de adicionar dependência de produção, justifique necessidade, compatibilidade com Workers, impacto de bundle e manutenção. Consulte documentação primária atual apenas quando houver dúvida relevante.
- Crie/atualize testes proporcionais ao risco. Não remova, ignore ou enfraqueça testes para obter aprovação. Testes não dependem de serviços remotos.
- Execute apenas verificações pertinentes e existentes após a mudança. Para alterações de código, rode o conjunto de verificações do pacote afetado; para alteração apenas documental, rode pelo menos `git diff --check` e a checagem de formatação aplicável.
- Atualize README ou ADR somente se a mudança alterar uso, arquitetura ou decisão duradoura. Não declare comando como executado sem tê-lo rodado.

## Economia de contexto e de tokens

- Faça perguntas apenas quando uma escolha ausente mudar materialmente o resultado ou envolver risco; em ambiguidade segura, escolha a opção simples e reversível e registre a suposição.
- Use buscas específicas (`rg`) e leia trechos, não arquivos irrelevantes. Não replique no chat conteúdo que o usuário já forneceu ou logs extensos sem necessidade.
- Não faça reformatação ampla, refatoração não relacionada ou varreduras integrais apenas por hábito.
- Valide com a menor suíte que cobre a mudança; amplie para a suíte completa quando o risco, as instruções ou uma falha o justificarem.
- Ao relatar, priorize resultado, arquivos alterados, verificações executadas e pendências reais. Seja conciso, mas nunca omita uma limitação, falha ou ação não executada.

## Conclusão

Antes de encerrar, revise o diff e execute:

```sh
git diff --check
git diff -- <arquivos alterados>
```

O relatório final deve informar: o que mudou; arquivos relevantes; comandos realmente executados e seus resultados; dependências/migrations/endpoints adicionados, se houver; e limitações ou ações manuais pendentes. Não faça commit nem deploy salvo solicitação explícita.
