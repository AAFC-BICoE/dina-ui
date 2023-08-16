import { GroupedCheckboxWithLabel, TextField } from "..";
import { CustomMenuProps } from "../../../dina-ui/components/collection/material-sample/GenerateLabelDropdownButton";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import React, { useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { useIntl } from "react-intl";
import { startCase } from "lodash";

export interface ColumnChooserProps {
  columns: any[];
  setCheckedIds: React.Dispatch<React.SetStateAction<string[]>>;
  checkedIds: string[];
  isCheckAll: boolean;
  setIsCheckAll: React.Dispatch<React.SetStateAction<boolean>>;
}
export function ColumnChooser({
  columns,
  checkedIds,
  setCheckedIds,
  isCheckAll,
  setIsCheckAll
}: ColumnChooserProps) {
  const { formatMessage, messages } = useIntl();
  const columnSearchMapping: any[] = columns.map((column) => {
    const messageKey = `field_${column.id}`;
    const label = messages[messageKey]
      ? formatMessage({ id: messageKey as any })
      : startCase(column.id);
    return { label: label.toLowerCase(), id: column.id };
  });
  const [searchedColumns, setSearchedColumns] = useState<any[]>(columns);
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
          aria-labelledby={props.labeledBy}
        >
          <TextField
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
          <GroupedCheckboxWithLabel
            resources={searchedColumns}
            isField={true}
            checkedIds={checkedIds}
            setCheckedIds={setCheckedIds}
            isCheckAll={isCheckAll}
            setIsCheckAll={setIsCheckAll}
          />
        </div>
      );
    }
  );
  return (
    <Dropdown>
      <Dropdown.Toggle>
        <DinaMessage id="selectColumn" />
      </Dropdown.Toggle>
      <Dropdown.Menu as={CustomMenu} />
    </Dropdown>
  );
}
