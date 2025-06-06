import { connect, Field } from "formik";
import { KitsuResource } from "kitsu";
import _ from "lodash";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { CommonMessage } from "../intl/common-ui-intl";
import { Tooltip } from "../tooltip/Tooltip";
import { useIntl } from "react-intl";
import { useFormikContext } from "formik";

export interface CheckBoxFieldProps<TData extends KitsuResource> {
  resource: TData;
  fileHyperlinkId?: string;
  disabled?: boolean;
  setCustomGeographicPlaceCheckboxState?: Dispatch<SetStateAction<boolean>>;
  className?: string;
}

export interface GroupedCheckBoxesParams<TData extends KitsuResource> {
  fieldName: string;
  detachTotalSelected?: boolean;
  defaultAvailableItems?: TData[];
  setCustomGeographicPlaceCheckboxState?: Dispatch<SetStateAction<boolean>>;
}

export type ExtendedKitsuResource = KitsuResource & { shortId?: number };

const SELECT_ALL_PREFIX = `selectAll`;

export function useGroupedCheckBoxes<TData extends ExtendedKitsuResource>({
  fieldName,
  detachTotalSelected,
  defaultAvailableItems,
  setCustomGeographicPlaceCheckboxState
}: GroupedCheckBoxesParams<TData>) {
  const [availableItems, setAvailableItems] = useState<TData[]>([]);
  const lastCheckedItemRef = useRef<TData>();
  const { formatMessage } = useIntl();
  const formik = useFormikContext<any>();
  const selectAllName = `${SELECT_ALL_PREFIX}.${fieldName}`;
  useEffect(() => {
    const selectedSectionsDefault = defaultAvailableItems?.map((_data) => true);
    if (selectedSectionsDefault && selectedSectionsDefault?.length > 0) {
      formik?.setFieldValue?.(fieldName, selectedSectionsDefault);
      formik?.setFieldValue?.(selectAllName, true);
    }
  }, []);

  function CheckBoxField({
    resource,
    fileHyperlinkId,
    disabled,
    className
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
            <div className={className ?? "d-flex w-100 h-100"}>
              <div className="mx-auto my-auto">
                <input
                  disabled={disabled}
                  aria-labelledby={`select-column-header ${fileHyperlinkId}`}
                  checked={disabled ? false : value || false}
                  onClick={onCheckBoxClick}
                  onChange={_.noop}
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

  function CheckAllCheckBox() {
    return (
      <Field name={selectAllName}>
        {({ field: { value }, form: { setFieldValue, setFieldTouched } }) => {
          function onCheckAllCheckBoxClick(e) {
            const { checked } = e.target;
            const computedAvailableItems =
              (defaultAvailableItems as TData[]) ?? availableItems;
            setFieldValue(selectAllName, checked);
            setFieldTouched(selectAllName);

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
              defaultChecked={value || false}
            />
          );
        }}
      </Field>
    );
  }

  /** Table column header with a CheckAllCheckBox for the QueryTable. */
  const CheckBoxHeader = connect(({ formik: { values } }) => {
    const totalChecked = _.toPairs(values[fieldName]).filter(
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
    const totalChecked = _.toPairs(values[fieldName]).filter(
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
    availableItems,
    DetachedTotalSelected
  };
}
