import { useFormikContext } from "formik";
import { useIntl } from "react-intl";
import { CommonMessage } from "..";
import { useDinaFormContext } from "./DinaForm";
import { NumberField } from "./NumberField";
import { isNil } from "lodash";

export interface NumberRangeFieldsProps {
  /** Min and max field names. */
  names: [string, string];
  labelMsg: JSX.Element;
}

export function NumberRangeFields({
  names: [minName, maxName],
  labelMsg
}: NumberRangeFieldsProps) {
  const { formatMessage } = useIntl();
  const { readOnly } = useDinaFormContext();
  const { values } = useFormikContext<any>();

  const minVal = values[minName];
  const maxVal = values[maxName];

  const bothAreDefined = !isNil(minVal) && !isNil(maxVal);

  return (
    <label className="w-100">
      <strong>{labelMsg}</strong>
      {readOnly && !bothAreDefined ? (
        <div className="mb-3">{minVal ?? maxVal ?? ""}</div>
      ) : (
        <div className="d-flex align-items-center mb-3">
          <NumberField
            removeLabel={true}
            removeBottomMargin={true}
            name={minName}
            className="flex-grow-1"
            placeholder={formatMessage({ id: "min" })}
          />
          <span className="mx-3">
            <CommonMessage id="to" />
          </span>
          <NumberField
            removeLabel={true}
            removeBottomMargin={true}
            name={maxName}
            className="flex-grow-1"
            placeholder={formatMessage({ id: "max" })}
          />
        </div>
      )}
    </label>
  );
}
