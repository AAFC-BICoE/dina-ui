import { FieldWrapper, FieldWrapperProps } from "./FieldWrapper";
import { SourceAdministrativeLevel } from "../../../dina-ui/types/collection-api/resources/GeographicPlaceNameSourceDetail";
import React from "react";
import ReactTable, { Column } from "react-table";
import { ColumnDefinition } from "../table/QueryTable";
import { useGroupedCheckBoxes } from "./GroupedCheckBoxFields";
import { FieldHeader } from "../field-header/FieldHeader";
import { useFormikContext } from "formik";

export interface PlaceSectionsSelectionFieldProps extends FieldWrapperProps {
  isDisabled?: boolean;
  hideSelectionCheckBox?: boolean;
}

/** Formik-connected table for selecting sections from one search result. */
export function PlaceSectionsSelectionField(
  placeSectionsSelectionFieldProps: PlaceSectionsSelectionFieldProps
) {
  const { hideSelectionCheckBox, ...placeFieldProps } =
    placeSectionsSelectionFieldProps;

  const { values } = useFormikContext<any>();

  const displayData = values.srcAdminLevels.map((opt, idx) => {
    opt.type = "place-section";
    opt.shortId = idx;
    return opt;
  });

  const { CheckBoxField, CheckBoxHeader } = useGroupedCheckBoxes({
    fieldName: "selectedSections",
    defaultAvailableItems: displayData
  });

  const PLACE_SECTIONS_TABLE_READONLY_COLUMNS: ColumnDefinition<SourceAdministrativeLevel>[] =
    [
      {
        accessor: "name",
        sortable: false
      }
    ];

  const PLACE_SECTIONS_TABLE_COLUMNS: ColumnDefinition<SourceAdministrativeLevel>[] =
    [
      ...PLACE_SECTIONS_TABLE_READONLY_COLUMNS,
      ...(!hideSelectionCheckBox
        ? [
            {
              Cell: ({ original: section }) => (
                <CheckBoxField key={section.id} resource={section} />
              ),
              Header: CheckBoxHeader,
              sortable: false
            }
          ]
        : [])
    ];

  const mappedColumns = PLACE_SECTIONS_TABLE_COLUMNS.map<Column>(column => {
    const { fieldName, customHeader } =
      typeof column === "string"
        ? {
            customHeader: undefined,
            fieldName: column
          }
        : {
            customHeader: column.Header,
            fieldName: String(column.accessor)
          };

    const Header = customHeader ?? <FieldHeader name={fieldName} />;
    return {
      Header,
      ...(typeof column === "string" ? { accessor: column } : { ...column })
    };
  });

  const defaultReadOnlyRender = (
    value?: SourceAdministrativeLevel[] | null
  ) => (
    <div className="read-only-view">
      {value?.map(val => (
        <div key={val?.id ?? val.shortId ?? val?.name} className="mb-1">
          {" "}
          {val?.name ?? val?.id ?? val?.toString()}{" "}
        </div>
      ))}
    </div>
  );

  return (
    <FieldWrapper
      {...placeFieldProps}
      removeLabel={true}
      readOnlyRender={defaultReadOnlyRender}
      disableLabelClick={true}
      key={displayData.map(data => data.shortId).join()}
    >
      {() => {
        return (
          <ReactTable
            className="-striped"
            columns={mappedColumns}
            data={displayData}
            minRows={1}
            showPagination={false}
          />
        );
      }}
    </FieldWrapper>
  );
}
