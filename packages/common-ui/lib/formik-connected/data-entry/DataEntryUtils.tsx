/**
 * Process Extension Values from back-end into nested arrays for front-end (formik) to use
 * 
 * @param {Object} initExtensionValues - The initial extension values loaded from the back-end.
 * @returns {Object|undefined} The processed extension values for front-end use, or undefined if input is not provided.
 */
export function processExtensionValuesLoading(initExtensionValues) {
  // If not loaded from the API leave it undefined.
  if (!initExtensionValues) {
    return undefined;
  }

  // Recursive function to check for the presence of .select property.
  function hasSelectProperty(obj) {
    if (typeof obj === 'object') {
      if (obj.hasOwnProperty('select')) {
        return true;
      }
      for (const key in obj) {
        if (hasSelectProperty(obj[key])) {
          return true;
        }
      }
    }
    return false;
  }

  // Check if initExtensionValues or any nested objects contain a '.select' property.
  if (hasSelectProperty(initExtensionValues)) {
    return initExtensionValues;
  }

  // Initialize an object to store the processed extension values.
  const processedExtensionValues = {};

  // Iterate through the keys of initExtensionValues (data blocks).
  Object.keys(initExtensionValues).forEach((blockKey) => {
    // Create a nested object for each data block.
    processedExtensionValues[blockKey] = {};
    processedExtensionValues[blockKey].rows = {};

    // Iterate through the keys of the data block (extension fields).
    Object.keys(initExtensionValues[blockKey]).forEach((extensionKey) => {

      // Check if the key is not "rows" (a special case).
      if (extensionKey !== "rows") {

        // Create an extension field object with 'type' and 'value'.
        const extensionField = {
          type: extensionKey,
          value: initExtensionValues[blockKey][extensionKey]
        };

        // Store the extension field in the 'rows' property.
        processedExtensionValues[blockKey].rows[extensionKey] = extensionField;
      }
    });

    // Set the 'select' property in the processed data to match the blockKey.
    processedExtensionValues[blockKey].select = blockKey;
  });

  // Return the processed extension values for front-end use.
  return processedExtensionValues;
}

/**
 * Process extension values and store the processed data in the input object.
 * 
 * This will convert the formik extension values into a format for the API to understand.
 * 
 * @param {Object} submittedExtensionValues - The input data to process and store.
 * @returns {Object} The processed extension values.
 */
export function processExtensionValuesSaving(submittedExtensionValues: any) {
  // Create an empty object to store the processed data.
  const processedExtensionValues = {};

  // Loop through the keys of the submittedExtensionValues object.
  Object.keys(submittedExtensionValues).forEach((dataBlockKey) => {
    // Extract the 'select' and 'rows' properties from the current dataBlock.
    const fieldKey = submittedExtensionValues[dataBlockKey]?.select;
    const extensionFieldsRows = submittedExtensionValues[dataBlockKey]?.rows;

    // If the processedExtensionValues object doesn't have a property with the fieldKey,
    // create an empty object for it.
    if (!processedExtensionValues[fieldKey]) {
      processedExtensionValues[fieldKey] = {};
    }

    // Loop through the keys of the extensionFieldsRows object.
    Object.keys(extensionFieldsRows).forEach((rowKey) => {
      // Extract the 'type' and 'value' properties from the current row.
      const type = extensionFieldsRows[rowKey]?.type;
      const value = extensionFieldsRows[rowKey]?.value;

      // Add a new property to the processedExtensionValues object, under the fieldKey,
      // where the property name is the 'type' and the value is the 'value'.
      processedExtensionValues[fieldKey] = {
        ...processedExtensionValues[fieldKey],
        [type]: value
      };
    });
  });

  // Return the processedExtensionValues object with the rearranged data.
  return processedExtensionValues;
}
