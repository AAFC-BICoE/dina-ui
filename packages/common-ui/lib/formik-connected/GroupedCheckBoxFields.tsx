import { connect, Field } from "formik";
import { KitsuResource } from "kitsu";
import { noop, toPairs } from "lodash";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { CommonMessage } from "../intl/common-ui-intl";
import { Tooltip } from "../tooltip/Tooltip";
import { useIntl } from "react-intl";

export interface CheckBoxFieldProps<TData extends KitsuResource> {
  resource: TData;
  fileHyperlinkId?: string;
  disabled?: boolean;
  setCustomGeographicPlaceCheckboxState?: Dispatch<SetStateAction<boolean>>;
}

export interface GroupedCheckBoxesParams<TData extends KitsuResource> {
  fieldName: string;
  detachTotalSelected?: boolean;
  defaultAvailableItems?: TData[];
  setCustomGeographicPlaceCheckboxState?: Dispatch<SetStateAction<boolean>>;
}

export type ExtendedKitsuResource = KitsuResource & { shortId?: number };

export function useGroupedCheckBoxes<TData extends ExtendedKitsuResource>({
  fieldName,
  detachTotalSelected,
  defaultAvailableItems,
  setCustomGeographicPlaceCheckboxState
}: GroupedCheckBoxesParams<TData>) {
  const [availableItems, setAvailableItems] = useState<TData[]>([]);
  const lastCheckedItemRef = useRef<TData>();
  const { formatMessage } = useIntl();

  function CheckBoxField({
    resource,
    fileHyperlinkId,
    disabled
  }: CheckBoxFieldProps<TData>) {
    const thisBoxFieldName = `${fieldName}[${resource.shortId ?? resource.id}]`;
    const computedAvailableItems =
      (defaultAvailableItems as TData[]) ?? availableItems;

    return (
      <Field name={thisBoxFieldName}>
        {({ field: { value }, form: { setFieldValue, setFieldTouched } }) => {
          function onCheckBoxClick(e) {
            setFieldValue(thisBoxFieldName, e.target.checked);
            setFieldTouched(thisBoxFieldName);
            if (!resource.id) {
              setCustomGeographicPlaceCheckboxState?.(e.target.checked);
            }

            if (lastCheckedItemRef.current && e.shiftKey) {
              const checked: boolean = (e.target as any).checked;

              const currentIndex = computedAvailableItems.indexOf(resource);
              const lastIndex = computedAvailableItems.indexOf(
                lastCheckedItemRef.current
              );
              const [lowIndex, highIndex] = [currentIndex, lastIndex].sort(
                (a, b) => a - b
              );
              const itemsToToggle = computedAvailableItems.slice(
                lowIndex,
                highIndex + 1
              );

              for (const item of itemsToToggle) {
                setFieldValue(
                  `${fieldName}[${item.shortId ?? item.id}]`,
                  checked
                );
              }
            }
            lastCheckedItemRef.current = resource;
          }

          return (
            <div className="d-flex w-100 h-100">
              <div className="mx-auto my-auto">
                <input
                  disabled={disabled}
                  aria-labelledby={`select-column-header ${fileHyperlinkId}`}
                  checked={disabled ? false : value || false}
                  onClick={onCheckBoxClick}
                  onChange={noop}
                  style={{
                    display: "block",
                    height: "20px",
                    width: "20px"
                  }}
                  type="checkbox"
                  value={value || false}
                />
              </div>
            </div>
          );
        }}
      </Field>
    );
  }

  const CheckAllCheckBox = connect(({ formik: { setFieldValue } }) => {
    function onCheckAllCheckBoxClick(e) {
      const { checked } = e.target;
      const computedAvailableItems =
        (defaultAvailableItems as TData[]) ?? availableItems;

      computedAvailableItems.forEach((item, index) => {
        if (item.id || index === 0) {
          setFieldValue(
            `${fieldName}[${item?.shortId ?? item.id}]`,
            checked || undefined
          );
        }

        // If custom place name is checked, disable custom place name textbox
        if (!item.id && setCustomGeographicPlaceCheckboxState) {
          setCustomGeographicPlaceCheckboxState(checked);
        }
      });
    }

    return (
      <input
        aria-label={formatMessage({ id: "checkAll" })}
        className="check-all-checkbox"
        onClick={onCheckAllCheckBoxClick}
        style={{ height: "20px", width: "20px", marginLeft: "5px" }}
        type="checkbox"
      />
    );
  });

  /** Table column header with a CheckAllCheckBox for the QueryTable. */
  const CheckBoxHeader = connect(({ formik: { values } }) => {
    const totalChecked = toPairs(values[fieldName]).filter(
      (pair) => pair[1]
    ).length;
    return (
      <div className="grouped-checkbox-header text-center">
        <div>
          <span id="select-column-header">
            <CommonMessage id="select" />
          </span>
          <CheckAllCheckBox />
          <Tooltip id="checkAllTooltipMessage" />
          {!detachTotalSelected && (
            <div>
              ({totalChecked} <CommonMessage id="selected" />)
            </div>
          )}
        </div>
      </div>
    );
  });

  const DetachedTotalSelected = connect(({ formik: { values } }) => {
    const totalChecked = toPairs(values[fieldName]).filter(
      (pair) => pair[1]
    ).length;
    return (
      <div>
        {totalChecked} <CommonMessage id="selected" />
      </div>
    );
  });

  return {
    CheckAllCheckBox,
    CheckBoxField,
    CheckBoxHeader,
    setAvailableItems,
    DetachedTotalSelected
  };
}
