import {
  BackButton,
  ButtonBar,
  SubmitButton,
  useQuery,
  withResponse
} from "common-ui";
import { pick } from "lodash";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  Head,
  materialSampleFormCustomViewSchema,
  MaterialSampleFormCustomViewConfig,
  Nav,
  useMaterialSampleFormCustomViewProps,
  MaterialSampleForm
} from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  CustomView,
  MaterialSampleFormSectionId
} from "../../../types/collection-api";

export default function CreateMaterialSampleFromWorkflowPage() {
  const router = useRouter();
  const {
    query: { id: actionDefinitionId }
  } = router;
  const { formatMessage } = useDinaIntl();

  const customViewQuery = useQuery<CustomView>(
    { path: `collection-api/custom-view/${actionDefinitionId}` },
    { disabled: !actionDefinitionId }
  );

  const pageTitle = `${formatMessage("createSampleWithCustomView")}${
    customViewQuery.response ? `: ${customViewQuery.response.data.name}` : ""
  }`;

  async function moveToSampleViewPage(id: string) {
    await router.push(`/collection/material-sample/view?id=${id}`);
  }

  async function moveToNewRunPage() {
    await router.reload();
  }

  return (
    <div>
      <Head title={pageTitle} />
      <Nav />
      <div className="container-fluid">
        <h1 id="wb-cont">{pageTitle}</h1>
        {withResponse(customViewQuery, ({ data }) => {
          const viewConfig = materialSampleFormCustomViewSchema.parse(
            data.viewConfiguration
          );

          return (
            <CreateMaterialSampleFromWorkflowForm
              actionDefinition={viewConfig}
              moveToNewRunPage={moveToNewRunPage}
              moveToSampleViewPage={moveToSampleViewPage}
            />
          );
        })}
      </div>
    </div>
  );
}

export interface CreateMaterialSampleFromWorkflowForm {
  actionDefinition: MaterialSampleFormCustomViewConfig;
  moveToSampleViewPage: (id: string) => Promise<void>;
  moveToNewRunPage: () => Promise<void>;
}

export function CreateMaterialSampleFromWorkflowForm({
  actionDefinition,
  moveToSampleViewPage,
  moveToNewRunPage
}: CreateMaterialSampleFromWorkflowForm) {
  const {
    materialSampleInitialValues,
    collectingEventInitialValues,
    acquisitionEventInitialValues,
    enabledFields,
    visibleManagedAttributeKeys
  } = useMaterialSampleFormCustomViewProps(actionDefinition);

  type RoutingButtonStrings = "newRun" | "viewSample";

  /* Route to either new workflow run page with the same template id or
  material sample list page based on button clicked */
  function selectOnSaved(routeString: RoutingButtonStrings) {
    return routeString === "newRun" ? moveToNewRunPage : moveToSampleViewPage;
  }

  const [onSaveString, setOnSaveString] =
    useState<RoutingButtonStrings>("viewSample");

  return (
    <MaterialSampleForm
      enableStoredDefaultGroup={true}
      buttonBar={
        <ButtonBar className="d-flex">
          <BackButton
            entityLink="/collection/material-sample-custom-view"
            className="flex-grow-1"
          />
          <SubmitButton
            buttonProps={() => ({
              onClick: () => setOnSaveString("newRun"),
              style: { width: "20rem" }
            })}
          >
            <DinaMessage id="saveAndCreateNewMaterialSampleButton" />
          </SubmitButton>
          <SubmitButton
            buttonProps={() => ({
              onClick: () => setOnSaveString("viewSample"),
              style: { width: "15rem" }
            })}
          >
            <DinaMessage id="saveAndGoToViewPageButton" />
          </SubmitButton>
        </ButtonBar>
      }
      materialSample={materialSampleInitialValues}
      collectingEventInitialValues={collectingEventInitialValues}
      acquisitionEventInitialValues={acquisitionEventInitialValues}
      onSaved={selectOnSaved(onSaveString)}
      enabledFields={enabledFields}
      attachmentsConfig={{
        collectingEvent: pick(
          actionDefinition.formTemplates.COLLECTING_EVENT,
          "allowNew",
          "allowExisting"
        ),
        materialSample: pick(
          actionDefinition.formTemplates.MATERIAL_SAMPLE,
          "allowNew",
          "allowExisting"
        )
      }}
      visibleManagedAttributeKeys={visibleManagedAttributeKeys}
    />
  );
}
