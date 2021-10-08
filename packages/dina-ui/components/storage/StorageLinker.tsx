import {
  ButtonBar,
  FieldWrapper,
  MetaWithTotal,
  SubmitButton,
  useApiClient,
  useModal,
  AreYouSureModal
} from "common-ui";
import { KitsuResource, KitsuResourceLink, PersistedResource } from "kitsu";
import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { Promisable } from "type-fest";
import { StorageUnitForm } from "..";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { MaterialSample, StorageUnit } from "../../types/collection-api";
import { AssignedStorage } from "./AssignedStorage";
import { BrowseStorageTree } from "./BrowseStorageTree";
import { StorageSearchSelector } from "./StorageSearchSelector";
import { useField } from "formik";

export interface StorageLinkerProps {
  value?: PersistedResource<StorageUnit>;
  onChange?: (
    newValue: PersistedResource<StorageUnit> | { id: null }
  ) => Promisable<void>;
}

/** Multi-Tab Storage Assignment UI. */
export function StorageLinker({
  onChange: onChangeProp,
  value
}: StorageLinkerProps) {
  const [activeTab, setActiveTab] = useState(0);

  const formId = useField<string | undefined>("id")[0].value;
  const formType = useField<string | undefined>("type")[0].value;

  const { promptToDeleteEmptyStorage } = usePromptToDeleteEmptyStorage();

  async function changeStorageAndResetTab(
    newValue: PersistedResource<StorageUnit> | { id: null }
  ) {
    await onChangeProp?.(newValue);

    // When removing the parent which becomes empty, prompt to delete the parent:
    const oldParentId = value?.id;
    if (!newValue?.id && oldParentId) {
      await promptToDeleteEmptyStorage(
        oldParentId,
        formId && formType ? { id: formId, type: formType } : undefined
      );
    }

    setActiveTab(0);
  }

  return value?.id ? (
    <AssignedStorage value={value} onChange={changeStorageAndResetTab} />
  ) : (
    <Tabs selectedIndex={activeTab} onSelect={setActiveTab}>
      <TabList className="react-tabs__tab-list mb-0">
        {!value?.id && (
          <Tab>
            <DinaMessage id="searchStorage" />
          </Tab>
        )}
        {!value?.id && (
          <Tab>
            <DinaMessage id="browseStorageTree" />
          </Tab>
        )}
        {!value?.id && (
          <Tab>
            <DinaMessage id="createStorage" />
          </Tab>
        )}
      </TabList>
      <div
        className="card-body border-top-0"
        style={{
          border: "1px solid rgb(170, 170, 170)",
          height: "60rem",
          overflowY: "scroll"
        }}
      >
        {!value?.id && (
          <TabPanel>
            <StorageSearchSelector onChange={changeStorageAndResetTab} />
          </TabPanel>
        )}
        {!value?.id && (
          <TabPanel>
            <BrowseStorageTree onSelect={changeStorageAndResetTab} />
          </TabPanel>
        )}
        {!value?.id && (
          <TabPanel>
            <StorageUnitForm
              onSaved={changeStorageAndResetTab}
              buttonBar={
                <ButtonBar>
                  <SubmitButton className="ms-auto">
                    <DinaMessage id="createAndAssign" />
                  </SubmitButton>
                </ButtonBar>
              }
            />
          </TabPanel>
        )}
      </div>
    </Tabs>
  );
}

export interface StorageLinkerFieldProps {
  name: string;
  customName?: string;
  removeLabelTag?: boolean;
}

/** DinaForm-connected Storage Assignment UI. */
export function StorageLinkerField({
  name,
  customName,
  removeLabelTag
}: StorageLinkerFieldProps) {
  return (
    <FieldWrapper
      name={name}
      readOnlyRender={value => (
        <AssignedStorage readOnly={true} value={value} />
      )}
      disableLabelClick={true}
      customName={customName}
      removeLabelTag={removeLabelTag}
    >
      {({ value, setValue }) => (
        <StorageLinker value={value} onChange={setValue} />
      )}
    </FieldWrapper>
  );
}

function usePromptToDeleteEmptyStorage() {
  const { apiClient, save } = useApiClient();
  const { openModal } = useModal();

  async function promptToDeleteEmptyStorage(
    storageId: string,
    currentContent?: KitsuResource
  ) {
    const currentContentFilter = currentContent?.id
      ? ` and uuid!=${currentContent?.id}`
      : "";

    const hasChildUnits = !!(
      await apiClient.get<StorageUnit[]>("collection-api/storage-unit", {
        filter: {
          rsql: `parentStorageUnit.uuid==${storageId}${currentContentFilter}`
        },
        page: { limit: 1 }
      })
    ).data.length;

    const hasChildSamples = !!(
      await apiClient.get<MaterialSample[]>("collection-api/material-sample", {
        filter: {
          rsql: `storageUnit.uuid==${storageId}${currentContentFilter}`
        },
        page: { limit: 1 }
      })
    ).data.length;

    const isEmpty = !hasChildUnits && !hasChildSamples;

    if (isEmpty) {
      const storageToDelete = (
        await apiClient.get<StorageUnit>(
          `collection-api/storage-unit/${storageId}`,
          {}
        )
      ).data;

      openModal(
        <AreYouSureModal
          actionMessage={<DinaMessage id="warning" />}
          messageBody={
            <DinaMessage
              id="deleteEmptyStorageWarning"
              values={{ storageName: storageToDelete.name }}
            />
          }
          onYesButtonClicked={async () => {
            const operations: Parameters<typeof save>[0] = [
              // If unlinking an existing content type:
              ...(currentContent
                ? [
                    {
                      resource: {
                        id: currentContent.id,
                        type: currentContent.type,
                        [currentContent.type === "storage-unit"
                          ? "parentStorageUnit"
                          : "storageUnit"]: { id: null }
                      },
                      type: currentContent.type
                    }
                  ]
                : []),
              { delete: { id: storageId, type: "storage-unit" } }
            ];

            await save(operations, {
              apiBaseUrl: "/collection-api"
            });
          }}
        />
      );
    }
  }

  return { promptToDeleteEmptyStorage };
}
