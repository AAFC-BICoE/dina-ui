import {
  DinaForm,
  FieldSet,
  ListLayoutFilterType,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { useResourcePermissions, ViewPageLayout } from "../../components";
import { ChangeOrderButton } from "../../components/controlled-vocabulary/ChangeOrderButton";
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

  const { canCreate: canCreateItem, canEdit: canEditItem } =
    useResourcePermissions({
      apiBaseUrl,
      typeName: "controlled-vocabulary-item"
    });

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
            vocabulary={props.initialValues}
            api={api}
            canEditItems={canEditItem}
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
      extraButtons={({ initialValues }) =>
        canCreateItem && (
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
        )
      }
      // Only shown to users who can edit the vocabulary.
      editButton={({ initialValues }) => (
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
      )}
    />
  );
}

/** Table of the items in the vocabulary. */
function ControlledVocabularyItemsSection({
  vocabulary,
  api,
  canEditItems
}: {
  vocabulary: ControlledVocabulary;
  api: ControlledVocabularyApi;
  canEditItems: boolean;
}) {
  const { formatMessage } = useDinaIntl();
  const { apiBaseUrl, componentTypeLabels } = CONTROLLED_VOCABULARY_APIS[api];
  const ordered = !!vocabulary.ordered;
  const [reloadKey, setReloadKey] = useState(0);

  const componentLabel = (component: string) =>
    componentTypeLabels[component]
      ? formatMessage(componentTypeLabels[component] as any)
      : component;

  return (
    <FieldSet
      legend={<DinaMessage id="controlledVocabularyItemsTitle" />}
      wrapLegend={(legend) => (
        <div className="d-flex align-items-center justify-content-between">
          {legend}
          {ordered && canEditItems && (
            <ChangeOrderButton
              vocabularyId={String(vocabulary.id)}
              vocabularyName={vocabulary.name}
              apiBaseUrl={apiBaseUrl}
              onSaved={() => setReloadKey((key) => key + 1)}
            />
          )}
        </div>
      )}
    >
      <ListPageLayout<ControlledVocabularyItem>
        // The table's sort is saved per id, so ordered vocabularies keep their own (position by default).
        id={
          ordered
            ? "controlled-vocabulary-ordered-items"
            : "controlled-vocabulary-items"
        }
        filterFormClassName={styles.cvItemsFilterPanel}
        filterType={ListLayoutFilterType.FREE_TEXT}
        filterAttributes={CV_FILTER_ATTRIBUTES}
        filterPlaceholder={formatMessage(
          "controlledVocabularySearchPlaceholder"
        )}
        defaultSort={ordered ? [{ id: "position", desc: false }] : undefined}
        queryTableProps={{
          columns: getControlledVocabularyItemColumns(
            api,
            componentLabel,
            ordered
          ),
          path: `${apiBaseUrl}/controlled-vocabulary-item`,
          filter: { "controlledVocabulary.uuid": { EQ: vocabulary.id } },
          deps: [reloadKey]
        }}
      />
    </FieldSet>
  );
}
