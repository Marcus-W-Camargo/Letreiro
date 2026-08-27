/// <reference types="vite/client" />

declare module '*.txt?raw' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_TMDB_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
