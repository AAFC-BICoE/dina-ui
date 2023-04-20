import { BackButton, ButtonBar, SubmitButton, withResponse } from "common-ui";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  Footer,
  Head,
  MaterialSampleFormTemplateSelect,
  MaterialSampleForm,
  MaterialSampleFormProps,
  Nav,
  nextSampleInitialValues,
  useMaterialSampleFormTemplateSelectState,
  useMaterialSampleQuery
} from "../../../components";
import { SaveAndCopyToNextSuccessAlert } from "../../../components/collection/SaveAndCopyToNextSuccessAlert";
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
    setNavOrder,
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
      <ButtonBar>
        <BackButton
          entityId={id}
          entityLink="/collection/material-sample"
          reloadLastSearch={true}
        />
        <div className="flex-grow-1 d-flex">
          <div className="mx-auto">
            <MaterialSampleFormTemplateSelect
              value={sampleFormTemplate}
              onChange={setSampleFormTemplateUUID}
            />
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
              />
            );
          })
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
          <MaterialSampleForm
            enableReinitialize={true}
            navOrder={navOrder}
            {...sampleFormProps}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
