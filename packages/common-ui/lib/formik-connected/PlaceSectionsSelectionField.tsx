import { ColumnDef } from "@tanstack/react-table";
import { useFormikContext } from "formik";
import { Dispatch, SetStateAction } from "react";
import { SourceAdministrativeLevel } from "../../../dina-ui/types/collection-api/resources/GeographicPlaceNameSourceDetail";
import { FieldHeader } from "../field-header/FieldHeader";
import { ReactTable } from "../table/ReactTable";
import { FieldWrapper, FieldWrapperProps } from "./FieldWrapper";
import { useGroupedCheckBoxes } from "./GroupedCheckBoxFields";
import _ from "lodash";

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
      },
      {
        id: "placeType",
        accessorKey: "placeType",
        header: () => <FieldHeader name="type" />,
        cell: ({ getValue }) => {
          // Uppercase the first letter of the place type.
          const value = getValue<string>();
          if (!value) return null;
          return <span>{value.charAt(0).toUpperCase() + value.slice(1)}</span>;
        },
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
        <div
          key={val?.id ?? val.shortId ?? val?.name}
          className="mb-1 d-flex align-items-center"
        >
          <span>{val?.name ?? val?.id ?? val?.toString()}</span>
          {val?.placeType && (
            <span className="badge bg-secondary ms-2">
              {_.startCase(val.placeType)}
            </span>
          )}
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
          <ReactTable<SourceAdministrativeLevel>
            className="-striped"
            columns={PLACE_SECTIONS_TABLE_COLUMNS}
            data={displayData}
            showPagination={false}
            enableSorting={false}
          />
        );
      }}
    </FieldWrapper>
  );
}
