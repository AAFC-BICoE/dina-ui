import { FormikButton, SelectField, TextField, withResponse } from "common-ui";
import { PersistedResource } from "kitsu";
import { Promisable } from "type-fest";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { useStorageUnit } from "../../pages/collection/storage-unit/edit";
import { StorageUnit } from "../../types/collection-api";
import { StorageUnitBreadCrumb } from "./StorageUnitBreadCrumb";
import { RiDeleteBinLine } from "react-icons/ri";

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

  return value?.id ? (
    <div>
      {withResponse(storageQuery, ({ data: storageUnit }) => {
        // function genCharArray(charA, charZ) {
        //   const a: string[] = [];
        //   let i = charA.charCodeAt(0);
        //   let j = charZ.charCodeAt(0);
        //   for (; i <= j; ++i) {
        //     a.push(String.fromCharCode(i));
        //   }
        //   return a;
        // }
        // const options = genCharArray("A", "Z").map((char) => ({ label: char }));
        return (
          <div>
            <div className="list-inline mb-3">
              <div className="storage-path list-inline-item">
                <StorageUnitBreadCrumb
                  storageUnit={storageUnit}
                  newTab={!readOnly}
                />
              </div>
              {storageUnit.storageUnitType?.isInseperable && (
                <div className="list-inline-item">
                  (<DinaMessage id="keepContentsTogether" />)
                </div>
              )}
              {!readOnly && !parentIdInURL && (
                <FormikButton
                  className="remove-storage btn mb-3 list-inline-item"
                  onClick={async () => await onChange?.({ id: null })}
                >
                  <RiDeleteBinLine size="1.8em" />
                </FormikButton>
              )}
            </div>
            {!!storageUnit.storageUnitType?.gridLayoutDefinition && (
              <div className="list-inline mb-3">
                <SelectField
                  options={undefined}
                  name={"wellRow"}
                  customName={"row"}
                  className="list-inline-item"
                />
                <TextField
                  name={"wellColumn"}
                  customName="column"
                  className="list-inline-item"
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
