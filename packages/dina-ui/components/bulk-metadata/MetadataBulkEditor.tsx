import React from "react";
import { Metadata } from "../../types/objectstore-api";
import { InputResource, PersistedResource, KitsuResource } from "kitsu";
import { Promisable } from "type-fest";
import { ResourceWithHooks } from "packages/common-ui/lib";
import { BulkNavigatorTab } from "../bulk-edit/BulkEditNavigator";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormikProps } from "formik";
import { useMetadataSave } from "../object-store/metadata/useMetadata";

export interface MetadataBulkEditorProps {
  metadatas: InputResource<Metadata>[];
  onSaved: (metadatas: PersistedResource<Metadata>[]) => Promisable<void>;
  disableMetadataNameField?: boolean;
  onPreviousClick?: () => void;
}
function getMetadataHooks(metadatas) {
  return metadatas.map((resource, index) => {
    const key = `metadata-${index}`;
    return {
      key,
      resource,
      saveHook: useMetadataSave({
        initialValues: resource
      }),
      formRef: useRef(null)
    };
  });
}

export function MetadataBulkEditor({
  metadatas: metadatasProp
}: // disableMetadataNameField,
// onSaved,
// onPreviousClick,
MetadataBulkEditorProps) {
  const [selectedTab, setSelectedTab] = useState<
    BulkNavigatorTab | ResourceWithHooks
  >();

  // Make sure the samples list doesn't change during this component's lifecycle:
  const metadatas = useMemo(() => metadatasProp, []);

  const initialValues: InputResource<Metadata> = {
    type: "metadata"
  };

  const bulkEditMetadataHook = useMetadataSave({
    initialValues
  });

  const bulkEditFormRef = useRef<FormikProps<InputResource<Metadata>>>(null);

  const metadataHooks = getMetadataHooks(metadatas);
  return <div>MetadataBulkEditor</div>;
}
