import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  DinaFormSection,
  FieldSpy,
  filterBy,
  FormikButton,
  ResourceSelect,
  SelectField,
  SubmitButton,
  TextField,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { FieldArray } from "formik";
import { InputResource, PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { PropsWithChildren } from "react";
import { GiMove } from "react-icons/gi";
import { RiDeleteBinLine } from "react-icons/ri";
import {
  SortableContainer,
  SortableElement,
  SortEnd
} from "react-sortable-hoc";
import * as yup from "yup";
import { GroupSelectField, Head, Nav } from "../../../components";
import { ManagedAttributeName } from "../../../components/object-store/managed-attributes/ManagedAttributesViewer";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  CustomView,
  ManagedAttributesView,
  managedAttributesViewSchema
} from "../../../types/collection-api";
import {
  COLLECTION_MODULE_TYPES,
  COLLECTION_MODULE_TYPE_LABELS
} from "../../../types/collection-api/resources/ManagedAttribute";
import { ManagedAttribute } from "../../../types/objectstore-api";

export interface ManagedAttributesViewFormProps {
  data?: InputResource<CustomView>;
  /** Default component in the form's initialValues. */
  defaultManagedAttributeComponent?: string;
  /** Disable the attribute component field. */
  disabledAttributeComponent?: boolean;
  onSaved: (data: PersistedResource<CustomView>) => Promise<void>;
}

/**
 * Validate the JSON field on the front-end because it's unstructured JSON on the back-end.
 */
const customViewSchema = yup.object({
  viewConfiguration: managedAttributesViewSchema
});

export function useManagedAttributesView(id?: string) {
  return useQuery<CustomView>(
    { path: `collection-api/custom-view/${id}` },
    {
      onSuccess: async ({ data: fetchedView }) => {
        // Throw an error if the wrong type of Custom View
        managedAttributesViewSchema.validateSync(fetchedView.viewConfiguration);
      },
      disabled: !id
    }
  );
}

export default function ManagedAttributesViewEditPage() {
  const router = useRouter();

  const id = router.query.id?.toString?.();
  const { formatMessage } = useDinaIntl();

  async function goToViewPage(data: PersistedResource<CustomView>) {
    await router.push(`/collection/managed-attributes-view/view?id=${data.id}`);
  }

  const title = id
    ? "editManagedAttributesViewTitle"
    : "addManagedAttributesViewTitle";

  const query = useManagedAttributesView(id);

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
              <ManagedAttributesViewForm data={data} onSaved={goToViewPage} />
            ))
          ) : (
            <ManagedAttributesViewForm onSaved={goToViewPage} />
          )}
        </div>
      </main>
    </div>
  );
}

export function ManagedAttributesViewForm({
  onSaved,
  data,
  disabledAttributeComponent,
  defaultManagedAttributeComponent
}: ManagedAttributesViewFormProps) {
  const initialViewConfiguration: Partial<ManagedAttributesView> = {
    type: "managed-attributes-view",
    attributeKeys: [],
    managedAttributeComponent: defaultManagedAttributeComponent
  };

  const initialValues = data ?? {
    type: "custom-view",
    restrictToCreatedBy: true,
    viewConfiguration: initialViewConfiguration
  };

  const onSubmit: DinaFormOnSubmit<InputResource<CustomView>> = async ({
    submittedValues,
    api: { save }
  }) => {
    const [savedView] = await save<CustomView>(
      [
        {
          resource: submittedValues,
          type: "custom-view"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    await onSaved(savedView);
  };

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={data?.id}
        entityLink="/collection/managed-attributes-view"
      />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  );

  return (
    <div className="managed-attributes-view-form">
      <DinaForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        validationSchema={customViewSchema}
      >
        {buttonBar}
        <ManagedAttributesViewFormLayout
          disabledAttributeComponent={disabledAttributeComponent}
        />
        {buttonBar}
      </DinaForm>
    </div>
  );
}

export interface ManagedAttributesViewFormLayoutProps {
  disabledAttributeComponent?: boolean;
}

export function ManagedAttributesViewFormLayout({
  disabledAttributeComponent
}: ManagedAttributesViewFormLayoutProps) {
  const { formatMessage } = useDinaIntl();
  const { readOnly } = useDinaFormContext();

  const ATTRIBUTE_COMPONENT_OPTIONS: {
    label: string;
    value: string;
  }[] = COLLECTION_MODULE_TYPES.map(dataType => ({
    label: formatMessage(COLLECTION_MODULE_TYPE_LABELS[dataType] as any),
    value: dataType
  }));

  return (
    <div>
      <div className="row">
        <GroupSelectField
          name="group"
          enableStoredDefaultGroup={true}
          className="col-md-6"
        />
      </div>
      <DinaFormSection horizontal="flex">
        <div className="row">
          <TextField name="name" className="col-sm-6" />
        </div>
        <div className="row">
          <SelectField
            className="col-md-6"
            disabled={disabledAttributeComponent}
            name="viewConfiguration.managedAttributeComponent"
            customName="managedAttributeComponent"
            options={ATTRIBUTE_COMPONENT_OPTIONS}
            readOnlyRender={value =>
              ATTRIBUTE_COMPONENT_OPTIONS.find(option => option.value === value)
                ?.label
            }
            onChange={(_, form) =>
              form.setFieldValue("viewConfiguration.attributeKeys", [])
            }
          />
        </div>
      </DinaFormSection>
      <FieldSpy<string> fieldName="viewConfiguration.managedAttributeComponent">
        {managedAttributeComponent =>
          managedAttributeComponent ? (
            <>
              <hr />
              <FieldArray name="viewConfiguration.attributeKeys">
                {({ push, remove, form, move }) => {
                  function onSortStart(_, event: unknown) {
                    if (event instanceof MouseEvent) {
                      document.body.style.cursor = "grabbing";
                    }
                  }
                  function onSortEnd(se: SortEnd) {
                    document.body.style.cursor = "default";
                    move(se.oldIndex, se.newIndex);
                  }

                  return (
                    <div>
                      {!readOnly && (
                        <div
                          className="managed-attributes-select mb-4"
                          style={{ maxWidth: "30rem" }}
                        >
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
                                !form.values.viewConfiguration?.attributeKeys?.includes?.(
                                  ma.key
                                )
                              ) {
                                push(ma.key);
                              }
                            }}
                            optionLabel={ma => ma.name}
                            placeholder={formatMessage("addManagedAttribute")}
                            omitNullOption={true}
                          />
                        </div>
                      )}
                      {!readOnly &&
                        form.values.viewConfiguration?.attributeKeys?.length >=
                          2 && (
                          <div>
                            <div className="alert alert-warning d-flex flex-column gap-2">
                              <div>
                                <strong>
                                  <DinaMessage id="dragDropInstructionsHeader" />
                                </strong>
                              </div>
                              <div>
                                <strong>
                                  <DinaMessage id="withAMouse" />:
                                </strong>{" "}
                                <DinaMessage id="dragDropMouseInstructions" />
                              </div>
                              <div>
                                <strong>
                                  <DinaMessage id="withAKeyboard" />:
                                </strong>{" "}
                                <DinaMessage id="dragDropKeyboardInstructions" />
                              </div>
                            </div>
                          </div>
                        )}
                      <div>
                        <FieldSpy<
                          string[]
                        > fieldName="viewConfiguration.attributeKeys">
                          {keys => (
                            <SortableAttributesViewList
                              axis="xy"
                              onSortStart={onSortStart}
                              onSortEnd={onSortEnd}
                              // "distance" is needed to allow clicking the Remove button:
                              distance={1}
                              helperClass="sortable-lifted"
                            >
                              {/* Give the lifted drag/drop item a blue background. */}
                              <style>{`
                              .form-control.sortable-lifted {
                                background-color: rgb(222, 235, 255);
                                z-index: 1100;
                              }
                            `}</style>
                              {keys?.map((key, index) => (
                                <SortableAttributesViewItem
                                  disabled={readOnly}
                                  key={key}
                                  attributeKey={key}
                                  onRemoveClick={() => remove(index)}
                                  index={index}
                                />
                              ))}
                            </SortableAttributesViewList>
                          )}
                        </FieldSpy>
                      </div>
                    </div>
                  );
                }}
              </FieldArray>
            </>
          ) : null
        }
      </FieldSpy>
    </div>
  );
}

function AttributesViewList({ children }: PropsWithChildren<{}>) {
  return (
    <div className="d-flex justify-content-between flex-wrap">{children}</div>
  );
}

interface AttributesViewItemProps {
  attributeKey: string;
  onRemoveClick: () => void;
}

function AttributesViewItem({
  attributeKey,
  onRemoveClick
}: AttributesViewItemProps) {
  const { readOnly } = useDinaFormContext();
  const cursor = readOnly ? undefined : "grab";

  return (
    <div
      // form-control adds the blue focus ring around the div:
      className="card card-body mb-4 form-control"
      style={{
        cursor,
        maxWidth: "49.2%"
      }}
      // Makes the div focusable and keyboard navigatable:
      tabIndex={readOnly ? undefined : 0}
    >
      <label htmlFor="none" style={{ cursor }}>
        <div className="mb-2 d-flex align-items-center">
          <div className="me-auto">
            <strong>
              <FieldSpy<string> fieldName="viewConfiguration.managedAttributeComponent">
                {managedAttributeComponent =>
                  managedAttributeComponent ? (
                    <ManagedAttributeName
                      managedAttributeKey={attributeKey}
                      managedAttributeApiPath={key =>
                        `collection-api/managed-attribute/${managedAttributeComponent}.${key}`
                      }
                    />
                  ) : null
                }
              </FieldSpy>
            </strong>
          </div>
          {!readOnly && (
            <div className="d-flex align-items-center gap-2">
              <FormikButton
                className="btn remove-attribute"
                onClick={() => onRemoveClick()}
              >
                <RiDeleteBinLine size="1.8em" />
              </FormikButton>
              <GiMove size="1.8em" />
            </div>
          )}
        </div>
        <input type="text" className="form-control" disabled={true} />
      </label>
    </div>
  );
}

const SortableAttributesViewItem = SortableElement(AttributesViewItem);
export const SortableAttributesViewList = SortableContainer(AttributesViewList);
