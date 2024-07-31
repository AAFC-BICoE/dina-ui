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
  DinaFormOnSubmit,
  useQuery,
  useAccount
} from "common-ui";
import { Card } from "react-bootstrap";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { useFormikContext } from "formik";
import { MaterialSampleIdentifierGenerator } from "../../types/collection-api/resources/MaterialSampleIdentifierGenerator";
import { useBulkGet } from "common-ui";
import { FormTemplate, MaterialSample } from "../../types/collection-api";
import { InputResource } from "kitsu";
import { SplitConfiguration } from "../../types/collection-api/resources/SplitConfiguration";
import { startCase } from "lodash";
import { SplitConfigurationOption } from "../collection/material-sample/SplitMaterialSampleDropdownButton";
import Select from "react-select";
import { getSplitConfigurationFormTemplates } from "../form-template/formTemplateUtils";
import { flattenDeep } from "lodash";

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
  splitConfiguration: splitConfigurationExternal,
  onGenerate
}: MaterialSampleSplitGenerationFormProps) {
  const { formatMessage } = useDinaIntl();
  const { groupNames, username } = useAccount();

  // List of all the split configurations available.
  const [splitConfigurationOptions, setSplitConfigurationOptions] = useState<
    SplitConfigurationOption[]
  >([]);

  // Selected split configuration option in drop down
  const [splitConfigurationOption, setSplitConfigurationOption] = useState<
    SplitConfigurationOption | undefined
  >();

  // Split configuration to be used
  const [splitConfiguration, setSplitConfiguration] = useState<
    SplitConfiguration | undefined
  >(splitConfigurationExternal);

  const [generatedIdentifiers, setGeneratedIdentifiers] = useState<string[]>(
    []
  );

  const [splitFromMaterialSamples, setSplitFromMaterialSamples] = useState<
    MaterialSample[]
  >([]);

  const isMultiple = useMemo(() => ids.length > 1, [ids]);

  const materialSamplesQuery = useBulkGet<MaterialSample>({
    ids,
    listPath:
      "collection-api/material-sample?include=materialSampleChildren,collection,parentMaterialSample",
    disabled: ids.length === 0,
    onSuccess(response) {
      setSplitFromMaterialSamples(response);
    }
  });
  const materialSampleType = (splitFromMaterialSamples?.at(0) as any)
    ?.materialSampleType;
  const filteredMaterialSamples = splitFromMaterialSamples?.filter(
    (materialSample: any) =>
      materialSample.materialSampleType === materialSampleType
  );

  const hasMismatchMaterialSampleType = splitFromMaterialSamples?.some(
    (materialSample: any) =>
      materialSample.materialSampleType !== materialSampleType
  );

  if (hasMismatchMaterialSampleType) {
    throw new Error(formatMessage("mismatchMaterialSampleTypeError"));
  }

  // Retrieve all of the form templates, then filter for the correct one.
  const formTemplatesQuery = useQuery<FormTemplate[]>(
    {
      path: "collection-api/form-template",

      // Display all user form templates and public to the group templates.
      filter: {
        rsql: `group=in=(${groupNames});(createdBy==${username},restrictToCreatedBy==false)`
      }
    },
    {
      disabled: filteredMaterialSamples?.length === 0,
      onSuccess: async ({ data }) => {
        const formTemplatesWithSplitConfig = getSplitConfigurationFormTemplates(
          data as FormTemplate[],
          materialSampleType
        );
        const generatedOptions = formTemplatesWithSplitConfig.map(
          (formTemplate) => ({
            label: formTemplate?.name ?? "",
            value: formTemplate?.id ?? ""
          })
        );
        setSplitConfigurationOptions(generatedOptions);

        // If options are available, just set the first one automatically.
        if (generatedOptions.length > 0) {
          setSplitConfigurationOption(generatedOptions[0]);
        }
      }
    }
  );
  const buttonBar = (
    <>
      {/* Back Button (Changes depending on the number of records) */}
      <div className="col-md-6 col-sm-12 mt-2">
        {isMultiple ? (
          <BackToListButton entityLink={ENTITY_LINK} />
        ) : (
          <BackButton entityLink={ENTITY_LINK} entityId={ids[0]} />
        )}
      </div>

      {/* Submit Button */}
      <div className="col-md-6 col-sm-12 d-flex">
        <SubmitButton className={"ms-auto"}>
          <DinaMessage id="splitButton" />
        </SubmitButton>
      </div>
    </>
  );

  if (materialSamplesQuery.loading || formTemplatesQuery.loading) {
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

    const splitFromMaterialSample: any = filteredMaterialSamples?.[0];

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
            {isMultiple && (
              <>
                <strong>
                  <DinaMessage id="selectSplitConfiguration" />
                </strong>
                <Select<SplitConfigurationOption>
                  className="mt-1 mb-3"
                  name="splitConfiguration"
                  options={splitConfigurationOptions}
                  onChange={(selection) =>
                    selection && setSplitConfigurationOption(selection)
                  }
                  autoFocus={true}
                  value={splitConfigurationOption}
                  isClearable={true}
                />
              </>
            )}
            <Card>
              <Card.Body>
                <DinaMessage id="splitFrom" />:
                <ul>
                  {(filteredMaterialSamples as any)?.map(
                    (materialSample, index) => (
                      <li key={index}>{materialSample?.materialSampleName}</li>
                    )
                  )}
                </ul>
              </Card.Body>
            </Card>

            {!isMultiple && (
              <NumberSpinnerField
                name="numberToCreate"
                min={1}
                max={500}
                label={formatMessage("materialSamplesToCreate")}
                disabled={isMultiple}
                className="mt-3"
              />
            )}
          </div>
          <div className="col-md-7">
            <PreviewGeneratedNames
              splitFromMaterialSamples={
                filteredMaterialSamples as MaterialSample[]
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
      quantity: numberToCreate,
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

      const generatedIdentifiersResults = flattenDeep(
        response.flatMap((resp) =>
          resp?.nextIdentifiers ? Object.values(resp?.nextIdentifiers) : []
        )
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
