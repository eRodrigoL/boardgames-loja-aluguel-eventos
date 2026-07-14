# ADR 0002: mídia no R2 e remoção lógica

## Decisão

Arquivos são guardados no R2 sob chaves UUID internas, enquanto D1 mantém somente metadados. Jogos e eventos usam remoção lógica para preservar rastreabilidade.

## Consequências

D1 e R2 não formam uma transação distribuída. Uploads compensam uma falha de inserção no D1 removendo o objeto recém-enviado. Remoções só eliminam metadados após remover o objeto; falhas de R2 deixam o metadado intacto e retornam erro recuperável.
