export function dataLocalAtual(): Date {
  const agora = new Date()
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
}

export function chaveData(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function dataParaRota(data: Date): string {
  const dia = String(data.getDate()).padStart(2, '0')
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const ano = String(data.getFullYear()).slice(-2)
  return `${dia}-${mes}-${ano}`
}

export function interpretarDataDaRota(valor: string): Date | null {
  const match = /^(\d{2})-(\d{2})-(\d{2})$/.exec(valor)
  if (!match) return null

  const dia = Number(match[1])
  const mes = Number(match[2])
  const ano = 2000 + Number(match[3])
  const data = new Date(ano, mes - 1, dia)

  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return null
  }

  return data
}

export function formatarDataLonga(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(data)
}
