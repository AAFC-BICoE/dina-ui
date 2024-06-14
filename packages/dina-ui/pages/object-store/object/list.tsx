import { useLocalStorage } from "@rehooks/local-storage";
import {
  dateCell,
  FieldHeader,
  FilterAttribute,
  filterBy,
  LoadingSpinner,
  QueryPage,
  stringArrayCell
} from "common-ui";
import Link from "next/link";
import { TableColumn } from "../../../../common-ui/lib/list-page/types";
import { Component, useMemo, useState } from "react";
import { Footer, Head, Nav, ThumbnailCell } from "../../../components";
import {
  MetadataPreview,
  StoredObjectGallery
} from "../../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Metadata, Person } from "../../../types/objectstore-api";
import Offcanvas from "react-bootstrap/Offcanvas";

type MetadataListLayoutType = "TABLE" | "GALLERY";

const LIST_LAYOUT_STORAGE_KEY = "metadata-list-layout";

const HIGHLIGHT_COLOR = "rgb(222, 252, 222)";

export const METADATA_FILTER_ATTRIBUTES: FilterAttribute[] = [
  "originalFilename",
  "dcFormat",
  "xmpRightsWebStatement",
  "dcRights",
  {
    name: "acDigitizationDate",
    type: "DATE"
  },
  {
    name: "xmpMetadataDate",
    type: "DATE"
  },
  {
    name: "acMetadataCreator",
    type: "DROPDOWN",
    resourcePath: "agent-api/person",
    filter: filterBy(["displayName"]),
    optionLabel: (person) => (person as Person).displayName ?? person.id
  }
];

export default function MetadataListPage() {
  const { formatMessage } = useDinaIntl();

  const [listLayoutType, setListLayoutType] =
    useLocalStorage<MetadataListLayoutType>(LIST_LAYOUT_STORAGE_KEY);

  const [previewMetadata, setPreviewMetadata] = useState<any | null>(null);
  const tableSectionWidth = previewMetadata?.id ? 10 : 12;

  const METADATA_TABLE_COLUMNS: TableColumn<Metadata>[] = [
    ThumbnailCell({
      bucketField: "data.attributes.bucket"
    }),
    {
      cell: ({ row: { original } }) =>
        (original as any)?.data?.attributes?.resourceExternalURL ? (
          <Link
            href={`/object-store/object/external-resource-view?id=${original?.id}`}
          >
            <a className="m-auto">
              <DinaMessage id="detailsPageLink" />
            </a>
          </Link>
        ) : (original as any).data?.attributes?.originalFilename ? (
          <Link
            href={`/object-store/object/view?id=${original.id}`}
            passHref={true}
          >
            <a id={`file-name-${original.id}`}>
              {(original as any).data?.attributes?.originalFilename}
            </a>
          </Link>
        ) : null,
      header: () => <FieldHeader name="originalFilename" />,
      accessorKey: "data.attributes.originalFilename",
      isKeyword: true,
      id: "originalFilename"
    },
    {
      header: () => <FieldHeader name="acCaption" />,
      accessorKey: "data.attributes.acCaption",
      isKeyword: true,
      id: "acCaption"
    },
    dateCell("acDigitizationDate", "data.attributes.acDigitizationDate"),
    dateCell("xmpMetadataDate", "data.attributes.xmpMetadataDate"),
    {
      cell: ({ row: { original } }) => (
        <>
          {
            (original as any).included?.acMetadataCreator?.attributes
              ?.displayName
          }
        </>
      ),
      header: () => <FieldHeader name="acMetadataCreator.displayName" />,
      relationshipType: "person",
      accessorKey: "included.attributes.displayName",
      isKeyword: true,
      enableSorting: false,
      id: "acMetadataCreator.displayName"
    },
    stringArrayCell("acTags", "data.attributes.acTags"),
    {
      id: "viewPreviewButtonText",
      cell: ({ row: { original } }) => (
        <div className="d-flex h-100">
          <button
            className="btn btn-info m-auto preview-button"
            onClick={() => setPreviewMetadata(original)}
            type="button"
          >
            <DinaMessage id="viewPreviewButtonText" />
          </button>
        </div>
      ),
      header: () => (
        <div id="acPreviewLinksHeader">
          <DinaMessage id="viewPreviewButtonText" />
        </div>
      ),
      enableSorting: false,
      size: 200
    }
  ];

  // Workaround to make sure react-table doesn't unmount TBodyComponent
  // when MetadataListPage is re-rendered:
  const TBodyGallery = useMemo(
    () =>
      class ReusedTBodyComponent extends Component {
        public static innerComponent;
        public render() {
          return ReusedTBodyComponent.innerComponent;
        }
      },
    []
  );

  return (
    <div>
      <Head title={formatMessage("objectListTitle")} />
      <Nav />
      <main className="large-container-fluid">
        <div className="list-inline">
          <div className="list-inline-item">
            <h1 id="wb-cont">
              <DinaMessage id="objectListTitle" />
            </h1>
          </div>
          <div className="list-inline-item">
            <ListLayoutSelector
              onChange={(newValue) => setListLayoutType(newValue)}
              value={listLayoutType ?? undefined}
            />
          </div>
          <div className="list-inline-item float-end">
            <Link href="/object-store/upload">
              <a>
                <DinaMessage id="uploadPageTitle" />
              </a>
            </Link>
          </div>
        </div>
        <div className="row">
          <div className={`table-section col-${tableSectionWidth}`}>
            <div className="split-page-panel">
              <QueryPage
                indexName={"dina_object_store_index"}
                uniqueName="object-store-list"
                dynamicFieldMapping={{
                  fields: [
                    {
                      type: "managedAttribute",
                      label: "managedAttributes",
                      path: "data.attributes.managedAttributes",
                      apiEndpoint: "objectstore-api/managed-attribute"
                    }
                  ],
                  relationshipFields: []
                }}
                columns={METADATA_TABLE_COLUMNS}
                bulkDeleteButtonProps={{
                  typeName: "metadata",
                  apiBaseUrl: "/objectstore-api"
                }}
                bulkEditPath={"/object-store/metadata/bulk-edit"}
                dataExportProps={{
                  dataExportPath: "/export/data-export/export",
                  entityLink: "/object-store/object"
                }}
                singleEditPath={"/object-store/metadata/edit"}
                defaultSort={[
                  {
                    desc: true,
                    id: "xmpMetadataDate"
                  }
                ]}
                reactTableProps={(responseData, CheckBoxField) => {
                  TBodyGallery.innerComponent = (
                    <StoredObjectGallery
                      CheckBoxField={CheckBoxField}
                      metadatas={(responseData as any) ?? []}
                      previewMetadataId={previewMetadata?.id as any}
                      onSelectPreviewMetadata={setPreviewMetadata}
                    />
                  );

                  return {
                    TbodyComponent:
                      listLayoutType === "GALLERY" ? TBodyGallery : undefined,
                    getTrProps: (_, rowInfo) => {
                      if (rowInfo) {
                        const metadata: Metadata = rowInfo.original;
                        return {
                          style: {
                            background:
                              metadata.id === previewMetadata?.id &&
                              HIGHLIGHT_COLOR
                          }
                        };
                      }
                      return {};
                    },
                    enableSorting: true,
                    enableMultiSort: true
                  };
                }}
              />
            </div>
          </div>

          <Offcanvas
            show={previewMetadata !== null}
            placement="end"
            scroll={true}
            backdrop={false}
            onHide={() => setPreviewMetadata(null)}
          >
            <Offcanvas.Header closeButton={true}>
              <Offcanvas.Title>
                <DinaMessage id="previewLabel" />
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              {previewMetadata?.id ? (
                <>
                  <div className="row align-items-center preview-buttonbar">
                    <div className="col">
                      {" "}
                      <Link
                        href={`/object-store/object/${
                          previewMetadata.data?.attributes?.resourceExternalURL
                            ? "external-resource-view"
                            : "view"
                        }?id=${previewMetadata.id}`}
                      >
                        <a>
                          <DinaMessage id="detailsPageLink" />
                        </a>
                      </Link>
                    </div>
                    <div className="col-auto d-flex justify-content-end">
                      {" "}
                      <div className="metadata-edit-link me-2">
                        {" "}
                        <Link
                          href={`/object-store/metadata/${
                            previewMetadata?.data?.resourceExternalURL
                              ? "external-resource-edit"
                              : "edit"
                          }?id=${previewMetadata.id}`}
                        >
                          <a className="btn btn-primary metadata-edit-link">
                            <DinaMessage id="editButtonText" />
                          </a>
                        </Link>
                      </div>
                      <Link
                        href={`/object-store/metadata/revisions?id=${
                          previewMetadata?.id
                        }&isExternalResourceMetadata=${!!previewMetadata?.data
                          ?.resourceExternalURL}`}
                      >
                        <a className="btn btn-info metadata-revisions-link">
                          <DinaMessage id="revisionsButtonText" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <MetadataPreview metadataId={previewMetadata?.id} />
                </>
              ) : (
                <LoadingSpinner loading={true} />
              )}
            </Offcanvas.Body>
          </Offcanvas>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ListLayoutSelector({ value = "TABLE", onChange }) {
  const items = [
    {
      layoutType: "TABLE",
      message: <DinaMessage id="metadataListTableLayout" />
    },
    {
      layoutType: "GALLERY",
      message: <DinaMessage id="metadataListGalleryLayout" />
    }
  ];

  return (
    <div className="list-layout-selector list-inline">
      {items.map(({ message, layoutType }) => (
        <div className="list-inline-item" key={layoutType}>
          <label>
            <input
              type="radio"
              checked={value === layoutType}
              onChange={() => onChange(layoutType)}
            />
            {message}
          </label>
        </div>
      ))}
    </div>
  );
}
