import { FastField } from "formik";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { FieldWrapper } from "../../../common-ui/lib";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";
import { BrowseStorageTree } from "./BrowseStorageTree";
import { SearchStorageTable } from "./SearchStorageTable";

export interface AssignToStorageProps {
  value?: PersistedResource<StorageUnit>;
  onChange: (newValue: PersistedResource<StorageUnit>) => void;
}

/** Storage Assignment UI. */
export function AssignToStorage({
  onChange: onChangeProp,
  value
}: AssignToStorageProps) {
  const [activeTab, setActiveTab] = useState(value ? 0 : 2);

  function changeAndResetTab(newValue: PersistedResource<StorageUnit>) {
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
          <DinaMessage id="browseStorage" />
        </Tab>
      </TabList>
      <TabPanel>
        {value ? (
          <Link href={`/collection/storage-unit/view?id=${value.id}`}>
            <a target="_blank">{value.name}</a>
          </Link>
        ) : (
          <DinaMessage id="none" />
        )}
      </TabPanel>
      <TabPanel>
        <SearchStorageTable />
      </TabPanel>
      <TabPanel>
        <BrowseStorageTree onSelect={changeAndResetTab} />
      </TabPanel>
    </Tabs>
  );
}

export interface AssignToStorageFieldProps {
  name: string;
}

/** DinaForm-connected Storage Assignment UI. */
export function AssignToStorageField({ name }: AssignToStorageFieldProps) {
  return (
    <FieldWrapper
      name={name}
      readOnlyRender={value =>
        value ? (
          <Link href={`/collection/storage-unit/view?id=${value.id}`}>
            <a target="_blank">{value.name}</a>
          </Link>
        ) : null
      }
      disableLabelClick={true}
    >
      {({ value, setValue }) => (
        <AssignToStorage value={value} onChange={setValue} />
      )}
    </FieldWrapper>
  );
}
