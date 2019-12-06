/* This function rename a json object's keys with new key */
export function renameJson(json, oldkey, newkey) {
  return Object.keys(json).reduce(
    (s, item) =>
      item === oldkey
        ? { ...s, [newkey]: json[oldkey] }
        : { ...s, [item]: json[item] },
    {}
  );
}

export function generateManagedAttributeValue(
  metaManagedAttributes,
  submittedValues
) {
  const acTags = new Set();
  for (const x in submittedValues) {
    if (/^key_/.test(x) && submittedValues["assignedValue" + x.substr(4)]) {
      const metaManagedAttribute = {
        attributes: {
          assignedValue: submittedValues["assignedValue" + x.substr(4)]
        },
        relationships: {
          managedAttribute: {
            data: submittedValues[x]
          },
          objectStoreMetadata: {
            data: {
              id: "variable",
              type: "metadata"
            }
          }
        },
        type: "metadata-managed-attribute"
      };
      metaManagedAttributes.push(metaManagedAttribute);
      delete submittedValues[x];
      delete submittedValues["assignedValue" + x.substr(4)];
    } else if (/^assignedValue_un/.test(x) && submittedValues[x]) {
      acTags.add(submittedValues[x]);
      delete submittedValues[x];
    }
  }
  if (acTags.size > 0) {
    submittedValues.acTags = acTags;
  }
}
