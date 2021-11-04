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
import { Footer, Head, Nav } from "../../../components";
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
}

export function SampleListLayout({
  onSelect,
  classNames,
  btnMsg,
  hideTopPagination
}: SampleListLayoutProps) {
  const { formatMessage } = useDinaIntl();
  const MATERIAL_SAMPLE_FILTER_ATTRIBUTES: FilterAttribute[] = [
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

  const MATERIAL_SAMPLE_TABLE_COLUMNS: ColumnDefinition<MaterialSample>[] = [
    {
      Cell: ({
        original: { id, materialSampleName, dwcOtherCatalogNumbers }
      }) => (
        <Link href={`/collection/material-sample/view?id=${id}`}>
          {materialSampleName || dwcOtherCatalogNumbers?.join?.(", ") || id}
        </Link>
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
    dateCell("createdOn"),
    onSelect
      ? {
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
      : {}
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
        columns: MATERIAL_SAMPLE_TABLE_COLUMNS,
        path: "collection-api/material-sample",
        include: "collection,materialSampleType",
        hideTopPagination
      }}
    />
  );
}

export default function MaterialSampleListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head
        title={formatMessage("materialSampleListTitle")}
        lang={formatMessage("languageOfPage")}
        creator={formatMessage("agricultureCanada")}
        subject={formatMessage("subjectTermsForPage")}
      />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="materialSampleListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/material-sample" />
        </ButtonBar>
        <SampleListLayout />
      </main>
      <Footer />
    </div>
  );
}
