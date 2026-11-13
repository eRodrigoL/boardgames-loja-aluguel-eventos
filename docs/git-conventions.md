# Convenções Git — branches e commits

Referência para desenvolvedores e agentes. `main` é a branch de integração e deve
permanecer estável. Não crie `develop`, `release/` ou `hotfix/` sem uma estratégia
que justifique seu uso.

## Branches

Use `<tipo>/<descricao-curta>` ou `<tipo>/<id>-<descricao-curta>` quando existir
uma issue ou ticket real. Escreva a descrição em português, sem acentos, com letras
minúsculas e palavras separadas por hífen (`kebab-case`). Descreva a entrega, não
o autor ou o período. Cada branch representa uma mudança coesa e de curta duração.

```text
feat/filtro-por-categoria
fix/validacao-jogadores
docs/configuracao-local
feat/123-filtro-acervo
```

Evite nomes vagos como `ajustes`, `minha-branch`, `feat/coisas` e `feat/versao-final`.
A convenção orienta novas branches; renomear branches existentes exige avaliar as
referências e o uso por colaboradores.

## Mensagens de commit

Use Conventional Commits, com tipo no início e emoji depois dos dois-pontos:

```text
<tipo>(<escopo opcional>)<! opcional>: <emoji> <resumo>

<corpo opcional>

<rodapé opcional>
```

- Escreva em português do Brasil, com verbo no presente do indicativo.
- Mantenha o resumo curto, específico e sem ponto final.
- Use escopo apenas quando acrescentar contexto; prefira nomes curtos e consistentes,
  como `api`, `frontend`, `acervo`, `eventos`, `auth`, `media`, `deps` e `config`.
- Inclua corpo quando explicar motivação, detalhes ou consequências além do resumo;
  prefira tópicos e omita conteúdo redundante.
- Use rodapés apenas quando necessários. Não invente issues ou quebras de compatibilidade.

Exemplo:

```text
feat(acervo): ✨ adiciona filtro por categoria

- filtra os jogos pela categoria selecionada
- mantém a paginação do catálogo
```

Não coloque o emoji antes do tipo, como em `✨ feat(acervo): adiciona filtro`.

## Tipos e emojis

| Tipo       | Emoji | Uso                                 |
| ---------- | ----- | ----------------------------------- |
| `feat`     | ✨    | Nova funcionalidade                 |
| `fix`      | 🐛    | Correção de bug                     |
| `docs`     | 📝    | Documentação                        |
| `style`    | 🎨    | Formatação sem alteração de lógica  |
| `refactor` | ♻️    | Refatoração                         |
| `perf`     | 🚀    | Performance                         |
| `test`     | 🚨    | Testes                              |
| `build`    | 📦    | Build, dependências e empacotamento |
| `ci`       | 👷    | CI/CD                               |
| `chore`    | 🔧    | Manutenção                          |
| `revert`   | ⏪    | Reversão                            |

Não crie um tipo `init`. Para iniciar um projeto, use um destes formatos:

```text
chore(init): 🎉 inicia a estrutura do projeto
feat(app): 🎉 adiciona a versão inicial da aplicação
```

Use `chore` para a estrutura e `feat` quando já houver uma aplicação funcional.
A configuração de ferramentas de build pode usar
`build: 📦 configura a base do backend`.

## Quebras de compatibilidade

Use `!` após o tipo ou escopo quando houver quebra de compatibilidade. Detalhe as
consequências no rodapé `BREAKING CHANGE:` quando necessário:

```text
feat(api)!: ✨ altera o contrato de imagens dos jogos

BREAKING CHANGE: substitui o campo image por images
```

## Atomicidade e ordem

Cada commit representa uma única mudança lógica e deve deixar o projeto funcional
e coerente. Não misture alterações independentes nem prepare conscientemente um
commit quebrado ou dependente de uma implementação futura. Uma exceção precisa
ser explicitamente justificada.

Organize dependências em ordem executável: implemente primeiro um endpoint e,
depois, sua integração na interface. Alterações inseparáveis para manter o projeto
funcional devem ficar no mesmo commit ou ser reorganizadas em unidades válidas.
Reescrever mensagens antigas não comprova que cada revisão histórica passa nos testes.

## Fluxo e revisão

Com a árvore de trabalho revisada e sem alterações que possam ser sobrescritas:

```sh
git switch main
git pull --ff-only
git switch -c feat/filtro-acervo
```

Antes de um commit autorizado:

```sh
git status
git diff
git add <arquivos-relacionados>
git diff --staged
git commit
```

Prefira staging seletivo; evite `git add .` quando houver alterações independentes.
Confira mudança coesa, dependências já implementadas, mensagem conforme o padrão,
ausência de segredos e verificações pertinentes concluídas. Consulte
[CONTRIBUTING.md](../CONTRIBUTING.md) para preparação e verificações.

Quando a publicação estiver autorizada:

```sh
git push -u origin feat/filtro-acervo
```

## Segurança e agentes

As convenções não autorizam ações Git. Não execute `commit`, `push`, `merge`,
`rebase`, `reset`, `clean`, exclusão forçada de branches ou publicação forçada sem
pedido explícito. Preserve alterações pré-existentes e não inclua arquivos alheios
à tarefa. Pergunte apenas diante de ambiguidade relevante ou risco não autorizado;
não interrompa por decisões triviais nem solicite novamente uma autorização já dada.

Para uma reescrita autorizada de histórico:

1. Confira branches e tags locais e remotas, além de alterações de trabalho.
2. Crie e verifique um backup recuperável antes de mover referências.
3. Em correções de mensagens, preserve conteúdo, autoria, datas e topologia.
4. Verifique cada árvore e o mapeamento dos commits anteriores para os novos.
5. Publique apenas as referências autorizadas, com `--force-with-lease` vinculado
   ao hash remoto conferido. Se o remoto mudar, interrompa e reavalie.
6. Confira o resultado remoto e informe a localização do backup e a necessidade
   de reconciliar clones existentes.

Reescrever mensagens muda os hashes dos commits e de seus descendentes; assinaturas
criptográficas não podem ser preservadas como válidas após a alteração. Avalie
commits assinados, tags anotadas e referências de revisão antes de reescrever.
Não apague branches ou tags para simplificar a operação.
