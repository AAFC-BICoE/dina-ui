import { useLocalStorage } from "@rehooks/local-storage";
import {
  ApiClientContext,
  AreYouSureModal,
  ColumnDefinition,
  FormikButton,
  ListPageLayout,
  SelectField,
  SplitPagePanel,
  useAccount,
  useGroupedCheckBoxes,
  useModal,
  filterBy,
  FilterAttribute,
  dateCell,
  useGroupSelectOptions
} from "common-ui";
import { Form, Formik, FormikContextType } from "formik";
import { noop, toPairs } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { Component, useContext, useMemo, useState } from "react";
import { Head, Nav, StoredObjectGallery } from "../../../components";
import { MetadataPreview } from "../../../components/metadata/MetadataPreview";
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

  const [listLayoutType, setListLayoutType] = useLocalStorage<
    MetadataListLayoutType
  >(LIST_LAYOUT_STORAGE_KEY);

  const [previewMetadataId, setPreviewMetadataId] = useState<string | null>(
    null
  );
  const [tableSectionWidth, previewSectionWidth] = previewMetadataId
    ? [8, 4]
    : [12, 0];
  const METADATA_FILTER_ATTRIBUTES: FilterAttribute[] = [
    "originalFilename",
    "dcFormat",
    "xmpRightsWebStatement",
    "dcRights",
    {
      name: "acDigitizationDate",
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

  const METADATA_TABLE_COLUMNS: ColumnDefinition<Metadata>[] = [
    {
      Cell: ({ original: metadata }) => (
        <CheckBoxField key={metadata.id} resource={metadata} />
      ),
      Header: CheckBoxHeader,
      sortable: false
    },
    "originalFilename",
    "dcFormat",
    dateCell("acDigitizationDate"),
    dateCell("xmpMetadataDate"),
    "acMetadataCreator.displayName",
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

  const groupSelectOptions = [
    { label: "<any>", value: undefined },
    ...useGroupSelectOptions()
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
      <div className="container-fluid">
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
          <div className="list-inline-item float-right">
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
                // Filter out the derived objects e.g. thumbnails:
                additionalFilters={filterForm => ({
                  ...(filterForm.group && { bucket: filterForm.group }),
                  rsql: "acSubTypeId==null"
                })}
                filterAttributes={METADATA_FILTER_ATTRIBUTES}
                filterFormchildren={({ submitForm }) => (
                  <div className="form-group">
                    <div style={{ width: "300px" }}>
                      <SelectField
                        onChange={() => setImmediate(submitForm)}
                        name="group"
                        options={groupSelectOptions}
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
                      path: metadata => `person/${metadata.acMetadataCreator}`
                    },
                    {
                      apiBaseUrl: "/agent-api",
                      idField: "dcCreator",
                      joinField: "dcCreator",
                      path: metadata => `person/${metadata.dcCreator}`
                    }
                  ],
                  onSuccess: res => setAvailableMetadatas(res.data),
                  path: "objectstore-api/metadata",
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
                WrapTable={MetadataListWrapper}
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
                        <DinaMessage id="metadataDetailsPageLink" />
                      </a>
                    </Link>
                    <button
                      className="btn btn-dark float-right preview-button"
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
      </div>
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
    <Formik<MetadataListFormValues>
      initialValues={{ selectedMetadatas: {} }}
      onSubmit={noop}
    >
      <Form translate={undefined}>
        <div style={{ height: "1rem" }}>
          <div className="float-right">
            <BulkDeleteButton />
            <FormikButton
              buttonProps={bulkButtonProps}
              className="btn btn-primary ml-2 metadata-bulk-edit-button"
              onClick={async (values: MetadataListFormValues) => {
                const metadataIds = toPairs(values.selectedMetadatas)
                  .filter(pair => pair[1])
                  .map(pair => pair[0]);

                await router.push({
                  pathname: "/object-store/metadata/edit",
                  query: { ids: metadataIds.join(",") }
                });
              }}
            >
              <DinaMessage id="editSelectedButtonText" />
            </FormikButton>
          </div>
        </div>
        {children}
      </Form>
    </Formik>
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
