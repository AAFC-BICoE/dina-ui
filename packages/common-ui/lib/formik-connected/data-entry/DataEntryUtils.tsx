/**
 * Process Extension Values from back-end into nested arrays for front-end
 */
export function processExtensionValuesLoading(initExtensionValues) {
  if (!initExtensionValues) {
    return undefined;
  }

  Object.keys(initExtensionValues).forEach((blockKey) => {
    initExtensionValues[blockKey]["rows"] = {};
    Object.keys(initExtensionValues[blockKey]).forEach((extensionKey) => {
      if (extensionKey !== "rows") {
        const extensionField = {
          type: extensionKey,
          value: initExtensionValues[blockKey][extensionKey]
        };
        initExtensionValues[blockKey]["rows"][extensionKey] = extensionField;
        delete initExtensionValues[blockKey][extensionKey];
      }
    });
    initExtensionValues[blockKey]["select"] = blockKey;
  });
}

/**
 * Process Extension Values from front-end into nested maps for back-end
 */
export function processExtensionValuesSaving(submittedValues: any) {
  const submittedExtensionValues: any[] | undefined =
    submittedValues.extensionValues;

  const processedExtensionValues = submittedExtensionValues?.reduce(
    (result, item) => {
      const extensionKey = item.select;
      const processedExtensionFields = {};
      item.rows?.forEach((extensionField) => {
        processedExtensionFields[extensionField.type] = extensionField.value;
      });
      result[extensionKey] = processedExtensionFields;
      return result;
    },
    {}
  );
  return processedExtensionValues;
}
