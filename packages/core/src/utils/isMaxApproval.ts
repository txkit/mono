import { maxUint256 } from 'viem'


/** Check if approval amount is MAX_UINT256 (unlimited) */
export const isMaxApproval = (amount: bigint): boolean => {
  return amount === maxUint256
}
