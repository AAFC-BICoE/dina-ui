import { useLocalStorage } from "@rehooks/local-storage";
import { ColumnDef } from "@tanstack/react-table";
import { FieldHeader, ReactTable, descriptionCell, useQuery } from "common-ui";
import { FreeTextFilterForm } from "packages/common-ui/lib/list-page-layout/FreeTextFilterForm";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import Select from "react-select";
import {
  ExtensionField,
  FieldExtension
} from "../../../../dina-ui/types/collection-api/resources/FieldExtension";
import { useDinaIntl } from "../../../intl/dina-ui-intl";

function getTableColumn() {
  const TABLE_COLUMNS: ColumnDef<ExtensionField>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: () => <FieldHeader name={"name"} />
    },
    descriptionCell(false, true, "multilingualDescription"),
    {
      id: "vocabularyElementType",
      accessorKey: "vocabularyElementType",
      header: () => <FieldHeader name={"type"} />
    },
    {
      id: "unit",
      accessorKey: "unit",
      header: () => <FieldHeader name={"unit"} />
    },

    {
      id: "dinaComponent",
      accessorKey: "dinaComponent",
      header: () => <FieldHeader name={"dinaComponent"} />
    }
  ];
  return TABLE_COLUMNS;
}

export default function FieldListPage() {
  const { locale } = useDinaIntl();
  const { formatMessage } = useDinaIntl();
  const id = "collection-module-extension-field";
  // Use a localStorage hook to get the filter form state,
  // and re-render when the watched localStorage key is changed.
  const [filterForm] = useLocalStorage<any>(`${id}_filterForm`, {});
  const [selectedExtensionId, setSelectedExtensionId] = useLocalStorage<string>(
    `${id}-selectedExtensionId`
  );

  const { response, loading } = useQuery<FieldExtension[]>({
    path: `collection-api/extension`
  });

  if (loading) return null;

  const extensionOptions = response?.data.map((data) => ({
    label: data.extension.name,
    value: data.id
  }));

  if (!selectedExtensionId && extensionOptions && extensionOptions.length > 0) {
    setSelectedExtensionId(extensionOptions[0].value);
  }

  const onExtensionSelectionChanged = (option) => {
    setSelectedExtensionId(option.value);
  };

  const filterExtensionFields = (extensions?: FieldExtension[]) => {
    if (!extensions) {
      return [];
    } else {
      const fields =
        extensions.find((item) => item.id === selectedExtensionId)?.extension
          .fields ?? [];
      return fields.filter((value) => {
        if (filterForm?.filterBuilderModel?.value) {
          return (
            value.name
              .toLowerCase()
              .indexOf(filterForm.filterBuilderModel.value.toLowerCase()) >
              -1 ||
            (
              value.multilingualDescription?.descriptions?.filter(
                (item) =>
                  item.lang === locale &&
                  (item.desc ?? "")
                    .toLowerCase()
                    .indexOf(
                      filterForm.filterBuilderModel.value.toLowerCase()
                    ) > -1
              ) ?? []
            ).length > 0
          );
        } else {
          return true;
        }
      });
    }
  };

  const extensionFields = filterExtensionFields(response?.data);

  return (
    <PageLayout titleId="extensionListTitle">
      <div className="d-flex flex-column">
        <span style={{ fontWeight: "bold" }} className="mt-1">
          {" "}
          {formatMessage("selectAnExtenstion")}{" "}
        </span>
        <Select
          options={extensionOptions}
          onChange={onExtensionSelectionChanged}
          defaultValue={extensionOptions?.[0]}
        />
        <FreeTextFilterForm
          filterAttributes={["name", "multilingualDescription"]}
          id={id}
        />

        <span style={{ fontWeight: "bold" }} className="mt-3">
          {" "}
          {formatMessage("totalExtenstionFieldsCount")}:{" "}
          {extensionFields?.length ??
            response?.data?.[0].extension.fields.length}{" "}
        </span>
        <ReactTable<ExtensionField>
          key={extensionFields?.length}
          className="-striped"
          columns={getTableColumn()}
          data={extensionFields ?? []}
          showPagination={true}
          showPaginationTop={true}
          enableSorting={true}
          enableMultiSort={true}
        />
      </div>
    </PageLayout>
  );
}
