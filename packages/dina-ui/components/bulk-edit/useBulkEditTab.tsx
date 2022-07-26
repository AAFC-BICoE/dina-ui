import {
  BulkEditTabContext,
  BulkEditTabContextI,
  ResourceWithHooks
} from "common-ui";
import React from "react";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { BulkNavigatorTab } from "./BulkEditNavigator";

export interface UseBulkEditTabParams {
  resourceHooks: ResourceWithHooks[];
  hideBulkEditTab?: boolean;
  resourceForm: any;
  bulkEditFormRef: any;
}

export function useBulkEditTab({
  hideBulkEditTab,
  resourceHooks,
  resourceForm,
  bulkEditFormRef
}: UseBulkEditTabParams) {
  const { formatMessage } = useDinaIntl();

  const ctx: BulkEditTabContextI = {
    resourceHooks,
    bulkEditFormRef
  };
  const bulkEditTab: BulkNavigatorTab = {
    formRef: bulkEditFormRef,
    key: "EDIT_ALL",
    title: formatMessage("editAll"),
    content: isSelected =>
      hideBulkEditTab ? null : (
        <BulkEditTabContext.Provider value={ctx}>
          {React.cloneElement(resourceForm, { isOffScreen: !isSelected })}
        </BulkEditTabContext.Provider>
      )
  };

  return {
    bulkEditTab,
    bulkEditFormRef
  };
}
