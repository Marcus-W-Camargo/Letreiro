import { useState, useEffect } from 'react';

// Importa os arquivos locais usando o formato raw do Vite
import palavrasRaw from './palavras_base.txt?raw';
import paisesRaw from './paises.txt?raw';
import cidadesRaw from './cidades.txt?raw';

export interface UseDicionarioReturn {
  dicionarioBr: Set<string>;
  carregandoDicionario: boolean;
}

export function useDicionario(): UseDicionarioReturn {
  const [dicionarioBr, setDicionarioBr] = useState<Set<string>>(new Set());
  const [carregandoDicionario, setCarregandoDicionario] = useState(true);

  const removerAcentos = (texto: string): string => {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  };

  useEffect(() => {
    try {
      const superLista: string[] = [];

      // 1. Processa o arquivo lexico (palavras_base)
      palavrasRaw.split('\n').forEach(palavra => {
        const limpa = removerAcentos(palavra.trim());
        if (limpa) superLista.push(limpa);
      });

      // 2. Processa os países
      paisesRaw.split('\n').forEach(pais => {
        const limpa = removerAcentos(pais.trim());
        if (limpa) superLista.push(limpa);
      });

      // 3. Processa as cidades brasileiras
      cidadesRaw.split('\n').forEach(cidade => {
        // Como cidades têm nomes compostos (ex: "São Paulo"), separamos por espaço
        cidade.split(' ').forEach(pedaco => {
          const limpa = removerAcentos(pedaco.trim());
          if (limpa) superLista.push(limpa);
        });
      });

      // Joga tudo no Set para remover duplicatas e salvar na memória
      setDicionarioBr(new Set(superLista));
      setCarregandoDicionario(false);

    } catch (erro) {
      console.error("Erro ao processar os arquivos do dicionário local:", erro);
      alert("Erro crítico ao carregar a lista de palavras local.");
    }
  }, []);

  return { dicionarioBr, carregandoDicionario };
}
