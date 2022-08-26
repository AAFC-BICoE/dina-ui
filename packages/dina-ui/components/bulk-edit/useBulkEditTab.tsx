import {
  BulkEditTabContext,
  BulkEditTabContextI,
  ResourceWithHooks
} from "common-ui";
import { InputResource, KitsuResource } from "kitsu";
import React from "react";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { BulkNavigatorTab } from "./BulkEditNavigator";
import { FormikProps } from "formik";
import { RefObject } from "react";

export interface UseBulkEditTabParams<T extends KitsuResource = KitsuResource> {
  resourceHooks: ResourceWithHooks<T>[];
  hideBulkEditTab?: boolean;
  resourceForm: JSX.Element;
  bulkEditFormRef: RefObject<FormikProps<InputResource<T>>>;
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
    content: (isSelected) =>
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
