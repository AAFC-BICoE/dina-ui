import React from "react";
import { Metadata } from "../../types/objectstore-api";
import { InputResource, PersistedResource, KitsuResource } from "kitsu";
import { Promisable } from "type-fest";
import {
  ButtonBar,
  DinaForm,
  FormikButton,
  ResourceWithHooks
} from "packages/common-ui/lib";
import { BulkNavigatorTab } from "../bulk-edit/BulkEditNavigator";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormikProps } from "formik";
import { useMetadataSave } from "../object-store/metadata/useMetadata";
import { MetadataForm } from "../object-store/metadata/MetadataForm";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";

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
  metadatas: metadatasProp,
  onPreviousClick
}: // onSaved,
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

  // const metadataForm = (
  //   <MetadataForm metadata={initialValues} buttonBar={null}></MetadataForm>
  // );
  return (
    <div>
      {" "}
      <DinaForm initialValues={{}}>
        <ButtonBar className="gap-4">
          {onPreviousClick && (
            <FormikButton
              className="btn btn-outline-secondary previous-button"
              onClick={onPreviousClick}
              buttonProps={() => ({ style: { width: "13rem" } })}
            >
              <DinaMessage id="goToThePreviousStep" />
            </FormikButton>
          )}
          {/* <FormikButton
            className="btn btn-primary bulk-save-button"
            onClick={saveAll}
            buttonProps={() => ({ style: { width: "10rem" } })}
          >
            <DinaMessage id="saveAll" />
          </FormikButton> */}
        </ButtonBar>
      </DinaForm>
    </div>
  );
}
