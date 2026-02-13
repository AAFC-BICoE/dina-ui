import { DinaForm } from "common-ui";
import Link from "next/link";
import { ViewPageLayout } from "../../components";
import { transformControlledVocabularyItemForForm } from "../../components/controlled-vocabulary/controlledVocabularyItemUtils";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { ControlledVocabularyItem } from "../../types/collection-api/resources/ControlledVocabularyItem";
import { ControlledVocabularyItemFormLayout } from "./edit";

export default function ControlledVocabularyItemViewPage() {
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
          <ControlledVocabularyItemFormLayout />
        </DinaForm>
      )}
      query={(id) => ({
        path: `collection-api/controlled-vocabulary-item/${id}`,
        include: "controlledVocabulary"
      })}
      entityLink="/controlled-vocabulary-item"
      specialListUrl="/controlled-vocabulary/list"
      type="controlled-vocabulary-item"
      apiBaseUrl="/collection-api"
      nameField="name"
      mainClass="container-fluid"
      showEditButton={true}
      showDeleteButton={false}
      backButton={
        <Link
          href="/controlled-vocabulary/list"
          className="back-button my-auto me-auto"
        >
          <DinaMessage id="backToList" />
        </Link>
      }
    />
  );
}
