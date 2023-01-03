import {
  AreYouSureModal,
  ButtonBar,
  FieldSpy,
  FieldWrapper,
  SubmitButton,
  useApiClient,
  useDinaFormContext,
  useFieldLabels,
  useModal
} from "common-ui";
import { useField } from "formik";
import { KitsuResource, PersistedResource } from "kitsu";
import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { Promisable } from "type-fest";
import { StorageActionMode, StorageUnitForm } from "..";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { MaterialSample, StorageUnit } from "../../types/collection-api";
import { AssignedStorage } from "./AssignedStorage";
import { BrowseStorageTree } from "./BrowseStorageTree";
import { StorageSearchSelector } from "./StorageSearchSelector";

export interface StorageLinkerProps {
  value?: PersistedResource<StorageUnit>;
  onChange?: (
    newValue: PersistedResource<StorageUnit> | { id: null }
  ) => Promisable<void>;
  placeholder?: string;
  actionMode?: StorageActionMode;
  parentIdInURL?: string;
  createStorageMode?: boolean;
}

/** Multi-Tab Storage Assignment UI. */
export function StorageLinker({
  onChange: onChangeProp,
  value,
  placeholder,
  actionMode,
  parentIdInURL,
  createStorageMode
}: StorageLinkerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const { readOnly } = useDinaFormContext();

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

  return (
    <div>
      {placeholder && (
        <div className="alert alert-secondary placeholder-text">
          {placeholder}
        </div>
      )}
      {value?.id ? (
        <AssignedStorage
          value={value}
          parentIdInURL={parentIdInURL}
          onChange={changeStorageAndResetTab}
        />
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
            {!value?.id && actionMode !== "ADD_EXISTING_AS_CHILD" && createStorageMode === true &&(
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
                <BrowseStorageTree
                  onSelect={changeStorageAndResetTab}
                  readOnly={readOnly}
                />
              </TabPanel>
            )}
            {!value?.id && (
              <TabPanel>
                <StorageUnitForm
                  onSaved={savedUnits =>
                    changeStorageAndResetTab(savedUnits[0])
                  }
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
      )}
    </div>
  );
}

export interface StorageLinkerFieldProps {
  name: string;
  targetType: string;
  customName?: string;
  hideLabel?: boolean;
  parentIdInURL?: string;
  createStorageMode?: boolean;
}

/** DinaForm-connected Storage Assignment UI. */
export function StorageLinkerField({
  name,
  customName,
  hideLabel,
  targetType,
  parentIdInURL,
  createStorageMode
}: StorageLinkerFieldProps) {
  const formId = useField<string | undefined>("id")[0].value;

  const { getFieldLabel } = useFieldLabels();

  return (
    <FieldWrapper
      name={name}
      readOnlyRender={value => (
        <AssignedStorage readOnly={true} value={value} />
      )}
      disableLabelClick={true}
      customName={customName}
      hideLabel={hideLabel}
    >
      {({ value, setValue, placeholder }) => (
        <div>
          <FieldSpy fieldName={name}>
            {(_, { bulkContext }) => (
              <div>
                {bulkContext?.hasBulkEditValue ? (
                  <div className="alert alert-warning">
                    <DinaMessage
                      id="bulkEditResourceLinkerWarningSingle"
                      values={{
                        targetType: getFieldLabel({ name: targetType })
                          .fieldLabel,
                        fieldName: getFieldLabel({ name }).fieldLabel
                      }}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </FieldSpy>
          <StorageLinker
            value={value}
            onChange={setValue}
            placeholder={placeholder}
            parentIdInURL={parentIdInURL}
            createStorageMode={createStorageMode}
          />
        </div>
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
