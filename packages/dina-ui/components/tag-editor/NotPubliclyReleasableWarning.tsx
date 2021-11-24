import { useDinaFormContext } from "common-ui";
import { useFormikContext } from "formik";
import { MdVpnLock } from "react-icons/md";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { TextField } from "../../../common-ui/lib/formik-connected/TextField";

export function NotPubliclyReleasableWarning() {
  const { readOnly } = useDinaFormContext();
  const { values } = useFormikContext<any>();

  if (!readOnly || values.publiclyReleasable) {
    return null;
  }

  return (
    <div className="alert alert-warning">
      <div className=" d-flex gap-2 align-items-center">
        <MdVpnLock style={{ width: "24px", height: "24px" }} />
        <DinaMessage id="notPubliclyReleasable" />
      </div>
      {!!values.notPubliclyReleasableReason && (
        <TextField
          name="notPubliclyReleasableReason"
          className="flex-grow-1"
          multiLines={true}
          hideLabel={true}
          removeBottomMargin={true}
        />
      )}
    </div>
  );
}
