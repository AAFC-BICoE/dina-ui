import { useLocalStorage } from "@rehooks/local-storage";
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
  DinaFormOnSubmit,
  getCustomQueryPageLocalStorageKey,
  materialSampleChildrenViewOptions
} from "common-ui";
import { Card } from "react-bootstrap";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { useFormikContext } from "formik";
import { MaterialSampleIdentifierGenerator } from "../../types/collection-api/resources/MaterialSampleIdentifierGenerator";
import { useBulkGet, useStringArrayConverter } from "common-ui";
import { MaterialSample } from "../../types/collection-api";
import { InputResource, PersistedResource } from "kitsu";
import {
  CustomOptionsDropdown,
  CustomQueryOption
} from "common-ui/lib/custom-query-view/CustomOptionsDropdown";

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
      "collection-api/material-sample?include=materialSampleChildren,collection,parentMaterialSample,hierarchy",
    disabled: ids.length === 0
  });

  // Load the custom view option value.
  const [customQuerySelectedValue, setCustomQuerySelectedValue] =
    useLocalStorage<string>(
      getCustomQueryPageLocalStorageKey("material-sample-children")
    );

  // List of all the possible options, we use the first index to generate the list options.
  const customQueryOptions = useMemo(() => {
    if (splitFromMaterialSamples?.data?.[0]) {
      return materialSampleChildrenViewOptions(
        splitFromMaterialSamples.data[0] as MaterialSample
      );
    }
  }, [splitFromMaterialSamples.data]);

  const customQuerySelected: CustomQueryOption | undefined = useMemo(() => {
    return customQueryOptions?.find(
      (option) => option.value === customQuerySelectedValue
    );
  }, [customQuerySelectedValue, customQueryOptions]);

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
    generationOptions: "lowercase"
  };

  const onSubmit: DinaFormOnSubmit<MaterialSampleBulkSplitFields> = ({
    submittedValues
  }) => {
    if (
      !isMultiple &&
      Number(generatedIdentifiers.length) !==
        Number(submittedValues?.numberToCreate)
    ) {
      return;
    }

    const samples: InputResource<MaterialSample>[] = [];
    splitFromMaterialSamples?.data?.forEach((splitMaterialSample, index) => {
      if (!splitMaterialSample) {
        return;
      }

      samples.push({
        type: "material-sample",
        parentMaterialSample: {
          id: splitMaterialSample.id ?? "",
          type: "material-sample"
        },
        group: (splitMaterialSample as any).group ?? "",
        collection: (splitMaterialSample as any)?.collection?.id
          ? {
              id: (splitMaterialSample as any).collection?.id ?? "",
              type: "collection"
            }
          : undefined,
        publiclyReleasable: true,
        allowDuplicateName: false,
        materialSampleName: generatedIdentifiers[index]
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
                    value: "continue",
                    label: formatMessage("splitSeriesOptionContinue"),
                    disabled: !ableToContinueSeries,
                    tooltipLabel: !ableToContinueSeries
                      ? "splitSeriesOptionContinueTooltip"
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
                {(selected) =>
                  selected === "new" ? (
                    <SelectField
                      name="generationOptions"
                      label={formatMessage("splitGenerationOptionLabel")}
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
                  ) : (
                    <>
                      {customQueryOptions ? (
                        <CustomOptionsDropdown
                          customQueryOptions={customQueryOptions}
                          customQuerySelected={customQuerySelectedValue}
                          setCustomQuerySelectedValue={
                            setCustomQuerySelectedValue
                          }
                        />
                      ) : (
                        <></>
                      )}
                    </>
                  )
                }
              </FieldSpy>
            </div>
          </div>

          <PreviewGeneratedNames
            splitFromMaterialSamples={
              splitFromMaterialSamples.data as MaterialSample[]
            }
            generatedIdentifiers={generatedIdentifiers}
            setGeneratedIdentifiers={setGeneratedIdentifiers}
            customQueryOptionSelected={customQuerySelected}
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
  customQueryOptionSelected: CustomQueryOption | undefined;
}

function PreviewGeneratedNames({
  splitFromMaterialSamples,
  generatedIdentifiers,
  setGeneratedIdentifiers,
  customQueryOptionSelected
}: PreviewGeneratedNamesProps) {
  const { save, apiClient } = useApiClient();
  const formik = useFormikContext<MaterialSampleBulkSplitFields>();

  const [seedIdentifiers, setSeedIdentifiers] = useState<string[] | undefined>(
    undefined
  );

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
          amount: numberToCreate - 1,
          identifier:
            splitFromMaterialSamples?.[index]?.materialSampleName +
            APPEND_GENERATION_MODE[generationMode]
        };
      case "continue":
        return {
          type: "material-sample-identifier-generator",
          amount: numberToCreate,
          identifier: seedIdentifiers?.[index] ?? ""
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

      if (seriesMode === "new") {
        if (isMultiple) {
          setGeneratedIdentifiers(
            requests.map((request) => request.identifier)
          );
        } else {
          setGeneratedIdentifiers([
            requests[0].identifier,
            ...generatedIdentifiersResults
          ]);
        }
      } else {
        setGeneratedIdentifiers(generatedIdentifiersResults);
      }
    }

    let timeoutId;
    const debouncedHandleChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Don't run the identifier API call until seeds are created (only in continue mode.)
        if (seriesMode === "continue" && seedIdentifiers === undefined) {
          return;
        }

        callGenerateIdentifierAPI();
      }, 500);
    };
    debouncedHandleChange();
    return () => {
      clearTimeout(timeoutId);
    };
  }, [formik.values, seedIdentifiers]);

  useEffect(() => {
    if (!customQueryOptionSelected) {
      return;
    }

    // Go through each "split from" material sample to get the generated custom elastic search query
    // for each. We will need to do a query for each one to determine the "seed" identifier.
    const customOptionsForEachMaterialSample: any[] = [
      ...Array(splitFromMaterialSamples.length).keys()
    ].map(
      (index) =>
        materialSampleChildrenViewOptions(
          splitFromMaterialSamples?.[index] as MaterialSample
        ).find((option) => option.value === customQueryOptionSelected?.value)
          ?.customElasticSearch
    );

    Promise.all(
      customOptionsForEachMaterialSample.map((elasticSearchQuery) =>
        elasticSearchRequest(elasticSearchQuery)
      )
    ).then((values) => {
      setSeedIdentifiers(
        values.map(
          (value) =>
            value?.hits?.[0]?._source?.data?.attributes?.materialSampleName
        )
      );
    });
  }, [customQueryOptionSelected]);

  /**
   * Asynchronous POST request for elastic search.
   *
   * @param queryDSL query containing filters and pagination.
   * @returns Elastic search response.
   */
  async function elasticSearchRequest(queryDSL) {
    const query = { ...queryDSL };
    const resp = await apiClient.axios.post(
      `search-api/search-ws/search`,
      query,
      {
        params: {
          indexName: "dina_material_sample_index"
        }
      }
    );
    return resp?.data?.hits;
  }

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
