export type FlowStepsLabels = {
  /** ARIA label for the steps list (screen readers) */
  listLabel?: string
  /** Text inside the "in-progress" pill on the active step */
  inProgress?: string
  /** Status announcement: completed step */
  completed?: string
  /** Status announcement: failed step */
  failed?: string
  /** Status announcement: rejected step */
  rejected?: string
  /** Status announcement: canceled step */
  canceled?: string
  /** Status announcement: skipped step */
  skipped?: string
  /** Status announcement: pending step */
  pending?: string
  /** Prefix used in the screen-reader-only status line */
  statusPrefix?: string
}

export const defaultLabels: Required<FlowStepsLabels> = {
  listLabel: 'Transaction steps',
  inProgress: 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
  rejected: 'Rejected',
  canceled: 'Canceled',
  skipped: 'Skipped',
  pending: 'Pending',
  statusPrefix: 'Status',
}
