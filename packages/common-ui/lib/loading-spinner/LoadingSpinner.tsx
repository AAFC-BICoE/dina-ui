export interface LoadingSpinnerProps {
  /** Whether the loading spinner should be shown. */
  loading: boolean;

  /** Add additional classnames to the loading bar. */
  additionalClassNames?: string;
}

/** Renders a Bootstrap loading spinner. */
export function LoadingSpinner({
  loading,
  additionalClassNames
}: LoadingSpinnerProps) {
  return loading ? (
    <div className={`spinner-border ${additionalClassNames}`} role="status">
      <span className="visually-hidden mb-3">Loading...</span>
    </div>
  ) : null;
}
