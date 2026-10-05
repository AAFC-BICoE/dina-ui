import { DinaForm, DinaFormOnSubmit, SubmitButton, TextField } from "common-ui";
import Link from "next/link";
import { useState } from "react";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Dataset } from "../../../types/collection-api";
import { DataExport } from "../../../types/dina-export-api";
import { DatasetExportDefinition } from "./datasetExportDefinitions";
import {
  normalizeDatasetExportQuery,
  toDatasetExportSnapshot
} from "./datasetExportUtils";

interface DatasetExportFormValues {
  name: string;
}

interface DatasetExportFormProps {
  dataset: Dataset;
  definition: DatasetExportDefinition;
  query?: unknown;
}

export function DatasetExportForm({
  dataset,
  definition,
  query
}: DatasetExportFormProps) {
  const { formatMessage } = useDinaIntl();
  const [submitted, setSubmitted] = useState(false);

  const validateName = (value?: string) =>
    value && value.length > 100
      ? formatMessage("datasetExportNameTooLong")
      : undefined;

  const onSubmit: DinaFormOnSubmit<DatasetExportFormValues> = async ({
    submittedValues,
    api
  }) => {
    const request: DataExport = {
      type: "data-export",
      name: submittedValues.name.trim(),
      exportType: definition.exportType,
      source: definition.source,
      query: normalizeDatasetExportQuery(query),
      dataset: toDatasetExportSnapshot(dataset)
    };

    await api.save<DataExport>([{ resource: request, type: "data-export" }], {
      apiBaseUrl: "/dina-export-api"
    });
    setSubmitted(true);
  };

  return (
    <section aria-labelledby="dataset-export-form-heading">
      <h2 id="dataset-export-form-heading">
        <DinaMessage id="datasetExportFormTitle" />
      </h2>
      <DinaForm<DatasetExportFormValues>
        initialValues={{ name: "" }}
        onSubmit={onSubmit}
      >
        <TextField
          name="name"
          customName={formatMessage("datasetExportName")}
          requiredField={true}
          validate={validateName}
        />
        <SubmitButton
          showSaveIcon={false}
          buttonProps={() => ({
            disabled: !query || submitted
          })}
        >
          <DinaMessage id="datasetExportSubmitButtonText" />
        </SubmitButton>
        {submitted && (
          <div className="alert alert-success mt-3" role="status">
            <DinaMessage id="datasetExportRequestSubmitted" />{" "}
            <Link href="/export/data-export/list">
              <DinaMessage id="datasetExportViewRequests" />
            </Link>
          </div>
        )}
      </DinaForm>
    </section>
  );
}
