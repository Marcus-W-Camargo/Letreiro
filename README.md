<p align="center">
  <img src="public/LetreiroIco.png" alt="Letreiro" width="120" />
</p>

# 🎬 Letreiro

> Um filme por dia. Descubra o título usando letras, cores e dicas progressivas.

[![React](https://img.shields.io/badge/React-19.2-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![TMDB](https://img.shields.io/badge/TMDB-Movie%20Data-01B4E4)](https://www.themoviedb.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Production-F38020?logo=cloudflare&logoColor=white)](https://www.cloudflare.com/)
[![Daily Automation](https://github.com/Marcus-W-Camargo/Letreiro/actions/workflows/letreiro-cron.yml/badge.svg)](https://github.com/Marcus-W-Camargo/Letreiro/actions/workflows/letreiro-cron.yml)

🌐 **Jogar:** https://letreiro.marcuscamargo-portfolio.com.br/

---

## Sobre o projeto

**Letreiro** é um jogo diário de descoberta de filmes, disponível em **português do Brasil** e **inglês dos Estados Unidos**.

A cada dia, um filme é selecionado automaticamente, processado em PT-BR e EN-US e armazenado no Supabase. O título se transforma em um tabuleiro com um quadrado para cada letra, e o jogador precisa descobrir a resposta utilizando as cores de cada tentativa e dicas progressivas.

O projeto combina três partes principais:

1. **jogo no navegador**;
2. **banco de desafios diários bilíngues**;
3. **automação que publica um novo filme sem depender de cadastro manual**.

A experiência também inclui tela inicial de escolha de idioma, calendário de partidas anteriores, persistência independente por idioma e data, teclado virtual e físico, temas claro e escuro, páginas de privacidade localizadas e navegação responsiva.

---

## ✨ Principais funcionalidades

### 🌎 Experiência bilíngue

A tela inicial permite escolher entre **PT-BR** e **EN-US** antes de entrar no jogo.

As duas versões compartilham o mesmo filme diário por `tmdb_id`, mas utilizam conteúdo localizado quando disponível:

- título em português e inglês;
- gêneros localizados;
- poster localizado para inglês quando o TMDB disponibiliza uma versão apropriada;
- interface, calendário, mensagens, tooltips e Política de Privacidade próprios de cada idioma.

### 🎯 Desafio diário

Cada data corresponde a um desafio próprio.

O jogador pode:

- preencher o título pelo teclado virtual;
- utilizar teclado físico;
- navegar pelos quadrados;
- enviar tentativas;
- receber feedback por cores;
- usar dicas;
- continuar uma partida posteriormente;
- acessar desafios anteriores pelo calendário.

### 🗓️ Histórico por data

O jogo permite abrir desafios anteriores por rota, mantendo progresso separado para cada idioma e data.

Formatos de rota:

```text
/pt-br/DD-MM-AA
/en-us/DD-MM-AA
```

Exemplos:

```text
/pt-br/27-08-26
/en-us/27-08-26
```

O armazenamento local utiliza uma chave própria por desafio e idioma.

### 💡 Dicas progressivas

O sistema possui níveis de ajuda:

| Nível | Informação |
| --- | --- |
| 💡 Leve | Estúdio / produtora |
| 💡 Média | Gêneros |
| 💡 Forte | Poster com blur |

As dicas utilizadas fazem parte do progresso salvo da partida.

### 🌗 Tema claro e escuro

A interface pode alternar entre temas claro e escuro e preserva a preferência do jogador localmente.

Os controles de **Sobre / About** e **Tema / Theme** também estão disponíveis na tela inicial de escolha de idioma, mantendo o mesmo padrão visual do restante da aplicação.

---

## 🟩🟨🟪 Lógica das cores

A avaliação do palpite é uma das principais regras de domínio do projeto.

| Cor | Significado |
| --- | --- |
| 🟩 Verde | Letra correta na posição correta |
| 🟨 Amarelo | Letra existe na mesma palavra, em outra posição |
| 🟪 Roxo | Letra existe no título, mas em outra palavra |
| ⬛ Cinza | Não há mais ocorrência disponível daquela letra |

A validação utiliza estoques de ocorrências para impedir que letras repetidas sejam marcadas mais vezes do que realmente existem na resposta.

A prioridade visual armazenada no teclado é:

```text
VERDE > AMARELO > ROXO > CINZA
```

Assim, uma informação menos precisa não substitui uma descoberta mais forte já obtida pelo jogador.

---

## 📚 Validação de palavras

As tentativas são verificadas contra bases de validação próprias da aplicação.

Na experiência em português, a base inclui arquivos como:

```text
src/palavras_base.txt
src/paises.txt
src/cidades.txt
```

A versão em inglês utiliza um léxico próprio de palavras comuns definido no frontend e o enriquece dinamicamente com palavras dos títulos em inglês já registrados em `daily_movies` no Supabase.

As entradas são normalizadas e deduplicadas em memória. As palavras que fazem parte da resposta do dia também são incorporadas ao conjunto de validação para impedir que um título correto seja recusado apenas por ausência no léxico base.

---

## 🤖 Automação diária

O novo desafio é criado por:

```text
.github/workflows/letreiro-cron.yml
```

que executa:

```text
scripts/sortearFilme.js
```

A automação roda em **Node.js 22** e utiliza:

- TMDB para descoberta e dados de filmes;
- Supabase para consultar histórico e inserir o desafio;
- GitHub Actions para agendamento;
- secrets do repositório para credenciais de servidor.

O workflow executa várias janelas de tentativa próximas à meia-noite no horário de Brasília e possui uma execução adicional de segurança.

O script é **idempotente por data**: se o desafio do dia já existe, ele encerra sem criar outro.

Para a internacionalização dos desafios históricos, o repositório também mantém o workflow `preencher-titulos-ingles.yml` e o script `scripts/preencherTitulosIngles.js`, responsáveis por complementar registros anteriores com dados em inglês sem depender da automação diária dos novos desafios.

---

## 🎞️ Seleção de filmes

A automação consulta o endpoint de descoberta do TMDB com filtros de qualidade.

Configuração atual relevante:

```text
include_adult=false
language=pt-BR
sort_by=popularity.desc
vote_average.gte=6
vote_count.gte=850
```

Também são aplicadas regras próprias:

- página aleatória entre 1 e 40;
- descarte de títulos vazios;
- descarte de títulos contendo números;
- descarte de filmes já utilizados;
- descarte de títulos equivalentes já utilizados;
- até 60 tentativas para encontrar um candidato válido.

Após escolher um filme, a automação recupera os dados em PT-BR e também consulta dados em EN-US para preparar o mesmo desafio nos dois idiomas.

São armazenados, entre outros dados:

```text
tmdb_id
title_brazil
title_english
studio
categories
categories_english
poster_url
poster_url_english
release_date
```

---

## ♻️ Proteção contra repetição

Antes de selecionar o desafio, o script carrega do Supabase:

```text
tmdb_id
title_brazil
```

dos filmes já utilizados.

São mantidos dois conjuntos em memória:

- IDs já usados;
- títulos normalizados já usados.

A chave textual remove diferenças que não deveriam permitir uma repetição lógica.

Por exemplo:

```text
HOMEM-ARANHA
HOMEM ARANHA
HOMEMARANHA
```

podem convergir para a mesma chave de comparação.

Caso o banco retorne conflito de unicidade (`23505`), o processo verifica se outro job já criou o desafio do dia. Se não, o filme conflitante é descartado e a busca continua.

---

## 🔤 Normalização dos títulos

Antes de entrar no jogo, o título passa por:

1. normalização Unicode;
2. remoção de acentos;
3. conversão de hífens em espaços;
4. remoção de caracteres que não sejam letras ou espaços;
5. redução de espaços repetidos;
6. conversão para maiúsculas;
7. remoção de espaços nas extremidades.

Exemplo:

```text
Homem-Aranha: Sem Volta para Casa
↓
HOMEM ARANHA SEM VOLTA PARA CASA
```

Isso mantém o tabuleiro previsível e compatível com a lógica de palavras.

---

## 🧠 Arquitetura

O projeto separa claramente frontend, automação e entrega em produção.

### Frontend

Responsável por:

- escolher idioma;
- carregar o desafio da data;
- renderizar o tabuleiro;
- receber entrada do jogador;
- validar palavras;
- calcular as cores;
- controlar dicas;
- manter progresso local;
- exibir histórico e calendário;
- controlar tema;
- atualizar metadados SEO conforme a rota e o idioma.

O frontend utiliza apenas credenciais públicas apropriadas do Supabase.

### Automação

Responsável por:

- acessar a API do TMDB;
- consultar filmes já utilizados;
- selecionar um candidato;
- buscar dados PT-BR e EN-US;
- impedir repetição;
- inserir o desafio diário.

Credenciais administrativas permanecem restritas ao ambiente do GitHub Actions.

### Produção

O build de produção é gerado com Vite e publicado no **Cloudflare Workers**, com assets estáticos e fallback de SPA configurados pelo Wrangler.

O domínio principal é:

```text
https://letreiro.marcuscamargo-portfolio.com.br/
```

A URL secundária do Workers:

```text
https://letreiro.mcpt.workers.dev/
```

redireciona para o domínio principal preservando o caminho solicitado.

---

## 🔒 Segurança e privacidade

A arquitetura evita expor credenciais administrativas no navegador.

Princípios centrais:

- chave administrativa do Supabase apenas na automação;
- token do TMDB apenas no ambiente de servidor;
- leitura pública do desafio separada da escrita administrativa;
- secrets armazenados no GitHub Actions;
- prevenção de duplicação no código e no banco;
- nenhum login obrigatório para preservar progresso do jogador;
- páginas de Política de Privacidade em PT-BR e EN-US.

A tabela `daily_movies` deve manter políticas que permitam leitura pública necessária ao jogo sem conceder escrita ao cliente anônimo.

---

## 🔎 SEO e descoberta

O projeto possui uma base de SEO técnico preparada para indexação e compartilhamento.

Entre os recursos atuais estão:

- `title` e `description` localizados;
- canonical por rota principal;
- `hreflang` para PT-BR, EN-US e `x-default`;
- Open Graph;
- Twitter Card;
- `robots.txt`;
- `sitemap.xml`;
- dados estruturados JSON-LD como `WebSite` e `WebApplication`;
- metadados de idioma atualizados conforme a rota.

O sitemap público está disponível em:

```text
https://letreiro.marcuscamargo-portfolio.com.br/sitemap.xml
```

---

## 📢 Monetização

A aplicação já possui a integração base com **Google AdSense** preparada no frontend.

A estratégia prevista prioriza anúncios automáticos fora da área central do jogo, com foco em preservar a jogabilidade e reduzir risco de cliques acidentais.

O código do AdSense é carregado no site com preferência para anúncio âncora inferior. A ativação e exibição efetiva dos formatos dependem da configuração e aprovação no painel do Google AdSense.

---

## 💾 Persistência

O progresso não exige conta.

Cada idioma e data utilizam chaves independentes no `localStorage`, permitindo que o jogador:

- feche o navegador;
- retorne mais tarde;
- mantenha tentativas;
- preserve dicas;
- mantenha o estado da partida;
- acompanhe jogos diferentes sem misturar progresso entre datas ou idiomas.

O projeto não depende do Supabase para salvar o estado individual de cada jogador.

---

## 🧭 Rotas

| Rota | Função |
| --- | --- |
| `/` | Seleção de idioma |
| `/pt-br` | Página inicial em português |
| `/pt-br/selecdata` | Calendário em português |
| `/pt-br/DD-MM-AA` | Desafio de uma data em português |
| `/pt-br/privacidade` | Política de Privacidade em português |
| `/en-us` | Página inicial em inglês |
| `/en-us/selectdate` | Calendário em inglês |
| `/en-us/DD-MM-AA` | Desafio de uma data em inglês |
| `/en-us/privacy` | Política de Privacidade em inglês |

Rotas de data inválidas, inexistentes ou futuras são tratadas pela aplicação.

---

## 🏗️ Stack

| Camada | Tecnologia | Responsabilidade |
| --- | --- | --- |
| Interface | React 19.2 | Componentes e estado |
| Linguagem | TypeScript 5.8 | Tipagem |
| Build | Vite 8.2 | Desenvolvimento e produção |
| Banco | Supabase | Desafios diários |
| Filmes | TMDB API | Catálogo e metadados |
| Automação | GitHub Actions | Execução agendada |
| Runtime da automação | Node.js 22 | Script de sorteio |
| HTTP da automação | Axios | Comunicação com TMDB |
| Persistência do jogador | localStorage | Progresso por idioma e data |
| Deploy | Cloudflare Workers | Hospedagem da SPA e domínio personalizado |
| Configuração de deploy | Wrangler | Assets, SPA fallback, domínio e Worker |

---

## 📁 Estrutura principal

```text
.
├── .github/workflows/
│   ├── letreiro-cron.yml                 # Automação diária
│   └── preencher-titulos-ingles.yml      # Backfill dos desafios históricos em inglês
│
├── public/
│   ├── LetreiroIco.png          # Ícone público
│   ├── favicon.svg
│   ├── robots.txt               # Regras de rastreamento
│   └── sitemap.xml              # Mapa do site
│
├── scripts/
│   ├── sortearFilme.js                   # Seleção e inserção do filme em PT-BR e EN-US
│   └── preencherTitulosIngles.js         # Complementa registros históricos em EN-US
│
├── src/
│   ├── assets/
│   ├── App.tsx                  # Jogo PT-BR
│   ├── AppEn.tsx                # Jogo EN-US
│   ├── LandingHome.tsx          # Seleção inicial de idioma
│   ├── LandingControls.tsx      # Sobre/About e Tema/Theme da landing
│   ├── routes.tsx               # Páginas e rotas PT-BR
│   ├── routesEn.tsx             # Páginas e rotas EN-US
│   ├── supabaseClient.ts        # Cliente público
│   ├── useDicionarioEn.ts       # Léxico e enriquecimento da validação EN-US
│   ├── palavras_base.txt        # Léxico PT-BR
│   ├── paises.txt
│   └── cidades.txt
│
├── worker.js                    # Redirect workers.dev e entrega dos assets
├── wrangler.jsonc               # Configuração do Cloudflare Worker
├── package.json
└── README.md
```

---

## ⚙️ Execução local

### Requisitos

- Node.js;
- npm;
- projeto Supabase configurado para leitura do desafio.

### Instalação

```bash
git clone https://github.com/Marcus-W-Camargo/Letreiro.git
cd Letreiro
npm install
```

### Desenvolvimento

```bash
npm run dev
```

### Validação

```bash
npm run lint
npm run build
```

---

## 🔑 Variáveis de ambiente

### Frontend

O build do frontend utiliza variáveis públicas do Supabase:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Essas variáveis são configuradas no ambiente de build da hospedagem.

### Automação

O script de sorteio depende de credenciais de servidor:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TMDB_API_KEY
```

Essas credenciais **não devem** ser adicionadas ao frontend nem versionadas no repositório.

A automação pode ser executada com:

```bash
node scripts/sortearFilme.js
```

---

## 🚀 Produção

**Aplicação:**  
https://letreiro.marcuscamargo-portfolio.com.br/

**Entrada secundária:**  
https://letreiro.mcpt.workers.dev/

O frontend é publicado como SPA no **Cloudflare Workers**. A configuração de deploy é versionada em `wrangler.jsonc`, que define os assets, o fallback de SPA e o domínio personalizado utilizados pela aplicação.

A URL secundária `workers.dev` permanece ativa como porta de entrada curta e redireciona para o domínio principal com status HTTP `308`, preservando rotas como `/pt-br` e `/en-us`.

O conteúdo diário não depende de um redeploy do frontend: o GitHub Actions cria o novo registro diretamente no Supabase e a aplicação consulta o desafio correspondente à data.

Essa separação permite atualizar o jogo diariamente sem reconstruir ou publicar novamente o site.

---

## 📄 Licença

O projeto utiliza a **Licença MIT**.

Consulte:

- [`LICENSE`](LICENSE);
- [`LICENSE.pt-br.md`](LICENSE.pt-br.md).

---

## 👨‍💻 Autor

Desenvolvido por **Marcus Camargo**.

**GitHub:**  
https://github.com/Marcus-W-Camargo

**Portfólio:**  
https://marcuscamargo-portfolio.com.br/

---

## Letreiro

**Um filme por dia. Uma nova descoberta por tentativa.**