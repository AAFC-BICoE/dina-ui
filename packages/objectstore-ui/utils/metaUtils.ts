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
/* Delete managed attribute */
export function deleteManagedAttribute(submittedValues, origiValues) {
  const deletedMAs = new Array();
  const updatedMAs = new Array();
  let foundMatch = false;
  for (const x in origiValues) {
    if (/^key_/.test(x) && origiValues["assignedValue" + x.substr(4)]) {
      for (const y in submittedValues) {
        if (/^key_/.test(y)) {
          if (y === x) {
            foundMatch = true;
            break;
          }
        }
      }
      if (foundMatch) {
        foundMatch = false;
      } else {
        deletedMAs.push(x);
      }
    }
  }
  const values = {};
  for (const y in submittedValues) {
    if (/^key_/.test(y)) {
      values[submittedValues[y].id] = {
        value: submittedValues["assignedValue" + y.substr(4)]
      };
    }
  }
  deletedMAs.map(ma => (values[origiValues[ma].id] = { value: null }));

  const dataToSubmit = {
    data: {
      attributes: {
        values
      },
      relationships: {
        metadata: {
          data: {
            id: submittedValues.id,
            type: "metadata"
          }
        }
      },
      type: "managed-attribute-map"
    }
  };
  return dataToSubmit;
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
