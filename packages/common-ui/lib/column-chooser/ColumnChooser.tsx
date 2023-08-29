import { useGroupedCheckboxWithLabel, TextField } from "..";
import { CustomMenuProps } from "../../../dina-ui/components/collection/material-sample/GenerateLabelDropdownButton";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import React, { useEffect, useRef, useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { useIntl } from "react-intl";
import { startCase } from "lodash";

export function ColumnChooser(
  CustomMenu: React.ForwardRefExoticComponent<
    CustomMenuProps & React.RefAttributes<HTMLDivElement>
  >
) {
  return (
    <Dropdown autoClose={"outside"}>
      <Dropdown.Toggle>
        <DinaMessage id="selectColumn" />
      </Dropdown.Toggle>
      <Dropdown.Menu as={CustomMenu} />
    </Dropdown>
  );
}
export interface UseColumnChooserProps {
  columns: any[];
}
export function useColumnChooser({ columns }: UseColumnChooserProps) {
  const { formatMessage, messages } = useIntl();
  const columnSearchMapping: any[] = columns.map((column) => {
    const messageKey = `field_${column.id}`;
    const label = messages[messageKey]
      ? formatMessage({ id: messageKey as any })
      : startCase(column.id);
    return { label: label.toLowerCase(), id: column.id };
  });
  const { CustomMenu, checkedIds } = useCustomMenu(
    columns,
    columnSearchMapping
  );
  const columnChooser = ColumnChooser(CustomMenu);
  return { columnChooser, checkedIds };
}

function useCustomMenu(columns: any[], columnSearchMapping: any[]) {
  const [searchedColumns, setSearchedColumns] = useState<any[]>(columns);
  const { groupedCheckBoxes, checkedIds } = useGroupedCheckboxWithLabel({
    resources: searchedColumns,
    isField: true
  });
  const testRef = useRef<any>();
  useEffect(() => {
    testRef?.current?.focus();
  }, []);
  const CustomMenu = React.forwardRef(
    (props: CustomMenuProps, ref: React.Ref<HTMLDivElement>) => {
      return (
        <div
          ref={ref}
          style={{
            ...props.style,
            width: "400px",
            padding: "20px",
            zIndex: 1
          }}
          className={props.className}
          aria-labelledby={props.labelledBy}
        >
          <TextField
            inputProps={{ autoFocus: true }}
            name="filterColumns"
            placeholder="Search"
            onChangeExternal={(_form, _name, value) => {
              if (value === "" || !value) {
                setSearchedColumns(columns);
              } else {
                const searchedColumnsIds = columnSearchMapping
                  .filter((columnMapping) =>
                    columnMapping.label.includes(value?.toLowerCase())
                  )
                  .map((filteredMapping) => filteredMapping.id);
                const filteredColumns = columns.filter((column) =>
                  searchedColumnsIds.includes(column.id)
                );
                setSearchedColumns(filteredColumns);
              }
            }}
          />
          <Dropdown.Divider />
          {groupedCheckBoxes}
        </div>
      );
    }
  );
  return { CustomMenu, checkedIds };
}
