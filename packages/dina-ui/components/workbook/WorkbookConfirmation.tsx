import { FaRegCheckCircle } from "react-icons/fa";
import Link from "next/link";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";

interface WorkbookConfirmationProps {
  totalRecordsCreated: number;
  onWorkbookReset: () => void;
}

export function WorkbookConfirmation({
  totalRecordsCreated,
  onWorkbookReset
}: WorkbookConfirmationProps) {
  return (
    <>
      <style>{`
        .check-icon {
          font-size: 4em;
          color: #33B17C;
        }
      `}</style>

      <div className="align-items-center justify-content-center d-flex flex-column">
        <span className="check-icon">
          <FaRegCheckCircle />
        </span>
        <h2 className="mt-2">
          <DinaMessage id="workbook_confirmation_title" />
        </h2>
        <span>
          <DinaMessage
            id="workbook_confirmation_total"
            values={{ total: totalRecordsCreated }}
          />
        </span>
      </div>

      <div className="row d-flex gap-2 mt-4 mb-5 align-items-center justify-content-center">
        <button
          className="btn btn-secondary col-sm-3"
          onClick={onWorkbookReset}
        >
          <DinaMessage id="workbook_confirmation_new" />
        </button>

        <button className="btn btn-primary col-sm-3">
          <DinaMessage id="workbook_confirmation_view" />
        </button>
      </div>
    </>
  );
}
