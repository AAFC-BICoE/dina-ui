import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button, ButtonGroup } from "react-bootstrap";
import { LoadingSpinner } from "common-ui";
import { useIntl } from "react-intl";
import "./PDFViewer.css";

// Configure PDF.js worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl;
}

export function PDFViewer({ fileUrl }: PDFViewerProps) {
  const { formatMessage } = useIntl();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error("Error loading PDF:", error);
    setLoading(false);
  }

  const goToPrevPage = () => {
    setPageNumber((prevPageNumber) => Math.max(prevPageNumber - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prevPageNumber) =>
      numPages ? Math.min(prevPageNumber + 1, numPages) : prevPageNumber
    );
  };

  return (
    <div className="pdf-viewer-container text-center">
      {loading && <LoadingSpinner loading={true} />}

      <div className="pdf-controls mb-3">
        <ButtonGroup>
          <Button
            variant="primary"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            {formatMessage({ id: "previousPage" })}
          </Button>
          <Button
            variant="primary"
            onClick={goToNextPage}
            disabled={numPages !== null && pageNumber >= numPages}
          >
            {formatMessage({ id: "nextPage" })}
          </Button>
        </ButtonGroup>
        <span className="mx-3">
          {formatMessage(
            { id: "pdfPageCounter" },
            { current: pageNumber, total: numPages || "--" }
          )}
        </span>
      </div>

      <div className="pdf-document-container">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<LoadingSpinner loading={true} />}
        >
          <Page
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            width={800}
          />
        </Document>
      </div>
    </div>
  );
}
