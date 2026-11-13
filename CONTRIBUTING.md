# Guia de contribuição

## Preparação

Leia [README.md](README.md) para instalação e execução e [AGENTS.md](AGENTS.md)
para limites do produto, segurança e regras de implementação. As
[convenções Git](docs/git-conventions.md) definem branches e commits.
Essas regras se aplicam a pessoas e agentes, independentemente da ferramenta.

Confira a raiz, o estado do Git e as versões de Node.js, npm e Git antes de
trabalhar. Preserve alterações existentes e instale cada pacote com `npm ci`
usando seu próprio lockfile. Não compartilhe `node_modules` entre ambientes.

Escolha uma versão de Node que satisfaça os requisitos `engines` das ferramentas
fixadas nos lockfiles dos pacotes afetados. O frontend declara a versão de npm
em `packageManager`. Se uma ferramenta estiver ausente, registre a limitação;
não altere dependências ou scripts apenas para contornar o ambiente.

As ferramentas podem estar no sistema ou em um ambiente isolado, como um
container de desenvolvimento. Nesse caso, execute os comandos dentro desse ambiente.
Confirme o ambiente do processo do agente: abrir um terminal em um container não
move automaticamente processos já iniciados para ele. Não exija instalação global
se o ambiente isolado já fornecer as versões compatíveis.

O script `db:reset:local` usa `rm -rf`, que exige um shell compatível com POSIX.
Em outro shell, prefira os comandos de migration e seed documentados; caso seja
necessário apagar o estado local, revise o caminho e use o equivalente nativo
somente com autorização para a remoção. Esse reset não é pré-requisito da instalação.

## Fluxo de trabalho

1. Defina uma mudança coesa e abra uma branch conforme as convenções Git.
2. Leia apenas os módulos e contratos envolvidos. Backend e frontend são pacotes independentes.
3. Implemente sem ampliar o escopo do produto; acrescente testes proporcionais ao risco.
4. Execute as verificações do pacote afetado descritas no README.
5. Revise `git status`, `git diff` e, antes de um commit autorizado, `git diff --staged`.
6. Registre resultado, verificações executadas e pendências reais na entrega.

Para documentação, execute `git diff --check` e a checagem de formatação aplicável.
Para código, execute todas as verificações do pacote afetado. Comandos remotos,
deploys, migrations remotas e publicação Git exigem autorização explícita.

## Documentação duradoura

- README: preparação, execução e verificações reproduzíveis.
- AGENTS: instruções comuns para agentes, limites e segurança.
- CONTRIBUTING: fluxo de contribuição e continuidade.
- `docs/git-conventions.md`: nomes de branches e mensagens de commits.
- `docs/adr/`: contexto, decisões de arquitetura e consequências.

Mantenha instruções próximas de sua fonte de verdade. Consulte scripts em
`package.json`, dependências nos lockfiles, rotas no código e estrutura de dados
nas migrations; evite duplicar inventários que precisam de atualização a cada entrega.

Não inclua em guias permanentes status de sessões, listas de tarefas temporárias,
hashes de entregas, versões chamadas de “mais recentes”, caminhos de máquinas ou
resultados de testes antigos. Registre essas informações na entrega ou na issue.
Nunca registre credenciais, dados pessoais reais ou estado local de ferramentas.

Uma ADR documenta uma decisão, não uma promessa de implementação. Quando uma
decisão mudar, registre a nova decisão e relacione a anterior, sem apagar o contexto.
Ao retomar o desenvolvimento, confira o código e o histórico; não presuma que uma
descrição de arquitetura comprova que todos os seus requisitos foram implementados.
