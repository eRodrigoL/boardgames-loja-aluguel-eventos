# Guia para agentes

Estas regras se aplicam a qualquer agente e sistema operacional.

- Preserve alterações existentes e trabalhe no menor conjunto de arquivos necessário.
- Antes de alterar, confira `git status --short`, os scripts do pacote afetado e os arquivos relevantes.
- O backend fica na raiz; o frontend, quando existir, fica em `frontend/` e só deve ser alterado mediante solicitação explícita.
- Use dependências locais e npm; não altere configurações globais, não instale ferramentas globalmente e não registre segredos.
- Não execute deploy, migration remota, criação de recursos Cloudflare, commit ou push sem autorização explícita.
- Valide entradas externas, use SQL parametrizado, mantenha datas UTC e não exponha segredos, stack traces ou detalhes internos.
- Para mudanças de código, execute testes e verificações adequados; para documentação, execute ao menos a verificação de formatação e `git diff --check`.
