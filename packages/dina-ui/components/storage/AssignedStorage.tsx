import {
  FormikButton,
  SelectField,
  SelectOption,
  TextField,
  useDinaFormContext,
  withResponse
} from "common-ui";
import { PersistedResource } from "kitsu";
import { Promisable } from "type-fest";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { useStorageUnit } from "../../pages/collection/storage-unit/edit";
import { StorageUnit } from "../../types/collection-api";
import { StorageUnitBreadCrumb } from "./StorageUnitBreadCrumb";
import { RiDeleteBinLine } from "react-icons/ri";
import AlphanumericEncoder from "alphanumeric-encoder";

export interface AssignedStorageProps {
  readOnly?: boolean;
  value?: PersistedResource<StorageUnit>;
  onChange?: (
    newValue: PersistedResource<StorageUnit> | { id: null }
  ) => Promisable<void>;
  noneMessage?: JSX.Element;
  parentIdInURL?: string;
}

/** Displays the currently assigned Storage, and lets you unlink it. */
export function AssignedStorage({
  onChange,
  readOnly,
  value,
  noneMessage,
  parentIdInURL
}: AssignedStorageProps) {
  const storageQuery = useStorageUnit(value?.id);
  const encoder = new AlphanumericEncoder();
  const { isTemplate, isBulkEditAllTab } = useDinaFormContext();
  return value?.id ? (
    <div>
      {withResponse(storageQuery, ({ data: storageUnit }) => {
        // Create storageUnitUsage Row options
        const options: SelectOption<string | null>[] = [];
        if (storageUnit.storageUnitType?.gridLayoutDefinition?.numberOfRows) {
          // Empty option
          options.push({
            label: "<None>",
            value: null
          });

          for (
            let i = 1;
            i <=
            storageUnit.storageUnitType?.gridLayoutDefinition?.numberOfRows;
            i++
          ) {
            options.push({
              label: encoder.encode(i) ?? "",
              value: encoder.encode(i) ?? ""
            });
          }
        }

        return (
          <div>
            <div className="list-inline mb-3">
              <div className="storage-path list-inline-item">
                <StorageUnitBreadCrumb
                  storageUnit={storageUnit}
                  newTab={!readOnly}
                />
              </div>
              {!readOnly && !parentIdInURL && (
                <FormikButton
                  className="remove-storage btn mb-3 list-inline-item"
                  onClick={async () => await onChange?.({ id: null })}
                >
                  <RiDeleteBinLine size="1.8em" />
                </FormikButton>
              )}
            </div>
            {!!storageUnit.storageUnitType?.gridLayoutDefinition &&
              !isBulkEditAllTab && (
                <div className="list-inline mb-3">
                  <SelectField
                    options={options}
                    name={"storageUnitUsage.wellRow"}
                    customName={"row"}
                    className="list-inline-item"
                    disableTemplateCheckbox={true}
                    disabled={isTemplate}
                  />
                  <TextField
                    name={"storageUnitUsage.wellColumn"}
                    customName="column"
                    className="list-inline-item"
                    disableTemplateCheckbox={true}
                    disabled={isTemplate}
                  />
                </div>
              )}
          </div>
        );
      })}
    </div>
  ) : (
    noneMessage ?? <DinaMessage id="none" />
  );
}
