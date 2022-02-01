import {
  DinaForm,
  DinaFormOnSubmit,
  DinaFormSection,
  FieldSpy,
  filterBy,
  FormikButton,
  ResourceSelect,
  SelectField,
  TextField,
  useApiClient,
  useQuery,
  withResponse
} from "common-ui";
import { FieldArray } from "formik";
import { InputResource, PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ManagedAttributesView } from "../../../types/collection-api";
import {
  COLLECTION_MODULE_TYPES,
  COLLECTION_MODULE_TYPE_LABELS
} from "../../../types/collection-api/resources/ManagedAttribute";
import { ManagedAttribute } from "../../../types/objectstore-api";
import { RiDeleteBinLine } from "react-icons/ri";
import { GiMove } from "react-icons/gi";
import { FileUploadProviderImpl } from "packages/dina-ui/components/object-store/file-upload/FileUploadProvider";

export interface CustomManagedAttributesViewFormProps {
  fetchedView?: ManagedAttributesView;
  onSaved: (project: PersistedResource<ManagedAttributesView>) => Promise<void>;
}

export default function CustomManagedAttributesViewPage() {
  const router = useRouter();

  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();

  async function goToViewPage(
    project: PersistedResource<ManagedAttributesView>
  ) {
    await router.push(
      `/collection/managed-attributes-view/view?id=${project.id}`
    );
  }

  const title = id
    ? "editManagedAttributesViewTitle"
    : "addManagedAttributesViewTitle";

  const query = useQuery<ManagedAttributesView>({
    path: `collection-api/managed-attributes-view/${id}`
  });

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container">
        <div>
          <h1 id="wb-cont">
            <DinaMessage id={title} />
          </h1>
          {id ? (
            withResponse(query, ({ data }) => (
              <CustomManagedAttributesViewForm
                fetchedView={data}
                onSaved={goToViewPage}
              />
            ))
          ) : (
            <CustomManagedAttributesViewForm onSaved={goToViewPage} />
          )}
        </div>
      </main>
    </div>
  );
}

export function CustomManagedAttributesViewForm({
  onSaved,
  fetchedView
}: CustomManagedAttributesViewFormProps) {
  const { save } = useApiClient();
  const { formatMessage } = useDinaIntl();

  const initialValues = fetchedView ?? { type: "managed-attributes-view" };

  const onSubmit: DinaFormOnSubmit<InputResource<ManagedAttributesView>> =
    async ({ submittedValues }) => {
      const [savedProject] = await save<ManagedAttributesView>(
        [
          {
            resource: submittedValues,
            type: "managed-attributes-view"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      );
      await onSaved(savedProject);
    };

  const ATTRIBUTE_COMPONENT_OPTIONS: {
    label: string;
    value: string;
  }[] = COLLECTION_MODULE_TYPES.map(dataType => ({
    label: formatMessage(COLLECTION_MODULE_TYPE_LABELS[dataType] as any),
    value: dataType
  }));

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <DinaFormSection horizontal="flex">
        <div className="row">
          <TextField name="name" className="col-sm-6" />
        </div>
        <div className="row">
          <SelectField
            className="col-md-6"
            name="managedAttributeComponent"
            options={ATTRIBUTE_COMPONENT_OPTIONS}
            onChange={(_, form) => form.setFieldValue("keys", [])}
          />
        </div>
      </DinaFormSection>
      <FieldSpy<string> fieldName="managedAttributeComponent">
        {managedAttributeComponent =>
          managedAttributeComponent ? (
            <>
              <hr />
              <FieldArray name="keys">
                {({ push, remove, form }) => (
                  <div>
                    <div className="mb-4" style={{ maxWidth: "30rem" }}>
                      <ResourceSelect<ManagedAttribute>
                        filter={input => ({
                          ...filterBy(["name"])(input),
                          ...(managedAttributeComponent
                            ? { managedAttributeComponent }
                            : {})
                        })}
                        model="collection-api/managed-attribute"
                        onChange={ma => {
                          if (
                            !Array.isArray(ma) &&
                            !form.values.keys?.includes?.(ma.key)
                          ) {
                            push(ma.key);
                          }
                        }}
                        optionLabel={ma => ma.name}
                        placeholder={formatMessage("addManagedAttribute")}
                        omitNullOption={true}
                      />
                    </div>
                    <div className="row">
                      <FieldSpy<string[]> fieldName="keys">
                        {keys =>
                          keys?.map((key, index) => (
                            <div className="col-sm-6 mb-4" key={key}>
                              <div className="card card-body">
                                <label htmlFor="none">
                                  <div className="mb-2 d-flex align-items-center">
                                    <div className="me-auto">
                                      <strong>{key}</strong>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                      <FormikButton
                                        className="btn"
                                        onClick={() => remove(index)}
                                      >
                                        <RiDeleteBinLine size="1.8em" />
                                      </FormikButton>
                                      <GiMove size="1.8em" />
                                    </div>
                                  </div>
                                  <input
                                    type="text"
                                    className="form-control"
                                    disabled={true}
                                  />
                                </label>
                              </div>
                            </div>
                          ))
                        }
                      </FieldSpy>
                    </div>
                  </div>
                )}
              </FieldArray>
            </>
          ) : null
        }
      </FieldSpy>
    </DinaForm>
  );
}
