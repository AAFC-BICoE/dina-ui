import { PersistedResource } from "kitsu";
import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { FieldWrapper } from "../../../common-ui/lib";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";
import { AssignedStorage } from "./AssignedStorage";
import { BrowseStorageTree } from "./BrowseStorageTree";
import { StorageSearchSelector } from "./StorageSearchSelector";

export interface StorageLinkerProps {
  value?: PersistedResource<StorageUnit>;
  onChange: (newValue: PersistedResource<StorageUnit>) => void;
  fieldName: string;

  /** Disable this option ID e.g. to avoid putting a storage unit inside itself. */
  excludeOptionId?: string;
}

/** Multi-Tab Storage Assignment UI. */
export function StorageLinker({
  onChange: onChangeProp,
  value,
  fieldName,
  excludeOptionId
}: StorageLinkerProps) {
  const [activeTab, setActiveTab] = useState(value ? 0 : 1);

  function changeStorageAndResetTab(newValue: PersistedResource<StorageUnit>) {
    onChangeProp(newValue);
    setActiveTab(0);
  }

  return (
    <Tabs selectedIndex={activeTab} onSelect={setActiveTab}>
      <TabList>
        <Tab>
          <DinaMessage id="assignedStorage" />
        </Tab>
        <Tab>
          <DinaMessage id="searchStorage" />
        </Tab>
        <Tab>
          <DinaMessage id="browseStorageTree" />
        </Tab>
      </TabList>
      <TabPanel>
        <AssignedStorage value={value} onChange={onChangeProp} />
      </TabPanel>
      <TabPanel>
        <StorageSearchSelector
          fieldName={fieldName}
          excludeOptionId={excludeOptionId}
        />
      </TabPanel>
      <TabPanel>
        <BrowseStorageTree
          onSelect={changeStorageAndResetTab}
          excludeOptionId={excludeOptionId}
        />
      </TabPanel>
    </Tabs>
  );
}

export interface StorageLinkerFieldProps {
  name: string;

  /** Disable this option ID e.g. to avoid putting a storage unit inside itself. */
  excludeOptionId?: string;
}

/** DinaForm-connected Storage Assignment UI. */
export function StorageLinkerField({
  name,
  excludeOptionId
}: StorageLinkerFieldProps) {
  return (
    <FieldWrapper
      name={name}
      readOnlyRender={value => (
        <AssignedStorage readOnly={true} value={value} />
      )}
      disableLabelClick={true}
    >
      {({ value, setValue }) => (
        <StorageLinker
          fieldName={name}
          value={value}
          onChange={setValue}
          excludeOptionId={excludeOptionId}
        />
      )}
    </FieldWrapper>
  );
}
