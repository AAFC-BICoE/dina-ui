import { ColumnDefinition, FieldHeader, useQuery } from "common-ui";
import { Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import ReactTable, { Column } from "react-table";
import {
  ExtensionField,
  FieldExtension
} from "../../../../dina-ui/types/collection-api/resources/FieldExtension";
import Select from "react-select";
import { useState } from "react";
import { find } from "lodash";

function getTableColumn(locale: string) {
  const TABLE_COLUMNS: ColumnDefinition<ExtensionField>[] = [
    "key",
    "name",
    {
      Cell: ({ original: { multilingualDescription } }) => {
        const desc =
          find(
            multilingualDescription?.descriptions || [],
            (item) => item.lang === locale
          )?.desc || "";
        return desc;
      },
      accessor: "multilingualDescription"
    },
    "dinaComponent"
  ];

  return TABLE_COLUMNS.map<Column>((column) => {
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
          <ReactTable
            key={fields?.length}
            className="-striped"
            columns={getTableColumn(locale)}
            data={fields ?? response?.data?.[0].extension.fields}
            minRows={1}
            showPagination={true}
            showPaginationTop={true}
          />
        </div>
      </main>
    </div>
  );
}
