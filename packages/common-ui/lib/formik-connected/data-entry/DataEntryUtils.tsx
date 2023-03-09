/**
 * Process Extension Values from back-end into nested arrays for front-end
 */
export function processExtensionValuesLoading(initExtensionValues) {
  if (!initExtensionValues) {
    return undefined;
  }
  const processedExtensionValues = {};
  Object.keys(initExtensionValues).forEach((blockKey) => {
    processedExtensionValues[blockKey] = {};
    processedExtensionValues[blockKey].rows = {};
    Object.keys(initExtensionValues[blockKey]).forEach((extensionKey) => {
      if (extensionKey !== "rows") {
        const extensionField = {
          type: extensionKey,
          value: initExtensionValues[blockKey][extensionKey]
        };
        processedExtensionValues[blockKey].rows[extensionKey] = extensionField;
      }
    });
    processedExtensionValues[blockKey].select = blockKey;
  });
  return processedExtensionValues;
}

/**
 * Process Extension Values from front-end into nested maps for back-end
 */
export function processExtensionValuesSaving(submittedExtensionValues: any) {
  const processedExtensionValues = {};
  Object.keys(submittedExtensionValues).forEach((dataBlockKey) => {
    const fieldKey = submittedExtensionValues[dataBlockKey]?.select;
    const extensionFieldsRows = submittedExtensionValues[dataBlockKey]?.rows;
    if (!processedExtensionValues[fieldKey]) {
      processedExtensionValues[fieldKey] = {};
    }

    Object.keys(extensionFieldsRows).forEach((rowKey) => {
      const type = extensionFieldsRows[rowKey]?.type;
      const value = extensionFieldsRows[rowKey]?.value;
      processedExtensionValues[fieldKey] = {
        ...processedExtensionValues[fieldKey],
        [type]: value
      };
    });
  });
  return processedExtensionValues;
}
