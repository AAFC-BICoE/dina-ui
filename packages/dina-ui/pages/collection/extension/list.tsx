import { FieldHeader, ReactTable8, useQuery } from "common-ui";
import { Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ColumnDef } from "@tanstack/react-table";
import {
  ExtensionField,
  FieldExtension
} from "../../../../dina-ui/types/collection-api/resources/FieldExtension";
import Select from "react-select";
import { useState } from "react";
import { find } from "lodash";

function getTableColumn(locale: string) {
  const TABLE_COLUMNS: ColumnDef<ExtensionField>[] = [
    {
      id: "key",
      accessorKey: "key",
      header: () => <FieldHeader name={"key"} />
    },
    {
      id: "name",
      accessorKey: "name",
      header: () => <FieldHeader name={"name"} />
    },
    {
      id: "multilingualDescription",
      cell: ({
        row: {
          original: { multilingualDescription }
        }
      }) => {
        const desc =
          find(
            multilingualDescription?.descriptions || [],
            (item) => item.lang === locale
          )?.desc || "";
        return desc;
      },
      header: () => <FieldHeader name={"multilingualDescription"} />
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
  const [fields, setFields] = useState<ExtensionField[]>();

  const { response, loading } = useQuery<FieldExtension[]>({
    path: `collection-api/extension`
  });

  if (loading) return null;

  const extensionOptions = response?.data.map((data) => ({
    label: data.extension.name,
    value: data.id
  }));

  const onExtensionSelectionChanged = (option) => {
    const selectedExtension = response?.data.filter(
      (data) => data.id === option.value
    );
    setFields(selectedExtension?.[0].extension.fields);
  };

  return (
    <div>
      <Head title={formatMessage("extensionListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="extensionListTitle" />
        </h1>
        <div className="d-flex flex-column">
          <span style={{ fontWeight: "bold" }} className="mt-3">
            {" "}
            {formatMessage("selectAnExtenstion")}{" "}
          </span>
          <Select
            options={extensionOptions}
            onChange={onExtensionSelectionChanged}
            defaultValue={extensionOptions?.[0]}
          />

          <span style={{ fontWeight: "bold" }} className="mt-3">
            {" "}
            {formatMessage("totalExtenstionFieldsCount")}:{" "}
            {fields?.length ?? response?.data?.[0].extension.fields.length}{" "}
          </span>
          <ReactTable8<ExtensionField>
            key={fields?.length}
            className="-striped"
            columns={getTableColumn(locale)}
            data={fields ?? response?.data?.[0]?.extension?.fields ?? []}
            showPagination={true}
            showPaginationTop={true}
          />
        </div>
      </main>
    </div>
  );
}
