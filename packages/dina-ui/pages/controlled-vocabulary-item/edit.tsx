import {
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  MultilingualDescription,
  MultilingualTitle,
  ResourceSelectField,
  SelectField,
  SimpleSearchFilterBuilder,
  StringArrayField,
  SubmitButton,
  TextField,
  useAccount,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import _ from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { withRouter } from "next/router";
import { useState } from "react";
import { GroupSelectField } from "../../components";
import {
  getInitialVocabularyElementType,
  transformControlledVocabularyItemForForm
} from "../../components/controlled-vocabulary/controlledVocabularyItemUtils";
import PageLayout from "../../components/page/PageLayout";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import {
  CollectionModuleType,
  COLLECTION_MODULE_TYPES,
  COLLECTION_MODULE_TYPE_LABELS,
  MANAGED_ATTRIBUTE_TYPE_OPTIONS,
  VocabularyElementType
} from "../../types/collection-api";
import { ControlledVocabularyItem } from "../../types/collection-api/resources/ControlledVocabularyItem";
import { ControlledVocabulary } from "../../types/collection-api/resources/ControlledVocabulary";

export function ControlledVocabularyItemEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();
  const title = id
    ? "editControlledVocabularyItemTitle"
    : "addControlledVocabularyItemTitle";

  const query = useQuery<ControlledVocabularyItem>(
    {
      path: `collection-api/controlled-vocabulary-item/${id}`,
      include: "controlledVocabulary"
    },
    { disabled: id === undefined }
  );

  const backButton =
    id === undefined ? (
      <Link
        href="/controlled-vocabulary/list"
        className="back-button my-auto me-auto"
      >
        <DinaMessage id="backToList" />
      </Link>
    ) : (
      <Link
        href={`/controlled-vocabulary-item/view?id=${id}`}
        className="back-button my-auto me-auto"
      >
        <DinaMessage id="backToReadOnlyPage" />
      </Link>
    );

  return (
    <PageLayout titleId={formatMessage(title as any)}>
      {id ? (
        <div>
          {withResponse(query, ({ data }) => (
            <ControlledVocabularyItemForm
              router={router}
              fetchedItem={data}
              backButton={backButton}
            />
          ))}
        </div>
      ) : (
        <ControlledVocabularyItemForm router={router} backButton={backButton} />
      )}
    </PageLayout>
  );
}

interface ControlledVocabularyItemFormProps {
  fetchedItem?: PersistedResource<ControlledVocabularyItem>;
  router: WithRouterProps["router"];
  backButton: JSX.Element;
}

function ControlledVocabularyItemForm({
  fetchedItem,
  router,
  backButton
}: ControlledVocabularyItemFormProps) {
  const initialValues: InputResource<ControlledVocabularyItem> = fetchedItem
    ? transformControlledVocabularyItemForForm(fetchedItem)
    : { type: "controlled-vocabulary-item" };

  const onSubmit: DinaFormOnSubmit<
    InputResource<ControlledVocabularyItem>
  > = async ({ api: { save }, submittedValues }) => {
    // Treat empty array or undefined as null:
    if (!submittedValues.acceptedValues?.length) {
      submittedValues.acceptedValues = null as any;
    }

    if (submittedValues.vocabularyElementType === "PICKLIST") {
      submittedValues.vocabularyElementType = "STRING";
    } else if (
      submittedValues.vocabularyElementType === "INTEGER" ||
      submittedValues.vocabularyElementType === "STRING"
    ) {
      submittedValues.acceptedValues = null as any;
    }

    // Don't save unit if type is not INTEGER/DECIMAL
    if (
      submittedValues.vocabularyElementType !== "INTEGER" &&
      submittedValues.vocabularyElementType !== "DECIMAL"
    ) {
      delete submittedValues.unit;
    }

    // Convert the editable format to the stored format:
    submittedValues.multilingualDescription = {
      descriptions: _.toPairs(submittedValues.multilingualDescription).map(
        ([lang, desc]) => ({ lang, desc })
      )
    };

    submittedValues.multilingualTitle = {
      titles: _.toPairs(submittedValues.multilingualTitle).map(
        ([lang, title]) => ({ lang, title })
      )
    };

    // Clean up the controlledVocabulary relationship - only keep id and type
    if (submittedValues.controlledVocabulary) {
      const cvId = (submittedValues.controlledVocabulary as any).id;
      submittedValues.controlledVocabulary = {
        id: cvId,
        type: "controlled-vocabulary"
      } as any;
    }

    const [savedItem] = await save(
      [
        {
          resource: submittedValues,
          type: "controlled-vocabulary-item"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    await router.push(`/controlled-vocabulary-item/view?id=${savedItem.id}`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar className="mb-3">
        <div className="col-md-6 col-sm-12 mt-2">{backButton}</div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
        </div>
      </ButtonBar>
      <ControlledVocabularyItemFormLayout />
    </DinaForm>
  );
}

export function ControlledVocabularyItemFormLayout() {
  const { formatMessage } = useDinaIntl();
  const { readOnly, initialValues } = useDinaFormContext();
  const { isAdmin } = useAccount();

  const [selectedControlledVocabulary, setSelectedControlledVocabulary] =
    useState<PersistedResource<ControlledVocabulary> | null>(
      (initialValues?.controlledVocabulary as any) ?? null
    );

  const [vocabularyElementType, setVocabularyElementType] = useState<
    VocabularyElementType | undefined
  >(getInitialVocabularyElementType(initialValues));

  const ATTRIBUTE_TYPE_OPTIONS = MANAGED_ATTRIBUTE_TYPE_OPTIONS.map(
    ({ labelKey, value }) => ({ label: formatMessage(labelKey), value })
  );

  const ATTRIBUTE_COMPONENT_OPTIONS: {
    label: string;
    value: CollectionModuleType;
  }[] = COLLECTION_MODULE_TYPES.map((dataType) => ({
    label: formatMessage(COLLECTION_MODULE_TYPE_LABELS[dataType] as any),
    value: dataType
  }));

  // Check if MANAGED_ATTRIBUTE is selected
  const isManagedAttributeSelected =
    selectedControlledVocabulary?.type === "controlled-vocabulary" &&
    (selectedControlledVocabulary as any)?.vocabClass === "MANAGED_ATTRIBUTE";

  return (
    <>
      <div className="row">
        {!readOnly && (
          <GroupSelectField
            className="col-md-6"
            name="group"
            enableStoredDefaultGroup={true}
          />
        )}
        <ResourceSelectField<ControlledVocabulary>
          className="col-md-6"
          name="controlledVocabulary"
          filter={(input) =>
            SimpleSearchFilterBuilder.create<ControlledVocabulary>()
              .searchFilter("name", input)
              .when(!isAdmin, (builder) =>
                // User editable controlled vocabularies
                builder.whereIn("name", [
                  "MANAGED_ATTRIBUTE",
                  "FIELD_EXTENSIONS"
                ])
              )
              .build()
          }
          model="collection-api/controlled-vocabulary"
          optionLabel={(cv) => cv.name}
          onChange={(selected) => {
            setSelectedControlledVocabulary(
              selected as PersistedResource<ControlledVocabulary> | null
            );
          }}
          omitNullOption={true}
          asyncOptions={
            [
              // {
              //   label: <DinaMessage id="createNewControlledVocabulary" />,
              //   getResource: () => { return undefined }
              // }
            ]
          }
        />
      </div>
      <div className="row">
        <TextField className="col-md-6" name="name" />
        <TextField className="col-md-6" name="key" readOnly={true} />
      </div>
      {isManagedAttributeSelected && (
        <div className="row">
          <SelectField
            className="col-md-6"
            name="dinaComponent"
            options={ATTRIBUTE_COMPONENT_OPTIONS}
            label={formatMessage("field_targetDataComponentType" as any)}
          />
        </div>
      )}
      <div className="row">
        <SelectField
          className="col-md-6"
          name="vocabularyElementType"
          options={ATTRIBUTE_TYPE_OPTIONS}
          onChange={(selectValue: VocabularyElementType) =>
            setVocabularyElementType(selectValue)
          }
        />
        {(vocabularyElementType === "DECIMAL" ||
          vocabularyElementType === "INTEGER") && (
          <TextField className="col-md-6" name="unit" />
        )}
      </div>
      {vocabularyElementType === "PICKLIST" && (
        <div className="row">
          <div className="col-md-6">
            <StringArrayField name="acceptedValues" />
          </div>
        </div>
      )}
      <MultilingualTitle />
      <MultilingualDescription />
    </>
  );
}

export default withRouter(ControlledVocabularyItemEditPage);
