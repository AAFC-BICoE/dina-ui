import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { PropsWithChildren } from "react";
import { Head, Nav } from "..";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { CommonMessage } from "common-ui/lib/intl/common-ui-intl";
import { Footer } from "../button-bar/nav/nav";

/** Catches errors in render methods and displays a fallback error message. */
export function ErrorBoundaryPage({ children }: PropsWithChildren<{}>) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>
  );
}

function ErrorFallback({ error }: FallbackProps) {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("errorPageTitle")} />
      <Nav />
      <main className="container-fluid">
        <div className="alert alert-danger" role="alert">
          <p>
            <CommonMessage id="somethingWentWrong" />:
          </p>
          <pre>{error.message}</pre>
        </div>
      </main>
      <Footer />
    </div>
  );
}
