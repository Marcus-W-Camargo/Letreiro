import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const PALAVRAS_COMUNS = `a about above across after again against all almost along already also although always am among an and another any anyone anything are around as ask at away back bad be because become been before began begin behind being below best better between big both bring but by call came can cannot case change child children city close come common could country course day did different do does done down during each early end enough even ever every everyone everything example eye face fact family far feel few find first follow food for form found four from full get give go good got great group had hand has have he head help her here high him his home house how however i if important in into is it its just keep kind know large last later learn left less let life like line little live long look made make man many may me mean might more most move much must my name near need never new next night no not now number of off often old on once one only open or order other our out over own part people place point possible put question right same saw say school see seem set she should show side since small so some someone something state still such system take tell than that the their them then there these they thing think this those thought three through time to together too two under until up us use used very want was way we well went were what when where which while who why will with without word work world would write year yes yet you young action adventure animation comedy crime documentary drama family fantasy history horror music mystery romance science fiction thriller war western film movie cinema actor actress director scene story plot character studio genre poster title guess hint letter letters correct wrong green yellow purple gray grey today previous calendar complete completed incomplete play game win winner victory try tries attempt attempts strong medium light close open clear dark theme day month year sunday monday tuesday wednesday thursday friday saturday january february march april may june july august september october november december`

export interface UseDicionarioEnReturn {
  dicionarioEn: Set<string>
  carregandoDicionario: boolean
}

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

export function useDicionarioEn(): UseDicionarioEnReturn {
  const [dicionarioEn, setDicionarioEn] = useState<Set<string>>(new Set())
  const [carregandoDicionario, setCarregandoDicionario] = useState(true)

  useEffect(() => {
    let ativo = true

    async function carregar() {
      const palavras = new Set<string>()
      normalizar(PALAVRAS_COMUNS)
        .split(' ')
        .filter(Boolean)
        .forEach((palavra) => palavras.add(palavra))

      try {
        const { data, error } = await supabase
          .from('daily_movies')
          .select('title_english')
          .not('title_english', 'is', null)

        if (error) throw error

        for (const registro of data || []) {
          normalizar(registro.title_english || '')
            .split(' ')
            .filter(Boolean)
            .forEach((palavra) => palavras.add(palavra))
        }
      } catch (erro) {
        console.warn('Could not enrich the English dictionary with previous movie titles.', erro)
      } finally {
        if (ativo) {
          setDicionarioEn(palavras)
          setCarregandoDicionario(false)
        }
      }
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [])

  return { dicionarioEn, carregandoDicionario }
}
