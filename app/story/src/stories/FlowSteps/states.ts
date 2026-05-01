// FlowSteps does not render at status 'idle' (no flow yet) and renders the
// three in-progress flow statuses (simulating-all / running / paused) with
// identical visuals - they all map to the same active indicator state. The
// pill shows only the visually distinct outcomes.
export const FLOW_STATES = [
  { id: 'running', label: 'Running', color: '#3b82f6' },
  { id: 'completed', label: 'Completed', color: '#10b981' },
  { id: 'error', label: 'Error', color: '#ef4444' },
  { id: 'rejected', label: 'Rejected', color: '#f97316' },
  { id: 'canceled', label: 'Canceled', color: '#6b7280' },
] as const
