import {
  DinaForm,
  FieldHeader,
  ReactTable,
  TextField,
  dateCell,
  stringArrayCell,
  useGroupedCheckBoxes
} from "..";
import { CustomMenuProps } from "../../../dina-ui/components/collection/material-sample/GenerateLabelDropdownButton";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import React, { useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import Select from "react-select";
import Button from "react-bootstrap/Button";
import { TableColumn } from "../list-page/types";
import Link from "next/link";

export interface ColumnChooserProps {
  columns: any[];
}
export function ColumnChooser({ columns }: ColumnChooserProps) {
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
          <TextField name="filterColumns" placeholder="Search" />
          <Dropdown.Divider />
          {columns.map((column) => {
            return (
              <div key={column.id}>
                {typeof column === "string" ? (
                  <FieldHeader name={column} />
                ) : (
                  column?.header &&
                  typeof column.header !== "string" &&
                  (column as any).header()
                )}
              </div>
            );
          })}
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
