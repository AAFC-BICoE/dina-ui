import {
  ButtonBar,
  CreateButton,
  dateCell,
  DeleteButton,
  FilterAttribute,
  filterBy,
  ListPageLayout,
  QueryPage,
  stringArrayCell,
  useAccount,
  useQuery,
  withResponse
} from "common-ui";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import { Footer, GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  MaterialSample,
  MaterialSampleType
} from "../../../types/collection-api";
import { useState } from "react";

export interface SampleListLayoutProps {
  onSelect?: (sample: PersistedResource<MaterialSample>) => void;
  classNames?: string;
  btnMsg?: string;
  hideTopPagination?: boolean;
  hideGroupFilter?: boolean;
  showBulkActions?: boolean;
}

export const getColumnDefinition = () => {
  return [
    {
      Cell: ({
        original: { id, materialSampleName, dwcOtherCatalogNumbers }
      }) => (
        <a href={`/collection/material-sample/view?id=${id}`}>
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
    { accessor: "materialSampleType" },
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
  showBulkActions
}: SampleListLayoutProps) {
  const { formatMessage } = useDinaIntl();
  const MATERIAL_SAMPLE_FILTER_ATTRIBUTES: FilterAttribute[] = [
    "materialSampleName",
    "dwcOtherCatalogNumbers",
    "createdBy",
    "collection.name",
    "collection.code",
    "materialSampleType",
    {
      name: "createdOn",
      type: "DATE"
    }
  ];

  const [queryKey, setQueryKey] = useState("");

  const columns = [
    ...getColumnDefinition(),
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
      : [
          {
            Cell: ({ original: sample }) => (
              <div className="d-flex">
                <Link href={`/collection/material-sample/view?id=${sample.id}`}>
                  <a className="btn btn-link">
                    <DinaMessage id="view" />
                  </a>
                </Link>
                <Link href={`/collection/material-sample/edit?id=${sample.id}`}>
                  <a className="btn btn-link">
                    <DinaMessage id="editButtonText" />
                  </a>
                </Link>
                <DeleteButton
                  replaceClassName="btn btn-link"
                  type="material-sample"
                  id={sample.id}
                  options={{ apiBaseUrl: "/collection-api" }}
                  onDeleted={() => setQueryKey(String(Math.random()))}
                />
              </div>
            ),
            Header: "",
            sortable: false
          }
        ])
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
        include: "collection",
        hideTopPagination,
        deps: [queryKey]
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
  const [queryKey, setQueryKey] = useState("");
  const { groupNames } = useAccount();
  const queryState = useQuery<MaterialSample[]>(
    {
      path: "collection-api/material-sample",
      include: "collection",
      filter: { rsql: `group=in=(${groupNames?.[0]})` }
    },
    {}
  );
  const { error, loading, response } = queryState;
  const columns = [
    ...getColumnDefinition(),
    ...[
      {
        Cell: ({ original: sample }) => (
          <div className="d-flex">
            <Link href={`/collection/material-sample/view?id=${sample.id}`}>
              <a className="btn btn-link">
                <DinaMessage id="view" />
              </a>
            </Link>
            <Link href={`/collection/material-sample/edit?id=${sample.id}`}>
              <a className="btn btn-link">
                <DinaMessage id="editButtonText" />
              </a>
            </Link>
            <DeleteButton
              replaceClassName="btn btn-link"
              type="material-sample"
              id={sample.id}
              options={{ apiBaseUrl: "/collection-api" }}
              onDeleted={() => setQueryKey(String(Math.random()))}
            />
          </div>
        ),
        Header: "",
        sortable: false
      }
    ]
  ];
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
        {withResponse({ loading, error, response }, () => (
          <QueryPage
            indexName={"dina_material_sample_index"}
            columns={columns}
            initData={response?.data}
            bulkDeleteButtonProps={{
              typeName: "material-sample",
              apiBaseUrl: "/collection-api"
            }}
            bulkEditPath={ids => ({
              pathname: "/collection/material-sample/bulk-edit",
              query: { ids: ids.join(",") }
            })}
          />
        ))}
      </main>
      <Footer />
    </div>
  );
}
