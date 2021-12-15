import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  dateCell,
  FilterAttribute,
  filterBy,
  ListPageLayout,
  stringArrayCell
} from "common-ui";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import { Footer, GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  MaterialSample,
  MaterialSampleType
} from "../../../types/collection-api";

export interface SampleListLayoutProps {
  onSelect?: (sample: PersistedResource<MaterialSample>) => void;
  classNames?: string;
  btnMsg?: string;
  hideTopPagination?: boolean;
  hideGroupFilter?: boolean;
  showBulkActions?: boolean;
  openLinkInNewTab?: boolean;
}

export const getColumnDefinition = ({ openLinkInNewTab }) => {
  return [
    {
      Cell: ({
        original: { id, materialSampleName, dwcOtherCatalogNumbers }
      }) => (
        <a
          href={`/collection/material-sample/view?id=${id}`}
          target={openLinkInNewTab ? "_blank" : ""}
        >
          {materialSampleName || dwcOtherCatalogNumbers?.join?.(", ") || id}
        </a>
      ),
      accessor: "materialSampleName"
    },
    {
      Cell: ({ original: { collection } }) =>
        collection?.id ? (
          <Link href={`/collection/collection/view?id=${collection?.id}`}>
            {collection?.name}
          </Link>
        ) : null,
      accessor: "collection.name"
    },
    stringArrayCell("dwcOtherCatalogNumbers"),
    { accessor: "materialSampleType.name" },
    "createdBy",
    dateCell("createdOn")
  ];
};

export function SampleListLayout({
  onSelect,
  classNames,
  btnMsg,
  hideTopPagination,
  hideGroupFilter,
  showBulkActions,
  openLinkInNewTab
}: SampleListLayoutProps) {
  const { formatMessage } = useDinaIntl();
  const MATERIAL_SAMPLE_FILTER_ATTRIBUTES: FilterAttribute[] = [
    "materialSampleName",
    "dwcOtherCatalogNumbers",
    "createdBy",
    "collection.name",
    "collection.code",
    {
      name: "materialSampleType.uuid",
      type: "DROPDOWN",
      resourcePath: "collection-api/material-sample-type",
      filter: filterBy(["name"]),
      optionLabel: (it: PersistedResource<MaterialSampleType>) => it.name
    },
    {
      name: "createdOn",
      type: "DATE"
    }
  ];

  const columns = [
    ...getColumnDefinition({ openLinkInNewTab }),
    ...(onSelect
      ? [
          {
            Cell: ({ original: sample }) => (
              <div className="d-flex">
                <button
                  type="button"
                  className={classNames}
                  onClick={() => onSelect(sample)}
                >
                  {btnMsg}
                </button>
              </div>
            ),
            Header: formatMessage("actions"),
            sortable: false
          }
        ]
      : [])
  ];

  return (
    <ListPageLayout
      additionalFilters={filterForm => ({
        // Apply group filter:
        ...(filterForm.group && { rsql: `group==${filterForm.group}` })
      })}
      filterAttributes={MATERIAL_SAMPLE_FILTER_ATTRIBUTES}
      id="material-sample-list"
      queryTableProps={{
        columns,
        path: "collection-api/material-sample",
        include: "collection,materialSampleType",
        hideTopPagination
      }}
      filterFormchildren={({ submitForm }) =>
        !hideGroupFilter ? (
          <div className="mb-3">
            <div style={{ width: "300px" }}>
              <GroupSelectField
                onChange={() => setImmediate(submitForm)}
                name="group"
                showAnyOption={true}
              />
            </div>
          </div>
        ) : (
          <></>
        )
      }
      bulkDeleteButtonProps={
        showBulkActions
          ? {
              typeName: "material-sample",
              apiBaseUrl: "/collection-api"
            }
          : undefined
      }
      bulkEditPath={
        showBulkActions
          ? ids => ({
              pathname: "/collection/material-sample/bulk-edit",
              query: { ids: ids.join(",") }
            })
          : undefined
      }
    />
  );
}

export default function MaterialSampleListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("materialSampleListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="materialSampleListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/material-sample" />
          <Link href={`/collection/material-sample/bulk-create`}>
            <a className="btn btn-primary">
              <DinaMessage id="bulkCreate" />
            </a>
          </Link>
        </ButtonBar>
        <SampleListLayout showBulkActions={true} openLinkInNewTab={false} />
      </main>
      <Footer />
    </div>
  );
}
