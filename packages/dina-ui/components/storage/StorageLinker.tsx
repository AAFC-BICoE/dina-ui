import {
  AreYouSureModal,
  ButtonBar,
  FieldSpy,
  FieldWrapper,
  SimpleSearchFilterBuilder,
  SubmitButton,
  useApiClient,
  useBulkEditTabContext,
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
import {
  MaterialSample,
  StorageUnit,
  StorageUnitType
} from "../../types/collection-api";
import { AssignedStorage } from "./AssignedStorage";
import { BrowseStorageTree } from "./BrowseStorageTree";
import { StorageSearchSelector } from "./StorageSearchSelector";
import { Button } from "react-bootstrap";
import { RiDeleteBinLine } from "react-icons/ri";

export interface StorageLinkerProps {
  name?: string;
  value?: PersistedResource<StorageUnit>;
  onChange?: (
    newValue: PersistedResource<StorageUnit> | { id: null }
  ) => Promisable<void>;
  placeholder?: string;
  actionMode?: StorageActionMode;
  parentIdInURL?: string;
  createStorageMode?: boolean;
  currentStorageUnitUUID?: string;
  storageUnitType?: StorageUnitType;
}

/** Multi-Tab Storage Assignment UI. */
export function StorageLinker({
  name,
  onChange: onChangeProp,
  value,
  placeholder,
  actionMode,
  parentIdInURL,
  createStorageMode,
  currentStorageUnitUUID,
  storageUnitType
}: StorageLinkerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const { readOnly } = useDinaFormContext();
  const bulkEditContext = useBulkEditTabContext();

  const formId = useField<string | undefined>("id")[0].value;
  const formType = useField<string | undefined>("type")[0].value;

  const { promptToDeleteEmptyStorage } = usePromptToDeleteEmptyStorage();

  /**
   * Generates an Elasticsearch query object for filtering storage units by type
   * based on the current storage unit type.
   *
   * @param type - The storage unit type object to generate the query for.
   * @returns An Elasticsearch query object:
   *   - Always filters out the current storage unit by its UUID.
   *   - If the `type` has a `gridLayoutDefinition`, returns a query that matches storage units with the
   *     same type.
   *   - If the `type` does not have a `gridLayoutDefinition`, returns a query that matches non-grid storage units.
   */
  function storageUnitTypeQuery(type: StorageUnitType): any {
    if (type.gridLayoutDefinition) {
      return {
        bool: {
          must_not: {
            term: {
              "data.id": currentStorageUnitUUID
            }
          },
          must: [
            {
              nested: {
                path: "included",
                query: {
                  bool: {
                    filter: [
                      {
                        term: {
                          "included.type": "storage-unit-type"
                        }
                      },
                      {
                        term: {
                          "included.id": type.id
                        }
                      }
                    ]
                  }
                }
              }
            }
          ]
        }
      };
    } else {
      return {
        bool: {
          must_not: {
            term: {
              "data.id": currentStorageUnitUUID
            }
          },
          must: [
            {
              nested: {
                path: "included",
                query: {
                  bool: {
                    must_not: [
                      {
                        exists: {
                          field: "included.attributes.gridLayoutDefinition"
                        }
                      }
                    ]
                  }
                }
              }
            }
          ]
        }
      };
    }
  }

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

    // If being changed to a new value, the deleted state needs to be removed.
    if (newValue?.id && name) {
      const deleted = new Set(bulkEditContext?.deletedFields);
      deleted.delete(name);
      bulkEditContext?.setDeletedFields?.(deleted);
    }

    setActiveTab(0);
  }

  /**
   * Handles the bulk edit delete location logic. Adds it as a deleted field.
   */
  async function bulkEditDeleteLocation() {
    if (name) {
      await changeStorageAndResetTab?.({ id: null });
      const deleted = new Set(bulkEditContext?.deletedFields);
      deleted.add(name);
      bulkEditContext?.setDeletedFields?.(deleted);
    }
  }

  const isDeleted =
    bulkEditContext && name
      ? bulkEditContext?.deletedFields?.has?.(name)
      : false;

  return (
    <div>
      {placeholder && (
        <div className="alert alert-secondary placeholder-text">
          {placeholder}
        </div>
      )}
      {/* Clear button */}
      {name === "parentStorageUnit" && bulkEditContext && !isDeleted && (
        <>
          <Button
            variant="danger"
            className="mb-3"
            onClick={bulkEditDeleteLocation}
          >
            <RiDeleteBinLine className="me-2" />
            <DinaMessage id="deleteAllStorageUnit" />
          </Button>
        </>
      )}
      {value?.id ? (
        <AssignedStorage
          name={name}
          value={value}
          parentIdInURL={parentIdInURL}
          onChange={changeStorageAndResetTab}
          // if editing or creating a new storage unit, don't show row and column fields since they don't have coordinates
          showRowAndColumnFields={!createStorageMode}
        />
      ) : (
        <div className="ignore-explicitly-styles">
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
              {!value?.id &&
                actionMode !== "ADD_EXISTING_AS_CHILD" &&
                createStorageMode === true && (
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
                  {actionMode === "MOVE_ALL" && storageUnitType ? (
                    <StorageSearchSelector
                      onChange={changeStorageAndResetTab}
                      currentStorageUnitUUID={currentStorageUnitUUID}
                      customViewElasticSearchQuery={storageUnitTypeQuery(
                        storageUnitType
                      )}
                    />
                  ) : (
                    <StorageSearchSelector
                      onChange={changeStorageAndResetTab}
                      currentStorageUnitUUID={currentStorageUnitUUID}
                    />
                  )}
                </TabPanel>
              )}
              {!value?.id && (
                <TabPanel>
                  <BrowseStorageTree
                    onSelect={changeStorageAndResetTab}
                    readOnly={readOnly}
                    currentStorageUnitUUID={currentStorageUnitUUID}
                  />
                </TabPanel>
              )}
              {!value?.id && (
                <TabPanel>
                  <StorageUnitForm
                    onSaved={(savedUnits) =>
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
        </div>
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
  currentStorageUnitUUID?: string;
}

/** DinaForm-connected Storage Assignment UI. */
export function StorageLinkerField({
  name,
  customName,
  hideLabel,
  targetType,
  parentIdInURL,
  createStorageMode,
  currentStorageUnitUUID
}: StorageLinkerFieldProps) {
  const { getFieldLabel } = useFieldLabels();

  return (
    <FieldWrapper
      name={name}
      readOnlyRender={(value) => (
        <AssignedStorage
          readOnly={true}
          value={value}
          showRowAndColumnFields={currentStorageUnitUUID === undefined} // if displaying the parent storage unit, don't show row and column fields
        />
      )}
      disableLabelClick={true}
      customName={customName}
      hideLabel={hideLabel}
    >
      {({ value, setValue, placeholder }) => (
        <div>
          <FieldSpy fieldName={name}>
            {(_, { bulkContext }) => (
              <>
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
                <StorageLinker
                  value={value}
                  name={name}
                  onChange={setValue}
                  placeholder={placeholder}
                  parentIdInURL={parentIdInURL}
                  createStorageMode={createStorageMode}
                  currentStorageUnitUUID={currentStorageUnitUUID}
                />
              </>
            )}
          </FieldSpy>
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
    const hasChildUnits = !!(
      await apiClient.get<StorageUnit[]>("collection-api/storage-unit", {
        filter: SimpleSearchFilterBuilder.create()
          .where("parentStorageUnit.uuid", "EQ", storageId)
          .whereProvided("uuid", "NEQ", currentContent?.id)
          .build(),
        page: { limit: 1 }
      })
    ).data.length;

    const hasChildSamples = !!(
      await apiClient.get<MaterialSample[]>("collection-api/material-sample", {
        filter: SimpleSearchFilterBuilder.create()
          .where("storageUnitUsage.storageUnit.uuid", "EQ", storageId)
          .whereProvided("uuid", "NEQ", currentContent?.id)
          .build(),
        page: { limit: 1 },
        include: "storageUnitUsage"
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
