import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { BsFillFileEarmarkCheckFill } from "react-icons/bs";
import Link from "next/link";
import { FaInfoCircle } from "react-icons/fa";
import Button from "react-bootstrap/Button";

export interface SaveAndCopyToNextSuccessAlertProps {
  id: string;
  entityPath: string;
  className?: string;
  displayName: string;
}

export function SaveAndCopyToNextSuccessAlert({
  id,
  entityPath,
  className,
  displayName
}: SaveAndCopyToNextSuccessAlertProps) {
  const { formatMessage } = useDinaIntl();
  return (
    <>
      <div className="alert alert-success">
        <div className="d-flex gap-2">
          <div className="d-flex gap-3">
            <BsFillFileEarmarkCheckFill
              style={{ width: "24px", height: "24px" }}
            />
            <Link
              href={`/${entityPath}/view?id=${id}`}
              className={className}
              passHref={true}
            >
              <a>
                <span style={{ fontSize: "1.2em", font: "fw-bold" }}>
                  {" "}
                  {displayName}
                </span>
              </a>
            </Link>
          </div>

          <span style={{ fontSize: "1.2em", font: "fw-bold" }}>
            {formatMessage("created")}{" "}
          </span>
        </div>
      </div>
      <div className="alert alert-info">
        <div className="d-flex gap-3">
          <FaInfoCircle style={{ width: "24px", height: "24px" }} />
          <span style={{ fontSize: "1.2em", font: "fw-bold" }}>
            The <strong>Storage</strong> data component was not automatically
            copied over since it's specific to the previous Material Sample.
            Would you like to duplicate it anyway?
          </span>
        </div>

        <Button className="mt-3" variant="secondary">
          Duplicate Storage from "{displayName}"
        </Button>
      </div>
    </>
  );
}
