import { useLocalStorage } from "@rehooks/local-storage";
import {
  ApiClientContext,
  AreYouSureModal,
  ColumnDefinition,
  dateCell,
  DinaForm,
  FilterAttribute,
  filterBy,
  FormikButton,
  ListPageLayout,
  SplitPagePanel,
  useAccount,
  useGroupedCheckBoxes,
  useModal
} from "common-ui";
import { FormikContextType } from "formik";
import { toPairs } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { Component, useContext, useMemo, useState } from "react";
import { GroupSelectField, Head, Nav } from "../../../components";
import {
  MetadataPreview,
  StoredObjectGallery
} from "../../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Metadata, Person } from "../../../types/objectstore-api";

type MetadataListLayoutType = "TABLE" | "GALLERY";

const LIST_LAYOUT_STORAGE_KEY = "metadata-list-layout";

const HIGHLIGHT_COLOR = "rgb(222, 252, 222)";

/** Values of the Formik form that wraps the metadata list */
export interface MetadataListFormValues {
  /** Tracks which metadata IDs are selected. */
  selectedMetadatas: Record<string, boolean>;
}

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
  const { groupNames } = useAccount();

  const {
    CheckBoxField,
    CheckBoxHeader,
    setAvailableItems: setAvailableMetadatas
  } = useGroupedCheckBoxes({
    fieldName: "selectedMetadatas"
  });

  const [
    listLayoutType,
    setListLayoutType
  ] = useLocalStorage<MetadataListLayoutType>(LIST_LAYOUT_STORAGE_KEY);

  const [previewMetadataId, setPreviewMetadataId] = useState<string | null>(
    null
  );
  const [tableSectionWidth, previewSectionWidth] = previewMetadataId
    ? [8, 4]
    : [12, 0];

  const METADATA_TABLE_COLUMNS: ColumnDefinition<Metadata>[] = [
    {
      Cell: ({ original: metadata }) => (
        <CheckBoxField key={metadata.id} resource={metadata} />
      ),
      Header: CheckBoxHeader,
      sortable: false
    },
    {
      Cell: ({ original: { id, originalFilename } }) =>
        originalFilename ? (
          <Link href={`/object-store/object/view?id=${id}`}>
            {originalFilename}
          </Link>
        ) : null,
      accessor: "originalFilename"
    },
    dateCell("acDigitizationDate"),
    dateCell("xmpMetadataDate"),
    { accessor: "acMetadataCreator.displayName", sortable: false },
    {
      Cell: ({ original: { acTags } }) => <>{acTags?.join(", ")}</>,
      accessor: "acTags"
    },
    {
      Cell: ({ original }) => (
        <div className="d-flex h-100">
          <button
            className="btn btn-info m-auto preview-button"
            onClick={() => setPreviewMetadataId(original.id)}
            type="button"
          >
            <DinaMessage id="viewPreviewButtonText" />
          </button>
        </div>
      ),
      Header: "",
      sortable: false
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
            <h1>
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
                  ...(filterForm.group && { bucket: filterForm.group }),
                  // Filter out the derived objects e.g. thumbnails:
                  rsql: "acSubTypeId==null"
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
                queryTableProps={{
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
                  onSuccess: res => setAvailableMetadatas(res.data),
                  path:
                    "objectstore-api/metadata?include=acMetadataCreator,dcCreator",
                  reactTableProps: ({ response }) => {
                    TBodyGallery.innerComponent = (
                      <StoredObjectGallery
                        CheckBoxField={CheckBoxField}
                        metadatas={response?.data ?? []}
                        previewMetadataId={previewMetadataId}
                        onSelectPreviewMetadataId={setPreviewMetadataId}
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
                                metadata.id === previewMetadataId &&
                                HIGHLIGHT_COLOR
                            }
                          };
                        }
                        return {};
                      }
                    };
                  }
                }}
                wrapTable={children => (
                  <MetadataListWrapper>{children}</MetadataListWrapper>
                )}
              />
            </SplitPagePanel>
          </div>
          <div className={`preview-section col-${previewSectionWidth}`}>
            <SplitPagePanel>
              {previewMetadataId && (
                <>
                  <div style={{ height: "2.5rem" }}>
                    <Link
                      href={`/object-store/object/view?id=${previewMetadataId}`}
                    >
                      <a>
                        <DinaMessage id="detailsPageLink" />
                      </a>
                    </Link>
                    <button
                      className="btn btn-dark float-end preview-button"
                      type="button"
                      onClick={() => setPreviewMetadataId(null)}
                    >
                      <DinaMessage id="closePreviewButtonText" />
                    </button>
                  </div>
                  <MetadataPreview metadataId={previewMetadataId} />
                </>
              )}
            </SplitPagePanel>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Common button props for the bulk edit/delete buttons */
function bulkButtonProps(ctx: FormikContextType<MetadataListFormValues>) {
  return {
    // Disable the button if none are selected:
    disabled: !Object.values(ctx.values.selectedMetadatas).reduce(
      (a, b) => a || b,
      false
    )
  };
}

/**
 * Adds additional controls around the metadata table.
 */
function MetadataListWrapper({ children }) {
  const router = useRouter();

  return (
    <DinaForm<MetadataListFormValues> initialValues={{ selectedMetadatas: {} }}>
      <div style={{ height: "1rem" }}>
        <div className="float-end">
          <BulkDeleteButton />
          <FormikButton
            buttonProps={bulkButtonProps}
            className="btn btn-primary ms-2 metadata-bulk-edit-button"
            onClick={async (values: MetadataListFormValues) => {
              const metadataIds = toPairs(values.selectedMetadatas)
                .filter(pair => pair[1])
                .map(pair => pair[0]);

              await router.push({
                pathname: "/object-store/metadata/edit",
                query: { metadataIds: metadataIds.join(",") }
              });
            }}
          >
            <DinaMessage id="editSelectedButtonText" />
          </FormikButton>
        </div>
      </div>
      {children}
    </DinaForm>
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

export function BulkDeleteButton() {
  const router = useRouter();
  const { openModal } = useModal();
  const { doOperations } = useContext(ApiClientContext);

  return (
    <FormikButton
      buttonProps={bulkButtonProps}
      className="btn btn-danger metadata-bulk-delete-button"
      onClick={(values: MetadataListFormValues) => {
        const metadataIds = toPairs(values.selectedMetadatas)
          .filter(pair => pair[1])
          .map(pair => pair[0]);

        openModal(
          <AreYouSureModal
            actionMessage={
              <span>
                <DinaMessage id="deleteSelectedButtonText" /> (
                {metadataIds.length})
              </span>
            }
            onYesButtonClicked={async () => {
              await doOperations(
                metadataIds.map(id => ({
                  op: "DELETE",
                  path: `metadata/${id}`
                })),
                {
                  apiBaseUrl: "/objectstore-api"
                }
              );

              // Refresh the page:
              await router.reload();
            }}
          />
        );
      }}
    >
      <DinaMessage id="deleteSelectedButtonText" />
    </FormikButton>
  );
}
