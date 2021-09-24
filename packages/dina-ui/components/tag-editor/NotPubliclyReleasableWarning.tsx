import { useDinaFormContext } from "common-ui";
import { useFormikContext } from "formik";
import { MdVpnLock } from "react-icons/md";
import { DinaMessage } from "../../intl/dina-ui-intl";

export function NotPubliclyReleasableWarning() {
  const { readOnly } = useDinaFormContext();
  const { values } = useFormikContext<any>();

  if (!readOnly || values.publiclyReleasable) {
    return null;
  }

  return (
    <div className="alert alert-warning d-flex gap-2 align-items-center">
      <MdVpnLock style={{ width: "24px", height: "24px" }} />
      <div>
        <DinaMessage id="notPubliclyReleasable" />
      </div>
    </div>
  );
}
