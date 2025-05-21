import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { LoadingSpinner } from "common-ui";
import "./PDFViewer.module.css";

// Configure PDF.js worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string | undefined;
}
export function PDFViewer({ fileUrl }: PDFViewerProps) {
  const [_, setLoading] = useState<boolean>(true);

  function onDocumentLoadSuccess() {
    setLoading(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error("Error loading PDF:", error);
    setLoading(false);
  }

  return (
    <div className="pdf-document-container">
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={<LoadingSpinner loading={true} />}
      >
        <Page
          pageNumber={1}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
    </div>
  );
}
