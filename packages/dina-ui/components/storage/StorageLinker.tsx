import { FieldWrapper } from "common-ui";
import { PersistedResource } from "kitsu";
import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";
import { AssignedStorage } from "./AssignedStorage";
import { BrowseStorageTree } from "./BrowseStorageTree";
import { StorageSearchSelector } from "./StorageSearchSelector";

export interface StorageLinkerProps {
  value?: PersistedResource<StorageUnit>;
  onChange: (newValue: PersistedResource<StorageUnit>) => void;

  /** Disable this option ID e.g. to avoid putting a storage unit inside itself. */
  excludeOptionId?: string;
}

/** Multi-Tab Storage Assignment UI. */
export function StorageLinker({
  onChange: onChangeProp,
  value,
  excludeOptionId
}: StorageLinkerProps) {
  const [activeTab, setActiveTab] = useState(0);

  function changeStorageAndResetTab(newValue: PersistedResource<StorageUnit>) {
    onChangeProp(newValue);
    setActiveTab(0);
  }

  return value?.id ? (
    <AssignedStorage value={value} onChange={onChangeProp} />
  ) : (
    <Tabs selectedIndex={activeTab} onSelect={setActiveTab}>
      <TabList>
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
      </TabList>
      {!value?.id && (
        <TabPanel>
          <StorageSearchSelector
            onChange={changeStorageAndResetTab}
            excludeOptionId={excludeOptionId}
          />
        </TabPanel>
      )}
      {!value?.id && (
        <TabPanel>
          <div style={{ height: "50rem", overflowY: "scroll" }}>
            <BrowseStorageTree
              onSelect={changeStorageAndResetTab}
              excludeOptionId={excludeOptionId}
            />
          </div>
        </TabPanel>
      )}
    </Tabs>
  );
}

export interface StorageLinkerFieldProps {
  name: string;

  /** Disable this option ID e.g. to avoid putting a storage unit inside itself. */
  excludeOptionId?: string;
  customName?: string;
}

/** DinaForm-connected Storage Assignment UI. */
export function StorageLinkerField({
  name,
  excludeOptionId,
  customName
}: StorageLinkerFieldProps) {
  return (
    <FieldWrapper
      name={name}
      readOnlyRender={value => (
        <AssignedStorage readOnly={true} value={value} />
      )}
      disableLabelClick={true}
      customName={customName}
    >
      {({ value, setValue }) => (
        <StorageLinker
          value={value}
          onChange={setValue}
          excludeOptionId={excludeOptionId}
        />
      )}
    </FieldWrapper>
  );
}
