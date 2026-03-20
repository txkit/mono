import { useQuery } from '@tanstack/react-query'
import { FRANKFURTER_API_URL } from '@txkit/core'


const fetchFiatRates = async (): Promise<Record<string, number>> => {
  const res = await fetch(`${FRANKFURTER_API_URL}?from=USD`)
  if (!res.ok) {
    throw new Error(`Fiat rates fetch failed: ${res.status}`)
  }
  const data = await res.json()
  if (!data.rates || typeof data.rates !== 'object') {
    throw new Error('Invalid fiat rates response')
  }
  return data.rates
}

const useFiatRates = (enabled = true) => {
  return useQuery({
    queryKey: [ 'txkit-fiat-rates' ],
    queryFn: fetchFiatRates,
    staleTime: 3_600_000,
    refetchInterval: 3_600_000,
    retry: 1,
    enabled,
  })
}


export default useFiatRates
