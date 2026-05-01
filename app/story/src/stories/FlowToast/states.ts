// FlowToast surfaces only on terminal flow statuses - non-terminal values
// (idle / simulating-all / running / paused) keep the toast hidden, so the
// state pill is restricted to the four shapes that actually render.
export const FLOW_STATES = [
  { id: 'completed', label: 'Completed', color: '#10b981' },
  { id: 'error', label: 'Error', color: '#ef4444' },
  { id: 'rejected', label: 'Rejected', color: '#f97316' },
  { id: 'canceled', label: 'Canceled', color: '#6b7280' },
] as const
