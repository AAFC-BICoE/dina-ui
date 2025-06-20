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
    <div className="align-items-center not-publicly-releasable-alert">
      <Tooltip
        id="notPubliclyReleasableWithReason"
        intlValues={{ reason: values.notPubliclyReleasableReason }}
        setVisible={setVisible}
        visible={visible}
        placement="left"
        visibleElement={
          <MdVpnLock
            style={{
              width: "24px",
              height: "24px",
              marginTop: "-9px"
            }}
            onMouseOver={() => setVisible(true)}
            onMouseOut={() => setVisible(false)}
          />
        }
      />
    </div>
  );
}
