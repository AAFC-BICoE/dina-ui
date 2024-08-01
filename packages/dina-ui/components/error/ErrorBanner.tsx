interface ErrorBannerProps {
  errorMessage: string;
}

export function ErrorBanner({ errorMessage }: ErrorBannerProps) {
  return (
    <div className="error-viewer">
      <div className="alert alert-danger" role="status">
        {errorMessage}
      </div>
    </div>
  );
}
