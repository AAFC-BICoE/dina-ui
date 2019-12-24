import {
  ApiClientContext,
  LoadingSpinner,
  ResourceSelectField,
  SaveArgs,
  SubmitButton
} from "common-ui";
import { Form, Formik } from "formik";
import { PersistedResource } from "kitsu";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { Head, Nav } from "../../components";
import {
  ObjectStoreMessage,
  useObjectStoreIntl
} from "../../intl/objectstore-intl";
import {
  ManagedAttribute,
  ManagedAttributeMap,
  Metadata
} from "../../types/objectstore-api";

const HotTable = dynamic(
  async () => (await import("@handsontable/react")).HotTable,
  { ssr: false }
);

interface RowData {
  metadata: PersistedResource<Metadata>;
}

interface FormControls {
  editableManagedAttributes: ManagedAttribute[];
}

export default function EditMetadatasPage() {
  const router = useRouter();
  const { apiClient, save } = useContext(ApiClientContext);
  const { formatMessage } = useObjectStoreIntl();

  const DEFAULT_COLUMNS = [
    {
      data: "metadata.originalFilename",
      readOnly: true,
      title: formatMessage("field_originalFilename")
    },
    {
      data: "metadata.dcType",
      source: ["Image", "Moving Image", "Sound", "Text"],
      title: formatMessage("metadataObjectTypeLabel"),
      type: "dropdown"
    },
    {
      data: "metadata.acTags",
      title: formatMessage("metadataBulkEditTagsLabel")
    },
    {
      data: "metadata.acDigitizationDate",
      dateFormat: "YYYY-MM-DD",
      title: formatMessage("metadataFirstDigitalVersionCreatedDateLabel"),
      type: "date"
    },
    {
      data: "metadata.xmpMetadataDate",
      dateFormat: "YYYY-MM-DD",
      title: formatMessage("metadataLastMetadataModificationTimeLabel"),
      type: "date"
    }
  ];

  const idsQuery = String(router.query.ids);
  const ids = idsQuery.split(",");

  const [tableData, setTableData] = useState<RowData[] | null>(null);

  useEffect(() => {
    (async () => {
      if (!router.query.ids) {
        return;
      }

      // TODO there should be a way to request many resources by ID in a single request.
      const metadataPromises = ids.map(id =>
        apiClient.get<Metadata>(`metadata/${id}`, {
          include: "managedAttributeMap"
        })
      );

      const metadataResponses = await Promise.all(metadataPromises);
      setTableData(
        metadataResponses.map<RowData>(res => ({
          metadata: res.data
        }))
      );
    })();
  }, [idsQuery]);

  async function onSubmit() {
    try {
      const editedMetadatas = (tableData || []).map<SaveArgs>(row => ({
        resource: { ...row.metadata, managedAttributeMap: null },
        type: "metadata"
      }));

      const editedmanagedAttributeMaps = (tableData || []).map<SaveArgs>(
        row => ({
          resource: {
            ...(row.metadata.managedAttributeMap as ManagedAttributeMap),
            metadata: row.metadata
          } as ManagedAttributeMap,
          type: "managed-attribute-map"
        })
      );

      editedmanagedAttributeMaps.forEach(saveArg => delete saveArg.resource.id);

      await save([...editedMetadatas, ...editedmanagedAttributeMaps]);

      await router.push("/object/list");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="container-fluid">
      <Head title={formatMessage("metadataBulkEditTitle")} />
      <Nav />
      <h2>
        <ObjectStoreMessage id="metadataBulkEditTitle" />
      </h2>
      <div className="form-group">
        <Formik<FormControls>
          initialValues={{
            editableManagedAttributes: []
          }}
          onSubmit={onSubmit}
        >
          {controlsForm => {
            const columns = [
              ...DEFAULT_COLUMNS,
              ...controlsForm.values.editableManagedAttributes.map(attr => ({
                data: `metadata.managedAttributeMap.values.${attr.id}.value`,
                title: attr.name
              }))
            ];

            return (
              <Form>
                <ResourceSelectField<ManagedAttribute>
                  className="col-2"
                  filter={val => ({ name: val })}
                  name="editableManagedAttributes"
                  isMulti={true}
                  model="managed-attribute"
                  optionLabel={attr => attr.name}
                />
                {tableData ? (
                  <>
                    <HotTable
                      columns={columns}
                      data={tableData}
                      manualColumnResize={true}
                    />
                    <SubmitButton />
                  </>
                ) : (
                  <LoadingSpinner loading={true} />
                )}
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
}
