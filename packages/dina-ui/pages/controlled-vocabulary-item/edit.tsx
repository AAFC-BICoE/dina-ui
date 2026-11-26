import {
  DateField,
  DeleteButton,
  DinaForm,
  MultilingualDescription,
  MultilingualTitle,
  ResourceSelectField,
  SelectField,
  SimpleSearchFilterBuilder,
  StringArrayField,
  TextField,
  ToggleField,
  useAccount,
  useDinaFormContext,
  useQuery,
  useSubmitHandler,
  withResponse
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { withRouter } from "next/router";
import {
  createContext,
  RefObject,
  useContext,
  useRef,
  useState,
  Fragment
} from "react";
import { GroupSelectField } from "../../components";
import {
  CONTROLLED_VOCABULARY_APIS,
  ControlledVocabularyApi,
  controlledVocabularyPageUrl,
  getControlledVocabularyApi,
  getInitialVocabularyElementType,
  getNewItemPosition,
  multilingualFieldsForSave,
  transformControlledVocabularyItemForForm
} from "../../components/controlled-vocabulary/controlledVocabularyItemUtils";
import PageLayout from "../../components/page/PageLayout";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import {
  VOCABULARY_ELEMENT_TYPE_OPTIONS,
  VocabularyElementType
} from "../../types/collection-api";
import { ControlledVocabularyItem } from "../../types/collection-api/resources/ControlledVocabularyItem";
import { ControlledVocabulary } from "../../types/collection-api/resources/ControlledVocabulary";
import { FormikProps } from "formik";
import { FaFloppyDisk } from "react-icons/fa6";

interface FormSubmissionContextType {
  submitForm?: () => void;
  formRef?: RefObject<FormikProps<
    InputResource<ControlledVocabularyItem>
  > | null>;
}

const FormSubmissionContext = createContext<FormSubmissionContextType>({});

function useFormSubmission() {
  return useContext(FormSubmissionContext);
}

export function ControlledVocabularyItemEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  // Set when creating an item from a controlled vocabulary's page.
  const controlledVocabularyId =
    router.query.controlledVocabularyId?.toString();
  const api = getControlledVocabularyApi(router.query);
  const { apiPath, apiBaseUrl, listRoute } = CONTROLLED_VOCABULARY_APIS[api];
  const title = id
    ? "editControlledVocabularyItemTitle"
    : "addControlledVocabularyItemTitle";

  const query = useQuery<ControlledVocabularyItem>(
    {
      path: `${apiPath}/controlled-vocabulary-item/${id}`,
      include: "controlledVocabulary"
    },
    { disabled: id === undefined }
  );

  const controlledVocabularyQuery = useQuery<ControlledVocabulary>(
    { path: `${apiPath}/controlled-vocabulary/${controlledVocabularyId}` },
    { disabled: !controlledVocabularyId }
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
              api={api}
              apiBaseUrl={apiBaseUrl}
              listRoute={listRoute}
            />
          ))}
        </div>
      ) : controlledVocabularyId ? (
        withResponse(controlledVocabularyQuery, ({ data }) => (
          <ControlledVocabularyItemEditPageContent
            router={router}
            initialControlledVocabulary={data}
            title={title}
            api={api}
            apiBaseUrl={apiBaseUrl}
            listRoute={listRoute}
          />
        ))
      ) : (
        <ControlledVocabularyItemEditPageContent
          router={router}
          title={title}
          api={api}
          apiBaseUrl={apiBaseUrl}
          listRoute={listRoute}
        />
      )}
    </>
  );
}

interface ControlledVocabularyItemEditPageContentProps {
  fetchedItem?: PersistedResource<ControlledVocabularyItem>;
  /** Controlled vocabulary selected by default when creating an item. */
  initialControlledVocabulary?: PersistedResource<ControlledVocabulary>;
  router: WithRouterProps["router"];
  title: string;
  api: ControlledVocabularyApi;
  apiBaseUrl: string;
  listRoute: string;
}

function ControlledVocabularyItemEditPageContent({
  fetchedItem,
  initialControlledVocabulary,
  router,
  title,
  api,
  apiBaseUrl,
  listRoute
}: ControlledVocabularyItemEditPageContentProps) {
  const { formatMessage } = useDinaIntl();
  const formRef =
    useRef<FormikProps<InputResource<ControlledVocabularyItem>>>(null);

  const initialValues: InputResource<ControlledVocabularyItem> = fetchedItem
    ? transformControlledVocabularyItemForForm(fetchedItem)
    : {
        type: "controlled-vocabulary-item",
        controlledVocabulary: initialControlledVocabulary
      };

  const onSubmit = useSubmitHandler<InputResource<ControlledVocabularyItem>>({
    resourceType: "controlled-vocabulary-item",
    original: fetchedItem,
    saveOptions: { apiBaseUrl },
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

        multilingualFieldsForSave(submittedValues);

        // Uri template should be null if empty string, and should include $1 if not empty.
        if (
          submittedValues.uriTemplate &&
          !submittedValues.uriTemplate?.includes("$1")
        ) {
          submittedValues.uriTemplate = `${submittedValues.uriTemplate}$1`;
        }

        return submittedValues;
      },
      // New items of an ordered vocabulary go last; Change Order reorders them.
      async (submittedValues, { apiClient }) => {
        const vocabularyId = submittedValues.controlledVocabulary?.id;
        const position =
          !fetchedItem && vocabularyId
            ? await getNewItemPosition(
                apiClient,
                CONTROLLED_VOCABULARY_APIS[api].apiPath,
                vocabularyId
              )
            : undefined;
        if (position) {
          submittedValues.position = position;
        }
        return submittedValues;
      }
    ],
    onSuccess: async (savedItem) => {
      await router.push(
        controlledVocabularyPageUrl("/controlled-vocabulary-item/view", api, {
          id: savedItem.id
        })
      );
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
      <Link href={listRoute} className="back-button my-auto me-auto">
        <DinaMessage id="backToList" />
      </Link>
    ) : (
      <Link
        href={controlledVocabularyPageUrl(
          "/controlled-vocabulary-item/view",
          api,
          { id }
        )}
        className="back-button my-auto me-auto"
      >
        <DinaMessage id="backToReadOnlyPage" />
      </Link>
    );

  const buttonBarContent = (
    <ButtonBarContent
      backButton={backButton}
      id={id}
      apiBaseUrl={apiBaseUrl}
      listRoute={listRoute}
    />
  );

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
          <ControlledVocabularyItemFormLayout
            isEditMode={!!fetchedItem}
            api={api}
          />
        </DinaForm>
      </PageLayout>
    </FormSubmissionContext.Provider>
  );
}

function ButtonBarContent({
  backButton,
  id,
  apiBaseUrl,
  listRoute
}: {
  backButton: React.JSX.Element;
  id?: string;
  apiBaseUrl: string;
  listRoute: string;
}) {
  const { submitForm } = useFormSubmission();

  return (
    <>
      <div className="col-md-6 col-sm-12 mt-2">{backButton}</div>
      <div className="col-md-6 col-sm-12 d-flex">
        <div className="ms-auto"></div>
        {id && (
          <DeleteButton
            id={id}
            options={{ apiBaseUrl }}
            postDeleteRedirect={listRoute}
            type="controlled-vocabulary-item"
            messageBody={<DinaMessage id="managedAttributeDeleteWarning" />}
          />
        )}
        <button
          type="button"
          className="btn btn-primary ms-2"
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

export function ControlledVocabularyItemFormLayout({
  isEditMode = false,
  api = "collection"
}: {
  isEditMode?: boolean;
  api?: ControlledVocabularyApi;
}) {
  const { formatMessage } = useDinaIntl();
  const { readOnly, initialValues } = useDinaFormContext();
  const { isAdmin } = useAccount();
  const { apiPath, componentTypes, componentTypeLabels } =
    CONTROLLED_VOCABULARY_APIS[api];

  const [vocabularyElementType, setVocabularyElementType] = useState<
    VocabularyElementType | undefined
  >(getInitialVocabularyElementType(initialValues));

  const ATTRIBUTE_TYPE_OPTIONS = VOCABULARY_ELEMENT_TYPE_OPTIONS.map(
    ({ labelKey, value }) => ({ label: formatMessage(labelKey), value })
  );

  const ATTRIBUTE_COMPONENT_OPTIONS: {
    label: string;
    value: string;
  }[] = componentTypes.map((dataType) => ({
    label: formatMessage(componentTypeLabels[dataType] as any),
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
            requiredField={true}
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
          model={`${apiPath}/controlled-vocabulary`}
          optionLabel={(cv) => cv.name}
          omitNullOption={true}
          requiredField={true}
          isDisabled={isEditMode}
        />
        <SelectField
          className="col-md-6"
          name="dinaComponent"
          options={ATTRIBUTE_COMPONENT_OPTIONS}
          label={formatMessage("field_managedAttributeComponent")}
          disabled={isEditMode}
          requiredField={true}
        />
      </div>
      <div className="row">
        <TextField
          className="col-md-6"
          name="name"
          disabled={isEditMode}
          requiredField={true}
        />
        <TextField className="col-md-6" name="key" disabled={true} />
      </div>
      <div className="row">
        <SelectField
          className="col-md-6"
          name="vocabularyElementType"
          options={ATTRIBUTE_TYPE_OPTIONS}
          onChange={(selectValue: VocabularyElementType) =>
            setVocabularyElementType(selectValue)
          }
          disabled={isEditMode}
          requiredField={true}
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
      <div className="row">
        <TextField
          className="col-md-6"
          name="term"
          link={initialValues?.term ?? ""}
        />
        <TextField
          className="col-md-6"
          name={"uriTemplate"}
          readOnlyRender={(value) => {
            try {
              const url = new URL(value);
              if (url.protocol === "http:" || url.protocol === "https:") {
                return (
                  <Fragment key={value}>
                    <Link href={value} passHref={true}>
                      {value}
                    </Link>
                  </Fragment>
                );
              }
            } catch (_) {
              return value;
            }
          }}
        />
      </div>
      <MultilingualTitle />
      <MultilingualDescription />
      <div className="row">
        {readOnly && <ToggleField className="col-md-6" name="systemDefined" />}
        {/* Only items of ordered vocabularies have one. */}
        {initialValues?.position != null && (
          <TextField className="col-md-6" name="position" disabled={true} />
        )}
      </div>
      {readOnly && (
        <div className="row">
          <DateField
            className="col-md-6"
            name="createdOn"
            label={formatMessage("field_createdOn")}
            showTime={true}
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
