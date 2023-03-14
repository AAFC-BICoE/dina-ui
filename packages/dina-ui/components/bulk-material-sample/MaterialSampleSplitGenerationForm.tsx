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
import {
  CharacterTypes,
  MaterialSampleIdentifierGenerator
} from "../../types/collection-api/resources/MaterialSampleIdentifierGenerator";
import { useBulkGet, useStringArrayConverter } from "common-ui";
import { MaterialSample } from "../../types/collection-api";
import { InputResource, PersistedResource } from "kitsu";
import { SplitConfiguration } from "../../types/collection-api/resources/SplitConfiguration";

const ENTITY_LINK = "/collection/material-sample";

type SeriesOptions = "splitConfig" | "continue" | "new";

interface MaterialSampleBulkSplitFields {
  numberToCreate: number;
  seriesOptions: SeriesOptions;
  generationOptions: CharacterTypes;
}

interface MaterialSampleSplitGenerationFormProps {
  ids: string[];
  splitConfiguration?: SplitConfiguration;
  onGenerate: (samples: InputResource<MaterialSample>[]) => void;
}

export function MaterialSampleSplitGenerationForm({
  ids,
  splitConfiguration,
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

  // Verify that all the ids meet the condition before preceding.
  // useEffect(() => {

  // }, [splitFromMaterialSamples.data])

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
      !splitConfiguration &&
      (splitFromMaterialSamples.data as any)?.every(
        (materialSample) => materialSample?.materialSampleChildren?.length !== 0
      ),
    [splitFromMaterialSamples.data, splitConfiguration]
  );

  const ableToStartNewSeries = useMemo<boolean>(
    () => !splitConfiguration,
    [splitConfiguration]
  );

  if (splitFromMaterialSamples.loading) {
    return <LoadingSpinner loading={true} />;
  }

  const initialValues: MaterialSampleBulkSplitFields = {
    numberToCreate: 1,
    seriesOptions: splitConfiguration
      ? "splitConfig"
      : ableToContinueSeries
      ? "continue"
      : "new",
    generationOptions: "LOWER_LETTER"
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

    const splitFromMaterialSample: any = splitFromMaterialSamples?.data?.[0];

    // TODO support multiple.
    const samples: InputResource<MaterialSample>[] = [];
    generatedIdentifiers.forEach((identifier) => {
      samples.push({
        type: "material-sample",
        parentMaterialSample: {
          id: splitFromMaterialSample?.id ?? "",
          type: "material-sample"
        },
        group: splitFromMaterialSample?.group ?? "",
        collection: splitFromMaterialSample?.collection?.id
          ? {
              id: splitFromMaterialSample?.collection?.id ?? "",
              type: "collection"
            }
          : undefined,
        publiclyReleasable: true,
        allowDuplicateName: false,
        materialSampleName: identifier
      });
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
                    value: "splitConfig",
                    label: formatMessage("materialSampleSplitConfiguration"),
                    disabled: !splitConfiguration
                  },
                  {
                    value: "continue",
                    label: formatMessage("splitSeriesOptionContinue"),
                    disabled: !ableToContinueSeries,
                    tooltipLabel: !ableToContinueSeries
                      ? "splitSeriesOptionContinueTooltip"
                      : undefined
                  },
                  {
                    value: "new",
                    label: formatMessage("splitSeriesOptionNew"),
                    disabled: !ableToStartNewSeries
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
                    disabled={selected === "continue" || !ableToStartNewSeries}
                    options={[
                      {
                        value: "LOWER_LETTER",
                        label: formatMessage("splitGenerationOptionLowercase")
                      },
                      {
                        value: "UPPER_LETTER",
                        label: formatMessage("splitGenerationOptionUppercase")
                      },
                      {
                        value: "NUMBER",
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
            generatedIdentifiers={generatedIdentifiers}
            setGeneratedIdentifiers={setGeneratedIdentifiers}
            splitConfiguration={splitConfiguration}
          />
        </>
      </PageLayout>
    </DinaForm>
  );
}

interface PreviewGeneratedNamesProps {
  splitFromMaterialSamples: MaterialSample[];
  generatedIdentifiers: string[];
  setGeneratedIdentifiers: (identifiers: string[]) => void;
  splitConfiguration?: SplitConfiguration;
}

function PreviewGeneratedNames({
  splitFromMaterialSamples,
  generatedIdentifiers,
  setGeneratedIdentifiers,
  splitConfiguration
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
    // Depending on the series mode, the identifier that will need to be sent to the backend to
    // generate more identifier changes.
    switch (seriesMode) {
      case "new":
        return {
          type: "material-sample-identifier-generator",
          amount: numberToCreate,
          currentParentUUID: splitFromMaterialSamples?.[index]?.id ?? "",
          strategy: "DIRECT_PARENT",
          characterType: generationMode
        };
      case "continue":
        return {
          type: "material-sample-identifier-generator",
          amount: numberToCreate,
          currentParentUUID: splitFromMaterialSamples?.[index]?.id ?? "",
          strategy: "DIRECT_PARENT",
          characterType: generationMode
        };
      case "splitConfig":
        return {
          type: "material-sample-identifier-generator",
          amount: numberToCreate,
          currentParentUUID: splitFromMaterialSamples?.[index]?.id ?? "",
          strategy:
            splitConfiguration?.materialSampleNameGeneration?.strategy ??
            "DIRECT_PARENT",
          characterType:
            splitConfiguration?.materialSampleNameGeneration?.characterType ??
            "LOWER_LETTER",
          materialSampleType:
            splitConfiguration?.materialSampleNameGeneration?.materialSampleType
        };
    }
  }

  // To prevent spamming the network calls, this useEffect has a debounce.
  useEffect(() => {
    async function callGenerateIdentifierAPI() {
      const requests = [...Array(splitFromMaterialSamples.length).keys()].map(
        (i) => getIdentifierRequest(i)
      );

      // If in multiple mode and series mode is new, no request is required.
      const responses: PersistedResource<MaterialSampleIdentifierGenerator>[] =
        [];
      if (!isMultiple || seriesMode !== "new") {
        for (const request of requests) {
          const response = await save<MaterialSampleIdentifierGenerator>(
            [
              {
                resource: request,
                type: "material-sample-identifier-generator"
              }
            ],
            { apiBaseUrl: "/collection-api", overridePatchOperation: true }
          );
          responses.push(response[0]);
        }
      }

      const generatedIdentifiersResults = responses
        .flatMap((response) => response?.nextIdentifiers || [])
        .filter((identifier) => identifier);

      setGeneratedIdentifiers(generatedIdentifiersResults);
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
          {Array.from(
            {
              length: isMultiple ? generatedIdentifiers.length : numberToCreate
            },
            (_, i) => i
          ).map((_, index) => (
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
