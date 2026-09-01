import { DinaForm } from "common-ui";
import Link from "next/link";
import { MdEdit } from "react-icons/md";
import { ViewPageLayout } from "../../components";
import {
  CONTROLLED_VOCABULARY_APIS,
  ControlledVocabularyApi,
  transformControlledVocabularyItemForForm
} from "../../components/controlled-vocabulary/controlledVocabularyItemUtils";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { ControlledVocabularyItem } from "../../types/collection-api/resources/ControlledVocabularyItem";
import { ControlledVocabularyItemFormLayout } from "./edit";

export function ControlledVocabularyItemViewPage({
  api = "collection"
}: {
  api?: ControlledVocabularyApi;
}) {
  const { apiPath, apiBaseUrl, entityLink, editRoute, listRoute } =
    CONTROLLED_VOCABULARY_APIS[api];

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
      entityLink={entityLink}
      specialListUrl={listRoute}
      type="controlled-vocabulary-item"
      apiBaseUrl={apiBaseUrl}
      nameField="name"
      mainClass="container-fluid"
      showEditButton={true}
      editButton={({ initialValues }) => (
        <Link
          href={`${editRoute}?id=${initialValues.id}`}
          className="btn btn-primary"
          style={{ paddingLeft: "15px", paddingRight: "15px" }}
        >
          <MdEdit className="me-2" />
          <DinaMessage id="operation_edit" />
        </Link>
      )}
      backButton={
        <Link href={listRoute} className="back-button my-auto me-auto">
          <DinaMessage id="backToList" />
        </Link>
      }
    />
  );
}

export default ControlledVocabularyItemViewPage;
