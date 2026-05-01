// FlowProgress renders nothing at 'idle' and treats simulating-all / running /
// paused identically (same fill ratio + shimmer + colors). The pill collapses
// the three in-progress flow statuses into a single 'running' representative.
export const FLOW_STATES = [
  { id: 'running', label: 'Running', color: '#3b82f6' },
  { id: 'completed', label: 'Completed', color: '#10b981' },
  { id: 'error', label: 'Error', color: '#ef4444' },
  { id: 'rejected', label: 'Rejected', color: '#f97316' },
  { id: 'canceled', label: 'Canceled', color: '#6b7280' },
] as const
