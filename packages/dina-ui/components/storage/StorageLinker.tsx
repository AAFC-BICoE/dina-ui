import { FieldWrapper } from "common-ui";
import { PersistedResource } from "kitsu";
import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { Promisable } from "type-fest";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";
import { AssignedStorage } from "./AssignedStorage";
import { BrowseStorageTree } from "./BrowseStorageTree";
import { StorageSearchSelector } from "./StorageSearchSelector";

export interface StorageLinkerProps {
  value?: PersistedResource<StorageUnit>;
  onChange: (newValue: PersistedResource<StorageUnit>) => Promisable<void>;
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
    await onChangeProp(newValue);
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
      </div>
    </Tabs>
  );
}

export interface StorageLinkerFieldProps {
  name: string;
}

/** DinaForm-connected Storage Assignment UI. */
export function StorageLinkerField({ name }: StorageLinkerFieldProps) {
  return (
    <FieldWrapper
      name={name}
      readOnlyRender={value => (
        <AssignedStorage readOnly={true} value={value} />
      )}
      disableLabelClick={true}
    >
      {({ value, setValue }) => (
        <StorageLinker value={value} onChange={setValue} />
      )}
    </FieldWrapper>
  );
}
