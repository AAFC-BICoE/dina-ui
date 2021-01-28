import { HotColumnProps } from "@handsontable/react";
import {
  ApiClientContext,
  ApiClientI,
  BulkDataEditor,
  decodeResourceCell,
  DinaForm,
  encodeResourceCell,
  LoadingSpinner,
  RowChange,
  SaveArgs,
  Tooltip,
  useAccount,
  useResourceSelectCells
} from "common-ui";
import moment from "moment";
import { useContext, useState } from "react";
import { AddPersonButton } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  DefaultValue,
  License,
  ManagedAttribute,
  ManagedAttributeMap,
  Metadata,
  Person
} from "../../../types/objectstore-api";
import { ObjectUpload } from "../../../types/objectstore-api/resources/ObjectUpload";
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
  afterMetadatasSaved: (metadataIds: string[]) => Promise<void>;
}

/** Editable row data */
export interface BulkMetadataEditRow {
  acTags: string;
  dcCreator: string;
  license: string;
  metadata: Metadata;
}

export function BulkMetadataEditor({
  metadataIds,
  objectUploadIds,
  group,
  afterMetadatasSaved
}: BulkMetadataEditorProps) {
  const { apiClient, bulkGet, save } = useContext(ApiClientContext);
  const { agentId, initialized: accountInitialized } = useAccount();
  const { formatMessage } = useDinaIntl();
  const resourceSelectCell = useResourceSelectCells();
  const [
    initialEditableManagedAttributes,
    setInitialEditableManagedAttributes
  ] = useState<ManagedAttribute[]>([]);

  const { locale } = useDinaIntl();

  const BUILT_IN_ATTRIBUTES_COLUMNS: HotColumnProps[] = [
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
    {
      data: "metadata.acCaption",
      title: formatMessage("field_acCaption")
    },
    {
      data: "acTags",
      title: formatMessage("metadataBulkEditTagsLabel")
    },
    resourceSelectCell<Person>(
      {
        filter: input => ({ rsql: `displayName==*${input}*` }),
        label: person => person.displayName,
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
        label: license => license.titles[locale] ?? license.url,
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

  if ((!metadataIds && !objectUploadIds) || !accountInitialized) {
    return <LoadingSpinner loading={true} />;
  }

  async function loadData() {
    const metadatas: Metadata[] = [];

    // When editing existing Metadatas:
    if (metadataIds) {
      const existingMetadatas = await bulkGet<Metadata>(
        metadataIds.map(
          id => `/metadata/${id}?include=managedAttributeMap,dcCreator`
        ),
        {
          apiBaseUrl: "/objectstore-api",
          joinSpecs: [
            // Join to persons api:
            {
              apiBaseUrl: "/agent-api",
              idField: "dcCreator",
              joinField: "dcCreator",
              path: metadata => `person/${metadata.dcCreator.id}`
            }
          ]
        }
      );

      metadatas.push(...existingMetadatas);

      // When adding new Metadatas based on existing ObjectUploads:
    } else if (objectUploadIds && group) {
      const objectUploads = await bulkGet<ObjectUpload>(
        objectUploadIds.map(id => `/object-upload/${id}`),
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
      const metadataDefaults: Partial<Metadata> = {};
      for (const defaultValue of defaultValues.filter(
        ({ type }) => type === "metadata"
      )) {
        metadataDefaults[
          defaultValue.attribute as keyof Metadata
        ] = defaultValue.value as any;
      }

      const newMetadatas = objectUploads.map<Metadata>(objectUpload => ({
        ...metadataDefaults,
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
      metadatas,
      bulkGet
    );
    setInitialEditableManagedAttributes(managedAttributesInUse);

    const newTableData = await Promise.all(
      metadatas.map<Promise<BulkMetadataEditRow>>(async metadata => {
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
          dcCreator: encodeResourceCell(dcCreator, {
            label: dcCreator?.displayName
          }),
          license: encodeResourceCell(license, {
            label: license?.titles[locale] ?? license?.url ?? ""
          }),
          metadata
        };
      })
    );

    return newTableData;
  }

  async function onSubmit(changes: RowChange<BulkMetadataEditRow>[]) {
    // Loop through the changes per row to get the data to POST to the bulk operations API:
    const editedMetadatas = await Promise.all(
      changes.map<Promise<SaveArgs<Metadata>>>(async row => {
        const {
          changes: { acTags, dcCreator, license, metadata },
          original: {
            metadata: { id, type }
          }
        } = row;

        const metadataEdit = {
          id,
          type,
          // When adding new Metadatas, add the required fields from the ObjectUpload:
          ...(!id ? row.original.metadata : {}),
          ...metadata
        } as Metadata;

        delete metadataEdit.managedAttributeMap;

        if (dcCreator !== undefined) {
          metadataEdit.dcCreator = {
            id: decodeResourceCell(dcCreator).id as any,
            type: "person"
          };
        }

        if (acTags !== undefined) {
          metadataEdit.acTags = acTags.split(",").map(t => t.trim());
        }

        if (license !== undefined) {
          const selectedLicense = license
            ? (
                await apiClient.get<License>(
                  `objectstore-api/license/${
                    decodeResourceCell(license).id as string
                  }`,
                  {}
                )
              ).data
            : null;
          // The Metadata's xmpRightsWebStatement field stores the license's url.
          metadataEdit.xmpRightsWebStatement = selectedLicense?.url ?? "";
          // No need to store this ; The url should be enough.
          metadataEdit.xmpRightsUsageTerms = "";
        }

        return {
          resource: metadataEdit,
          type: "metadata"
        };
      })
    );

    const editedManagedAttributeMaps = changes.map<
      SaveArgs<ManagedAttributeMap>
    >(row => {
      const managedAttributeMap = row.changes.metadata?.managedAttributeMap;
      const metadata = {
        id: row.original.metadata.id,
        type: row.original.metadata.type
      };

      return {
        resource: {
          ...managedAttributeMap,
          metadata,
          type: "managed-attribute-map"
        } as ManagedAttributeMap,
        type: "managed-attribute-map"
      };
    });

    editedManagedAttributeMaps.forEach(saveArg => delete saveArg.resource.id);

    if (metadataIds) {
      // When editing existing Metadatas:
      await save([...editedMetadatas, ...editedManagedAttributeMaps], {
        apiBaseUrl: "/objectstore-api"
      });

      await afterMetadatasSaved(metadataIds);
    } else if (objectUploadIds) {
      // When adding new Metadatas based on existing ObjectUploads:
      // Create the Metadatas:
      const createdMetadatas = await save(editedMetadatas, {
        apiBaseUrl: "/objectstore-api"
      });

      createdMetadatas.forEach((createdMetadata, index) => {
        // Set the original row's Metadata ID so if the Managed Attribute Map fails, you don't create duplicate Metadats:
        changes[index].original.metadata.id = createdMetadata.id;

        // Link the managed attribute value with the newly created Metadata ID:
        editedManagedAttributeMaps[index].resource.metadata = {
          id: createdMetadata.id,
          type: "metadata"
        } as Metadata;
      });

      // Create the Managed Attribute Values:
      await save(editedManagedAttributeMaps, {
        apiBaseUrl: "/objectstore-api"
      });

      await afterMetadatasSaved(createdMetadatas.map(metadata => metadata.id));
    }
  }

  const initialFormControls: MetadataEditorControls = {
    attributesTemplate: null,
    editableBuiltInAttributes: BUILT_IN_ATTRIBUTES_COLUMNS.filter(
      // Omit notPubliclyReleasableReason from the default shown attributes:
      col => col.data !== "metadata.notPubliclyReleasableReason"
    ).map(col => col.data),
    editableManagedAttributes: initialEditableManagedAttributes
  };

  return (
    <div>
      <h1>
        <DinaMessage id="metadataBulkEditTitle" />
      </h1>
      <div className="form-group">
        <DinaForm<MetadataEditorControls>
          enableReinitialize={true}
          initialValues={initialFormControls}
        >
          {controlsForm => {
            const columns = [
              ...BUILT_IN_ATTRIBUTES_COLUMNS.filter(col =>
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
                <div className="form-group">
                  <AddPersonButton />
                  <Tooltip id="addPersonPopupTooltip" />
                </div>
                <BulkDataEditor
                  columns={columns}
                  loadData={loadData}
                  onSubmit={onSubmit}
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

/**
 * Initializes the editable managed attributes based on what attributes are set on the metadatas.
 */
export async function getManagedAttributesInUse(
  metadatas: Metadata[],
  bulkGet: ApiClientI["bulkGet"]
) {
  // Loop through the metadatas and find which managed attributes are set:
  const managedAttributeIdMap: Record<string, true> = {};
  for (const metadata of metadatas) {
    const keys = Object.keys(metadata.managedAttributeMap?.values ?? {});
    for (const key of keys) {
      managedAttributeIdMap[key] = true;
    }
  }
  const managedAttributeIds = Object.keys(managedAttributeIdMap);

  // Fetch the managed attributes from the back-end:
  const newInitialEditableManagedAttributes = await bulkGet<ManagedAttribute>(
    managedAttributeIds.map(id => `/managed-attribute/${id}`),
    { apiBaseUrl: "/objectstore-api" }
  );

  return newInitialEditableManagedAttributes;
}

export function managedAttributeColumns(
  editableManagedAttributes: ManagedAttribute[]
) {
  return editableManagedAttributes.map(attr => ({
    data: `metadata.managedAttributeMap.values.${attr.id}.value`,
    title: attr.name,
    ...(attr.acceptedValues?.length
      ? {
          source: attr.acceptedValues,
          type: "dropdown"
        }
      : {})
  }));
}
