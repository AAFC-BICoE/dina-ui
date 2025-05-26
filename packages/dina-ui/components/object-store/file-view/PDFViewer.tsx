import React, { useState, ReactNode } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button, ButtonGroup } from "react-bootstrap";
import { LoadingSpinner } from "common-ui";
import RcTooltip from "rc-tooltip";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.js`;

interface PDFViewerProps {
  objectUrl: string;
  shownTypeIndicator: ReactNode | null;
}

export function PDFViewer({
  objectUrl,
  shownTypeIndicator = null
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [_, setLoading] = useState<boolean>(true);

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

  const goToLastPage = () => {
    setPageNumber(1);
  };

  const goToFirstPage = () => {
    setPageNumber(numPages || 1);
  };

  return (
    <div className="pdf-viewer-container" data-testid="pdf-viewer-container">
      <a
        href={objectUrl as any}
        target="_blank"
        style={{
          color: "inherit",
          textDecoration: "none",
          pointerEvents: "auto",
          display: "block",
          marginLeft: "auto",
          marginRight: "auto",
          width: "fit-content"
        }}
      >
        <RcTooltip
          overlay={<>{shownTypeIndicator}</>}
          placement="top"
          align={{
            points: ["bc", "bc"],
            offset: [0, -20]
          }}
          motion={{
            motionName: "rc-tooltip-zoom",
            motionAppear: true,
            motionEnter: true,
            motionLeave: true
          }}
        >
          <div className="pdf-document-container">
            <Document
              file={objectUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<LoadingSpinner loading={true} />}
            >
              <div className="pdf-page">
                <Page
                  pageNumber={pageNumber}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </div>
            </Document>
          </div>
        </RcTooltip>
      </a>
      <div className="pdf-controls">
        <div className="page-counter">
          Page {pageNumber} of {numPages || "--"}
        </div>

        <ButtonGroup>
          <Button
            variant="primary"
            onClick={goToLastPage}
            disabled={pageNumber == 1}
          >
            &laquo;
          </Button>
          <Button
            variant="primary"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            &lsaquo;
          </Button>
          <Button
            variant="primary"
            onClick={goToNextPage}
            disabled={numPages !== null && pageNumber >= numPages}
          >
            &rsaquo;
          </Button>
          <Button
            variant="primary"
            onClick={goToFirstPage}
            disabled={pageNumber == numPages}
          >
            &raquo;
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
