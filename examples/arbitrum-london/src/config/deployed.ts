import deployedJson from '../../contracts/deployed.json'


/**
 * Typed view onto contracts/deployed.json. The JSON ships with PENDING
 * placeholder addresses until Mike runs the forge deploy scripts; the
 * helpers below throw a clear error if a caller tries to use an unfilled
 * address so we surface the deploy gap rather than silently calling 0x0.
 */
type DeployedEntry = {
  address: string,
  deployedAt: string | null,
  blockExplorer: string,
  note?: string,
}

type DeployedMap = {
  AgentPolicyGate: Record<string, DeployedEntry>,
}

const deployed = deployedJson as DeployedMap

const isDeployed = (entry: DeployedEntry): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(entry.address) && !entry.address.includes('PENDING')
}

export const getAgentPolicyGateAddress = (chainId: number): `0x${string}` => {
  const entry = deployed.AgentPolicyGate[String(chainId)]
  if (entry === undefined) {
    throw new Error(`AgentPolicyGate not configured for chainId ${chainId}`)
  }
  if (!isDeployed(entry)) {
    throw new Error(
      `AgentPolicyGate on chainId ${chainId} is not deployed yet. ` +
      `Run forge script to deploy and update contracts/deployed.json.`,
    )
  }
  return entry.address as `0x${string}`
}

export const getAgentPolicyGateExplorerUrl = (chainId: number): string => {
  const entry = deployed.AgentPolicyGate[String(chainId)]
  if (entry === undefined) {
    throw new Error(`AgentPolicyGate not configured for chainId ${chainId}`)
  }
  return entry.blockExplorer
}

export const checkIsAgentPolicyGateDeployed = (chainId: number): boolean => {
  const entry = deployed.AgentPolicyGate[String(chainId)]
  if (entry === undefined) {
    return false
  }
  return isDeployed(entry)
}
