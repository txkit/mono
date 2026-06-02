import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { previewSequencerFee, type SequencerFeePreview } from '@txkit/arbitrum-adapter'
import type { ReactNode } from 'react'
import { formatGwei, toHex } from 'viem'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SequencerFeeRow } from './SequencerFeeRow'


vi.mock('@txkit/arbitrum-adapter', () => ({
  previewSequencerFee: vi.fn(),
}))

const mockedPreviewSequencerFee = vi.mocked(previewSequencerFee)

const SAMPLE_TO = '0x000000000000000000000000000000000000dEaD' as const
const SAMPLE_CALLDATA = '0xabcdef' as const

/**
 * Wei amounts picked to format as clean, distinct gwei values (1 gwei = 1e9
 * wei): 1.5 / 4.2 / 5.7 gwei. Distinct strings let each row be asserted on
 * its own without ambiguity.
 */
const SAMPLE_FEE_PREVIEW: SequencerFeePreview = {
  l2GasEstimate: '0x4c4b40',
  l1CalldataBytes: 132,
  l1BaseFeeWei: '0x3b9aca00',
  l1FeeWei: toHex(1_500_000_000n),
  l2FeeWei: toHex(4_200_000_000n),
  totalFeeWei: toHex(5_700_000_000n),
  isCompressed: false,
}

const renderWithQueryClient = (node: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(<QueryClientProvider client={queryClient}>{node}</QueryClientProvider>)
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('SequencerFeeRow', () => {
  it('shows the estimating hint while the preview request is in flight', () => {
    const pendingForever = new Promise<SequencerFeePreview | null>(() => {})
    mockedPreviewSequencerFee.mockReturnValue(pendingForever)

    renderWithQueryClient(<SequencerFeeRow chain="eip155:42161" to={SAMPLE_TO} calldata={SAMPLE_CALLDATA} />)

    expect(screen.getByText(/estimating sequencer fee/i)).toBeTruthy()
  })

  it('renders nothing once the preview resolves to null', async () => {
    mockedPreviewSequencerFee.mockResolvedValue(null)

    const { container } = renderWithQueryClient(
      <SequencerFeeRow chain="eip155:42161" to={SAMPLE_TO} calldata={SAMPLE_CALLDATA} />,
    )

    await waitFor(() => {
      expect(screen.queryByText(/estimating sequencer fee/i)).toBeNull()
    })
    expect(screen.queryByText(/estimated sequencer fee/i)).toBeNull()
    expect(container.textContent).toBe('')
  })

  it('renders the L1, L2, and total fee rows when the preview resolves with data', async () => {
    mockedPreviewSequencerFee.mockResolvedValue(SAMPLE_FEE_PREVIEW)

    renderWithQueryClient(<SequencerFeeRow chain="eip155:42161" to={SAMPLE_TO} calldata={SAMPLE_CALLDATA} />)

    expect(await screen.findByText('Estimated sequencer fee')).toBeTruthy()
    expect(screen.getByText('L1 calldata')).toBeTruthy()
    expect(screen.getByText('L2 compute')).toBeTruthy()
    expect(screen.getByText('Total')).toBeTruthy()

    expect(screen.getByText(`${formatGwei(BigInt(SAMPLE_FEE_PREVIEW.l1FeeWei))} gwei`)).toBeTruthy()
    expect(screen.getByText(`${formatGwei(BigInt(SAMPLE_FEE_PREVIEW.l2FeeWei))} gwei`)).toBeTruthy()
    expect(screen.getByText(`${formatGwei(BigInt(SAMPLE_FEE_PREVIEW.totalFeeWei))} gwei`)).toBeTruthy()
  })
})
