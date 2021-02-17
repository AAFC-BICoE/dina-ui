import {
  FieldWrapper,
  filterBy,
  NumberField,
  ResourceSelect,
  SelectField,
  TextField,
  useApiClient
} from "common-ui";
import { useFormikContext } from "formik";
import { get } from "lodash";
import { useEffect, useState } from "react";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ManagedAttribute, Metadata } from "../../../types/objectstore-api";
import { getManagedAttributesInUse } from "./getManagedAttributesInUse";

export interface ManagedAttributesEditorProps {
  /** Formik path to the ManagedAttributeMap field. */
  mapPath: string;
}

/** Set of fields inside a Formik form to edit Managed Attributes. */
export function ManagedAttributesEditor({
  mapPath
}: ManagedAttributesEditorProps) {
  const { values: formValues } = useFormikContext<Metadata>();
  const { bulkGet } = useApiClient();
  const { formatMessage } = useDinaIntl();

  const managedAttributeMap = get(formValues, mapPath);

  const [editableManagedAttributes, setEditableManagedAttributes] = useState<
    ManagedAttribute[]
  >([]);

  useEffect(() => {
    (async () => {
      const initialAttributes = await getManagedAttributesInUse(
        [managedAttributeMap],
        bulkGet
      );
      setEditableManagedAttributes(initialAttributes);
    })();
  }, []);

  return (
    <div className="form-group managed-attributes-editor">
      <h2>
        <DinaMessage id="metadataManagedAttributesLabel" />
      </h2>
      <div className="row">
        <div className="col-md-3 col-sm-4">
          <FieldWrapper
            name="editableManagedAttributes"
            label={formatMessage("field_editableManagedAttributes")}
          >
            <ResourceSelect<ManagedAttribute>
              filter={filterBy(["name"])}
              model="objectstore-api/managed-attribute"
              optionLabel={attribute => attribute.name}
              isMulti={true}
              onChange={ma =>
                setEditableManagedAttributes(ma as ManagedAttribute[])
              }
              value={editableManagedAttributes}
            />
          </FieldWrapper>
        </div>
        <div className="col-md-3 col-sm-4">
          <div className="alert alert-warning">
            <DinaMessage id="editableManagedAttributesRemoveInfo" />
          </div>
        </div>
      </div>
      <div className="row" style={{ minHeight: "25rem" }}>
        {editableManagedAttributes.map(attribute => {
          const props = {
            className: "col-md-3 col-sm-4",
            key: attribute.id,
            label: attribute.name,
            name: `${mapPath}.values.${attribute.id}.value`
          };

          if (attribute.managedAttributeType === "STRING") {
            if (attribute.acceptedValues) {
              return (
                <SelectField
                  {...props}
                  options={[
                    { label: `<${formatMessage("none")}>`, value: "" },
                    ...attribute.acceptedValues.map(value => ({
                      label: value,
                      value
                    }))
                  ]}
                />
              );
            }
            return (
              <TextField
                {...props}
                inputProps={{ type: "search" }} // Adds the 'X' clear button in the text input.
              />
            );
          } else if (attribute.managedAttributeType === "INTEGER") {
            return <NumberField {...props} />;
          } else {
            return null;
          }
        })}
      </div>
    </div>
  );
}
