import {
  DateField,
  DinaForm,
  MultilingualDescription,
  MultilingualTitle,
  ResourceSelectField,
  SelectField,
  SimpleSearchFilterBuilder,
  StringArrayField,
  TextField,
  useAccount,
  useDinaFormContext,
  useQuery,
  useSubmitHandler,
  withResponse
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import _ from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { withRouter } from "next/router";
import { createContext, RefObject, useContext, useRef, useState } from "react";
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
import { FormikProps } from "formik";
import { FaFloppyDisk } from "react-icons/fa6";

interface FormSubmissionContextType {
  submitForm?: () => void;
  formRef?: RefObject<FormikProps<InputResource<ControlledVocabularyItem>>>;
}

const FormSubmissionContext = createContext<FormSubmissionContextType>({});

function useFormSubmission() {
  return useContext(FormSubmissionContext);
}

export function ControlledVocabularyItemEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
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

  return (
    <>
      {id ? (
        <div>
          {withResponse(query, ({ data }) => (
            <ControlledVocabularyItemEditPageContent
              router={router}
              fetchedItem={data}
              title={title}
            />
          ))}
        </div>
      ) : (
        <ControlledVocabularyItemEditPageContent
          router={router}
          title={title}
        />
      )}
    </>
  );
}

interface ControlledVocabularyItemEditPageContentProps {
  fetchedItem?: PersistedResource<ControlledVocabularyItem>;
  router: WithRouterProps["router"];
  title: string;
}

function ControlledVocabularyItemEditPageContent({
  fetchedItem,
  router,
  title
}: ControlledVocabularyItemEditPageContentProps) {
  const { formatMessage } = useDinaIntl();
  const formRef =
    useRef<FormikProps<InputResource<ControlledVocabularyItem>>>(null);

  const initialValues: InputResource<ControlledVocabularyItem> = fetchedItem
    ? transformControlledVocabularyItemForForm(fetchedItem)
    : { type: "controlled-vocabulary-item" };

  const onSubmit = useSubmitHandler<InputResource<ControlledVocabularyItem>>({
    resourceType: "controlled-vocabulary-item",
    original: fetchedItem,
    saveOptions: { apiBaseUrl: "/collection-api" },
    relationshipMappings: [
      {
        sourceAttribute: "controlledVocabulary",
        relationshipName: "controlledVocabulary",
        relationshipType: "SINGLE" as const,
        removeSourceAttribute: true,
        entityType: "controlled-vocabulary"
      }
    ],
    transforms: [
      (submittedValues) => {
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
        if (submittedValues.multilingualDescription) {
          submittedValues.multilingualDescription = {
            descriptions: _.toPairs(
              submittedValues.multilingualDescription
            ).map(([lang, desc]) => ({ lang, desc }))
          };
        }
        if (submittedValues.multilingualTitle) {
          submittedValues.multilingualTitle = {
            titles: _.toPairs(submittedValues.multilingualTitle).map(
              ([lang, title]) => ({ lang, title })
            )
          };
        }

        return submittedValues;
      }
    ],
    onSuccess: async (savedItem) => {
      await router.push(`/controlled-vocabulary-item/view?id=${savedItem.id}`);
    }
  });

  const submitForm = () => {
    if (formRef.current) {
      formRef.current.submitForm();
    }
  };

  const id = fetchedItem?.id;
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

  const buttonBarContent = <ButtonBarContent backButton={backButton} />;

  return (
    <FormSubmissionContext.Provider value={{ submitForm, formRef }}>
      <PageLayout
        titleId={formatMessage(title as any)}
        buttonBarContent={buttonBarContent}
      >
        <DinaForm
          initialValues={initialValues}
          onSubmit={onSubmit}
          innerRef={formRef}
        >
          <ControlledVocabularyItemFormLayout />
        </DinaForm>
      </PageLayout>
    </FormSubmissionContext.Provider>
  );
}

function ButtonBarContent({ backButton }: { backButton: JSX.Element }) {
  const { submitForm } = useFormSubmission();

  return (
    <>
      <div className="col-md-6 col-sm-12 mt-2">{backButton}</div>
      <div className="col-md-6 col-sm-12 d-flex">
        <button
          type="button"
          className="btn btn-primary ms-auto"
          style={{ width: "8rem" }}
          onClick={submitForm}
        >
          <FaFloppyDisk className="me-2" />
          <DinaMessage id="submitBtnText" />
        </button>
      </div>
    </>
  );
}

export function ControlledVocabularyItemFormLayout() {
  const { formatMessage } = useDinaIntl();
  const { readOnly, initialValues } = useDinaFormContext();
  const { isAdmin } = useAccount();

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
      </div>
      <div className="row">
        <ResourceSelectField<ControlledVocabulary>
          className="col-md-6"
          name="controlledVocabulary"
          filter={(input) =>
            SimpleSearchFilterBuilder.create<ControlledVocabulary>()
              .searchFilter("name", input)
              .when(!isAdmin, (builder) =>
                // User editable controlled vocabularies
                builder.whereIn("key", ["managed_attribute", "field_extension"])
              )
              .build()
          }
          model="collection-api/controlled-vocabulary"
          optionLabel={(cv) => cv.name}
          omitNullOption={true}
        />
        <SelectField
          className="col-md-6"
          name="dinaComponent"
          options={ATTRIBUTE_COMPONENT_OPTIONS}
          label={formatMessage("field_managedAttributeComponent")}
        />
      </div>
      <div className="row">
        <TextField className="col-md-6" name="name" />
        <TextField className="col-md-6" name="key" readOnly={true} />
      </div>
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
      {readOnly && (
        <div className="row">
          <DateField
            className="col-md-6"
            name="createdOn"
            label={formatMessage("field_createdOn")}
          />
          <TextField
            className="col-md-6"
            name="createdBy"
            label={formatMessage("field_createdBy")}
          />
        </div>
      )}
    </>
  );
}

export default withRouter(ControlledVocabularyItemEditPage);
