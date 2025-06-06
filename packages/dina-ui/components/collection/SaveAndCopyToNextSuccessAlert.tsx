import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { BsFillFileEarmarkCheckFill } from "react-icons/bs";
import Link from "next/link";
import { FaInfoCircle } from "react-icons/fa";
import Button from "react-bootstrap/Button";
import { useCopyToNextSample } from "./material-sample/next-sample-functions";
import { useFormikContext } from "formik";
import { useMaterialSampleSave } from "./material-sample/useMaterialSample";

export interface SaveAndCopyToNextSuccessAlertProps {
  id: string;
  entityPath: string;
  className?: string;
  displayName: string;
  dataComponentState: ReturnType<
    typeof useMaterialSampleSave
  >["dataComponentState"];
}

export function SaveAndCopyToNextSuccessAlert({
  id,
  entityPath,
  className,
  displayName,
  dataComponentState
}: SaveAndCopyToNextSuccessAlertProps) {
  const { formatMessage } = useDinaIntl();
  const copyToNextSampleInfo = useCopyToNextSample();
  const formik = useFormikContext<any>();

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
              <span style={{ fontSize: "1.2em", font: "fw-bold" }}>
                {" "}
                {displayName}
              </span>
            </Link>
          </div>

          <span style={{ fontSize: "1.2em", font: "fw-bold" }}>
            {formatMessage("created")}{" "}
          </span>
        </div>
      </div>
      {copyToNextSampleInfo?.notCopiedOverWarnings &&
        copyToNextSampleInfo?.notCopiedOverWarnings.length > 0 && (
          <>
            {copyToNextSampleInfo.notCopiedOverWarnings.map((warning) => (
              <div className="alert alert-info" key={warning.componentName}>
                <div className="d-flex gap-3">
                  <FaInfoCircle style={{ width: "24px", height: "24px" }} />
                  <span style={{ fontSize: "1.2em", font: "fw-bold" }}>
                    {formatMessage("saveAndCopyToNextWarning", {
                      componentName: warning.componentName
                    })}
                  </span>
                </div>

                <Button
                  className="mt-3"
                  variant="secondary"
                  onClick={() => {
                    // Perform logic to add it back, this is defined in the next-sample-functions.
                    warning.duplicateAnyway(
                      copyToNextSampleInfo.originalSample,
                      formik,
                      dataComponentState
                    );

                    // Remove this warning since it's been actioned.
                    copyToNextSampleInfo.removeWarning(warning);
                  }}
                >
                  {formatMessage("saveAndCopyToNextWarningButton", {
                    componentName: warning.componentName,
                    displayName
                  })}
                </Button>
              </div>
            ))}
          </>
        )}
    </>
  );
}
