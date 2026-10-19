import { useFormikContext } from "formik";
import { KitsuResource } from "kitsu";
import useVocabularyOptions from "@dina-ui/components/collection/useVocabularyOptions";
import { ProtocolElement } from "@dina-ui/types/collection-api";
import { FieldExtension } from "@dina-ui/types/collection-api/resources/FieldExtension";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import {
  BulkEditTabContextI,
  FieldSet,
  LoadingSpinner,
  SelectOption,
  useApiClient,
  useBulkEditTabContext,
  useQuery
} from "../..";
import { DinaMessage, useDinaIntl } from "@dina-ui/intl/dina-ui-intl";
import { DataBlock } from "./DataBlock";
import { DataEntryFieldProps } from "./DataEntryField";

export interface DataEntryProps extends DataEntryFieldProps {}

export function DataEntry({
  legend,
  name,
  readOnly,
  id,
  className,
  blockAddable = false,
  unitsAddable = false,
  typesAddable = false,
  isVocabularyBasedEnabledForBlock = false,
  isVocabularyBasedEnabledForType = false,
  blockOptionsEndpoint,
  blockOptionsFilter,
  unitOptionsEndpoint,
  typeOptionsEndpoint,
  disableClearButton = false
}: DataEntryProps) {
  const { apiClient } = useApiClient();
  const { locale } = useDinaIntl();
  const formik = useFormikContext<any>();
  const bulkContext = useBulkEditTabContext();
  let extensionValues =
    formik?.values?.[name] ?? getBulkContextExtensionValues(bulkContext, name);

  const vocabOptions = useVocabularyOptions({
    path: blockOptionsEndpoint
  });

  const fieldExtensionQuery = useQuery<FieldExtension[]>({
    path: blockOptionsEndpoint,
    filter: blockOptionsFilter
  });

  // Read-only uses the same extension definitions as edit mode for its labels and tooltips.
  const blockOptionsQuery: any = isVocabularyBasedEnabledForBlock
    ? vocabOptions
    : fieldExtensionQuery;

  function getBlockOptions() {
    if (isVocabularyBasedEnabledForBlock) {
      return blockOptionsQuery?.vocabOptions;
    }
    return blockOptionsQuery?.response?.data.map((data) => ({
      label: data.extension.name,
      value: data.extension.key,
      fields: data.extension.fields
    }));
  }
  const blockOptions = getBlockOptions();
  const [queriedTypeOptions, setQueriedTypeOptions] = useState<
    SelectOption<string>[]
  >([]);

  useEffect(() => {
    async function fetchAllProtocolElements() {
      if (typeOptionsEndpoint) {
        const { data } = await apiClient.get<ProtocolElement[]>(
          typeOptionsEndpoint,
          {}
        );
        const options = data.map((rec) => ({
          label:
            rec.multilingualTitle?.titles?.find((item) => item.lang === locale)
              ?.title || "",
          value: rec.id
        }));
        setQueriedTypeOptions(options);
      }
    }

    fetchAllProtocolElements();
  }, []);

  const vocabQuery = useVocabularyOptions({
    path: unitOptionsEndpoint
  });

  // If user changes field extensions in Bulk Edit, write Bulk Edit values to Formik form once
  const [bulkExtensionValuesOverride, setBulkExtensionValuesOverride] =
    useState<boolean>(false);
  if (formik?.values?.[name] && bulkContext && !bulkExtensionValuesOverride) {
    setBulkExtensionValuesOverride(true);
    formik.values[name] = getBulkContextExtensionValues(bulkContext, name);
    extensionValues = formik.values[name];
  }

  function removeBlock(blockPath: string) {
    const blockName = blockPath.split(".").at(-1);
    if (blockName) {
      const { [blockName]: _, ...newExtensionValues } = formik?.values?.[name];
      formik.setFieldValue(name, newExtensionValues);
    }
  }

  function addBlock() {
    let newExtensionValues = {};

    const selectedBlockOptions = formik?.values?.[name]
      ? Object.keys(formik?.values?.[name]).map(
          (blockKey) => formik?.values?.[name][blockKey].select
        )
      : [];

    const newBlockOption = blockOptions?.find(
      (blockOption) => !selectedBlockOptions?.includes(blockOption.value)
    );
    if (newBlockOption) {
      newExtensionValues = {
        ...formik?.values?.[name],
        [newBlockOption.value]: !blockAddable
          ? {
              select: newBlockOption.value,
              rows: { "extensionField-0": "" }
            }
          : {
              select: newBlockOption.value,
              rows: { "extensionField-0": "" },
              vocabularyBased: true
            }
      };
    } else {
      newExtensionValues = {
        ...formik?.values?.[name],
        [`extension-${Object.keys(extensionValues)}`]: !blockAddable
          ? {
              select: "",
              rows: { "extensionField-0": "" }
            }
          : {
              select: "",
              rows: { "extensionField-0": "" },
              vocabularyBased: true
            }
      };
    }

    formik.setFieldValue(name, newExtensionValues);
  }

  function legendWrapper():
    | ((legendElement: React.JSX.Element) => React.JSX.Element)
    | undefined {
    return (legendElement) => {
      return (
        <div className="d-flex align-items-center justify-content-between legend-with-actions">
          {legendElement}
          {!readOnly && (
            <Button onClick={() => addBlock()} className="add-datablock">
              <FaPlus className="me-2" />
              <DinaMessage id="addExtension" />
            </Button>
          )}
        </div>
      );
    };
  }
  if (blockOptionsQuery?.loading) {
    return <LoadingSpinner loading={true} />;
  }
  return (
    <FieldSet
      legend={legend}
      wrapLegend={legendWrapper()}
      id={id}
      className={className}
    >
      {
        <div className="d-flex flex-column gap-3">
          {extensionValues
            ? Object.keys(extensionValues).map((blockKey) => {
                return (
                  <DataBlock
                    key={blockKey}
                    removeBlock={removeBlock}
                    name={`${name}.${blockKey}`}
                    blockKey={blockKey}
                    readOnly={readOnly}
                    blockAddable={blockAddable}
                    unitsAddable={unitsAddable}
                    typesAddable={typesAddable}
                    isVocabularyBasedEnabledForBlock={
                      isVocabularyBasedEnabledForBlock
                    }
                    isVocabularyBasedEnabledForType={
                      isVocabularyBasedEnabledForType
                    }
                    extensionValues={extensionValues}
                    blockOptions={blockOptions}
                    unitsOptions={vocabQuery?.vocabOptions}
                    typeOptions={
                      typeOptionsEndpoint ? queriedTypeOptions : undefined
                    }
                    disableClearButton={disableClearButton}
                  />
                );
              })
            : null}
        </div>
      }
    </FieldSet>
  );
}

/**
 * Gets extensionValues from individual Material Samples to be displayed in bulk edit tab
 * @param bulkContext
 * @returns extensionValues taken from individual Material Samples used for displaying in bulk edit tab
 */
function getBulkContextExtensionValues(
  bulkContext: BulkEditTabContextI<KitsuResource> | null,
  name
): any {
  const extensionValues = {};
  bulkContext?.resourceHooks?.forEach((resourceHook: any) => {
    if (!!resourceHook.resource[name]) {
      Object.keys(resourceHook.resource[name]).forEach((fieldKey) => {
        if (extensionValues[fieldKey]) {
          Object.keys(resourceHook?.resource?.[name][fieldKey].rows).forEach(
            (extensionKey) => {
              extensionValues[fieldKey].rows[extensionKey] = undefined;
            }
          );
        } else {
          extensionValues[fieldKey] = resourceHook.resource?.[name][fieldKey];
          Object.keys(resourceHook?.resource?.[name][fieldKey].rows).forEach(
            (extensionKey) => {
              extensionValues[fieldKey].rows[extensionKey] = undefined;
            }
          );
        }
      });
    }
  });
  return extensionValues;
}
