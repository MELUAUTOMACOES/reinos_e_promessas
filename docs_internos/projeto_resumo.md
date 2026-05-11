# Reinos & Promessas — Escopo do Projeto e Rules para Agente

Este documento serve como contexto oficial para continuar o desenvolvimento do projeto em uma nova plataforma de IA/código.

O foco atual é construir um **MVP jogável local** para validar regras internas, lógica de jogo e equilíbrio, antes de investir em multiplayer, login, backend, visual final ou mobile completo.

---

# 1. Resumo do projeto

**Nome do projeto:** Reinos & Promessas

**Tipo:** jogo online/web de estratégia territorial inspirado em War, ambientado no Antigo Testamento.

**Tema:** conquista de territórios, administração de recursos, fé/estabilidade dos territórios, cartas bíblicas, eventos, quizzes bíblicos e objetivos secretos.

**Objetivo do MVP atual:** validar se a lógica do jogo funciona e é divertida.

**Não é objetivo atual:** criar produto final, multiplayer real, login, sala online, ranking, mobile completo ou visual definitivo.

---

# 2. Visão do jogo

Reinos & Promessas é um jogo de estratégia territorial onde 2 a 6 jogadores constroem seu próprio reino/facção no mundo geográfico do Antigo Testamento.

Os jogadores disputam territórios, administram recursos, fortalecem cidades, cuidam da fé dos lugares conquistados, usam cartas de personagens bíblicos, enfrentam eventos globais, respondem quizzes bíblicos e tentam vencer por objetivo secreto ou por legado + domínio territorial.

A proposta é unir:

* estratégia territorial estilo War;
* administração de recursos;
* cartas e efeitos temporários;
* conhecimento bíblico com quiz;
* mapa geográfico inspirado no Antigo Testamento;
* bots para jogar localmente contra o usuário.

---

# 3. Estado atual do desenvolvimento

Já foram enviados e executados prompts até a etapa 5.

## Etapas já solicitadas anteriormente

### Prompt 1 — Setup do projeto + arquitetura

Criar base do projeto com:

* React;
* Vite;
* TypeScript;
* Tailwind CSS;
* estado local com Zustand ou useReducer;
* localStorage;
* separação entre lógica do jogo e interface.

Estrutura desejada:

```txt
src/
  game-core/
  game-data/
  components/
  pages/
  store/
  types/
```

Ou, se monorepo for simples de manter:

```txt
apps/
  web/
packages/
  game-core/
  game-data/
```

### Prompt 2 — Modelagem dos tipos e dados base

Criar tipos e dados estáticos do jogo:

* GameState;
* Player;
* Territory;
* Region;
* ResourceState;
* Card;
* Objective;
* StartingPack;
* GameMode;
* TurnState;
* ActionType;
* TerritoryState;
* BotDifficulty.

Cadastrar os 24 territórios, regiões, conexões e pacotes iniciais.

### Prompt 3 — Engine inicial da partida

Criar funções puras do game-core para:

* criar nova partida;
* iniciar turno;
* finalizar turno;
* aplicar produção;
* calcular estado de fé;
* calcular limite de tropas;
* atualizar estado do território.

### Prompt 4 — Tela de configuração e mapa simples jogável

Criar:

* tela inicial;
* tela de configuração da partida;
* tela do jogo;
* mapa clicável simples;
* painel de jogador atual;
* recursos;
* ações restantes;
* botão passar turno;
* histórico.

### Prompt 5 — Ações básicas

Implementar:

* recrutar tropas;
* mover tropas;
* fortalecer fé;
* descartar carta;
* passar turno.

---

# 4. Stack desejada

## Stack do MVP atual

Usar:

* TypeScript;
* React;
* Vite;
* Tailwind CSS;
* Zustand ou useReducer;
* localStorage;
* lógica do jogo em arquivos TypeScript puros.

## O que NÃO usar agora

Não implementar agora:

* backend;
* banco de dados;
* login;
* Google OAuth;
* multiplayer real;
* WebSocket;
* Socket.IO;
* ranking;
* amigos;
* convites;
* sala online;
* chat;
* mobile completo;
* Expo agora;
* autenticação;
* pagamentos;
* deploy complexo.

## Arquitetura obrigatória

A lógica do jogo deve ficar separada da UI.

### game-core

Deve conter regras puras do jogo, sem React:

* produção;
* turno;
* combate;
* movimento;
* influência;
* fé;
* cartas;
* bots;
* objetivos;
* vitória;
* exílio.

### game-data

Deve conter dados estáticos:

* territórios;
* regiões;
* conexões;
* pacotes iniciais;
* cartas;
* objetivos secretos;
* perguntas bíblicas;
* eventos globais.

### UI

Deve apenas renderizar dados e chamar ações da engine/store.

Componentes React não devem conter regra de jogo complexa.

---

# 5. Escopo atual do MVP jogável

O MVP deve permitir jogar uma partida local no navegador com:

* 2 a 6 jogadores;
* jogadores humanos e/ou bots;
* mapa clicável;
* turnos;
* 3 ações por turno;
* produção por território;
* tropas;
* recursos;
* fé/estabilidade;
* movimento;
* recrutamento;
* fortalecimento de fé;
* descarte de cartas;
* combate;
* influência;
* cartas básicas;
* objetivos secretos;
* vitória;
* exílio;
* localStorage para continuar partida.

## Objetivo principal do MVP

Testar se as regras internas são divertidas e equilibradas.

O visual pode ser funcional. Não precisa ser o visual final.

---

# 6. Telas do MVP

## 6.1 Tela inicial

Deve ter:

* nome do jogo: Reinos & Promessas;
* frase curta explicando a proposta;
* botão “Nova Partida”;
* botão “Continuar Partida” se houver jogo salvo no localStorage.

Pode ter uma animação simples feita com elementos HTML/CSS, mas não deve depender de imagens.

## 6.2 Tela de configuração da partida

Deve permitir escolher:

* modo de partida: rápido ou padrão;
* número de jogadores: 2 a 6;
* nome dos jogadores;
* tipo de jogador: humano ou bot;
* dificuldade do bot: fácil, médio ou difícil;
* iniciar partida.

Para o MVP, pacotes iniciais podem ser atribuídos automaticamente, respeitando os pacotes aprovados.

## 6.3 Tela do jogo

Deve mostrar:

* mapa com 24 territórios;
* dono de cada território por cor;
* tropas de cada território;
* fé atual;
* estado do território;
* jogador atual;
* rodada atual;
* ações restantes;
* recursos do jogador atual;
* cartas na mão;
* mercado de cartas futuramente;
* objetivo secreto do jogador atual;
* histórico de ações;
* botão passar turno.

## 6.4 Modais/painéis necessários

* Detalhes do território;
* Recrutar;
* Mover;
* Fortalecer fé;
* Combate;
* Influência;
* Comprar carta;
* Descartar carta;
* Usar carta;
* Quiz;
* Fim de jogo.

---

# 7. Regras principais do jogo

## 7.1 Jogadores

* 2 a 6 jogadores.
* Podem ser humanos ou bots.
* No MVP, todos jogam localmente no mesmo navegador.

## 7.2 Modos de partida

### Modo rápido

* Vitória secundária exige 100 pontos de legado + controle territorial mínimo.

### Modo padrão

* Vitória secundária exige 150 pontos de legado + controle territorial mínimo.

## 7.3 Setup inicial

Cada jogador começa com:

* 8 tropas;
* 4 provisões;
* 3 ouro;
* 2 influência;
* 0 legado;
* 1 carta inicial, quando cartas estiverem implementadas;
* 1 objetivo secreto;
* 2 territórios iniciais próximos, mas separados.

Ao escolher o pacote inicial:

* os territórios passam a ser do jogador;
* as tropas neutras desses territórios são removidas;
* o jogador distribui 8 tropas entre os dois territórios;
* no MVP, pode distribuir automaticamente 4 e 4;
* mínimo futuro: 2 tropas em cada território inicial.

## 7.4 Turno

Cada jogador tem 3 ações por turno.

### Início do turno

1. Aplicar produção dos territórios.
2. Aplicar efeitos temporários.
3. Aplicar melhorias.
4. Atualizar estados pendentes.

### Durante o turno

O jogador pode executar até 3 ações.

### Fim do turno

1. Validar missões.
2. Validar vitória.
3. Reduzir duração de cartas/personagens ativos.
4. Encerrar estados temporários quando aplicável.
5. Passar para o próximo jogador.

---

# 8. Ações do jogador

Ações previstas:

1. Recrutar tropas;
2. Mover tropas;
3. Atacar/conquistar;
4. Tentar domínio por influência;
5. Construir melhoria;
6. Comprar carta;
7. Descartar carta;
8. Usar carta;
9. Fortalecer fé/estabilidade;
10. Trocar recursos futuramente;
11. Cumprir missão;
12. Passar turno.

No MVP atual, as ações iniciais já solicitadas foram:

* recrutar;
* mover;
* fortalecer fé;
* descartar carta;
* passar turno.

Próximas ações a implementar:

* combate;
* influência;
* cartas;
* objetivos/vitória;
* bots;
* quiz.

---

# 9. Recursos

## 9.1 Provisão

Usada para:

* recrutar tropas;
* sustentar campanhas;
* atravessar desertos;
* pagar algumas cartas/melhorias.

Limite inicial: 12.

## 9.2 Ouro

Recurso raro.

Usado para:

* construir melhorias;
* comprar cartas;
* apoiar influência;
* trocas futuras.

Limite inicial: 10.

Ouro não deve substituir influência.

Em teste de influência:

* cada 2 ouro = +1 no teste;
* limite máximo de bônus por ouro: +2.

## 9.3 Influência

Usada para:

* domínio sem guerra;
* resistência contra influência;
* cartas;
* diplomacia futura.

Limite inicial: 8.

## 9.4 Tropas

Ficam nos territórios.

Usadas para atacar e defender.

## 9.5 Fé/estabilidade

Cada território tem fé de 0 a 100.

Faixas:

* 0–19: rebelde;
* 20–39: fraco;
* 40–59: estável;
* 60–79: forte;
* 80–100: fiel/protegido.

---

# 10. Fé e território rebelde

## 10.1 Fortalecer fé

Ação: Fortalecer fé.

O jogador escolhe um território controlado.

### Opção segura

* +10 fé;
* se o território tiver fé difícil: +5.

### Opção com quiz

* quiz de 20 segundos;
* 3 alternativas;
* preferencialmente relacionado ao território/região/personagem/evento;
* se acertar: +15 fé;
* se território tiver fé difícil: +10;
* se errar ou não responder: -5 fé.

## 10.2 Território rebelde

Um território fica rebelde com fé entre 0 e 19.

Efeitos:

* -2 defesa;
* produz metade ou 0 conforme regra/evento;
* +2 vulnerabilidade contra influência inimiga;
* não pode receber nova melhoria;
* se sofrer sucesso de influência inimiga enquanto rebelde, pode mudar de dono como ocupado/instável.

Para sair do estado rebelde, precisa chegar a 40 fé ou mais.

---

# 11. Movimento

## Movimento normal

* só pode mover tropas entre territórios conectados;
* ambos devem pertencer ao jogador;
* território de origem deve ficar com pelo menos 1 tropa;
* custa 1 ação.

## Estrada/Rota futuramente

Com melhoria Estrada/Rota:

* pode mover por cadeia de territórios próprios conectados;
* o caminho inteiro precisa pertencer ao jogador;
* custa 1 ação.

No MVP inicial, pode deixar Estrada/Rota para depois.

---

# 12. Recrutamento

Ação: Recrutar tropas.

* custa 1 provisão;
* adiciona 2 tropas em um território controlado;
* se tiver Quartel futuramente, adiciona 3;
* respeita limite de tropas do território;
* custa 1 ação.

Limites de tropas:

* comum: 6;
* estratégico: 8;
* sagrado/histórico: 10;
* capital/império: 12.

---

# 13. Combate

Implementar como próxima grande etapa.

## Regras

O atacante pode atacar território vizinho se:

* o território de origem pertence ao atacante;
* o território alvo não pertence ao atacante;
* a origem tem mais de 1 tropa;
* o atacante deixa pelo menos 1 tropa na origem.

## Cálculo

Atacante:

```txt
tropas usadas + bônus + dado d6
```

Defensor:

```txt
tropas defensoras + defesa natural + bônus de fé + bônus defensivo base + dado d6
```

O defensor sempre recebe +1 defesa base.

Empate favorece o defensor.

## Bônus de fé na defesa

* Rebelde: -2;
* Fraco: -1;
* Estável: 0;
* Forte: +1;
* Fiel/Protegido: +2.

## Tabela de perdas

|   Diferença | Resultado          | Perdas                   |
| ----------: | ------------------ | ------------------------ |
| 0 ou empate | defensor segura    | atacante -2, defensor -1 |
|         1–2 | vitória apertada   | vencedor -1, perdedor -2 |
|         3–5 | vitória clara      | vencedor -1, perdedor -3 |
|          6+ | vitória esmagadora | vencedor -0, perdedor -4 |

O território só muda de dono quando as tropas defensoras chegam a 0.

## Conquista

Ao conquistar:

* território passa para o atacante;
* fica ocupado/instável por 1 rodada;
* produz metade enquanto instável;
* recebe -1 defesa enquanto instável;
* pelo menos 1 tropa atacante sobrevivente ocupa o território.

---

# 14. Influência

Implementar depois do combate.

## Contra território neutro

O jogador pode tentar influência em território neutro conectado a território seu.

Atacante soma:

* influência investida: cada 1 = +1;
* ouro: cada 2 ouro = +1, máximo +2;
* dado d6.

Defesa soma:

* resistência base do território;
* bônus por fé;
* dado d6.

Resistência base:

* comum: 2;
* estratégico: 3;
* sagrado: 4;
* capital: 5.

Sucessos necessários:

* comum: 1;
* estratégico: 2;
* sagrado: 2 + quiz obrigatório futuramente;
* capital: 3.

## Contra território inimigo

Influência não conquista direto.

Cada sucesso:

* reduz -10 fé do alvo;
* adiciona 1 marcador de pressão.

Com 2 marcadores:

* território fica pressionado;
* produz metade por 1 rodada.

Se o território estiver rebelde e sofrer mais 1 sucesso:

* passa para o influenciador como ocupado/instável.

---

# 15. Melhorias

Melhorias previstas:

* Muralha;
* Quartel;
* Mercado;
* Celeiro;
* Altar/Templo;
* Estrada/Rota.

## Regra importante

Cada jogador pode construir no máximo 1 melhoria por turno.

Mesmo tendo 3 ações, não pode construir 2 ou 3 melhorias no mesmo turno.

## Custos sugeridos

* Muralha: 4 ouro;
* Quartel: 4 ouro + 1 provisão;
* Mercado: 3 ouro;
* Celeiro: 3 ouro;
* Altar/Templo: 3 ouro + 1 influência;
* Estrada/Rota: 3 ouro + 1 provisão.

---

# 16. Cartas

Implementar depois de combate e influência ou em paralelo leve.

## Tipos de carta

* personagem;
* tática;
* missão;
* evento global.

## Mercado

Sempre existem 3 cartas abertas no mercado.

Jogador pode:

* comprar carta aleatória por 2 ouro;
* comprar carta aberta por 4 ouro.

Comprar custa 1 ação.

## Limite de mão

Máximo de 5 cartas.

Se o jogador já tem 5 cartas:

* não pode comprar;
* precisa descartar antes;
* descartar custa 1 ação.

## Personagens

* 1 personagem ativo por jogador;
* bônus principal só 1 vez por turno;
* personagens são únicos enquanto ativos.

Exemplos iniciais:

* Davi: +3 em 1 combate ofensivo por turno por 2 rodadas;
* Josué: +3 contra cidade fortificada em 1 combate por turno por 2 rodadas;
* Neemias: +2 defesa em um território por 2 rodadas;
* José: +3 provisão imediata;
* Salomão: próxima melhoria custa 1 ouro a menos;
* Samuel: +10 fé em um território.

---

# 17. Objetivos secretos e vitória

Cada jogador recebe 1 objetivo secreto no início.

O sistema deve sortear objetivos do mesmo tier de dificuldade para todos.

## Exemplos de objetivos médios

### Reino de Davi

Controle Hebrom, Belém e Jerusalém. Jerusalém precisa ter fé 60+.

### Caminho do Êxodo

Controle Gósen, Sinai e Jericó. Tenha 8 provisões no fim do turno.

### Domínio das rotas

Controle Gaza, Megido, Damasco e Tiro por 1 rodada completa.

### Reino fiel

Tenha 5 territórios com fé acima de 70 e controle 1 cidade sagrada.

---

# 18. Exílio

Se um jogador perder todos os territórios, ele entra em exílio.

## Penalidade

* perde 15 pontos de legado;
* se tiver menos de 15, fica com 0.

## Retorno

No próximo turno, escolhe um território neutro comum ou estratégico com até 3 tropas neutras.

Retorna com:

* 4 tropas no território escolhido;
* 2 provisões;
* 1 ouro;
* 1 influência;
* nenhuma carta nova.

Restrições:

* não pode retornar em capital/império;
* não pode retornar em cidade sagrada/histórica;
* não pode retornar em território controlado por outro jogador.

---

# 19. Bots

Bots são desejados no MVP local.

Não devem usar IA generativa ou API externa.

Usar lógica de **Utility AI simples**.

## Dificuldades

### Fácil

* avalia só territórios próprios e vizinhos;
* tem bastante aleatoriedade;
* raramente prioriza objetivo secreto;
* pode desperdiçar ações;
* evita ataques arriscados.

### Médio

* avalia recursos, vizinhos e objetivo secreto;
* ataca quando tem vantagem razoável;
* fortalece fé se território estiver fraco ou rebelde;
* compra cartas quando tem ouro;
* recruta quando está vulnerável.

### Difícil

* avalia ameaças de outros jogadores;
* tenta bloquear jogador perto da vitória;
* prioriza objetivo secreto;
* usa cartas melhor;
* cuida da fé antes de virar rebelde;
* ainda deve ter aleatoriedade para não ser invencível.

## Importante

Bots devem usar as mesmas regras dos jogadores humanos.

Não criar vantagem escondida.

---

# 20. Quiz bíblico

Quiz deve estimular estudo bíblico sem transformar o jogo inteiro em quiz.

## Estrutura da pergunta

Cada pergunta deve ter:

* id;
* texto;
* 3 alternativas;
* índice da resposta correta;
* dificuldade: fácil, média, difícil;
* território relacionado opcional;
* região relacionada opcional;
* referência bíblica;
* explicação curta pós-resposta.

## Quiz na ação de fé

Ao fortalecer fé com quiz:

* 20 segundos;
* 3 alternativas;
* se acertar: +15 fé;
* se território tiver fé difícil: +10;
* se errar/não responder: -5 fé.

## Quiz global

A cada 3 rodadas globais:

* todos respondem;
* só os 2 primeiros que acertarem mais rápido ganham;
* em partida com 2 jogadores, só o 1º ganha;
* quem errar/não responder: -5 fé no território próprio com menor fé.

## Quiz individual

A cada 5 rodadas globais.

Quando coincidir com global, o individual substitui o global.

---

# 21. Mapa e territórios

O mapa tem 24 territórios divididos em 6 regiões.

## Territórios

1. Egito
2. Gósen
3. Sinai
4. Deserto de Sur
5. Hebrom
6. Jerusalém
7. Belém
8. Neguebe
9. Jericó
10. Siquém
11. Samaria
12. Megido
13. Filístia
14. Gaza
15. Tiro
16. Sidom
17. Moabe
18. Edom
19. Amom
20. Gileade
21. Damasco
22. Nínive
23. Babilônia
24. Susa/Pérsia

## Regiões

* Egito e Sinai;
* Judá e Sul de Canaã;
* Canaã Central e Norte;
* Costa, Fenícia e Filístia;
* Transjordânia;
* Norte e Impérios.

## Territórios bloqueados como início

* Jerusalém;
* Jericó;
* Egito;
* Nínive;
* Babilônia;
* Susa/Pérsia.

---

# 22. Regras gerais para o agente de código

Estas regras devem ser seguidas em qualquer plataforma de IA/código.

## 22.1 Prioridade máxima

O foco atual é validar a lógica do jogo.

Não priorizar visual final, animações avançadas ou arquitetura de produto completo antes das regras funcionarem.

## 22.2 Não sair do escopo

Não implementar sem pedido explícito:

* login;
* backend;
* banco de dados;
* multiplayer;
* WebSocket;
* OAuth;
* ranking;
* amigos;
* convites;
* chat;
* notificações;
* pagamentos;
* mobile completo.

## 22.3 Lógica separada da UI

Toda regra do jogo deve ficar em game-core ou equivalente.

Componentes React não devem conter cálculo principal de regra.

## 22.4 Dados separados da lógica

Territórios, cartas, objetivos, perguntas e pacotes iniciais devem ficar em game-data ou equivalente.

## 22.5 Funções puras sempre que possível

Funções de regra devem receber estado/ação e retornar novo estado ou resultado.

Evitar efeitos colaterais escondidos.

## 22.6 Histórico de ações

Toda ação relevante deve registrar mensagem no histórico.

Exemplo:

* “Davi recrutou 2 tropas em Hebrom.”
* “Jogador 2 atacou Gaza a partir de Hebrom.”
* “Siquém ganhou +10 fé.”

## 22.7 Validações antes de alterar estado

Antes de executar uma ação, validar:

* se é turno do jogador;
* se ainda há ações restantes;
* se o jogador tem recursos;
* se o território pertence a ele quando necessário;
* se territórios são conectados;
* se limite de tropas/recursos será respeitado;
* se a ação é permitida pelo estado atual.

## 22.8 Não reescrever tudo

Antes de alterar, analisar estrutura existente.

Reaproveitar arquivos e padrões já criados.

Não reescrever o projeto inteiro sem necessidade.

## 22.9 Incrementos pequenos

Implementar uma etapa por vez.

Depois de cada etapa:

* compilar;
* testar manualmente;
* registrar o que foi feito;
* apontar pendências.

## 22.10 TODOs claros

Se alguma regra estiver incompleta ou ambígua, não inventar grande sistema.

Registrar em TODO.md e fazer a menor implementação segura.

---

# 23. Próxima ordem recomendada de implementação

Como os prompts até o 5 já foram executados, continuar nesta ordem:

## Próxima etapa 6 — Combate

Implementar:

* ataque entre territórios conectados;
* cálculo com dado d6;
* bônus de defesa por fé;
* tabela de perdas;
* conquista;
* estado ocupado/instável;
* modal de combate.

## Etapa 7 — Influência

Implementar:

* influência contra neutro;
* influência contra inimigo;
* redução de fé;
* marcadores de pressão;
* conquista de território rebelde por influência.

## Etapa 8 — Cartas e mercado

Implementar:

* baralho inicial pequeno;
* mercado com 3 cartas abertas;
* compra aleatória e compra aberta;
* limite de 5 cartas;
* descarte custando ação;
* personagens básicos.

## Etapa 9 — Objetivos secretos e vitória

Implementar:

* objetivos por tier;
* sorteio equilibrado;
* validação de objetivo secreto;
* vitória por legado + controle;
* tela de fim de jogo.

## Etapa 10 — Bots

Implementar:

* bot fácil;
* bot médio;
* bot difícil;
* Utility AI simples;
* execução automática de 3 ações.

## Etapa 11 — Quiz bíblico

Implementar:

* perguntas;
* ação de fé com quiz;
* quiz global;
* quiz individual;
* integração com bots.

## Etapa 12 — Polimento do MVP

Implementar:

* melhorar mapa;
* melhorar painel de ação;
* melhorar histórico;
* salvar/continuar partida;
* revisar balanceamento.

---

# 24. Futuro fora do MVP

Documentar, mas não implementar agora:

## Web completo

* login com Google OAuth;
* nickname;
* WhatsApp;
* tela inicial pós-login;
* amigos;
* convites;
* criação de sala;
* lobby inspirado em League of Legends;
* adicionar amigos na sala;
* adicionar bots;
* chat;
* pausa global com aprovação de 50% ou mais;
* multiplayer em tempo real;
* ranking;
* histórico de partidas;
* estatísticas.

## Mobile

* Expo + React Native;
* reaproveitar game-core;
* reaproveitar game-data;
* adaptar mapa para toque;
* Expo Go no início;
* development build depois se precisar de recursos nativos.

## Multiplayer

* backend Node.js;
* WebSocket ou Socket.IO;
* salas;
* turnos sincronizados;
* validação de ações no servidor;
* reconexão;
* persistência de partida;
* bots no servidor.

## Pausa global futura

* qualquer jogador pode pedir pausa;
* pausa só ativa se 50% ou mais aprovarem;
* 2 jogadores: precisa dos 2;
* 3 jogadores: precisa de 2;
* 4 jogadores: precisa de 2;
* 5 jogadores: precisa de 3;
* 6 jogadores: precisa de 3.

## Timer futuro

* 30 segundos por ação;
* no MVP local pode ficar opcional;
* no multiplayer será obrigatório/configurável.

---

# 25. Critérios de sucesso do MVP

O MVP será considerado bom se permitir responder:

1. O combate é divertido e justo?
2. A fé importa de verdade?
3. Influência é útil sem ficar forte demais?
4. Ouro está raro o suficiente?
5. Os pacotes iniciais são equilibrados?
6. Bots jogam de forma aceitável sem parecerem invencíveis?
7. Objetivos secretos são alcançáveis?
8. O jogo termina em tempo razoável?
9. O jogador entende o que pode fazer no turno?
10. A Bíblia aparece de forma natural e relevante?

Se essas respostas forem positivas, aí sim o projeto pode evoluir para multiplayer, login, lobby, mobile e visual final.
