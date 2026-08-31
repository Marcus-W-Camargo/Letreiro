# 🎬 Letreiro

> Adivinhe o filme do dia, letra por letra.  
> Guess the movie of the day, letter by letter.

[![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![TMDB](https://img.shields.io/badge/TMDB-Movie%20Data-01B4E4)](https://www.themoviedb.org/)

🌐 **Jogar / Play:** https://letreiro-cine-puzzle.vercel.app/pt-br

---

## 🇧🇷 Português (Brasil)

### Sobre o projeto

**Letreiro** é um jogo diário de descoberta de filmes inspirado em jogos de palavras. A cada dia, um filme é selecionado automaticamente, armazenado no Supabase e transformado em um tabuleiro com um quadrado para cada letra do título.

O jogador precisa descobrir o título utilizando as respostas coloridas de cada tentativa. Além do desafio atual, o projeto possui calendário de partidas anteriores, persistência independente por data, dicas progressivas, teclado virtual, suporte ao teclado físico, temas claro e escuro e uma automação diária integrada ao GitHub Actions.

O projeto foi desenvolvido como uma SPA em React + TypeScript, com Vite no frontend, Supabase como banco de dados, TMDB como fonte de dados cinematográficos, GitHub Actions para a automação diária e Vercel para publicação.

---

## Como o Letreiro funciona

O fluxo principal do sistema é:

1. O GitHub Actions executa a automação diária.
2. O script consulta o histórico no Supabase.
3. O sistema busca candidatos na API do TMDB.
4. Filmes que não atendem aos filtros ou já foram usados são eliminados.
5. Um filme inédito é sorteado.
6. O título é higienizado e os detalhes do filme são consultados.
7. O desafio é salvo na tabela `daily_movies`.
8. Ao acessar uma data, o frontend consulta exatamente o registro correspondente.
9. O título vira um tabuleiro de letras.
10. Cada tentativa é avaliada e recebe uma cor.
11. O progresso daquela data é salvo localmente no navegador.
12. O calendário apresenta o estado de cada jogo já visitado.

---

## Tecnologias

| Camada | Tecnologia | Função |
|---|---|---|
| Interface | React 19 | Componentes e estado da aplicação |
| Linguagem | TypeScript | Tipagem e manutenção do frontend |
| Build | Vite 8 | Desenvolvimento e geração da aplicação |
| Banco | Supabase | Armazenamento dos desafios diários |
| Fonte de filmes | TMDB API | Filmes, gêneros, produtoras e posters |
| Automação | GitHub Actions | Sorteio e inserção diária |
| Runtime da automação | Node.js 22 | Execução de `scripts/sortearFilme.js` |
| Deploy | Vercel | Hospedagem da SPA |
| Persistência do jogador | `localStorage` | Progresso, tentativas e tema |
| Validação | Dicionário local | Verificação das palavras digitadas |

---

## Arquitetura

O Letreiro separa duas responsabilidades principais.

### Frontend

O navegador utiliza a chave pública/anônima do Supabase para **ler** o desafio associado à data aberta.

O frontend é responsável por:

- roteamento das páginas;
- consulta do desafio;
- construção do tabuleiro;
- entrada das letras;
- validação das palavras;
- cálculo das cores;
- dicas;
- histórico das tentativas;
- calendário;
- armazenamento do progresso do jogador;
- temas claro e escuro.

O frontend não utiliza credenciais administrativas do Supabase e não contém token do TMDB. A consulta direta à API do TMDB fica restrita à automação de servidor.

### Automação

O GitHub Actions executa `scripts/sortearFilme.js` com credenciais de servidor para:

- ler o histórico de filmes já utilizados;
- consultar a API do TMDB;
- impedir repetições;
- escolher um novo filme;
- buscar dados complementares;
- inserir o desafio em `daily_movies`.

A **Service Role Key do Supabase não é utilizada no frontend**.

---

## Rotas e datas

O projeto usa um roteamento leve baseado em `window.location`, sem dependência de React Router.

| Rota | Função |
|---|---|
| `/` | Redireciona para `/pt-br` |
| `/pt-br` | Página inicial |
| `/pt-br/selecdata` | Calendário de Letreiros anteriores |
| `/pt-br/DD-MM-AA` | Jogo correspondente à data |
| `/pt-br/privacidade` | Página de privacidade |
| Data inexistente/inválida | Tela “Letreiro não encontrado” |

Exemplo:

```text
/pt-br/27-08-26
```

representa o desafio de **27 de agosto de 2026**.

Internamente existem dois formatos principais:

```text
Banco / localStorage:  YYYY-MM-DD
Rota:                  DD-MM-AA
```

Uma rota de data só é aceita quando corresponde ao padrão `DD-MM-AA`, representa uma data real e não está no futuro.

---

## Banco de dados

A tabela principal é:

```text
daily_movies
```

### Campos utilizados

| Campo | Tipo esperado | Uso |
|---|---|---|
| `release_date` | `date` | Data do desafio |
| `tmdb_id` | número/integer | ID do filme no TMDB |
| `title_brazil` | texto | Título higienizado usado pelo jogo |
| `studio` | texto | Primeira produtora retornada pelo TMDB |
| `categories` | array/lista | Gêneros do filme |
| `poster_url` | texto | URL do poster no TMDB |

Exemplo conceitual:

```json
{
  "release_date": "2026-08-27",
  "tmdb_id": 12345,
  "title_brazil": "EXEMPLO DE FILME",
  "studio": "Example Pictures",
  "categories": ["Aventura", "Drama"],
  "poster_url": "https://image.tmdb.org/t/p/w500/..."
}
```

Para a integridade do banco, `release_date` não deve se repetir e `tmdb_id` deve ser único. O código também possui uma camada própria de prevenção contra filmes repetidos.

### RLS e princípio de menor privilégio

A tabela `public.daily_movies` utiliza **Row Level Security (RLS)** para separar a leitura pública do fluxo administrativo de escrita.

O acesso esperado é:

- `anon`: pode executar somente `SELECT`;
- `anon`: não possui `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES` ou `TRIGGER`;
- `PUBLIC`: não possui privilégios de escrita sobre `daily_movies`;
- `service_role`: permanece reservado ao ambiente seguro da automação e pode realizar as operações administrativas necessárias.

A política pública necessária é uma política de `SELECT` destinada ao papel `anon`. Não devem existir políticas de `INSERT`, `UPDATE`, `DELETE` ou `ALL` aplicáveis a `anon` ou `PUBLIC`.

Essa separação permite que o navegador consulte o desafio diário sem conceder capacidade de alterar os registros do banco.

---

## Automação diária e TMDB

O workflow fica em:

```text
.github/workflows/letreiro-cron.yml
```

Ele utiliza Node.js 22 e executa:

```text
node scripts/sortearFilme.js
```

O workflow possui agendamento diário e também `workflow_dispatch` para execução manual.

### Filtros atuais

```text
include_adult=false
language=pt-BR
sort_by=popularity.desc
vote_average.gte=6
vote_count.gte=850
```

Também são aplicadas as regras:

- página aleatória entre 1 e 40;
- títulos com números são descartados;
- títulos vazios são descartados;
- filmes já utilizados são descartados;
- até 60 tentativas podem ser realizadas.

Após selecionar um candidato, o script consulta os detalhes do filme para obter `production_companies` e `genres`. A primeira produtora é salva como `studio`; todos os gêneros são salvos em `categories`.

Quando existe `poster_path`, a URL é gerada no formato:

```text
https://image.tmdb.org/t/p/w500{poster_path}
```

---

## Proteção contra filmes repetidos

Antes do sorteio, o script lê o histórico de `daily_movies` em blocos de até 1.000 registros, ordenados por data e ID.

São criados dois conjuntos em memória:

```text
IDs já utilizados
Títulos já utilizados
```

Um candidato é recusado quando o mesmo `tmdb_id` ou o mesmo título normalizado já existe.

Para a comparação de títulos, uma chave adicional remove espaços. Dessa forma:

```text
HOMEM-ARANHA
HOMEM ARANHA
HOMEMARANHA
```

podem ser tratados como equivalentes para a prevenção de duplicidade.

Se o banco retornar o código PostgreSQL `23505` durante o `INSERT`, o script verifica se o desafio do dia foi criado por outro processo. Caso contrário, marca o filme conflitante como já usado e procura outro candidato. Depois de 60 tentativas sem sucesso, a automação falha explicitamente para tornar o problema visível no GitHub Actions.

---

## Normalização dos títulos

Antes de salvar um título, a automação executa:

1. normalização Unicode `NFD`;
2. remoção de acentos;
3. substituição de `-` por espaço;
4. remoção de caracteres que não sejam letras ou espaços;
5. redução de espaços consecutivos;
6. conversão para maiúsculas;
7. remoção de espaços nas extremidades.

Exemplos:

```text
Homem-Aranha: Sem Volta para Casa
→ HOMEM ARANHA SEM VOLTA PARA CASA

WALL-E
→ WALL E
```

O hífen se torna espaço porque o tabuleiro trabalha com palavras independentes.

---

## Tabuleiro e quadrados de input

Cada letra do título corresponde a um `.letra-quadrado`.

As palavras são renderizadas em blocos separados:

```text
O SENHOR DOS ANEIS
↓
[O]   [S][E][N][H][O][R]   [D][O][S]   [A][N][E][I][S]
```

Os espaços não criam quadrados; eles definem a separação entre palavras e são ignorados durante a movimentação horizontal do cursor.

O tamanho visual padrão dos quadrados é aproximadamente `40px × 40px`, com ajustes responsivos por CSS.

O palpite atual permanece fixado no topo da área rolável. O jogador pode digitar pelo teclado físico, teclado virtual, clicar nos quadrados, navegar pelas setas, apagar com Backspace e enviar com Enter.

Após o envio, a tentativa recebe as cores, é adicionada ao histórico, o input é limpo e o cursor volta ao primeiro quadrado válido.

---

## Lógica das cores

| Cor | Significado |
|---|---|
| 🟩 **Verde** | Letra correta na posição correta |
| 🟨 **Amarelo** | A letra existe na mesma palavra, mas em outra posição |
| 🟪 **Roxo** | A letra existe no título do filme, porém em outra palavra |
| ⬛/⬜ **Cinza** | A letra não possui mais ocorrência disponível no título |

A avaliação ocorre em três etapas.

### 1. Verde

Primeiro são mapeadas as letras exatamente corretas. Cada ocorrência consumida é retirada do estoque global do filme.

### 2. Amarelo

O sistema cria um estoque local por palavra. Se a letra existe em outra posição **dentro da mesma palavra**, ela recebe amarelo.

### 3. Roxo e cinza

Nas posições restantes, uma letra recebe roxo quando ainda existe uma ocorrência disponível em outra parte do título. Caso contrário, recebe cinza.

### Letras repetidas

O algoritmo utiliza estoques de quantidade para impedir que uma letra seja marcada mais vezes do que realmente existe no filme.

### Prioridade no teclado

O teclado virtual guarda a informação mais forte já conhecida:

```text
VERDE > AMARELO > ROXO > CINZA
```

Uma cor de menor prioridade não substitui uma informação mais forte.

---

## Teclado e movimentação

Layout virtual:

```text
Q W E R T Y U I O P
 A S D F G H J K L
   Z X C V B N M ⌫
          ENTER
```

O teclado físico suporta letras, Enter, Backspace e as quatro setas.

A movimentação horizontal pula espaços automaticamente. A movimentação vertical identifica a palavra atual e tenta manter a mesma posição relativa na palavra acima/abaixo; se a palavra de destino for menor, usa a última posição válida. Também é possível clicar diretamente em um quadrado.

---

## Validação pelo dicionário

Uma tentativa só é aceita quando todos os quadrados estão preenchidos e cada bloco forma uma palavra reconhecida.

O dicionário é montado localmente a partir de:

```text
src/palavras_base.txt
src/paises.txt
src/cidades.txt
```

As entradas são normalizadas e armazenadas em um `Set`, removendo duplicatas. Cidades compostas são divididas por palavra.

As palavras do próprio filme do dia também são adicionadas ao conjunto em memória, evitando que a resposta correta seja bloqueada por ausência no léxico local.

---

## Dicas

| Nível | Informação |
|---|---|
| 💡 Leve | Estúdio / produtora |
| 💡 Média | Categoria / gêneros |
| 💡 Forte | Poster do filme com blur |

As dicas usadas ficam salvas no progresso da data. A dica de poster aplica blur para oferecer contexto sem revelar imediatamente a capa completa. A quantidade de dicas também influencia a mensagem de vitória.

---

## Persistência local

O Letreiro não exige login para manter o progresso.

Cada data utiliza uma chave independente:

```text
letreiro-progresso-YYYY-MM-DD
```

O registro pode guardar:

```text
status
letrasDigitadas
cursorAtual
statusTeclado
tentativasAnteriores
jogoGanhou
dicasAbertas
dicaAtiva
tituloVitoria
```

Assim, voltar a uma data anterior restaura aquela partida e o calendário consegue identificar seu estado.

O progresso pertence ao navegador/dispositivo atual. Limpar o `localStorage` remove esse histórico e não existe, atualmente, sincronização entre dispositivos.

---

## Calendário

O calendário está disponível em:

```text
/pt-br/selecdata
```

Ele exibe uma claquete para cada dia do mês atual.

| Estado | Aparência |
|---|---|
| Não jogado | Neutra |
| Incompleto | Amarelo |
| Concluído | Verde |
| Dia atual | Contorno de destaque |
| Futuro | Desabilitado e com opacidade reduzida |

O calendário consulta a chave de progresso correspondente a cada data. `status === "concluido"` ou `jogoGanhou === true` marcam o dia como concluído. Um registro incompleto ou com tentativas marca o dia como amarelo. Sem progresso local, o dia fica neutro.

Datas futuras não podem ser abertas.

> O Supabase armazena o desafio. O estado individual do jogador é local ao navegador.

---

## Temas

O Letreiro possui temas `dark` e `light`.

A preferência é salva em:

```text
letreiro-tema
```

Sem preferência salva, o sistema utiliza inicialmente `prefers-color-scheme`. O tema é aplicado antes da montagem do React para reduzir o flash visual durante o carregamento.

### Cores principais

| Papel | Dark | Light |
|---|---:|---:|
| Fundo | `#0b0f19` | `#ebe4d6` |
| Superfície | `#151828` | `#f7f1e6` |
| Texto | `#f4efe4` | `#1c1914` |
| Verde | `#26b65b` | `#2a8a45` |
| Amarelo | `#b59f3b` | `#b8860b` |
| Roxo | `#7b2cbf` | `#5b21b6` |
| Cinza/base | `#3a3a3c` | `#b5aa96` |

As variáveis CSS são compartilhadas entre tabuleiro, teclado, calendário, dicas, botões e modais.

---

## Tela de vitória

Quando todos os quadrados de uma tentativa ficam verdes, o jogo é marcado como concluído, o cursor é desativado, o progresso é salvo e o modal de vitória é aberto.

A mensagem considera o número de tentativas e de dicas utilizadas. Entre os textos possíveis estão `Parabéns!`, `Muito Bom!`, `Foi Muito Bem!`, `É isso aí!`, `Conseguiu!`, `Espetacular!` e `Sensacional!`.

O modal pode mostrar o poster sem blur e permite voltar ao histórico de tentativas.

---

## Deploy e SPA

🌐 **Produção:** https://letreiro-cine-puzzle.vercel.app/pt-br

O `vercel.json` redireciona `/` para `/pt-br` e reescreve as demais rotas para `/index.html`.

Isso permite abrir ou atualizar diretamente URLs como:

```text
/pt-br/27-08-26
/pt-br/privacidade
```

sem retornar erro 404 do servidor.

### Headers de segurança

A aplicação publica headers de segurança pela configuração da Vercel, incluindo:

- `Content-Security-Policy` (CSP);
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `X-Frame-Options: DENY`;
- `Permissions-Policy` com câmera, microfone, geolocalização, pagamento e USB desabilitados.

A CSP restringe scripts e assets ao necessário para o funcionamento do site, permite posters pelo domínio `image.tmdb.org` e conexões do frontend apenas com o próprio site e com o Supabase. `unsafe-eval` não é permitido. `unsafe-inline` permanece somente para estilos porque a interface atual ainda utiliza estilos inline legítimos.

---

## Variáveis de ambiente

### Frontend

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Apenas valores públicos necessários ao cliente ficam em variáveis `VITE_*`. O frontend não utiliza `VITE_TMDB_TOKEN`.

### GitHub Actions

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TMDB_API_KEY
```

> Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` em uma variável `VITE_*`, no frontend ou em arquivos versionados.

---

## Execução local

Requisitos: Node.js 22+ recomendado, npm e um projeto Supabase configurado.

```bash
git clone https://github.com/Marcus-W-Camargo/Letreiro.git
cd Letreiro
npm install
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

O workflow também pode ser iniciado manualmente pelo botão **Run workflow** no GitHub Actions.

---

## Estrutura do projeto

```text
Letreiro/
├── .github/
│   └── workflows/
│       └── letreiro-cron.yml      # Automação diária
├── scripts/
│   └── sortearFilme.js            # TMDB + Supabase
├── src/
│   ├── App.tsx                    # Jogo principal
│   ├── App.css                    # Jogo e temas
│   ├── Pages.css                  # Home e calendário
│   ├── Privacy.tsx                # Página de privacidade
│   ├── Privacy.css                # Estilos da página de privacidade
│   ├── FooterPrivacy.css          # Estilo do link de privacidade no rodapé
│   ├── routes.tsx                 # Rotas por URL/data
│   ├── dateUtils.ts               # Utilitários de datas
│   ├── supabaseClient.ts          # Cliente Supabase frontend
│   ├── useMovimentacao.ts         # Cursor e navegação
│   ├── useDicionario.ts           # Dicionário local
│   ├── palavras_base.txt
│   ├── paises.txt
│   ├── cidades.txt
│   └── main.tsx                   # Entrada React
├── package.json
├── vercel.json
└── README.md
```

O diretório de build `dist/` é gerado pelo Vite durante o build e permanece ignorado pelo Git, evitando versionar artefatos derivados.

---

## Segurança

- `.env`, `node_modules/` e `dist/` não devem ser versionados.
- A chave anônima do Supabase pode ser usada pelo frontend porque seu acesso é limitado por privilégios e RLS.
- `daily_movies` mantém RLS habilitado e acesso público de leitura restrito ao papel `anon`.
- Escrita pública (`INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES` e `TRIGGER`) é revogada de `anon` e de `PUBLIC`.
- A `service_role` permanece exclusivamente em ambiente seguro/server-side para a automação diária.
- O frontend não armazena nem utiliza o token da API do TMDB; as chamadas de seleção de filmes são feitas pela automação.
- A Content Security Policy restringe scripts, imagens e conexões a origens necessárias e não permite `unsafe-eval`.
- Headers adicionais reduzem riscos de MIME sniffing, framing indevido e exposição excessiva de referência/permissões do navegador.
- A constraint única de `tmdb_id` complementa a validação da automação.
- Validações no código, RLS, privilégios PostgreSQL e constraints do banco funcionam como camadas complementares.

---

## Privacidade

A página pública de privacidade está disponível em:

```text
/pt-br/privacidade
```

O escopo atual de privacidade do Letreiro é simples e funcional:

- o progresso das partidas, tentativas, dicas e preferência de tema são armazenados localmente no navegador por meio de `localStorage`;
- o Supabase armazena os desafios diários e o frontend consulta os registros necessários para exibir o jogo;
- dados públicos de filmes e posters são fornecidos pelo TMDB;
- a aplicação é hospedada na Vercel;
- Supabase, TMDB e Vercel possuem suas próprias políticas de privacidade e suas infraestruturas podem manter logs técnicos necessários à operação;
- não foram identificados no código atual cookies publicitários, Google Analytics ou outras ferramentas próprias de rastreamento analítico do usuário.

O Letreiro não exige conta de usuário para manter o progresso e, atualmente, não sincroniza o histórico individual de partidas entre dispositivos.

---

## Licença

Consulte `LICENSE` e `LICENSE.pt-br.md`.

---

<br>

# 🇺🇸 English

## About the project

**Letreiro** is a daily movie guessing game inspired by word puzzle games. Every day, a movie is automatically selected, stored in Supabase, and transformed into a board containing one square for every letter in its title.

Players discover the movie by interpreting the color feedback from each guess. The project includes an archive calendar, date-specific progress persistence, progressive hints, a virtual keyboard, physical keyboard support, dark/light themes, and daily automation powered by GitHub Actions.

The application is a React + TypeScript SPA built with Vite, using Supabase as its database, TMDB as its movie data source, GitHub Actions for daily selection, and Vercel for deployment.

🌐 **Play:** https://letreiro-cine-puzzle.vercel.app/pt-br

---

## How Letreiro works

1. GitHub Actions starts the daily automation.
2. The script loads the existing Supabase movie history.
3. Candidate movies are fetched from TMDB.
4. Invalid or previously used candidates are discarded.
5. One unused movie is randomly selected.
6. Its title is normalized and additional details are fetched.
7. The challenge is inserted into `daily_movies`.
8. Opening a date URL loads exactly that date from Supabase.
9. The movie title becomes a board of letter squares.
10. Submitted guesses are evaluated and colored.
11. Date-specific progress is stored in the browser.
12. The calendar reflects the local state of previous challenges.

---

## Technology stack

| Layer | Technology | Purpose |
|---|---|---|
| UI | React 19 | Components and state |
| Language | TypeScript | Typed frontend code |
| Build | Vite 8 | Development and production builds |
| Database | Supabase | Daily challenge storage |
| Movie source | TMDB API | Movie metadata and posters |
| Automation | GitHub Actions | Daily movie selection |
| Runtime | Node.js 22 | Runs `scripts/sortearFilme.js` |
| Deployment | Vercel | SPA hosting |
| Player state | `localStorage` | Progress and theme |
| Validation | Local dictionary | Word validation |

---

## Architecture

### Frontend

The browser uses the public/anonymous Supabase credentials to **read** the challenge associated with the selected date.

The frontend handles routing, challenge loading, board rendering, input, word validation, color evaluation, hints, guess history, calendar state, player progress, and themes.

The frontend does not use administrative Supabase credentials and does not contain a TMDB token. Direct TMDB API access is limited to the server-side automation.

### Automation

GitHub Actions runs `scripts/sortearFilme.js` with server-side credentials to load used movies, query TMDB, prevent duplicates, select a candidate, fetch details, and write the challenge into `daily_movies`.

The **Supabase Service Role Key is never used in browser code**.

---

## Routes and dates

The app uses lightweight `window.location` routing without React Router.

| Route | Purpose |
|---|---|
| `/` | Redirects to `/pt-br` |
| `/pt-br` | Home |
| `/pt-br/selecdata` | Previous Letreiros calendar |
| `/pt-br/DD-MM-YY` | Challenge for a date |
| `/pt-br/privacidade` | Privacy page |
| Invalid/missing date | “Letreiro not found” screen |

Two formats are used:

```text
Database / localStorage: YYYY-MM-DD
Route:                   DD-MM-YY
```

Date routes must match the pattern, represent a real date, and cannot point to the future.

---

## Database

Main table:

```text
daily_movies
```

| Field | Expected type | Purpose |
|---|---|---|
| `release_date` | `date` | Challenge date |
| `tmdb_id` | number/integer | TMDB identifier |
| `title_brazil` | text | Normalized playable title |
| `studio` | text | First TMDB production company |
| `categories` | array/list | Movie genres |
| `poster_url` | text | TMDB poster URL |

For data integrity, `release_date` should not repeat and `tmdb_id` should be unique. Application-level duplicate protection adds another safety layer.

### RLS and least privilege

The `public.daily_movies` table uses **Row Level Security (RLS)** to separate public reads from administrative writes.

Expected access is:

- `anon`: `SELECT` only;
- `anon`: no `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, or `TRIGGER` privileges;
- `PUBLIC`: no write privileges on `daily_movies`;
- `service_role`: reserved for the trusted automation environment and retains the administrative capabilities required by the daily workflow.

The only public-facing policy required is a `SELECT` policy targeted at `anon`. There should be no `INSERT`, `UPDATE`, `DELETE`, or `ALL` policies applicable to `anon` or `PUBLIC`.

This allows browsers to read the daily challenge without granting them the ability to modify database records.

---

## Daily automation and TMDB

Workflow:

```text
.github/workflows/letreiro-cron.yml
```

It runs `scripts/sortearFilme.js` with Node.js 22 and supports both scheduled and manual execution.

Current TMDB filters:

```text
include_adult=false
language=pt-BR
sort_by=popularity.desc
vote_average.gte=6
vote_count.gte=850
```

Additional rules:

- random page from 1 to 40;
- numeric titles rejected;
- empty titles rejected;
- previously used movies rejected;
- maximum of 60 attempts.

The selected movie's production companies and genres are fetched in a second request. The first production company becomes `studio`, all genres become `categories`, and the poster uses the TMDB `w500` image path.

---

## Duplicate movie protection

The automation reads the `daily_movies` history in paginated chunks of up to 1,000 records, ordered by date and ID.

It creates sets containing used TMDB IDs and normalized titles. A movie is rejected if either its ID or title has already been used.

Duplicate-title comparison removes spaces, allowing older and newer formatting rules to remain compatible:

```text
HOMEM-ARANHA
HOMEM ARANHA
HOMEMARANHA
```

can be treated as equivalent for duplicate detection.

PostgreSQL error `23505` is also handled. If another process already created today's challenge, the script exits safely. Otherwise the conflicting movie is rejected and another candidate is searched. After 60 unsuccessful attempts, the automation fails explicitly.

---

## Title normalization

Before storage, titles go through:

1. Unicode NFD normalization;
2. accent removal;
3. hyphens replaced by spaces;
4. removal of non-letter/non-space characters;
5. repeated spaces collapsed;
6. uppercase conversion;
7. trimming.

Examples:

```text
Homem-Aranha: Sem Volta para Casa
→ HOMEM ARANHA SEM VOLTA PARA CASA

WALL-E
→ WALL E
```

Hyphens become spaces because the board is organized into independent word groups.

---

## Board and input squares

Each title letter becomes one `.letra-quadrado` square. Spaces create word separation but no square.

The default visual square size is approximately `40px × 40px`, with responsive CSS adjustments.

The active guess stays sticky at the top of the scrollable board. Players can use the virtual keyboard, physical keyboard, click squares, navigate with arrow keys, delete with Backspace, and submit with Enter.

After submission, the guess is colored, stored in history, input is cleared, and the cursor returns to the first valid square.

---

## Color rules

| Color | Meaning |
|---|---|
| 🟩 **Green** | Correct letter and position |
| 🟨 **Yellow** | Letter exists in the same word, different position |
| 🟪 **Purple** | Letter exists elsewhere in the movie title, in another word |
| ⬛/⬜ **Gray** | No remaining occurrence is available |

Evaluation runs in three passes: green exact matches first, then yellow matches using per-word stocks, and finally purple/gray using the remaining global stock.

Letter counts are tracked so repeated letters cannot be marked as present more times than they actually occur.

Virtual keyboard priority is:

```text
GREEN > YELLOW > PURPLE > GRAY
```

---

## Keyboard and navigation

```text
Q W E R T Y U I O P
 A S D F G H J K L
   Z X C V B N M ⌫
          ENTER
```

Physical keyboard support includes letters, Enter, Backspace, and all four arrow keys.

Horizontal movement skips spaces. Vertical movement tries to preserve the relative character position when moving between words. Players can also click an input square directly.

---

## Dictionary validation

A guess is accepted only when every square is filled and every word exists in the local Portuguese dictionary.

Sources:

```text
src/palavras_base.txt
src/paises.txt
src/cidades.txt
```

Entries are normalized, uppercased, and stored in a `Set`. Compound city names are split into individual words. Words from the daily movie are also added in memory so the correct title cannot be rejected simply because it is missing from the base dictionary.

---

## Hints

| Level | Reveals |
|---|---|
| 💡 Light | Studio / production company |
| 💡 Medium | Category / genres |
| 💡 Strong | Blurred movie poster |

Used hints are persisted with the date-specific game state and influence the victory message.

---

## Local persistence

Each date uses its own key:

```text
letreiro-progresso-YYYY-MM-DD
```

Stored state may include input letters, cursor position, keyboard colors, previous guesses, completion state, hints, active hint, and victory title.

Progress belongs to the current browser/device. Clearing `localStorage` removes it, and there is currently no cross-device synchronization.

---

## Calendar

Available at:

```text
/pt-br/selecdata
```

| State | Appearance |
|---|---|
| Not played | Neutral |
| Incomplete | Yellow |
| Completed | Green |
| Today | Highlighted outline |
| Future | Disabled and faded |

The calendar derives completion from date-specific `localStorage`. Future dates cannot be opened.

> Supabase stores the challenge itself; individual player completion remains local to the browser.

---

## Themes

Theme preference is stored under:

```text
letreiro-tema
```

If no value exists, the initial theme follows `prefers-color-scheme`. The theme is applied before React mounts to reduce visual flashing.

| Role | Dark | Light |
|---|---:|---:|
| Background | `#0b0f19` | `#ebe4d6` |
| Surface | `#151828` | `#f7f1e6` |
| Text | `#f4efe4` | `#1c1914` |
| Green | `#26b65b` | `#2a8a45` |
| Yellow | `#b59f3b` | `#b8860b` |
| Purple | `#7b2cbf` | `#5b21b6` |
| Gray/base | `#3a3a3c` | `#b5aa96` |

---

## Victory screen

When every submitted square is green, the challenge is marked complete, progress is saved, input navigation is disabled, and the victory modal opens.

The message depends on attempts and hints used. The modal may display the unblurred movie poster and allows the player to return to the guess history.

---

## Deployment and SPA routing

🌐 https://letreiro-cine-puzzle.vercel.app/pt-br

`vercel.json` redirects `/` to `/pt-br` and rewrites application routes to `/index.html`, allowing direct access and refreshes on paths such as `/pt-br/27-08-26` and `/pt-br/privacidade`.

### Security headers

The application publishes security headers through the Vercel configuration, including:

- `Content-Security-Policy` (CSP);
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `X-Frame-Options: DENY`;
- a `Permissions-Policy` disabling camera, microphone, geolocation, payment, and USB access.

The CSP limits scripts and assets to the origins required by the application, allows movie posters from `image.tmdb.org`, and limits frontend connections to the application itself and Supabase. `unsafe-eval` is not allowed. `unsafe-inline` remains enabled only for styles because the current approved UI still uses legitimate inline styles.

---

## Environment variables

Frontend `.env`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Only public client-side values are exposed through `VITE_*`. The frontend does not use `VITE_TMDB_TOKEN`.

GitHub Actions Secrets:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TMDB_API_KEY
```

> Never expose `SUPABASE_SERVICE_ROLE_KEY` through browser code, `VITE_*` variables, or committed files.

---

## Local development

```bash
git clone https://github.com/Marcus-W-Camargo/Letreiro.git
cd Letreiro
npm install
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

---

## Project structure

```text
Letreiro/
├── .github/workflows/letreiro-cron.yml
├── scripts/sortearFilme.js
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── Pages.css
│   ├── Privacy.tsx
│   ├── Privacy.css
│   ├── FooterPrivacy.css
│   ├── routes.tsx
│   ├── dateUtils.ts
│   ├── supabaseClient.ts
│   ├── useMovimentacao.ts
│   ├── useDicionario.ts
│   ├── palavras_base.txt
│   ├── paises.txt
│   ├── cidades.txt
│   └── main.tsx
├── package.json
├── vercel.json
└── README.md
```

The Vite-generated `dist/` directory is treated as build output and remains ignored by Git instead of being committed.

---

## Security notes

- Do not commit `.env`, `node_modules/`, or `dist/`.
- The Supabase anonymous key is safe for browser use only because database privileges and RLS limit what `anon` can do.
- `daily_movies` keeps RLS enabled and exposes only public read access to `anon`.
- Public write privileges (`INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, and `TRIGGER`) are revoked from both `anon` and `PUBLIC`.
- The Supabase `service_role` key stays exclusively in the trusted server-side automation environment.
- The frontend does not store or use a TMDB API token; movie-selection calls are made by the automation.
- The Content Security Policy limits scripts, images, and connections to required origins and does not allow `unsafe-eval`.
- Additional response headers reduce MIME sniffing, unwanted framing, and unnecessary browser permissions/referrer exposure.
- A unique `tmdb_id` database constraint complements application-level duplicate protection.
- Code validation, RLS, PostgreSQL privileges, and database constraints operate as complementary security layers.

---

## Privacy

The public privacy page is available at:

```text
/pt-br/privacidade
```

The current Letreiro privacy scope is intentionally simple and functional:

- game progress, guesses, hints, and theme preference are stored locally in the browser through `localStorage`;
- Supabase stores the daily challenges, and the frontend reads the records required to display the game;
- public movie metadata and posters are provided by TMDB;
- the application is hosted on Vercel;
- Supabase, TMDB, and Vercel maintain their own privacy policies, and their infrastructure may process technical logs required for operation;
- no advertising cookies, Google Analytics, or other first-party user analytics/tracking tools were identified in the current codebase.

Letreiro does not require a user account to preserve progress and currently does not synchronize individual game history across devices.

---

## License

See `LICENSE` and `LICENSE.pt-br.md`.

---

<p align="center">
  🎬 <strong>Letreiro</strong><br>
  Descubra o filme do dia, letra por letra.<br>
  Guess the movie of the day, letter by letter.
</p>
