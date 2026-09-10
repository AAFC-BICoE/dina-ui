import { BackButton, ButtonBar, LoadingSpinner, withResponse } from "common-ui";
import { FormikProps } from "formik";
import { InputResource } from "kitsu";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
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
import { MaterialSample } from "../../../types/collection-api";
import { FaCopy, FaFloppyDisk } from "react-icons/fa6";

export type PostSaveRedirect = "VIEW" | "CREATE_NEXT";

export default function MaterialSampleEditPage() {
  const router = useRouter();

  const id = router.query.id?.toString();
  const copyFromId = router.query.copyFromId?.toString();

  const { formatMessage } = useDinaIntl();

  const materialSampleQuery = useMaterialSampleQuery(id);
  const copyFromQuery = useMaterialSampleQuery(copyFromId);

  /** The page to redirect to after saving. */
  const [saveRedirect, setSaveRedirect] = useState<PostSaveRedirect>("VIEW");

  const [copyWarnings, setCopyWarnings] = useState<
    NotCopiedOverWarning[] | undefined
  >(undefined);

  // The button bar is rendered outside of the form (so it can be positioned directly under the
  // nav bar, above the page title), so a ref is needed to trigger the form's submission from there:
  const materialSampleFormRef =
    useRef<FormikProps<InputResource<MaterialSample>>>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(redirect: PostSaveRedirect) {
    setSaveRedirect(redirect);
    setIsSubmitting(true);
    try {
      await materialSampleFormRef.current?.submitForm();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function moveToViewPage(savedId: string) {
    await router.push(`/collection/material-sample/view?id=${savedId}`);
  }

  async function moveToNextSamplePage(savedId: string) {
    await router.push(`/collection/material-sample/edit?copyFromId=${savedId}`);
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
    materialSampleFormRef,
    // No button bar inside the form; it's rendered above the form instead:
    buttonBar: <></>,
    // On save either redirect to the view page or create the next sample with the same values:
    onSaved:
      saveRedirect === "CREATE_NEXT" ? moveToNextSamplePage : moveToViewPage
  };

  const buttonBar = (
    <ButtonBar>
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
        {isSubmitting ? (
          <LoadingSpinner loading={true} />
        ) : (
          <>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "13rem" }}
              onClick={() => submit("CREATE_NEXT")}
            >
              <FaCopy className="me-2" />
              <DinaMessage id="saveAndCopyToNext" />
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "10rem" }}
              onClick={() => submit("VIEW")}
            >
              <FaFloppyDisk className="me-2" />
              <DinaMessage id="submitBtnText" />
            </button>
          </>
        )}
      </div>
    </ButtonBar>
  );

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav marginBottom={false} />
      {buttonBar}
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id={title} />
        </h1>
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
              <MaterialSampleForm
                enableReinitialize={true}
                navOrder={navOrder}
                {...sampleFormProps}
                materialSample={sample}
                defaultToNotReleasable={true}
              />
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
                  copyFromId: copyFromId ?? "",
                  removeWarning
                }}
              >
                <MaterialSampleForm
                  {...sampleFormProps}
                  materialSample={initialValues}
                  disableAutoNamePrefix={true}
                  defaultToNotReleasable={true}
                />
              </CopyToNextSampleProvider>
            );
          })
        ) : (
          <MaterialSampleForm
            enableReinitialize={true}
            navOrder={navOrder}
            {...sampleFormProps}
            defaultToNotReleasable={true}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
