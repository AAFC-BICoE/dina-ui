import {
  DinaForm,
  FieldSet,
  ListLayoutFilterType,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaPlus } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { ViewPageLayout } from "../../components";
import {
  CV_FILTER_ATTRIBUTES,
  getControlledVocabularyItemColumns
} from "../../components/controlled-vocabulary/ControlledVocabularyItemColumns";
import {
  CONTROLLED_VOCABULARY_APIS,
  ControlledVocabularyApi,
  controlledVocabularyPageUrl,
  getControlledVocabularyApi,
  multilingualFieldsForForm
} from "../../components/controlled-vocabulary/controlledVocabularyItemUtils";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { ControlledVocabulary } from "../../types/collection-api/resources/ControlledVocabulary";
import { ControlledVocabularyItem } from "../../types/collection-api/resources/ControlledVocabularyItem";
import styles from "../controlled-vocabulary/controlled-vocabulary.module.css";
import { ControlledVocabularyFormLayout } from "./edit";

export default function ControlledVocabularyViewPage() {
  const router = useRouter();
  const api = getControlledVocabularyApi(router.query);
  const { apiPath, apiBaseUrl, listRoute } = CONTROLLED_VOCABULARY_APIS[api];

  return (
    <ViewPageLayout<ControlledVocabulary>
      form={(props) => (
        <>
          <DinaForm<ControlledVocabulary>
            {...props}
            initialValues={
              {
                ...props.initialValues,
                ...multilingualFieldsForForm(props.initialValues)
              } as any
            }
          >
            <ControlledVocabularyFormLayout />
          </DinaForm>
          <ControlledVocabularyItemsSection
            vocabularyId={props.initialValues.id}
            api={api}
          />
        </>
      )}
      query={(id) => ({ path: `${apiPath}/controlled-vocabulary/${id}` })}
      entityLink="/controlled-vocabulary-type"
      specialListUrl={listRoute}
      type="controlled-vocabulary"
      apiBaseUrl={apiBaseUrl}
      showDeleteButton={false}
      showGroup={false}
      // Only shown to users who can edit the vocabulary.
      editButton={({ initialValues }) => (
        <>
          {/* TODO: also require useResourcePermissions canCreate for "controlled-vocabulary-item" once PR #2012 is merged. */}
          <Link
            href={controlledVocabularyPageUrl(
              "/controlled-vocabulary-item/edit",
              api,
              { controlledVocabularyId: initialValues.id }
            )}
            className="btn btn-primary"
          >
            <FaPlus className="me-2" />
            <DinaMessage id="createItem" />
          </Link>
          <Link
            href={controlledVocabularyPageUrl(
              "/controlled-vocabulary-type/edit",
              api,
              { id: initialValues.id }
            )}
            className="btn btn-primary"
          >
            <MdEdit className="me-2" />
            <DinaMessage id="operation_edit" />
          </Link>
        </>
      )}
    />
  );
}

/** Table of the items in the vocabulary. */
function ControlledVocabularyItemsSection({
  vocabularyId,
  api
}: {
  vocabularyId: string;
  api: ControlledVocabularyApi;
}) {
  const { formatMessage } = useDinaIntl();
  const { apiBaseUrl, componentTypeLabels } = CONTROLLED_VOCABULARY_APIS[api];

  const componentLabel = (component: string) =>
    componentTypeLabels[component]
      ? formatMessage(componentTypeLabels[component] as any)
      : component;

  return (
    <FieldSet legend={<DinaMessage id="controlledVocabularyItemsTitle" />}>
      <ListPageLayout<ControlledVocabularyItem>
        id="controlled-vocabulary-items"
        filterFormClassName={styles.cvItemsFilterPanel}
        filterType={ListLayoutFilterType.FREE_TEXT}
        filterAttributes={CV_FILTER_ATTRIBUTES}
        filterPlaceholder={formatMessage(
          "controlledVocabularySearchPlaceholder"
        )}
        queryTableProps={{
          columns: getControlledVocabularyItemColumns(api, componentLabel),
          path: `${apiBaseUrl}/controlled-vocabulary-item`,
          filter: { "controlledVocabulary.uuid": { EQ: vocabularyId } }
        }}
      />
    </FieldSet>
  );
}
