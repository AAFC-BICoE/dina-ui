import {
  BackButton,
  ButtonBar,
  ControlledVocabularySelectField,
  DinaForm,
  DinaFormOnSubmit,
  FieldSet,
  SelectField,
  SubmitButton,
  TextField,
  useDinaFormContext,
  useQuery,
  withResponseOrDisabled
} from "common-ui";
import { NextRouter, useRouter } from "next/router";
import { GroupSelectField } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  DIRECT_PARENT_STRATEGY,
  LOWER_CHARACTER_TYPE,
  NUMBER_CHARACTER_TYPE,
  SEPERATOR_DASH,
  SEPERATOR_SPACE,
  SEPERATOR_UNDERSCORE,
  SplitConfiguration,
  TYPE_BASED_STRATEGY,
  UPPER_CHARACTER_TYPE
} from "../../../types/collection-api/resources/SplitConfiguration";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { isUndefined, isEmpty } from "lodash";

export default function SplitConfigurationEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;

  const splitConfigurationQuery = useQuery<SplitConfiguration>(
    { path: `collection-api/split-configuration/${id}` },
    { disabled: id === undefined }
  );

  const titleId =
    id === undefined ? "splitConfigurationAdd" : "splitConfigurationEdit";

  return (
    <PageLayout titleId={titleId} displayHeading={false}>
      {withResponseOrDisabled(splitConfigurationQuery, (response) => (
        <SplitConfigurationForm
          splitConfiguration={response ? response.data : undefined}
          titleId={titleId}
          router={router}
          readOnlyMode={false}
        />
      ))}
    </PageLayout>
  );
}

interface SplitConfigurationFormProps {
  splitConfiguration?: SplitConfiguration;
  readOnlyMode: boolean;
  titleId: string;
  router: NextRouter;
}

export function SplitConfigurationForm({
  readOnlyMode,
  splitConfiguration: splitConfigurationData,
  titleId,
  router
}: SplitConfigurationFormProps) {
  const { formatMessage } = useDinaIntl();

  const initialValues: SplitConfiguration = splitConfigurationData
    ? splitConfigurationData
    : {
        type: "split-configuration",
        separator: SEPERATOR_DASH
      };

  const onSubmit: DinaFormOnSubmit<SplitConfiguration> = async ({
    api: { save },
    submittedValues
  }) => {
    const updatedSplitConfiguration = {
      ...submittedValues,
      id: submittedValues.id,
      type: submittedValues.type
    } as SplitConfiguration;

    const [savedSplitConfiguration] = await save(
      [
        {
          resource: updatedSplitConfiguration,
          type: updatedSplitConfiguration.type
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    await router.push(
      `/collection/split-configuration/view?id=${savedSplitConfiguration.id}`
    );
  };

  const onValidate = (values: SplitConfiguration) => {
    // Create a new object to hold any new errors we find
    const newErrors: any = {};

    // Name is a required field
    if (isUndefined(values?.name)) {
      newErrors.name = formatMessage("requiredField");
    }

    // Condition Material Sample Type is a required field
    if (isEmpty(values?.conditionalOnMaterialSampleTypes)) {
      newErrors.conditionalOnMaterialSampleTypes =
        formatMessage("requiredField");
    }

    // Strategy is a required field
    if (isUndefined(values?.strategy)) {
      newErrors.strategy = formatMessage("requiredField");
    } else if (
      values.strategy === "TYPE_BASED" &&
      isUndefined(values.materialSampleTypeCreatedBySplit)
    ) {
      newErrors.materialSampleTypeCreatedBySplit = formatMessage(
        "materialSampleSplitConfigurationRequiredMaterialSampleType"
      );
    }

    // Character Type is a required field
    if (isUndefined(values?.characterType)) {
      newErrors.characterType = formatMessage("requiredField");
    }

    // Seperator is required and it can only be one character.
    if (!isUndefined(values?.separator) && values.separator.length > 1) {
      newErrors.separator = formatMessage(
        "materialSampleSplitConfigurationSeperatorError"
      );
    }

    return newErrors;
  };

  const buttonBarContent = readOnlyMode ? null : (
    <>
      <ButtonBar className="mb-4">
        <div className="col-md-6 col-sm-12 mt-2">
          <BackButton
            entityId={initialValues.id as string}
            entityLink="/collection/split-configuration"
          />
        </div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
        </div>
      </ButtonBar>
      <h1 id="wb-cont">
        <DinaMessage id={titleId as any} />
      </h1>
    </>
  );

  return (
    <DinaForm<SplitConfiguration>
      initialValues={initialValues}
      onSubmit={onSubmit}
      validate={onValidate}
      readOnly={readOnlyMode}
    >
      {buttonBarContent}
      <SplitConfigurationFormLayout />
    </DinaForm>
  );
}

export function SplitConfigurationFormLayout() {
  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  return (
    <>
      <div className="row">
        <TextField
          className="col-md-6 splitConfigurationName"
          name="name"
          label={formatMessage("splitConfigurationNameLabel")}
        />
        {!readOnly && (
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-md-6"
          />
        )}
      </div>

      {/* Condition Fields */}
      <FieldSet
        id="split-configuration-condition-section"
        legend={<DinaMessage id="materialSampleSplitConfigurationCondition" />}
        sectionName="split-configuration-condition-section"
        className="non-strip"
      >
        <div className="row">
          <ControlledVocabularySelectField
            name="conditionalOnMaterialSampleTypes"
            label={formatMessage("field_materialSampleType")}
            query={() => ({
              path: "collection-api/vocabulary2/materialSampleType"
            })}
            isMulti={true}
          />
        </div>
      </FieldSet>

      {/* Sequence Generation Fields */}
      <FieldSet
        id="split-configuration-material-sample-name-generation-section"
        legend={
          <DinaMessage id="materialSampleSplitConfigurationMaterialSampleNameGeneration" />
        }
        sectionName="split-configuration-material-sample-name-generation-section"
        className="non-strip"
      >
        <div className="row">
          <div className="col-md-6">
            <SelectField
              name="strategy"
              label={formatMessage("materialSampleSplitConfigurationStrategy")}
              options={[
                {
                  value: DIRECT_PARENT_STRATEGY,
                  label: formatMessage(
                    "materialSampleSplitConfigurationDirectParent"
                  )
                },
                {
                  value: TYPE_BASED_STRATEGY,
                  label: formatMessage("field_materialSampleType")
                }
              ]}
            />
          </div>
          <div className="col-md-6">
            <SelectField
              name="characterType"
              label={formatMessage("splitGenerationOptionLabel")}
              options={[
                {
                  value: LOWER_CHARACTER_TYPE,
                  label: formatMessage("splitGenerationOptionLowercase")
                },
                {
                  value: UPPER_CHARACTER_TYPE,
                  label: formatMessage("splitGenerationOptionUppercase")
                },
                {
                  value: NUMBER_CHARACTER_TYPE,
                  label: formatMessage("splitGenerationOptionNumerical")
                }
              ]}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <SelectField
              name="separator"
              label={formatMessage("materialSampleSplitConfigurationSeperator")}
              options={[
                {
                  value: SEPERATOR_DASH,
                  label: formatMessage("splitConfiguration_separator_dash")
                },
                {
                  value: SEPERATOR_UNDERSCORE,
                  label: formatMessage(
                    "splitConfiguration_separator_underscore"
                  )
                },
                {
                  value: SEPERATOR_SPACE,
                  label: formatMessage("splitConfiguration_separator_space")
                }
              ]}
            />
          </div>
        </div>
      </FieldSet>

      {/* Material Sample Generation */}
      <FieldSet
        id="split-configuration-material-sample-generation-section"
        legend={
          <DinaMessage id="materialSampleSplitConfigurationMaterialSampleGeneration" />
        }
        sectionName="split-configuration-material-sample-generation-section"
        className="non-strip"
      >
        <div className="row">
          <ControlledVocabularySelectField
            name="materialSampleTypeCreatedBySplit"
            label={formatMessage(
              "materialSampleSplitConfigurationTypeCreatedBySplit"
            )}
            query={() => ({
              path: "collection-api/vocabulary2/materialSampleType"
            })}
            isMulti={false}
          />
        </div>
      </FieldSet>
    </>
  );
}
