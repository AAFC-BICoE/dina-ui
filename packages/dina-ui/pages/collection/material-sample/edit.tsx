import {
  BackButton,
  ButtonBar,
  FieldSpy,
  filterBy,
  ResourceSelect,
  SubmitButton,
  withResponse
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  Footer,
  Head,
  MaterialSampleForm,
  materialSampleFormCustomViewSchema,
  MaterialSampleFormProps,
  Nav,
  nextSampleInitialValues,
  useMaterialSampleFormCustomViewProps,
  useMaterialSampleQuery
} from "../../../components";
import { SaveAndCopyToNextSuccessAlert } from "../../../components/collection/SaveAndCopyToNextSuccessAlert";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  CustomView,
  MaterialSampleFormSectionId
} from "../../../types/collection-api";

export type PostSaveRedirect = "VIEW" | "CREATE_NEXT";

export default function MaterialSampleEditPage() {
  const router = useRouter();

  const id = router.query.id?.toString();
  const copyFromId = router.query.copyFromId?.toString();
  const lastCreatedId = router.query.lastCreatedId?.toString();

  const { formatMessage } = useDinaIntl();

  const materialSampleQuery = useMaterialSampleQuery(id);
  const copyFromQuery = useMaterialSampleQuery(copyFromId);

  /** The page to redirect to after saving. */
  const [saveRedirect, setSaveRedirect] = useState<PostSaveRedirect>("VIEW");

  async function moveToViewPage(savedId: string) {
    await router.push(`/collection/material-sample/view?id=${savedId}`);
  }

  async function moveToNextSamplePage(savedId: string) {
    await router.push(
      `/collection/material-sample/edit?copyFromId=${savedId}&lastCreatedId=${savedId}`
    );
  }

  const title = id ? "editMaterialSampleTitle" : "addMaterialSampleTitle";

  const [sampleFormCustomView, setSampleFormCustomView] =
    useState<PersistedResource<CustomView>>();

  const customViewConfig = sampleFormCustomView?.id
    ? materialSampleFormCustomViewSchema.parse(
        sampleFormCustomView?.viewConfiguration
      )
    : undefined;

  // Call the custom view hook but only use the "enabledFields" value:
  const { enabledFields, visibleManagedAttributeKeys } =
    useMaterialSampleFormCustomViewProps(customViewConfig) ?? {};

  // Store the nav order in the Page components state:
  const [navOrder, setNavOrder] = useState<
    MaterialSampleFormSectionId[] | null
  >(null);

  // Effect hook: When the Custom View changes,
  // update the navOrder to what's stored in the Custom View:
  useEffect(() => {
    if (sampleFormCustomView) {
      setNavOrder(customViewConfig?.navOrder ?? null);
    }
  }, [customViewConfig]);

  const sampleFormProps: Partial<MaterialSampleFormProps> = {
    navOrder,
    onChangeNavOrder: setNavOrder,
    enabledFields,
    visibleManagedAttributeKeys,
    enableStoredDefaultGroup: true,
    buttonBar: (
      <ButtonBar>
        <BackButton entityId={id} entityLink="/collection/material-sample" />
        <div className="flex-grow-1 d-flex">
          <div className="mx-auto" style={{ width: "20rem" }}>
            <label>
              <div className="mb-2 fw-bold">
                <DinaMessage id="customMaterialSampleFormView" />
              </div>
              <FieldSpy<string> fieldName="group">
                {group => (
                  <ResourceSelect<CustomView>
                    filter={input => ({
                      // Filter by "material-sample-form-section-order" to omit unrelated custom-view records:
                      "viewConfiguration.type":
                        "material-sample-form-custom-view",
                      // Filter by view name typed into the dropdown:
                      ...filterBy(["name"])(input),
                      // Filter by the form's group:
                      ...(group && { group: { EQ: `${group}` } })
                    })}
                    optionLabel={view => view.name || view.id}
                    model="collection-api/custom-view"
                    onChange={newVal =>
                      setSampleFormCustomView(
                        newVal as PersistedResource<CustomView>
                      )
                    }
                    value={sampleFormCustomView}
                  />
                )}
              </FieldSpy>
            </label>
          </div>
        </div>
        {!id && (
          <SubmitButton
            buttonProps={() => ({
              style: { width: "12rem" },
              onClick: () => setSaveRedirect("CREATE_NEXT")
            })}
          >
            <DinaMessage id="saveAndCopyToNext" />
          </SubmitButton>
        )}
        <SubmitButton
          buttonProps={() => ({ onClick: () => setSaveRedirect("VIEW") })}
        />
      </ButtonBar>
    ),
    // On save either redirect to the view page or create the next sample with the same values:
    onSaved:
      saveRedirect === "CREATE_NEXT" ? moveToNextSamplePage : moveToViewPage
  };

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        {!id &&
          !!lastCreatedId &&
          withResponse(copyFromQuery, ({ data: originalSample }) => (
            <SaveAndCopyToNextSuccessAlert
              id={lastCreatedId}
              displayName={
                !!originalSample.materialSampleName?.length
                  ? originalSample.materialSampleName
                  : lastCreatedId
              }
              entityPath={"collection/material-sample"}
            />
          ))}
        <h1 id="wb-cont">
          <DinaMessage id={title} />
        </h1>
        {id ? (
          withResponse(materialSampleQuery, ({ data: sample }) => (
            <MaterialSampleForm {...sampleFormProps} materialSample={sample} />
          ))
        ) : copyFromId ? (
          withResponse(copyFromQuery, ({ data: originalSample }) => {
            const initialValues = nextSampleInitialValues(originalSample);
            return (
              <MaterialSampleForm
                {...sampleFormProps}
                materialSample={initialValues}
                disableAutoNamePrefix={true}
              />
            );
          })
        ) : (
          <MaterialSampleForm {...sampleFormProps} />
        )}
      </main>
      <Footer />
    </div>
  );
}
