import { useLocalStorage } from "@rehooks/local-storage";
import {
  ColumnDefinition,
  dateCell,
  FilterAttribute,
  filterBy,
  ListPageLayout,
  SplitPagePanel
} from "common-ui";
import Link from "next/link";
import { Component, useMemo, useState } from "react";
import {
  GroupSelectField,
  Head,
  Nav,
  thumbnailCell
} from "../../../components";
import {
  MetadataPreview,
  StoredObjectGallery
} from "../../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Metadata, Person } from "../../../types/objectstore-api";

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
    optionLabel: person => (person as Person).displayName
  }
];

export default function MetadataListPage() {
  const { formatMessage } = useDinaIntl();

  const [listLayoutType, setListLayoutType] =
    useLocalStorage<MetadataListLayoutType>(LIST_LAYOUT_STORAGE_KEY);

  const [previewMetadata, setPreviewMetadata] = useState<Metadata | null>(null);
  const [tableSectionWidth, previewSectionWidth] = previewMetadata?.id
    ? [8, 4]
    : [12, 0];

  const METADATA_TABLE_COLUMNS: ColumnDefinition<Metadata>[] = [
    thumbnailCell({
      bucketField: "bucket",
      fileIdentifierField: "fileIdentifier"
    }),
    {
      Cell: ({ original: { id, originalFilename } }) =>
        originalFilename ? (
          <a href={`/object-store/object/view?id=${id}`} id={`file-name-${id}`}>
            {originalFilename}
          </a>
        ) : null,
      accessor: "originalFilename"
    },
    "acCaption",
    dateCell("acDigitizationDate"),
    dateCell("xmpMetadataDate"),
    {
      accessor: "acMetadataCreator.displayName",
      sortable: false
    },
    {
      Cell: ({ original: { acTags } }) => <>{acTags?.join(", ")}</>,
      accessor: "acTags"
    },
    {
      Cell: ({ original }) => (
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
      Header: (
        <div id="acPreviewLinksHeader">
          <DinaMessage id="viewPreviewButtonText" />
        </div>
      ),
      sortable: false,
      width: 200
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
      <main className="container-fluid">
        <div className="list-inline">
          <div className="list-inline-item">
            <h1 id="wb-cont">
              <DinaMessage id="objectListTitle" />
            </h1>
          </div>
          <div className="list-inline-item">
            <ListLayoutSelector
              onChange={newValue => setListLayoutType(newValue)}
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
            <SplitPagePanel>
              <ListPageLayout<Metadata>
                additionalFilters={filterForm => ({
                  // Apply group filter:
                  ...(filterForm.group && { bucket: filterForm.group })
                })}
                defaultSort={[
                  {
                    desc: true,
                    id: "xmpMetadataDate"
                  }
                ]}
                filterAttributes={METADATA_FILTER_ATTRIBUTES}
                filterFormchildren={({ submitForm }) => (
                  <div className="mb-3">
                    <div style={{ width: "300px" }}>
                      <GroupSelectField
                        onChange={() => setImmediate(submitForm)}
                        name="group"
                        showAnyOption={true}
                        showAllGroups={true}
                      />
                    </div>
                  </div>
                )}
                id="metadata-list"
                queryTableProps={({ CheckBoxField }) => ({
                  columns: METADATA_TABLE_COLUMNS,
                  // Include the Agents from the Agent API in the Metadatas:
                  joinSpecs: [
                    {
                      apiBaseUrl: "/agent-api",
                      idField: "acMetadataCreator",
                      joinField: "acMetadataCreator",
                      path: metadata =>
                        `person/${metadata.acMetadataCreator.id}`
                    },
                    {
                      apiBaseUrl: "/agent-api",
                      idField: "dcCreator",
                      joinField: "dcCreator",
                      path: metadata => `person/${metadata.dcCreator.id}`
                    }
                  ],
                  path: "objectstore-api/metadata?include=acMetadataCreator,dcCreator",
                  reactTableProps: ({ response }) => {
                    TBodyGallery.innerComponent = (
                      <StoredObjectGallery
                        CheckBoxField={CheckBoxField}
                        metadatas={response?.data ?? []}
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
                      }
                    };
                  }
                })}
                bulkDeleteButtonProps={{
                  typeName: "metadata",
                  apiBaseUrl: "/objectstore-api"
                }}
                bulkEditPath={ids => ({
                  pathname: "/object-store/metadata/edit",
                  query: { metadataIds: ids.join(",") }
                })}
              />
            </SplitPagePanel>
          </div>
          <div className={`preview-section col-${previewSectionWidth}`}>
            <SplitPagePanel>
              {previewMetadata?.id && (
                <>
                  <div style={{ height: "2.5rem" }}>
                    <Link
                      href={`/object-store/object/${
                        previewMetadata.resourceExternalURI
                          ? "external-resource-view"
                          : "view"
                      }?id=${previewMetadata.id}`}
                    >
                      <a>
                        <DinaMessage id="detailsPageLink" />
                      </a>
                    </Link>
                    <button
                      className="btn btn-dark float-end preview-button"
                      type="button"
                      onClick={() => setPreviewMetadata(null)}
                    >
                      <DinaMessage id="closePreviewButtonText" />
                    </button>
                  </div>
                  <MetadataPreview metadataId={previewMetadata?.id} />
                </>
              )}
            </SplitPagePanel>
          </div>
        </div>
      </main>
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
