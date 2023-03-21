import { useEffect, useMemo, useState } from "react";
import { BackToListButton } from "common-ui/lib/button-bar/BackToListButton";
import PageLayout from "../page/PageLayout";
import {
  BackButton,
  DinaForm,
  NumberSpinnerField,
  SubmitButton,
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
import { SplitConfiguration } from "../../types/collection-api/resources/SplitConfiguration";
import { startCase } from "lodash";

const ENTITY_LINK = "/collection/material-sample";

interface MaterialSampleBulkSplitFields {
  numberToCreate: number;
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

  if (splitFromMaterialSamples.loading) {
    return <LoadingSpinner loading={true} />;
  }

  const initialValues: MaterialSampleBulkSplitFields = {
    numberToCreate: 1
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
        <div className="row">
          <div className="col-md-5">
            <h4 className="mt-2">
              <DinaMessage id="settingLabel" />
            </h4>
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

            <NumberSpinnerField
              name="numberToCreate"
              min={1}
              max={500}
              label={formatMessage("materialSamplesToCreate")}
              disabled={isMultiple}
              className="mt-3"
            />
          </div>
          <div className="col-md-7">
            <PreviewGeneratedNames
              splitFromMaterialSamples={
                splitFromMaterialSamples.data as MaterialSample[]
              }
              generatedIdentifiers={generatedIdentifiers}
              setGeneratedIdentifiers={setGeneratedIdentifiers}
              splitConfiguration={splitConfiguration}
            />
          </div>
        </div>
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

  const numberToCreate = formik.values.numberToCreate;

  function getIdentifierRequest(index): MaterialSampleIdentifierGenerator {
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

  // To prevent spamming the network calls, this useEffect has a debounce.
  useEffect(() => {
    async function callGenerateIdentifierAPI() {
      const response = await save<MaterialSampleIdentifierGenerator>(
        [
          {
            resource: getIdentifierRequest(0),
            type: "material-sample-identifier-generator"
          }
        ],
        { apiBaseUrl: "/collection-api", overridePatchOperation: true }
      );

      const generatedIdentifiersResults = response.flatMap(
        (resp) => resp?.nextIdentifiers ?? []
      );

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

  // Columns to be displayed
  const materialSampleType =
    splitConfiguration?.materialSampleNameGeneration?.materialSampleType ?? "";
  const formattedMaterialSampleType = startCase(
    materialSampleType.toLowerCase().replace(/_/g, " ")
  );

  return (
    <div className="mt-2">
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
            <th>
              <DinaMessage id="parentMaterialSample" />
            </th>
            <th>
              <DinaMessage id="field_materialSampleType" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from(
            {
              length: numberToCreate
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
              <td>{splitFromMaterialSamples?.[0]?.materialSampleName ?? ""}</td>
              <td>{formattedMaterialSampleType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
