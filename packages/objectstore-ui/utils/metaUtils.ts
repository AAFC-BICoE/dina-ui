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
  submittedValues,
  managedAttributes
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
              id: submittedValues.id ? submittedValues.id : "variable",
              type: "metadata"
            }
          }
        },
        type: "metadata-managed-attribute"
      };

      /* tslint:disable:no-string-literal */
      if (managedAttributes) {
        managedAttributes.map(ma => {
          if (
            ma["ma_data"] &&
            ma["ma_data"]["id"] ===
              metaManagedAttribute["relationships"]["managedAttribute"]["data"][
                "id"
              ]
          ) {
            if (ma["metama_data"]["data"]["id"]) {
              metaManagedAttribute["id"] = ma["metama_data"]["data"]["id"];
            }
          }
        });
      }
      /* tslint:enable:no-string-literal */
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
