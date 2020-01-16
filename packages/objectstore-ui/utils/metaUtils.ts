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
/* Generetae managed attribute map data*/
export function generateManagedAttributesMap(submittedValues, origiValues) {
  const values = {};
  const deletedMAs = new Array();
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
      if (
        foundMatch &&
        submittedValues["assignedValue" + x.substr(4)] === null
      ) {
        foundMatch = false;
        deletedMAs.push(x);
      } else {
        deletedMAs.push(x);
      }
    }
  }
  // add new or modified ma to the values
  for (const y in submittedValues) {
    if (/^key_/.test(y)) {
      values[submittedValues[y].id] = {
        value: submittedValues["assignedValue" + y.substr(4)]
      };
    }
  }
  // add deleted ma to the values
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
  metainitialValues
) {
  const managedAttributes = metainitialValues?.managedAttributes;
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

      // set the metamanaged attribute id if there is one based on the
      // initial value retrieved for this metatdata
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
    } else if (/^assignedValue_un/.test(x)) {
      // either this is create new metadata or edit existing metadata
      if (
        !metainitialValues ||
        (metainitialValues[x] && metainitialValues[x] !== "null") ||
        (metainitialValues && !metainitialValues[x])
      ) {
        acTags.add(submittedValues[x]);
      }
      delete submittedValues[x];
    } else if (submittedValues["assignedValue" + x.substr(4)]) {
      delete submittedValues["assignedValue" + x.substr(4)];
    }
  }
  if (acTags.size > 0) {
    submittedValues.acTags = acTags;
  }
}
