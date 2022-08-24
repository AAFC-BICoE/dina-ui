import { HotColumnProps } from "@handsontable/react";
import {
  ApiClientContext,
  BackButton,
  BulkDataEditor,
  ButtonBar,
  decodeResourceCell,
  DinaForm,
  ENCODED_RESOURCE_NAME_MATCHER,
  encodeResourceCell,
  LoadingSpinner,
  RowChange,
  SaveArgs,
  Tooltip,
  useAccount,
  useResourceSelectCells
} from "common-ui";
import { PersistedResource } from "kitsu";
import { get, set, keys, merge, cloneDeep, toPairs, isEmpty } from "lodash";
import moment from "moment";
import { useContext, useState } from "react";
import { AddPersonButton } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  DefaultValue,
  License,
  ManagedAttribute,
  Metadata,
  ObjectSubtype,
  Person
} from "../../../types/objectstore-api";
import { ObjectUpload } from "../../../types/objectstore-api/resources/ObjectUpload";
import { getManagedAttributesInUse } from "../managed-attributes/getManagedAttributesInUse";
import { useStoredDefaultValuesConfigs } from "./custom-default-values/DefaultValueConfigManager";
import {
  MetadataEditorAttributesControls,
  MetadataEditorControls
} from "./MetadataEditorAttributesControls";

/** Bulk Metadata spreadsheet editor. Either metadataIds or objectUploadIds is required. */
export interface BulkMetadataEditorProps {
  /** IDs of existing Metadatas to edit. */
  metadataIds?: string[];
  /** IDs of ObjectUplaods to create new Metadatas for. */
  objectUploadIds?: string[];
  group?: string;
  defaultValuesConfig?: number;
  afterMetadatasSaved: (
    metadataIds: string[],
    isExternalResource?: boolean
  ) => Promise<void>;
}

/** Editable row data */
export interface BulkMetadataEditRow {
  acTags: string;
  dcCreator: string;
  license: string;
  acSubtype: string;
  metadata: Metadata;

  /** Included in the row data for new Metadata records. */
  objectUpload?: PersistedResource<ObjectUpload>;
}

export function BulkMetadataEditor({
  metadataIds,
  objectUploadIds,
  group,
  defaultValuesConfig,
  afterMetadatasSaved
}: BulkMetadataEditorProps) {
  const { apiClient, bulkGet, save } = useContext(ApiClientContext);
  const { agentId, initialized: accountInitialized } = useAccount();
  const [
    initialEditableManagedAttributes,
    setInitialEditableManagedAttributes
  ] = useState<ManagedAttribute[]>([]);

  const { locale } = useDinaIntl();

  const [loadedMetadata, setLoadedMetadata] = useState<Metadata[]>([]);

  const { storedDefaultValuesConfigs } = useStoredDefaultValuesConfigs();

  const BUILT_IN_ATTRIBUTES_COLUMNS = useMetadataBuiltInAttributeColumns();

  if ((!metadataIds && !objectUploadIds) || !accountInitialized) {
    return <LoadingSpinner loading={true} />;
  }

  async function loadData() {
    const metadatas: Metadata[] = [];
    // tslint:disable-next-line
    let objectUploads: PersistedResource<ObjectUpload>[] | undefined =
      undefined;

    // When editing existing Metadatas:
    if (metadataIds) {
      const existingMetadatas = await bulkGet<Metadata>(
        metadataIds.map((id) => `/metadata/${id}?include=dcCreator`),
        {
          apiBaseUrl: "/objectstore-api",
          joinSpecs: [
            // Join to persons api:
            {
              apiBaseUrl: "/agent-api",
              idField: "dcCreator",
              joinField: "dcCreator",
              path: (metadata) => `person/${metadata.dcCreator.id}`
            }
          ]
        }
      );
      metadatas.push(...existingMetadatas);

      // When adding new Metadatas based on existing ObjectUploads:
    } else if (objectUploadIds && group) {
      objectUploads = await bulkGet<ObjectUpload>(
        objectUploadIds.map((id) => `/object-upload/${id}`),
        {
          apiBaseUrl: "/objectstore-api"
        }
      );

      // Set default values for the new Metadatas:
      const {
        data: { values: defaultValues }
      } = await apiClient.get<{ values: DefaultValue[] }>(
        "objectstore-api/config/default-values",
        {}
      );
      const metadataDefaults: Partial<Metadata> = {
        publiclyReleasable: true
      };
      for (const defaultValue of defaultValues.filter(
        ({ type }) => type === "metadata"
      )) {
        metadataDefaults[defaultValue.attribute as keyof Metadata] =
          defaultValue.value as any;
      }

      const newMetadatas = objectUploads.map<Metadata>((objectUpload) => ({
        ...metadataDefaults,
        acCaption: objectUpload.originalFilename,
        acDigitizationDate: objectUpload.dateTimeDigitized
          ? moment(objectUpload.dateTimeDigitized).format()
          : null,
        acMetadataCreator: agentId
          ? {
              id: agentId,
              type: "person"
            }
          : null,
        bucket: group,
        dcType: objectUpload.dcType,
        fileIdentifier: objectUpload.id,
        originalFilename: objectUpload.originalFilename,
        type: "metadata"
      }));

      metadatas.push(...newMetadatas);
    } else {
      // Shouldn't happen:
      throw new Error(
        "No Metadata IDs or ObjectUpload IDs (+ Group) were provided to load."
      );
    }

    const managedAttributesInUse = await getManagedAttributesInUse(
      metadatas.map((it) => it.managedAttributes),
      bulkGet
    );
    setInitialEditableManagedAttributes(managedAttributesInUse);

    const newTableData = await Promise.all(
      metadatas.map<Promise<BulkMetadataEditRow>>(
        async (metadata, rowIndex) => {
          const dcCreator = metadata.dcCreator as Person;

          // Get the License resource based on the Metadata's xmpRightsWebStatement field:
          let license: License | undefined;
          if (metadata.xmpRightsWebStatement) {
            const url = metadata.xmpRightsWebStatement;
            license = (
              await apiClient.get<License[]>("objectstore-api/license", {
                filter: { url }
              })
            ).data[0];
          }

          return {
            acTags: metadata.acTags?.join(", ") ?? "",
            acSubtype: metadata.acSubtype ?? "",
            dcCreator: encodeResourceCell(dcCreator, {
              label: dcCreator?.displayName
            }),
            license: encodeResourceCell(license, {
              label: license?.titles[locale] ?? license?.url ?? ""
            }),
            metadata,
            objectUpload: objectUploads?.[rowIndex]
          };
        }
      )
    );
    if (metadatas.length === 1) setLoadedMetadata(metadatas);
    return newTableData;
  }

  /** Apply custom default values to new Metadatas: */
  async function applyCustomDefaultValues(rows: BulkMetadataEditRow[]) {
    const selectedDefaultValuesConfig =
      storedDefaultValuesConfigs[defaultValuesConfig ?? -1];

    // Don't apply default values to existing Metadatas.
    // Don't apply default values when no Default Values Config is seleceted.
    if (!objectUploadIds || !selectedDefaultValuesConfig) {
      return;
    }

    // Loop through spreadsheet rows:
    for (const row of rows) {
      // Loop through default value rules:
      for (const rule of selectedDefaultValuesConfig.defaultValueRules ?? []) {
        if (rule?.source?.type === "objectUploadField") {
          const value = get(row.objectUpload, rule.source.field);
          set(row, rule.targetField, value);
        } else if (rule?.source?.type === "text") {
          set(row, rule.targetField, rule.source.text);
        }
      }
    }
  }

  async function onSubmit(
    changes: RowChange<BulkMetadataEditRow>[],
    formikValues,
    _,
    workingTableData
  ) {
    async function preProcessMetadata(metadataEdit: BulkMetadataEditRow) {
      if (metadataEdit.dcCreator !== undefined) {
        metadataEdit.metadata.dcCreator = {
          id: decodeResourceCell(metadataEdit.dcCreator).id as any,
          type: "person"
        };
      }

      if (metadataEdit.acSubtype !== undefined) {
        const subtypeName =
          ENCODED_RESOURCE_NAME_MATCHER.exec(metadataEdit.acSubtype)?.[1] ?? "";
        metadataEdit.metadata.acSubtype = subtypeName;
      }

      if (metadataEdit.acTags !== undefined) {
        metadataEdit.metadata.acTags = metadataEdit.acTags
          .split(",")
          .map((t) => t.trim());
      }

      if (metadataEdit.license !== undefined) {
        const selectedLicense = metadataEdit.license
          ? (
              await apiClient.get<License>(
                `objectstore-api/license/${
                  decodeResourceCell(metadataEdit.license).id as string
                }`,
                {}
              )
            ).data
          : null;
        // The Metadata's xmpRightsWebStatement field stores the license's url.
        metadataEdit.metadata.xmpRightsWebStatement =
          selectedLicense?.url ?? "";
        // No need to store this ; The url should be enough.
        metadataEdit.metadata.xmpRightsUsageTerms = "";
      }

      // Remove blank managed attribute values from the map:
      const blankValues: any[] = ["", null];
      for (const maKey of keys(metadataEdit?.metadata.managedAttributes)) {
        if (
          blankValues.includes(
            metadataEdit?.metadata.managedAttributes?.[maKey]
          )
        ) {
          delete metadataEdit?.metadata.managedAttributes?.[maKey];
        }
      }
    }

    // Array of all the records to be included in the operation.
    let editedMetadatas;

    // Check if we are updating existing records or creating new records from object ids.
    if (metadataIds) {
      // If you are editing existing records:
      // Handle when user removing managed attributes
      if (changes.length === 0) {
        const managedAttributeNamesInUse =
          formikValues.editableManagedAttributes.map((maAttr) => maAttr.name);

        const copied = cloneDeep(workingTableData);

        copied.map((tableData: BulkMetadataEditRow) =>
          preProcessMetadata(tableData)
        );
        // Remove the managed attributes that are not within the in use list anymore
        editedMetadatas = copied.map((copy) => {
          toPairs(copy.metadata.managedAttributes).forEach((ma) => {
            if (!managedAttributeNamesInUse.includes(ma[0])) {
              delete copy.metadata.managedAttributes[ma[0]];
            }
          });

          return { resource: copy.metadata, type: "metadata" };
        });
      } else {
        // Loop through the changes per row to get the data to POST to the bulk operations API:
        editedMetadatas = await Promise.all(
          changes
            .filter((row) => !isEmpty(row.changes))
            .map<Promise<SaveArgs<Metadata>>>(async (row) => {
              const {
                changes: { acTags, acSubtype, dcCreator, license, metadata },
                original: {
                  metadata: { id, type }
                }
              } = row;

              const metadataEdit = {
                id,
                type,
                // When adding new Metadatas, add the required fields from the ObjectUpload:
                ...(!id ? row.original.metadata : {}),
                ...metadata,
                ...(id
                  ? {
                      managedAttributes: merge(
                        row.original.metadata.managedAttributes,
                        metadata?.managedAttributes
                      )
                    }
                  : {})
              } as Metadata;

              const bulkMetadataEditRow: BulkMetadataEditRow = {
                metadata: metadataEdit,
                dcCreator: dcCreator as any,
                acSubtype: acSubtype as any,
                acTags: acTags as any,
                license: license as any
              };

              preProcessMetadata(bulkMetadataEditRow);
              return {
                resource: metadataEdit,
                type: "metadata"
              };
            })
        );
      }

      // When editing existing Metadatas:
      await save(editedMetadatas, { apiBaseUrl: "/objectstore-api" });

      // Ensure if when bulk edit 1 metadata, pass on the isExternalResource info
      // to be directed to the respective external resource view page for single metadata case
      await afterMetadatasSaved(
        metadataIds,
        loadedMetadata.length === 1
          ? !!loadedMetadata[0].resourceExternalURL
          : false
      );
    } else if (objectUploadIds) {
      // When adding new Metadatas based on existing ObjectUploads:

      const copied = cloneDeep(workingTableData);
      editedMetadatas = copied.map((copy) => {
        return { resource: copy.metadata, type: "metadata" };
      });

      // Create the Metadatas:
      const createdMetadatas = await save(editedMetadatas, {
        apiBaseUrl: "/objectstore-api"
      });

      createdMetadatas.forEach((createdMetadata, index) => {
        // Set the original row's Metadata ID so if the Managed Attribute Map fails, you don't create duplicate Metadatas:
        changes[index].original.metadata.id = createdMetadata.id;
      });

      await afterMetadatasSaved(
        createdMetadatas.map((metadata) => metadata.id)
      );
    }
  }

  const initialFormControls: MetadataEditorControls = {
    attributesTemplate: null,
    editableBuiltInAttributes: BUILT_IN_ATTRIBUTES_COLUMNS.filter(
      // Omit notPubliclyReleasableReason from the default shown attributes:
      (col) => col.data !== "metadata.notPubliclyReleasableReason"
    ).map((col) => col.data),
    editableManagedAttributes: initialEditableManagedAttributes
  };

  return (
    <div>
      <ButtonBar>
        <>
          {metadataIds?.length === 1 ? (
            <BackButton
              entityLink="/object-store/object"
              entityId={metadataIds[0]}
              byPassView={false}
            />
          ) : (
            <BackButton entityLink="/object-store/object" />
          )}
        </>
      </ButtonBar>
      <h1>
        <DinaMessage
          id={metadataIds ? "metadataBulkEditTitle" : "addMetadataTitle"}
        />
      </h1>
      <div className="mb-3">
        <DinaForm<MetadataEditorControls>
          enableReinitialize={true}
          initialValues={initialFormControls}
        >
          {(controlsForm) => {
            const columns = [
              ...BUILT_IN_ATTRIBUTES_COLUMNS.filter((col) =>
                controlsForm.values.editableBuiltInAttributes.includes(col.data)
              ),
              ...managedAttributeColumns(
                controlsForm.values.editableManagedAttributes
              )
            ];

            return (
              <div>
                <MetadataEditorAttributesControls
                  builtInAttributes={BUILT_IN_ATTRIBUTES_COLUMNS}
                />
                <div className="mb-3">
                  <AddPersonButton />
                  <Tooltip id="addPersonPopupTooltip" />
                </div>
                <BulkDataEditor
                  columns={columns}
                  loadData={loadData}
                  onSubmit={onSubmit}
                  applyCustomDefaultValues={applyCustomDefaultValues}
                  submitUnchangedRows={objectUploadIds ? true : false}
                />
              </div>
            );
          }}
        </DinaForm>
      </div>
    </div>
  );
}

/** Gets the Metadata bulit in attribute columns for the bulk editor. (Not including ManagedAttributes) */
export function useMetadataBuiltInAttributeColumns(): HotColumnProps[] {
  const { formatMessage, locale } = useDinaIntl();
  const resourceSelectCell = useResourceSelectCells();

  return [
    {
      data: "metadata.originalFilename",
      readOnly: true,
      title: formatMessage("field_originalFilename")
    },
    {
      data: "metadata.acDigitizationDate",
      readOnly: true,
      title: formatMessage("field_acDigitizationDate")
    },
    {
      data: "metadata.dcType",
      source: [
        "Image",
        "Moving Image",
        "Sound",
        "Text",
        "Dataset",
        "Undetermined"
      ],
      title: formatMessage("field_dcType"),
      type: "dropdown"
    },
    resourceSelectCell<ObjectSubtype>(
      {
        filter: (input) => ({ rsql: `acSubtype==${input}*` }),
        label: (ost) => ost.acSubtype,
        model: "objectstore-api/object-subtype",
        type: "object-subtype"
      },
      {
        data: "acSubtype",
        title: formatMessage("field_acSubtype")
      }
    ),
    {
      data: "metadata.acCaption",
      title: formatMessage("field_acCaption")
    },
    {
      data: "metadata.orientation",
      source: [1, 2, 3, 4, 5, 6, 7, 8, null],
      title: formatMessage("field_orientation"),
      type: "dropdown"
    },
    {
      data: "acTags",
      title: formatMessage("metadataBulkEditTagsLabel")
    },
    resourceSelectCell<Person>(
      {
        filter: (input) => ({ rsql: `displayName==${input}*` }),
        label: (person) => person.displayName ?? person.id,
        model: "agent-api/person",
        type: "person"
      },
      {
        data: "dcCreator",
        title: formatMessage("field_dcCreator.displayName")
      }
    ),
    {
      data: "metadata.dcRights",
      title: formatMessage("field_dcRights")
    },
    resourceSelectCell<License>(
      {
        label: (license) => license.titles[locale] ?? license.url,
        model: "objectstore-api/license",
        type: "license"
      },
      {
        data: "license",
        title: formatMessage("field_license")
      }
    ),
    {
      data: "metadata.publiclyReleasable",
      source: ["true", "false"],
      title: formatMessage("field_publiclyReleasable"),
      type: "dropdown"
    },
    {
      data: "metadata.notPubliclyReleasableReason",
      title: formatMessage("field_notPubliclyReleasableReason")
    }
  ];
}

export function managedAttributeColumns(
  editableManagedAttributes: ManagedAttribute[]
) {
  return editableManagedAttributes.map((attr) => ({
    data: `metadata.managedAttributes.${attr.key}`,
    title: attr.name,
    ...(attr.acceptedValues?.length
      ? {
          source: attr.acceptedValues,
          type: "dropdown"
        }
      : attr.managedAttributeType === "BOOL"
      ? {
          source: ["true", "false"],
          type: "dropdown"
        }
      : {})
  }));
}
