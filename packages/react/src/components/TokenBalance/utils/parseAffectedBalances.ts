/** ERC-20 Transfer(address,address,uint256) event topic */
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'


export type AffectedBalance = {
  /** Wallet address whose balance may have changed */
  address: `0x${string}`
  /** ERC-20 token contract. Undefined for native token (gas spend) */
  token?: `0x${string}`
}

type LogEntry = {
  address: `0x${string}`
  topics: `0x${string}`[]
  data: `0x${string}`
}

const extractAddress = (topic: `0x${string}`): `0x${string}` => {
  return `0x${topic.slice(26)}` as `0x${string}`
}

/**
 * Parse transaction receipt logs to find addresses/tokens whose balances may have changed.
 * Always includes senderAddress (native balance changes due to gas).
 */
const parseAffectedBalances = (
  logs: LogEntry[],
  senderAddress: `0x${string}`
): AffectedBalance[] => {
  const seen: Record<string, true> = {}
  const result: AffectedBalance[] = []

  const add = (address: `0x${string}`, token?: `0x${string}`) => {
    const key = `${address.toLowerCase()}:${token?.toLowerCase() ?? 'native'}`
    if (seen[key]) {
      return
    }
    seen[key] = true
    result.push({ address, token })
  }

  // Sender always affected (gas spend)
  add(senderAddress)

  for (const log of logs) {
    // Only process ERC-20 Transfer events (3 indexed topics: event sig, from, to)
    if (
      log.topics[0] !== TRANSFER_TOPIC
      || log.topics.length < 3
    ) {
      continue
    }

    const from = extractAddress(log.topics[1])
    const to = extractAddress(log.topics[2])
    const tokenContract = log.address

    add(from, tokenContract)
    add(to, tokenContract)
  }

  return result
}


export default parseAffectedBalances
