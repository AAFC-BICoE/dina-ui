import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { PropsWithChildren, useState } from "react";
import { Head, Nav } from "..";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { CommonMessage } from "common-ui";
import { Footer } from "../button-bar/nav/nav";

export interface ErrorBoundaryPageProps {
  /** Clears the error page when this value changes, e.g. the current route. */
  resetKey: string;
}

/** Catches errors in render methods and displays a fallback error message. */
export function ErrorBoundaryPage({
  children,
  resetKey
}: PropsWithChildren<ErrorBoundaryPageProps>) {
  const [failedResetKey, setFailedResetKey] = useState<string>();
  const [boundaryKey, setBoundaryKey] = useState(0);

  // Replace the error page in the same render as the route change. Resetting one render later
  // would make Next.js announce the error page's title for the new route.
  if (failedResetKey !== undefined && failedResetKey !== resetKey) {
    setFailedResetKey(undefined);
    setBoundaryKey(boundaryKey + 1);
  }

  return (
    <ErrorBoundary
      key={boundaryKey}
      FallbackComponent={ErrorFallback}
      onError={() => setFailedResetKey(resetKey)}
      onReset={() => setFailedResetKey(undefined)}
    >
      {children}
    </ErrorBoundary>
  );
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("errorPageTitle")} />
      {/* An error thrown here would escape to Next.js and replace the whole application. */}
      <ErrorBoundary fallbackRender={() => null}>
        <Nav />
      </ErrorBoundary>
      <main className="container-fluid">
        <div className="alert alert-danger" role="alert">
          <p>
            <CommonMessage id="somethingWentWrong" />:
          </p>
          <pre>{error.message}</pre>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={resetErrorBoundary}
        >
          <CommonMessage id="tryAgain" />
        </button>
      </main>
      <Footer />
    </div>
  );
}
