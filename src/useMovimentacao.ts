import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';

export type LetrasDigitadas = Record<number, string>;

export interface EstruturaPalavra {
  inicio: number;
  fim: number;
  tamanho: number;
}

export interface UseMovimentacaoReturn {
  letrasDigitadas: LetrasDigitadas;
  setLetrasDigitadas: Dispatch<SetStateAction<LetrasDigitadas>>;
  cursorAtual: number;
  setCursorAtual: Dispatch<SetStateAction<number>>;
  filmeNormalizado: string;
  totalCaracteres: number;
  removerAcentos: (texto: string) => string;
  obterProximoIndiceValido: (atual: number) => number;
  obterIndiceAnteriorValido: (atual: number) => number;
  navegarVerticalmente: (direcao: 'CIMA' | 'BAIXO') => number;
}

export function useMovimentacao(filmeDoDia: string): UseMovimentacaoReturn {
  const [letrasDigitadas, setLetrasDigitadas] = useState<LetrasDigitadas>({});
  const [cursorAtual, setCursorAtual] = useState(0);

  const removerAcentos = useCallback((texto: string): string => {
    if (!texto) return "";
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  }, []);

  const filmeNormalizado = removerAcentos(filmeDoDia);
  const totalCaracteres = filmeNormalizado ? filmeNormalizado.length : 0;

  const obterEstruturaPalavras = useCallback((): EstruturaPalavra[] => {
    if (!filmeDoDia) return [];
    const palavras = filmeDoDia.split(" ");
    let acumulado = 0;
    return palavras.map(p => {
      const inicio = acumulado;
      const fim = acumulado + p.length - 1;
      acumulado += p.length + 1;
      return { inicio, fim, tamanho: p.length };
    });
  }, [filmeDoDia]);

  const obterProximoIndiceValido = useCallback((atual: number): number => {
    if (totalCaracteres === 0) return 0;
    let proximo = atual + 1;
    while (proximo < totalCaracteres && filmeNormalizado[proximo] === " ") { proximo++; }
    return proximo < totalCaracteres ? proximo : atual;
  }, [totalCaracteres, filmeNormalizado]);

  const obterIndiceAnteriorValido = useCallback((atual: number): number => {
    if (totalCaracteres === 0) return 0;
    let anterior = atual - 1;
    while (anterior >= 0 && filmeNormalizado[anterior] === " ") { anterior--; }
    return anterior >= 0 ? anterior : atual;
  }, [totalCaracteres, filmeNormalizado]);

  const navegarVerticalmente = useCallback((direcao: 'CIMA' | 'BAIXO'): number => {
    if (totalCaracteres === 0) return cursorAtual;
    const estrutura = obterEstruturaPalavras();
    let palavraAtualIdx = 0;
    let posicaoNaPalavra = 0;

    for (let i = 0; i < estrutura.length; i++) {
      if (cursorAtual >= estrutura[i].inicio && cursorAtual <= estrutura[i].fim) {
        palavraAtualIdx = i;
        posicaoNaPalavra = cursorAtual - estrutura[i].inicio;
        break;
      }
    }

    let novaPalavraIdx = palavraAtualIdx;
    if (direcao === "CIMA" && palavraAtualIdx > 0) novaPalavraIdx--;
    else if (direcao === "BAIXO" && palavraAtualIdx < estrutura.length - 1) novaPalavraIdx++;
    else return cursorAtual;

    const destino = estrutura[novaPalavraIdx];
    if (!destino) return cursorAtual;
    
    const novaPosicao = Math.min(posicaoNaPalavra, destino.tamanho - 1);
    return destino.inicio + novaPosicao;
  }, [totalCaracteres, cursorAtual, obterEstruturaPalavras]);

  return {
    letrasDigitadas,
    setLetrasDigitadas,
    cursorAtual,
    setCursorAtual,
    filmeNormalizado,
    totalCaracteres,
    removerAcentos,
    obterProximoIndiceValido,
    obterIndiceAnteriorValido,
    navegarVerticalmente
  };
}
