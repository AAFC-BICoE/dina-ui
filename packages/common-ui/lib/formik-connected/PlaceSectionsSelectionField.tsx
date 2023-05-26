import { FieldWrapper, FieldWrapperProps } from "./FieldWrapper";
import { SourceAdministrativeLevel } from "../../../dina-ui/types/collection-api/resources/GeographicPlaceNameSourceDetail";
import React, { Dispatch, SetStateAction } from "react";
import ReactTable, { Column } from "react-table";
import { ColumnDefinition } from "../table/QueryTable";
import { useGroupedCheckBoxes } from "./GroupedCheckBoxFields";
import { FieldHeader } from "../field-header/FieldHeader";
import { useFormikContext } from "formik";
import { ReactTable8 } from "../table8/ReactTable8";
import { ColumnDef } from "@tanstack/react-table";

export interface PlaceSectionsSelectionFieldProps extends FieldWrapperProps {
  isDisabled?: boolean;
  hideSelectionCheckBox?: boolean;
  setCustomGeographicPlaceCheckboxState?: Dispatch<SetStateAction<boolean>>;
  customPlaceValue?: string;
}

/** Formik-connected table for selecting sections from one search result. */
export function PlaceSectionsSelectionField(
  placeSectionsSelectionFieldProps: PlaceSectionsSelectionFieldProps
) {
  const {
    setCustomGeographicPlaceCheckboxState,
    customPlaceValue,
    hideSelectionCheckBox,
    ...placeFieldProps
  } = placeSectionsSelectionFieldProps;

  const { values } = useFormikContext<any>();

  const displayData = values.srcAdminLevels.map((opt, idx) => {
    opt.type = "place-section";
    opt.shortId = idx;
    return opt;
  });

  const { CheckBoxField, CheckBoxHeader } = useGroupedCheckBoxes({
    fieldName: "selectedSections",
    defaultAvailableItems: displayData,
    setCustomGeographicPlaceCheckboxState
  });

  const PLACE_SECTIONS_TABLE_READONLY_COLUMNS: ColumnDef<SourceAdministrativeLevel>[] =
    [
      {
        id: "name",
        accessorKey: "name",
        header: () => <FieldHeader name="name" />,
        enableSorting: false
      }
    ];

  const PLACE_SECTIONS_TABLE_COLUMNS: ColumnDef<SourceAdministrativeLevel>[] = [
    ...PLACE_SECTIONS_TABLE_READONLY_COLUMNS,
    ...(!hideSelectionCheckBox
      ? [
          {
            id: "select",
            cell: ({ row: { original: section } }) => {
              const disableCustomGeographicPlace =
                !!customPlaceValue && !section.id && section.shortId !== 0;
              return (
                <CheckBoxField
                  key={section.id}
                  resource={section}
                  disabled={disableCustomGeographicPlace}
                  setCustomGeographicPlaceCheckboxState={
                    !section.id
                      ? setCustomGeographicPlaceCheckboxState
                      : undefined
                  }
                />
              );
            },
            header: () => <CheckBoxHeader />,
            enableSorting: false
          }
        ]
      : [])
  ];

  const defaultReadOnlyRender = (
    value?: SourceAdministrativeLevel[] | null
  ) => (
    <div className="read-only-view">
      {value?.map((val) => (
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
      key={displayData.map((data) => data.shortId).join()}
    >
      {() => {
        return (
          <ReactTable8<SourceAdministrativeLevel>
            className="-striped"
            columns={PLACE_SECTIONS_TABLE_COLUMNS}
            data={displayData}
            showPagination={false}
          />
        );
      }}
    </FieldWrapper>
  );
}
