import {
  ApiClientContext,
  LoadingSpinner,
  ResourceSelectField,
  SubmitButton
} from "common-ui";
import { Form, Formik } from "formik";
import { PersistedResource } from "kitsu";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { Head, Nav } from "../../components";
import { useObjectStoreIntl } from "../../intl/objectstore-intl";
import { ManagedAttribute, Metadata } from "../../types/objectstore-api";

const HotTable = dynamic(
  async () => (await import("@handsontable/react")).HotTable,
  { ssr: false }
);

interface RowData {
  metadata: PersistedResource<Metadata>;
  metaManagedAttributes: { [uuid: string]: string };
}

interface FormControls {
  editableManagedAttributes: ManagedAttribute[];
}

export default function EditMetadatasPage() {
  const router = useRouter();
  const { apiClient } = useContext(ApiClientContext);
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
        apiClient.get<Metadata>(`metadata/${id}`, {})
      );

      const metadataResponses = await Promise.all(metadataPromises);
      setTableData(
        metadataResponses.map<RowData>(res => ({
          metaManagedAttributes: {},
          metadata: res.data
        }))
      );
    })();
  }, [idsQuery]);

  async function onSubmit() {
    try {
      for (const row of tableData || []) {
        const { metadata } = row;
        await apiClient.patch("metadata", metadata);
      }

      // TODO handle managed attributes in bulk

      await router.push("/object/list");
    } catch (err) {
      alert(JSON.stringify(err));
    }
  }

  return (
    <div className="container-fluid">
      <Head />
      <Nav />
      <h2>Edit Metadata</h2>
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
                data: `metaManagedAttributes.${attr.id}`,
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
