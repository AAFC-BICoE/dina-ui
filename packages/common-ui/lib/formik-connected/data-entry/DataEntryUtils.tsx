/**
 * Process Extension Values from back-end into nested arrays for front-end
 */
export function processExtensionValuesLoading(initExtensionValues) {
  if (!initExtensionValues) {
    return undefined;
  }

  let processedExtensionValues = Object.keys(initExtensionValues).map(
    (extensionKey) => {
      const initExtensionValue = initExtensionValues[extensionKey];
      const extensionFields = Object.keys(initExtensionValue).map(
        (extensionFieldKey) => {
          return {
            type: extensionFieldKey,
            value: initExtensionValue[extensionFieldKey]
          };
        }
      );
      const processedExtensionValue = {
        select: extensionKey,
        rows: extensionFields
      };
      return processedExtensionValue;
    }
  );
  processedExtensionValues.forEach((extensionValue) => {
    extensionValue.rows.sort((a, b) => {
      return a.type.localeCompare(b.type);
    })
  })
  
  return processedExtensionValues;
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
