import {
  ApiClientContext,
  BulkDataEditor,
  decodeResourceCell,
  encodeResourceCell,
  filterBy,
  LoadingSpinner,
  ResourceSelectField,
  RowChange,
  SaveArgs,
  useResourceSelectCells,
  Tooltip,
  ButtonBar,
  CancelButton
} from "common-ui";
import { Form, Formik } from "formik";
import { PersistedResource } from "kitsu";
import { noop } from "lodash";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { AddPersonButton, Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  ManagedAttribute,
  ManagedAttributeMap,
  Metadata,
  Person,
  License
} from "../../../types/objectstore-api";
import { debug } from "console";

/** Editable row data */
export interface BulkMetadataEditRow {
  acTags: string;
  acMetadataCreator: string;
  dcCreator: string;
  license: string;
  metadata: PersistedResource<Metadata>;
}

interface FormControls {
  editableManagedAttributes: ManagedAttribute[];
}

export default function EditMetadatasPage() {
  const router = useRouter();
  const { apiClient, bulkGet, save } = useContext(ApiClientContext);
  const { formatMessage } = useDinaIntl();
  const resourceSelectCell = useResourceSelectCells();
  const [
    initialEditableManagedAttributes,
    setInitialEditableManagedAttributes
  ] = useState<ManagedAttribute[]>([]);

  const { locale } = useDinaIntl();

  const DEFAULT_COLUMNS = [
    {
      data: "metadata.originalFilename",
      readOnly: true,
      title: formatMessage("field_originalFilename")
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
    resourceSelectCell<Person>(
      {
        filter: input => ({ rsql: `displayName==*${input}*` }),
        label: person => person.displayName,
        model: "agent-api/person",
        type: "person"
      },
      {
        data: "acMetadataCreator",
        title: formatMessage("field_acMetadataCreator.displayName")
      }
    ),
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
    )
  ];

  const idsQuery = String(router.query.ids);
  const ids = idsQuery.split(",");

  if (!idsQuery) {
    return <LoadingSpinner loading={true} />;
  }

  /**
   * Initializes the editable managed attributes based on what attributes are set on the metadatas.
   */
  async function initEditableManagedAttributes(metadatas: Metadata[]) {
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

    // Set the attributes in component state; These are used to re-initialize the Formik controls:
    setInitialEditableManagedAttributes(newInitialEditableManagedAttributes);
  }

  async function loadData() {
    const metadatas = await bulkGet<Metadata>(
      ids.map(id => `/metadata/${id}?include=managedAttributeMap`),
      {
        apiBaseUrl: "/objectstore-api",
        joinSpecs: [
          // Join to persons api:
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
        ]
      }
    );

    await initEditableManagedAttributes(metadatas);

    const newTableData = await Promise.all(
      metadatas.map<Promise<BulkMetadataEditRow>>(async metadata => {
        const acMetadataCreator = metadata.acMetadataCreator as Person;
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
          acMetadataCreator: encodeResourceCell(acMetadataCreator, {
            label: acMetadataCreator?.displayName
          }),
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
          changes: { acMetadataCreator, acTags, dcCreator, license, metadata },
          original: {
            metadata: { id, type }
          }
        } = row;

        const metadataEdit = {
          id,
          type,
          ...metadata
        } as Metadata;

        delete metadataEdit.managedAttributeMap;

        if (acMetadataCreator !== undefined) {
          metadataEdit.acMetadataCreator = decodeResourceCell(
            acMetadataCreator
          ).id;
        }

        if (dcCreator !== undefined) {
          metadataEdit.dcCreator = decodeResourceCell(dcCreator).id;
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

    await save([...editedMetadatas, ...editedManagedAttributeMaps], {
      apiBaseUrl: "/objectstore-api"
    });

    await router.push("/object-store/object/list");
  }

  return (
    <div className="container-fluid">
      <Head title={formatMessage("metadataBulkEditTitle")} />
      <Nav />
      <ButtonBar>
        <CancelButton entityLink="/object-store/object" />
      </ButtonBar>
      <h2>
        <DinaMessage id="metadataBulkEditTitle" />
      </h2>
      <div className="form-group">
        <Formik<FormControls>
          enableReinitialize={true}
          initialValues={{
            editableManagedAttributes: initialEditableManagedAttributes
          }}
          onSubmit={noop}
        >
          {controlsForm => {
            const columns = [
              ...DEFAULT_COLUMNS,
              ...managedAttributeColumns(
                controlsForm.values.editableManagedAttributes
              )
            ];

            return (
              <Form translate={undefined}>
                <ResourceSelectField<ManagedAttribute>
                  className="col-2 editable-managed-attributes-select"
                  filter={filterBy(["name"])}
                  name="editableManagedAttributes"
                  isMulti={true}
                  model="objectstore-api/managed-attribute"
                  optionLabel={attr => attr.name}
                />
                <div className="form-group">
                  <AddPersonButton />
                  <Tooltip id="addPersonPopupTooltip" />
                </div>
                <BulkDataEditor
                  columns={columns}
                  loadData={loadData}
                  onSubmit={onSubmit}
                />
              </Form>
            );
          }}
        </Formik>
      </div>
      <Footer />
    </div>
  );
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
