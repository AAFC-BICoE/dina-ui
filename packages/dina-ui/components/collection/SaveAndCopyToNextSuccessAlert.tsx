import { useDinaIntl } from "../../intl/dina-ui-intl";
import Link from "next/link";
import { FaInfoCircle } from "react-icons/fa";
import Button from "react-bootstrap/Button";
import { useCopyToNextSample } from "./material-sample/next-sample-functions";
import { useFormikContext } from "formik";
import { useMaterialSampleSave } from "./material-sample/useMaterialSample";
import { FaCopy } from "react-icons/fa6";

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
      <div className="alert alert-info">
        <div className="d-flex align-items-center gap-3">
          <FaCopy style={{ width: "30px", height: "30px", flexShrink: 0 }} />
          <div>
            <div>
              <span>{formatMessage("saveSuccess")} "</span>
              <Link
                href={`/${entityPath}/view?id=${id}`}
                className={className}
                passHref={true}
              >
                <span>{displayName}</span>
              </Link>
              ".
              <br />
              <span className="small">
                {formatMessage("copyToNextSampleInProgressMessage", {
                  displayName
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {copyToNextSampleInfo?.notCopiedOverWarnings &&
        copyToNextSampleInfo?.notCopiedOverWarnings.length > 0 && (
          <>
            {copyToNextSampleInfo.notCopiedOverWarnings.map((warning) => (
              <div className="alert alert-warning" key={warning.componentName}>
                <div className="d-flex align-items-center gap-3">
                  <FaInfoCircle
                    style={{ width: "24px", height: "24px", flexShrink: 0 }}
                  />
                  <span className="fw-bold" style={{ fontSize: "1.2em" }}>
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
