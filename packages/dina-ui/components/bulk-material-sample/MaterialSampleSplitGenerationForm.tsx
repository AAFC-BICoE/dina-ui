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
import { MaterialSample } from "../../types/collection-api";
import { InputResource } from "kitsu";
import { startCase } from "lodash";
import { SplitConfigurationOption } from "../collection/material-sample/SplitMaterialSampleDropdownButton";
import Select from "react-select";
import { flattenDeep } from "lodash";
import { ErrorBanner } from "../error/ErrorBanner";
import { useRouter } from "next/router";
import { SplitConfiguration } from "../../types/collection-api/resources/SplitConfiguration";

const ENTITY_LINK = "/collection/material-sample";

interface MaterialSampleBulkSplitFields {
  numberToCreate: number;
}

interface MaterialSampleSplitGenerationFormProps {
  ids: string[];
  splitConfiguration?: SplitConfiguration;
  onGenerate: (samples: InputResource<MaterialSample>[]) => void;
  setSplitConfigurationID?: (splitConfigurationID: string) => void;
  splitConfigurationID?: string;
}

export function MaterialSampleSplitGenerationForm({
  ids,
  splitConfiguration: splitConfigurationExternal,
  onGenerate,
  setSplitConfigurationID,
  splitConfigurationID
}: MaterialSampleSplitGenerationFormProps) {
  const { formatMessage } = useDinaIntl();
  const { groupNames, username } = useAccount();
  const router = useRouter();
  const splitConfigQuery = router?.query?.splitConfiguration;

  // List of all the split configurations available.
  const [splitConfigurationOptions, setSplitConfigurationOptions] = useState<
    SplitConfigurationOption[]
  >([]);

  // Split configuration to be used
  const [splitConfiguration, setSplitConfiguration] = useState<
    SplitConfiguration | undefined
  >(splitConfigurationExternal);

  const [generatedIdentifiers, setGeneratedIdentifiers] = useState<
    Record<string, string[]>
  >({});

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

  const filteredMaterialSamples = splitFromMaterialSamples?.filter(
    (materialSample: any) =>
      splitConfiguration?.conditionalOnMaterialSampleTypes?.includes(
        materialSample.materialSampleType
      )
  );

  const hasMismatchMaterialSampleType = splitFromMaterialSamples?.some(
    (materialSample: any) =>
      !splitConfiguration?.conditionalOnMaterialSampleTypes?.includes(
        materialSample.materialSampleType
      )
  );

  // Retrieve all of the form templates, then filter for the correct one.
  const splitConfigurationQuery = useQuery<SplitConfiguration[]>(
    {
      path: "collection-api/split-configuration",
      page: {
        limit: 1000
      },
      // Display all user split configurations.
      filter: {
        rsql: `group=in=(${groupNames});(createdBy==${username})`
      }
    },
    {
      disabled: filteredMaterialSamples?.length === 0,
      onSuccess: async ({ data }) => {
        const generatedOptions = data.map((splitConfig) => ({
          label: splitConfiguration?.name ?? "",
          value: splitConfiguration?.id ?? "",
          resource: splitConfig
        }));

        setSplitConfigurationOptions(generatedOptions);

        // If options are available, just set the first one automatically.
        if (generatedOptions.length > 0 && generatedOptions?.[0]?.resource) {
          setSplitConfiguration?.(generatedOptions?.[0]?.resource);
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
        <SubmitButton
          className={"ms-auto"}
          buttonProps={() => ({
            disabled: !splitConfiguration
          })}
        >
          <DinaMessage id="splitButton" />
        </SubmitButton>
      </div>
    </>
  );

  if (materialSamplesQuery.loading || splitConfigurationQuery.loading) {
    return <LoadingSpinner loading={true} />;
  }

  const initialValues: MaterialSampleBulkSplitFields = {
    numberToCreate: 1
  };

  const onSubmit: DinaFormOnSubmit<MaterialSampleBulkSplitFields> = ({
    submittedValues
  }) => {
    if (filteredMaterialSamples.length === 1) {
      if (
        Number(flattenDeep(Object.values(generatedIdentifiers)).length) !==
        Number(submittedValues?.numberToCreate)
      ) {
        return;
      }
    } else if (filteredMaterialSamples.length > 1) {
      if (
        Number(Object.keys(generatedIdentifiers).length) !==
        Number(filteredMaterialSamples.length)
      ) {
        return;
      }
    }

    const samples: InputResource<MaterialSample>[] = [];
    Object.keys(generatedIdentifiers).forEach((parentId) => {
      generatedIdentifiers[parentId].forEach((childMaterialSampleName) => {
        const parentMaterialSample = filteredMaterialSamples.find(
          (filteredMaterialSample) => filteredMaterialSample.id === parentId
        );
        samples.push({
          type: "material-sample",
          parentMaterialSample: {
            id: parentId ?? "",
            type: "material-sample"
          },
          group: parentMaterialSample?.group ?? "",
          collection: parentMaterialSample?.collection?.id
            ? {
                id: parentMaterialSample?.collection?.id ?? "",
                type: "collection"
              }
            : undefined,
          publiclyReleasable: true,
          allowDuplicateName: false,
          materialSampleName: childMaterialSampleName
        });
      });
    });

    onGenerate(samples);
  };

  const splitConfigurationOption = splitConfigurationOptions.find(
    (splitOption) => splitOption.value === splitConfigurationID
  );

  return (
    <DinaForm<MaterialSampleBulkSplitFields>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <PageLayout titleId="splitSubsampleTitle" buttonBarContent={buttonBar}>
        {hasMismatchMaterialSampleType && (
          <ErrorBanner
            errorMessage={formatMessage("mismatchMaterialSampleTypeError")}
          />
        )}
        <div className="row">
          <div className="col-md-5">
            <h4 className="mt-2">
              <DinaMessage id="settingLabel" />
            </h4>
            {!splitConfigQuery && (
              <>
                <strong>
                  <DinaMessage id="selectSplitConfiguration" />
                </strong>
                <Select<SplitConfigurationOption>
                  className="mt-1 mb-3"
                  name="splitConfiguration"
                  options={splitConfigurationOptions}
                  onChange={(selection) => {
                    if (selection && selection.resource) {
                      setSplitConfigurationID?.(selection.value);
                      setSplitConfiguration(selection.resource);
                    }
                  }}
                  autoFocus={true}
                  value={splitConfigurationOption}
                />
              </>
            )}
            <Card>
              <Card.Body>
                <DinaMessage id="splitFrom" />:
                <ul>
                  {Object.keys(generatedIdentifiers).map((parentId, index) => (
                    <li key={index}>
                      {
                        filteredMaterialSamples.find(
                          (materialSample) => materialSample.id === parentId
                        )?.materialSampleName
                      }
                    </li>
                  ))}
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
              splitFromMaterialSamples={filteredMaterialSamples}
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
  generatedIdentifiers: Record<string, string[]>;
  setGeneratedIdentifiers: (identifiers: Record<string, string[]>) => void;
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
  const numberToCreate =
    splitFromMaterialSamples.length > 1
      ? splitFromMaterialSamples.length
      : formik.values.numberToCreate;

  function getSingleParentIdentifierRequest(
    index
  ): MaterialSampleIdentifierGenerator {
    return {
      type: "material-sample-identifier-generator",
      quantity: numberToCreate,
      currentParentUUID: splitFromMaterialSamples?.[index]?.id ?? "",
      strategy: splitConfiguration?.strategy ?? "DIRECT_PARENT",
      characterType: splitConfiguration?.characterType ?? "LOWER_LETTER",
      materialSampleType: splitConfiguration?.materialSampleTypeCreatedBySplit
    };
  }

  function getMultiParentIdentifierRequest(
    parentIds
  ): MaterialSampleIdentifierGenerator {
    return {
      type: "material-sample-identifier-generator",
      currentParentsUUID: parentIds,
      strategy: splitConfiguration?.strategy ?? "DIRECT_PARENT",
      characterType: splitConfiguration?.characterType ?? "LOWER_LETTER",
      materialSampleType: splitConfiguration?.materialSampleTypeCreatedBySplit
    };
  }

  // To prevent spamming the network calls, this useEffect has a debounce.
  useEffect(() => {
    async function callGenerateIdentifierAPI() {
      if (splitFromMaterialSamples.length === 1) {
        const response = await save<MaterialSampleIdentifierGenerator>(
          [
            {
              resource: getSingleParentIdentifierRequest(0),
              type: "material-sample-identifier-generator"
            }
          ],
          { apiBaseUrl: "/collection-api", overridePatchOperation: true }
        );

        setGeneratedIdentifiers(response[0].nextIdentifiers ?? {});
      } else if (splitFromMaterialSamples.length > 1) {
        const parentIds = splitFromMaterialSamples.map(
          (parentMaterialSample) => parentMaterialSample.id
        );
        const response = await save<MaterialSampleIdentifierGenerator>(
          [
            {
              resource: getMultiParentIdentifierRequest(parentIds),
              type: "material-sample-identifier-generator"
            }
          ],
          { apiBaseUrl: "/collection-api", overridePatchOperation: true }
        );
        setGeneratedIdentifiers(response[0].nextIdentifiers ?? {});
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
  }, [formik.values, splitConfiguration]);

  // Columns to be displayed
  const materialSampleType =
    splitConfiguration?.materialSampleTypeCreatedBySplit ?? "";
  const formattedMaterialSampleType = startCase(
    materialSampleType.toLowerCase().replace(/_/g, " ")
  );

  const childrenRows: JSX.Element[] = [];
  let numberOfChildren = 0;
  Object.keys(generatedIdentifiers).forEach((parentId) => {
    const childMaterialSampleNames = generatedIdentifiers[parentId];
    const parentMaterialSampleName = splitFromMaterialSamples.find(
      (materialSample) => materialSample.id === parentId
    )?.materialSampleName;
    childMaterialSampleNames.forEach((childMaterialSampleName) => {
      numberOfChildren++;
      const childRowComponent = (
        <tr key={numberOfChildren}>
          <td>#{numberOfChildren}</td>
          <td>
            {childMaterialSampleName ? (
              childMaterialSampleName
            ) : (
              <LoadingSpinner loading={true} />
            )}
          </td>
          <td>{parentMaterialSampleName}</td>
          <td>{formattedMaterialSampleType}</td>
        </tr>
      );
      childrenRows.push(childRowComponent);
    });
  });

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
        <tbody>{childrenRows}</tbody>
      </table>
    </div>
  );
}
