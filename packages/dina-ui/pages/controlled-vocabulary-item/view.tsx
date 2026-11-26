import { DinaForm } from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { MdEdit } from "react-icons/md";
import { ViewPageLayout } from "../../components";
import {
  CONTROLLED_VOCABULARY_APIS,
  controlledVocabularyPageUrl,
  getControlledVocabularyApi,
  transformControlledVocabularyItemForForm
} from "../../components/controlled-vocabulary/controlledVocabularyItemUtils";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { ControlledVocabularyItem } from "../../types/collection-api/resources/ControlledVocabularyItem";
import { ControlledVocabularyItemFormLayout } from "./edit";

export default function ControlledVocabularyItemViewPage() {
  const router = useRouter();
  const api = getControlledVocabularyApi(router.query);
  const { apiPath, apiBaseUrl, listRoute } = CONTROLLED_VOCABULARY_APIS[api];
  // Set when the item was opened from its vocabulary's page instead of the main list.
  const vocabularyId = router.query.controlledVocabularyId?.toString();
  const backUrl = vocabularyId
    ? controlledVocabularyPageUrl("/controlled-vocabulary-type/view", api, {
        id: vocabularyId
      })
    : listRoute;

  return (
    <ViewPageLayout<ControlledVocabularyItem>
      form={(props) => (
        <DinaForm<ControlledVocabularyItem>
          {...props}
          initialValues={
            transformControlledVocabularyItemForForm(
              props.initialValues
            ) as ControlledVocabularyItem
          }
        >
          <ControlledVocabularyItemFormLayout api={api} />
        </DinaForm>
      )}
      query={(id) => ({
        path: `${apiPath}/controlled-vocabulary-item/${id}`,
        include: "controlledVocabulary"
      })}
      entityLink="/controlled-vocabulary-item"
      specialListUrl={listRoute}
      type="controlled-vocabulary-item"
      apiBaseUrl={apiBaseUrl}
      nameField="name"
      mainClass="container-fluid"
      showEditButton={true}
      showDeleteButton={(item) => !item.systemDefined}
      editButton={({ initialValues }) => (
        <Link
          href={controlledVocabularyPageUrl(
            "/controlled-vocabulary-item/edit",
            api,
            { id: initialValues.id }
          )}
          className="btn btn-primary"
          style={{ paddingLeft: "15px", paddingRight: "15px" }}
        >
          <MdEdit className="me-2" />
          <DinaMessage id="operation_edit" />
        </Link>
      )}
      backButton={
        <Link href={backUrl} className="back-button my-auto me-auto">
          <DinaMessage
            id={vocabularyId ? "backToControlledVocabulary" : "backToList"}
          />
        </Link>
      }
    />
  );
}
