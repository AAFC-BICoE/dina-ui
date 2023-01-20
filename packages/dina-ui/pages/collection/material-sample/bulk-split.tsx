import { useEffect, useMemo, useState } from "react";
import { BackToListButton } from "common-ui/lib/button-bar/BackToListButton";
import PageLayout from "../../../components/page/PageLayout";
import { useLocalStorage } from "@rehooks/local-storage";
import {
  BackButton,
  DinaForm,
  RadioButtonsField,
  NumberSpinnerField,
  SubmitButton,
  SelectField,
  FieldSpy,
  useApiClient,
  LoadingSpinner
} from "common-ui/lib";
import { Card } from "react-bootstrap";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { useFormikContext } from "formik";
import { MaterialSampleIdentifierGenerator } from "../../../types/collection-api/resources/MaterialSampleIdentifierGenerator";
import { useRouter } from "next/router";
import { useBulkGet, useStringArrayConverter } from "common-ui";
import { MaterialSample } from "../../../types/collection-api";

/**
 * String key for the local storage of the bulk split ids.
 */
export const BULK_SPLIT_IDS = "bulk_split_ids";

const ENTITY_LINK = "/collection/material-sample";

type SeriesOptions = "continue" | "new";
type GenerationOptions = "lowercase" | "uppercase" | "numeric";
type AppendGenerationMode = {
  [key in GenerationOptions]: string;
};

const APPEND_GENERATION_MODE: AppendGenerationMode = {
  lowercase: "-a",
  uppercase: "-A",
  numeric: "-1"
};

interface MaterialSampleBulkSplitFields {
  numberToCreate: number;
  seriesOptions: SeriesOptions;
  seriesGenerationOptions: GenerationOptions;
}

export function MaterialSampleBulkSplitPage() {
  const { formatMessage } = useDinaIntl();
  const router = useRouter();
  const { bulkGet } = useApiClient();
  const [convertArrayToString] = useStringArrayConverter();

  const [ids] = useLocalStorage<string[]>(BULK_SPLIT_IDS, []);
  const isMultiple = useMemo(() => ids.length > 1, [ids]);

  // Clear local storage once the ids have been retrieved.
  useEffect(() => {
    if (ids.length === 0) {
      // router.push("/collection/material-sample/list");
    }

    // Clear the local storage.
    // localStorage.removeItem(BULK_SPLIT_IDS);
  }, [ids]);

  const splitFromMaterialSamples = useBulkGet<MaterialSample>({
    ids,
    listPath: "collection-api/material-sample",
    disabled: ids.length === 0
  });

  const buttonBar = (
    <>
      {/* Back Button (Changes depending on the number of records) */}
      {isMultiple ? (
        <BackToListButton entityLink={ENTITY_LINK} />
      ) : (
        <BackButton entityLink={ENTITY_LINK} entityId={ids[0]} />
      )}

      {/* Submit Button */}
      <SubmitButton className={"ms-auto"}>
        <DinaMessage id="splitButton" />
      </SubmitButton>
    </>
  );

  const ableToContinueSeries = useMemo<boolean>(
    () =>
      (splitFromMaterialSamples.data as any)?.every(
        (materialSample) => materialSample?.materialSampleChildren?.length !== 0
      ),
    [splitFromMaterialSamples.data]
  );

  if (splitFromMaterialSamples.loading) {
    return <LoadingSpinner loading={true} />;
  }

  const initialValues: MaterialSampleBulkSplitFields = {
    numberToCreate: 1,
    seriesOptions: ableToContinueSeries ? "continue" : "new",
    seriesGenerationOptions: "lowercase"
  };

  return (
    <DinaForm<MaterialSampleBulkSplitFields> initialValues={initialValues}>
      <PageLayout titleId="splitSubsampleTitle" buttonBarContent={buttonBar}>
        <>
          <Card>
            <Card.Body>
              <DinaMessage id="splitFrom" />:
              <span className="ms-2">
                {convertArrayToString(
                  (splitFromMaterialSamples?.data as any)?.map(
                    (materialSample) => materialSample?.materialSampleName
                  )
                )}
              </span>
            </Card.Body>
          </Card>

          <div className="row mt-3">
            <div className="col-md-4">
              <NumberSpinnerField
                name="numberToCreate"
                min={1}
                max={500}
                label={formatMessage("materialSamplesToCreate")}
              />
            </div>
            <div className="col-md-4">
              <RadioButtonsField<string>
                name="seriesOptions"
                horizontalOptions={true}
                options={[
                  {
                    value: "continue",
                    label: "Continue series",
                    disabled: !ableToContinueSeries
                  },
                  { value: "new", label: "New Series" }
                ]}
              />
            </div>
            <div className="col-md-4">
              <FieldSpy fieldName="seriesOptions">
                {(selected) => (
                  <SelectField
                    name="seriesGenerationOptions"
                    disabled={selected === "continue"}
                    options={[
                      { value: "lowercase", label: "a (Lowercase letters)" },
                      { value: "uppercase", label: "A (Uppercase letters)" },
                      { value: "numeric", label: "1 (Numerical)" }
                    ]}
                  />
                )}
              </FieldSpy>
            </div>
          </div>

          <PreviewGeneratedNames
            splitFromMaterialSamples={
              splitFromMaterialSamples.data as MaterialSample[]
            }
          />
        </>
      </PageLayout>
    </DinaForm>
  );
}

interface PreviewGeneratedNamesProps {
  splitFromMaterialSamples: MaterialSample[];
}

function PreviewGeneratedNames({
  splitFromMaterialSamples
}: PreviewGeneratedNamesProps) {
  const { save } = useApiClient();
  const formik = useFormikContext<MaterialSampleBulkSplitFields>();

  const [generatedIdentifiers, setGeneratedIdentifiers] = useState<string[]>(
    []
  );

  // To prevent spamming the network calls, this useEffect has a debounce.
  useEffect(() => {
    async function callGenerateIdentifierAPI() {
      const seriesMode = formik.values.seriesOptions;
      const generationMode = formik.values.seriesGenerationOptions;
      const identifier =
        seriesMode === "new"
          ? splitFromMaterialSamples[0]?.materialSampleName +
            APPEND_GENERATION_MODE[generationMode]
          : "CNC-1";

      const input: MaterialSampleIdentifierGenerator = {
        amount: formik.values.numberToCreate,
        identifier,
        type: "material-sample-identifier-generator"
      };

      const response = await save<MaterialSampleIdentifierGenerator>(
        [
          {
            resource: input,
            type: "material-sample-identifier-generator"
          }
        ],
        { apiBaseUrl: "/collection-api", overridePatchOperation: true }
      );

      if (response?.[0]?.nextIdentifiers) {
        setGeneratedIdentifiers(response?.[0]?.nextIdentifiers);
      }
    }

    let timeoutId;
    const debouncedHandleChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        callGenerateIdentifierAPI();
      }, 500);
    };
    debouncedHandleChange();
    return () => {
      clearTimeout(timeoutId);
    };
  }, [formik.values]);

  return (
    <div className="mt-4">
      <h4>
        <DinaMessage id="previewLabel" />
      </h4>
      <table className="table">
        <thead>
          <tr>
            <th>Number</th>
            <th>Generated name</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(
            { length: formik.values.numberToCreate },
            (_, i) => i
          ).map((_, index) => (
            <tr key={index + 1}>
              <td>{index + 1}</td>
              <td>
                {generatedIdentifiers[index] ? (
                  generatedIdentifiers[index]
                ) : (
                  <LoadingSpinner loading={true} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MaterialSampleBulkSplitPage;
