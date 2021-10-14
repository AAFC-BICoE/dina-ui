import { useFormikContext } from "formik";
import { isNil } from "lodash";
import { useIntl } from "react-intl";
import { CommonMessage, Tooltip } from "..";
import { useDinaFormContext } from "./DinaForm";
import { MetersField } from "./MetersField";

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
  const neitherAreDefined = isNil(minVal) && isNil(maxVal);

  return (
    <label className="w-100">
      <div className="mb-2">
        <strong>{labelMsg}</strong>
        <Tooltip id="metersField_tooltip" />
      </div>
      <div className="mb-3" style={{ minHeight: "25px" }}>
        {readOnly ? (
          bothAreDefined ? (
            <span>
              {minVal}–{maxVal}m
            </span>
          ) : neitherAreDefined ? null : (
            <span>{minVal ?? maxVal ?? ""}m</span>
          )
        ) : (
          <div className="d-flex align-items-center">
            <MetersField
              removeLabel={true}
              removeBottomMargin={true}
              name={minName}
              className="flex-grow-1"
              placeholder={formatMessage({ id: "min" })}
            />
            <span className="mx-3">
              <CommonMessage id="to" />
            </span>
            <MetersField
              removeLabel={true}
              removeBottomMargin={true}
              name={maxName}
              className="flex-grow-1"
              placeholder={formatMessage({ id: "max" })}
            />
          </div>
        )}
      </div>
    </label>
  );
}
