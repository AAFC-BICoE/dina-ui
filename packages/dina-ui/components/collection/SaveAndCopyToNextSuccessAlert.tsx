import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { BsFillFileEarmarkCheckFill } from "react-icons/bs";
import Link from "next/link";

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
    <div className="alert alert-success">
      <div className=" d-flex gap-3">
        <BsFillFileEarmarkCheckFill style={{ width: "24px", height: "24px" }} />
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

        <span style={{ fontSize: "1.2em", font: "fw-bold" }}>
          {formatMessage("created")}{" "}
        </span>
      </div>
    </div>
  );
}
