/**
 * The wallet-modal open state is internal to @txkit/react (no imperative API),
 * so callers reach the header's ConnectWallet button through the DOM. While
 * disconnected that click opens the wallet modal; if triggered after
 * connecting, it opens the account dropdown - both honest states. Shared by
 * the chat connect-prompt turn and the x402 paywall's pay button.
 */
export const openConnectWalletModal = () => {
  const button = document.querySelector<HTMLButtonElement>('.tx-cw .tx-cw-button')
  if (button === null) {
    console.warn('openConnectWalletModal: no ConnectWallet button in the DOM')
    return
  }

  button.click()
}
