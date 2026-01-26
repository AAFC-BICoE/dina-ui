import { DinaForm } from "common-ui";
import _ from "lodash";
import Link from "next/link";
import { ViewPageLayout } from "../../components";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { ControlledVocabularyItem } from "../../types/collection-api/resources/ControlledVocabularyItem";
import { ControlledVocabularyItemFormLayout } from "./edit";

export default function ControlledVocabularyItemViewPage() {
  return (
    <ViewPageLayout<ControlledVocabularyItem>
      form={(props) => {
        const item = props.initialValues;

        // Convert multilingualDescription to editable Dictionary format:
        const formattedItem = {
          ...item,
          multilingualDescription: _.fromPairs<string | undefined>(
            item.multilingualDescription?.descriptions?.map(
              ({ desc, lang }) => [lang ?? "", desc ?? ""]
            )
          ),
          // Convert multilingualTitle to editable Dictionary format:
          multilingualTitle: _.fromPairs<string | undefined>(
            item.multilingualTitle?.titles?.map(({ title, lang }) => [
              lang ?? "",
              title ?? ""
            ])
          ),
          // Set vocabularyElementType to PICKLIST if acceptedValues has items
          vocabularyElementType: item.acceptedValues?.length
            ? "PICKLIST"
            : item.vocabularyElementType
        };

        return (
          <DinaForm<ControlledVocabularyItem>
            {...props}
            initialValues={formattedItem as any}
          >
            <ControlledVocabularyItemFormLayout />
          </DinaForm>
        );
      }}
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
      showDeleteButton={true}
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
