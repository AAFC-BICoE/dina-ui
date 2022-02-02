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
import { PropsWithChildren } from "react";
import { GiMove } from "react-icons/gi";
import { RiDeleteBinLine } from "react-icons/ri";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import { Head, Nav } from "../../../components";
import { ManagedAttributeName } from "../../../components/object-store/managed-attributes/ManagedAttributesViewer";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ManagedAttributesView } from "../../../types/collection-api";
import {
  COLLECTION_MODULE_TYPES,
  COLLECTION_MODULE_TYPE_LABELS
} from "../../../types/collection-api/resources/ManagedAttribute";
import { ManagedAttribute } from "../../../types/objectstore-api";

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
            onChange={(_, form) => form.setFieldValue("attributeUuids", [])}
          />
        </div>
      </DinaFormSection>
      <FieldSpy<string> fieldName="managedAttributeComponent">
        {managedAttributeComponent =>
          managedAttributeComponent ? (
            <>
              <hr />
              <FieldArray name="attributeUuids">
                {({ push, remove, form, move }) => (
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
                            !form.values.attributeUuids?.includes?.(ma.id)
                          ) {
                            push(ma.id);
                          }
                        }}
                        optionLabel={ma => ma.name}
                        placeholder={formatMessage("addManagedAttribute")}
                        omitNullOption={true}
                      />
                    </div>
                    <div>
                      <FieldSpy<string[]> fieldName="attributeUuids">
                        {uuids => (
                          <SortableAttributesViewList
                            axis="xy"
                            onSortEnd={sortEnd =>
                              move(sortEnd.oldIndex, sortEnd.newIndex)
                            }
                            // "distance" is needed to allow clicking the Remove button:
                            distance={1}
                            helperClass="sortable-lifted"
                          >
                            {/* Give the lifted drag/drop item a blue background. */}
                            <style>{`
                              .form-control.sortable-lifted {
                                background-color: rgb(222, 235, 255);
                              }
                            `}</style>
                            {uuids?.map((id, index) => (
                              <SortableAttributesViewItem
                                key={id}
                                attributeId={id}
                                onRemoveClick={() => remove(index)}
                                index={index}
                              />
                            ))}
                          </SortableAttributesViewList>
                        )}
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

function AttributesViewList({ children }: PropsWithChildren<{}>) {
  return (
    <div className="d-flex justify-content-between flex-wrap">{children}</div>
  );
}

interface AttributesViewItemProps {
  attributeId: string;
  onRemoveClick: () => void;
}

function AttributesViewItem({
  attributeId,
  onRemoveClick
}: AttributesViewItemProps) {
  return (
    <div
      // form-control adds the blue focus ring around the div:
      className="card card-body mb-4 form-control"
      style={{
        cursor: "grab",
        maxWidth: "49.2%"
      }}
      // Makes the div focusable and keyboard navigatable:
      tabIndex={0}
    >
      <label htmlFor="none" style={{ cursor: "grab" }}>
        <div className="mb-2 d-flex align-items-center">
          <div className="me-auto">
            <strong>
              <ManagedAttributeName
                managedAttributeKey={attributeId}
                managedAttributeApiPath={id =>
                  `collection-api/managed-attribute/${id}`
                }
              />
            </strong>
          </div>
          <div className="d-flex align-items-center gap-2">
            <FormikButton className="btn" onClick={() => onRemoveClick()}>
              <RiDeleteBinLine size="1.8em" />
            </FormikButton>
            <GiMove size="1.8em" />
          </div>
        </div>
        <input type="text" className="form-control" disabled={true} />
      </label>
    </div>
  );
}

const SortableAttributesViewItem = SortableElement(AttributesViewItem);
const SortableAttributesViewList = SortableContainer(AttributesViewList);
