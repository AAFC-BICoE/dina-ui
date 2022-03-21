import { Tooltip, useDinaFormContext } from "common-ui";
import { useFormikContext } from "formik";
import { MdVpnLock } from "react-icons/md";
import { useState } from "react";

export function NotPubliclyReleasableWarning() {
  const { readOnly } = useDinaFormContext();
  const [visible, setVisible] = useState(false);
  const { values } = useFormikContext<any>();
  if (!readOnly || values.publiclyReleasable) {
    return null;
  }

  return (
    <div className=" d-flex gap-2 align-items-center not-publicly-releasable-alert">
      <Tooltip
        id="notPubliclyReleasable"
        setVisible={setVisible}
        visible={visible}
        visibleElement={
          <MdVpnLock
            style={{ width: "24px", height: "24px" }}
            onMouseOver={() => setVisible(true)}
            onMouseOut={() => setVisible(false)}
          />
        }
      />
    </div>
  );
}
