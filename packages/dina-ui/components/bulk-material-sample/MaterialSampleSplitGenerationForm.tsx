import { useEffect, useMemo, useState } from "react";
import { BackToListButton } from "common-ui/lib/button-bar/BackToListButton";
import PageLayout from "../page/PageLayout";
import {
  BackButton,
  DinaForm,
  RadioButtonsField,
  NumberSpinnerField,
  SubmitButton,
  SelectField,
  FieldSpy,
  useApiClient,
  LoadingSpinner,
  DinaFormOnSubmit
} from "common-ui";
import { Card } from "react-bootstrap";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { useFormikContext } from "formik";
import { MaterialSampleIdentifierGenerator } from "../../types/collection-api/resources/MaterialSampleIdentifierGenerator";
import { useBulkGet, useStringArrayConverter } from "common-ui";
import { MaterialSample } from "../../types/collection-api";
import { InputResource } from "kitsu";

const ENTITY_LINK = "/collection/material-sample";

type SeriesOptions = "continue" | "continueFromParent" | "new";
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
  generationOptions: GenerationOptions;
}

interface MaterialSampleSplitGenerationFormProps {
  ids: string[];
  onGenerate: (samples: InputResource<MaterialSample>[]) => void;
}

export function MaterialSampleSplitGenerationForm({
  ids,
  onGenerate
}: MaterialSampleSplitGenerationFormProps) {
  const { formatMessage } = useDinaIntl();
  const [convertArrayToString] = useStringArrayConverter();

  const isMultiple = useMemo(() => ids.length > 1, [ids]);

  const [generatedIdentifiers, setGeneratedIdentifiers] = useState<string[]>(
    []
  );

  const splitFromMaterialSamples = useBulkGet<MaterialSample>({
    ids,
    listPath:
      "collection-api/material-sample?include=materialSampleChildren,collection,parentMaterialSample",
    disabled: ids.length === 0
  });

  const splitFromParentMaterialSamples = useBulkGet<MaterialSample>({
    ids: (splitFromMaterialSamples.data as any)?.map(
      (sample) => sample?.parentMaterialSample?.id ?? ""
    ),
    listPath:
      "collection-api/material-sample?include=materialSampleChildren,collection,parentMaterialSample",
    disabled:
      splitFromMaterialSamples.loading ||
      (splitFromMaterialSamples.data as any)?.some(
        (sample) => !sample.parentMaterialSample
      )
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

  const ableToContinueSeriesFromParent = useMemo<boolean>(
    () =>
      (splitFromParentMaterialSamples.data as any)?.every(
        (materialSample) => materialSample?.materialSampleChildren?.length !== 0
      ),
    [splitFromParentMaterialSamples.data]
  );

  if (splitFromMaterialSamples.loading) {
    return <LoadingSpinner loading={true} />;
  }

  const initialValues: MaterialSampleBulkSplitFields = {
    numberToCreate: 1,
    seriesOptions: ableToContinueSeries ? "continue" : "new",
    generationOptions: "lowercase"
  };

  const onSubmit: DinaFormOnSubmit<MaterialSampleBulkSplitFields> = ({
    submittedValues
  }) => {
    if (
      Number(generatedIdentifiers.length) !==
      Number(submittedValues?.numberToCreate)
    ) {
      return;
    }

    const splitMaterialSample = splitFromMaterialSamples
      ?.data?.[0] as MaterialSample;

    if (!splitMaterialSample) {
      return;
    }

    const samples = [...Array(Number(submittedValues.numberToCreate))].map<
      InputResource<MaterialSample>
    >((_, index) => {
      return {
        type: "material-sample",
        parentMaterialSample: {
          id: splitMaterialSample.id ?? "",
          type: "material-sample"
        },
        group: splitMaterialSample.group ?? "",
        collection: splitMaterialSample?.collection?.id
          ? {
              id: splitMaterialSample.collection?.id ?? "",
              type: "collection"
            }
          : undefined,
        publiclyReleasable: true,
        allowDuplicateName: false,
        materialSampleName: generatedIdentifiers[index]
      };
    });

    onGenerate(samples);
  };

  return (
    <DinaForm<MaterialSampleBulkSplitFields>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
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
                disabled={isMultiple}
              />
            </div>
            <div className="col-md-4">
              <RadioButtonsField<string>
                name="seriesOptions"
                label={formatMessage("splitSeriesOptionLabel")}
                horizontalOptions={true}
                options={[
                  {
                    value: "continue",
                    label: formatMessage("splitSeriesOptionContinue"),
                    disabled: !ableToContinueSeries,
                    tooltipLabel: !ableToContinueSeries
                      ? "splitSeriesOptionContinueTooltip"
                      : undefined
                  },
                  {
                    value: "continueFromParent",
                    label: formatMessage("splitSeriesOptionContinueFromParent"),
                    disabled: !ableToContinueSeriesFromParent,
                    tooltipLabel: !ableToContinueSeriesFromParent
                      ? "splitSeriesOptionContinueFromParentTooltip"
                      : undefined
                  },
                  {
                    value: "new",
                    label: formatMessage("splitSeriesOptionNew")
                  }
                ]}
              />
            </div>
            <div className="col-md-4">
              <FieldSpy fieldName="seriesOptions">
                {(selected) => (
                  <SelectField
                    name="generationOptions"
                    label={formatMessage("splitGenerationOptionLabel")}
                    disabled={selected === "continue"}
                    options={[
                      {
                        value: "lowercase",
                        label: formatMessage("splitGenerationOptionLowercase")
                      },
                      {
                        value: "uppercase",
                        label: formatMessage("splitGenerationOptionUppercase")
                      },
                      {
                        value: "numeric",
                        label: formatMessage("splitGenerationOptionNumerical")
                      }
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
            splitFromParentMaterialSamples={
              splitFromParentMaterialSamples.data as MaterialSample[]
            }
            generatedIdentifiers={generatedIdentifiers}
            setGeneratedIdentifiers={setGeneratedIdentifiers}
          />
        </>
      </PageLayout>
    </DinaForm>
  );
}

interface PreviewGeneratedNamesProps {
  splitFromMaterialSamples: MaterialSample[];
  splitFromParentMaterialSamples: MaterialSample[];
  generatedIdentifiers: string[];
  setGeneratedIdentifiers: (identifiers: string[]) => void;
}

function PreviewGeneratedNames({
  splitFromMaterialSamples,
  splitFromParentMaterialSamples,
  generatedIdentifiers,
  setGeneratedIdentifiers
}: PreviewGeneratedNamesProps) {
  const { save } = useApiClient();
  const formik = useFormikContext<MaterialSampleBulkSplitFields>();

  const isMultiple = useMemo(
    () => splitFromMaterialSamples?.length > 1,
    [splitFromMaterialSamples]
  );

  const seriesMode = formik.values.seriesOptions;
  const generationMode = formik.values.generationOptions;
  const numberToCreate = formik.values.numberToCreate;

  function getIdentifierRequest(index): MaterialSampleIdentifierGenerator {
    const getYoungestMaterialSample = (materialSampleChildren) => {
      return materialSampleChildren
        ? materialSampleChildren.reduce((max, current) => {
            return current.ordinal > max.ordinal ? current : max;
          }, materialSampleChildren[0])
        : undefined;
    };

    // Depending on the series mode, the identifier that will need to be sent to the backend to
    // generate more identifier changes.
    switch (seriesMode) {
      case "new":
        return {
          type: "material-sample-identifier-generator",
          amount: numberToCreate - 1,
          identifier:
            splitFromMaterialSamples?.[index]?.materialSampleName +
            APPEND_GENERATION_MODE[generationMode]
        };
      case "continue":
        return {
          type: "material-sample-identifier-generator",
          amount: numberToCreate,
          identifier: getYoungestMaterialSample(
            splitFromMaterialSamples?.[index]?.materialSampleChildren
          )?.materialSampleName
        };
      case "continueFromParent":
        return {
          type: "material-sample-identifier-generator",
          amount: numberToCreate,
          identifier: getYoungestMaterialSample(
            splitFromParentMaterialSamples?.[index]?.materialSampleChildren
          )?.materialSampleName
        };
    }
  }

  // To prevent spamming the network calls, this useEffect has a debounce.
  useEffect(() => {
    async function callGenerateIdentifierAPI() {
      const requests = [...Array(splitFromMaterialSamples.length).keys()].map(
        (i) => getIdentifierRequest(i)
      );

      const responses = await save<MaterialSampleIdentifierGenerator>(
        requests.map((request) => ({
          resource: request,
          type: "material-sample-identifier-generator"
        })),
        { apiBaseUrl: "/collection-api", overridePatchOperation: true }
      );

      const generatedIdentifiersResults = responses
        .flatMap((response) => response?.nextIdentifiers || [])
        .filter((identifier) => identifier);

      if (seriesMode === "new") {
        setGeneratedIdentifiers(requests.map((request) => request.identifier));
      } else {
        setGeneratedIdentifiers(generatedIdentifiersResults);
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
            <th>
              <DinaMessage id="splitPreviewNumberColumn" />
            </th>
            <th>
              <DinaMessage id="splitPreviewGeneratedIdentifierColumn" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: generatedIdentifiers.length }, (_, i) => i).map(
            (_, index) => (
              <tr key={index + 1}>
                <td>#{index + 1}</td>
                <td>
                  {generatedIdentifiers[index] ? (
                    generatedIdentifiers[index]
                  ) : (
                    <LoadingSpinner loading={true} />
                  )}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
