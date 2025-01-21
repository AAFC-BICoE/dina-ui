import { BackButton, ButtonBar, SubmitButton, withResponse } from "common-ui";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  Footer,
  Head,
  MaterialSampleFormTemplateSelect,
  MaterialSampleForm,
  MaterialSampleFormProps,
  Nav,
  nextSampleInitialValues,
  useMaterialSampleFormTemplateSelectState,
  useMaterialSampleQuery,
  CopyToNextSampleProvider,
  NotCopiedOverWarning
} from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

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

  const [copyWarnings, setCopyWarnings] = useState<
    NotCopiedOverWarning[] | undefined
  >(undefined);

  async function moveToViewPage(savedId: string) {
    await router.push(`/collection/material-sample/view?id=${savedId}`);
  }

  async function moveToNextSamplePage(savedId: string) {
    await router.push(
      `/collection/material-sample/edit?copyFromId=${savedId}&lastCreatedId=${savedId}`
    );
  }

  const title = id ? "editMaterialSampleTitle" : "addMaterialSampleTitle";

  const {
    navOrder,
    sampleFormTemplate,
    setSampleFormTemplateUUID,
    visibleManagedAttributeKeys,
    materialSampleInitialValues,
    collectingEventInitialValues
  } = useMaterialSampleFormTemplateSelectState({});
  const sampleFormProps: Partial<MaterialSampleFormProps> = {
    formTemplate: sampleFormTemplate,
    visibleManagedAttributeKeys,
    materialSample: materialSampleInitialValues,
    collectingEventInitialValues,
    enableStoredDefaultGroup: true,
    buttonBar: (
      <ButtonBar className="mb-3">
        <div className="col-md-3 col-sm-12 mt-2">
          <BackButton entityId={id} entityLink="/collection/material-sample" />
        </div>
        <div className="col-md-4 flex-grow-1 d-flex">
          <div className="mx-auto">
            <MaterialSampleFormTemplateSelect
              value={sampleFormTemplate}
              onChange={setSampleFormTemplateUUID}
            />
          </div>
        </div>
        <div className="col-md-3 flex-grow-1 d-flex gap-2">
          <div className="ms-auto" />
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
        </div>
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
        {id ? (
          withResponse(materialSampleQuery, ({ data: sample }) => {
            if (sampleFormTemplate?.id) {
              Object.keys(materialSampleInitialValues).forEach((key) => {
                if (!sample[key]) {
                  sample[key] = materialSampleInitialValues[key];
                }
              });
            }
            return (
              <>
                <h1 id="wb-cont">
                  <DinaMessage id={title} />
                </h1>
                <MaterialSampleForm
                  enableReinitialize={true}
                  navOrder={navOrder}
                  {...sampleFormProps}
                  materialSample={sample}
                />
              </>
            );
          })
        ) : copyFromId ? (
          withResponse(copyFromQuery, ({ data: originalSample }) => {
            const { initialValues, notCopiedOverWarnings } =
              nextSampleInitialValues(originalSample);

            // Set the initial warnings found, only should be set on initial load.
            if (copyWarnings === undefined) {
              setCopyWarnings(notCopiedOverWarnings);
            }

            const removeWarning = (warningToRemove: NotCopiedOverWarning) => {
              if (copyWarnings === undefined) {
                return;
              }

              setCopyWarnings(
                copyWarnings.filter(
                  (warn) => warn.componentName !== warningToRemove.componentName
                )
              );
            };

            return (
              <CopyToNextSampleProvider
                value={{
                  originalSample,
                  notCopiedOverWarnings: copyWarnings ?? [],
                  lastCreatedId: lastCreatedId ?? "",
                  removeWarning
                }}
              >
                <MaterialSampleForm
                  {...sampleFormProps}
                  materialSample={initialValues}
                  disableAutoNamePrefix={true}
                />
              </CopyToNextSampleProvider>
            );
          })
        ) : (
          <>
            <h1 id="wb-cont">
              <DinaMessage id={title} />
            </h1>
            <MaterialSampleForm
              enableReinitialize={true}
              navOrder={navOrder}
              {...sampleFormProps}
            />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
