export interface LoadingSpinnerProps {
  /** Whether the loading spinner should be shown. */
  loading: boolean;
}

/** Renders a Bootstrap loading spinner. */
export function LoadingSpinner({ loading }: LoadingSpinnerProps) {
  return loading ? (
    <div className="spinner-border" role="status">
      <span className="visually-hidden mb-3">Loading...</span>
    </div>
  ) : null;
}
