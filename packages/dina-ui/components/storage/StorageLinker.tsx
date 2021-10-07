import { ButtonBar, FieldWrapper, SubmitButton } from "common-ui";
import { PersistedResource } from "kitsu";
import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { Promisable } from "type-fest";
import { StorageUnitForm } from "..";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";
import { AssignedStorage } from "./AssignedStorage";
import { BrowseStorageTree } from "./BrowseStorageTree";
import { StorageSearchSelector } from "./StorageSearchSelector";

export interface StorageLinkerProps {
  value?: PersistedResource<StorageUnit>;
  onChange?: (newValue: PersistedResource<StorageUnit>) => Promisable<void>;
}

/** Multi-Tab Storage Assignment UI. */
export function StorageLinker({
  onChange: onChangeProp,
  value
}: StorageLinkerProps) {
  const [activeTab, setActiveTab] = useState(0);

  async function changeStorageAndResetTab(
    newValue: PersistedResource<StorageUnit>
  ) {
    await onChangeProp?.(newValue);
    setActiveTab(0);
  }

  return value?.id ? (
    <AssignedStorage value={value} onChange={onChangeProp} />
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
