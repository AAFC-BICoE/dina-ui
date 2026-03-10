import Link from "next/link";
import { useState } from "react";
import { FaTrash } from "react-icons/fa";
import { useFormikContext } from "formik";
import { KitsuResource, PersistedResource } from "kitsu";
import {
  ResourceSelectField,
  ResourceSelectFieldProps
} from "../../../../common-ui/lib/formik-connected/ResourceSelectField";
import { Tooltip } from "../../../../common-ui/lib";
import { useDinaIntl } from "../../../../dina-ui/intl/dina-ui-intl";

type Props<T extends KitsuResource> = Omit<
  ResourceSelectFieldProps<T>,
  "value" | "onChange"
> & {
  resourcePath?: string;
  selectName?: string;
  emptyMessage?: string;
  mode?: string;
};

export function MultiSiteSelect<T extends KitsuResource & { name: string }>({
  name,
  resourcePath,
  selectName = `${name}`,
  emptyMessage = "",
  mode,
  ...props
}: Props<T>) {
  const { formatMessage } = useDinaIntl();
  const { values, setFieldValue } = useFormikContext<Record<string, any>>();
  const selected: PersistedResource<T> = values[name];
  const [available, setAvailable] = useState<PersistedResource<T>[]>([]);
  const isDisabled = !available.length || selected !== undefined;

  function addItem(item?: PersistedResource<T>) {
    if (!item) return;

    if (selected) return;

    setFieldValue(name, item);
  }

  function removeItem() {
    setFieldValue(name, undefined);
  }

  function onDataLoaded(data) {
    setAvailable(data ?? []);
  }

  return (
    <div>
      {selected ? (
        <div className="mb-3">
          {resourcePath ? (
            <Link className="ms-1" href={resourcePath + selected.id}>
              {selected.name as string}
            </Link>
          ) : (
            <span>{selected.name as string}</span>
          )}
          {mode === "edit" && (
            <Tooltip
              directText={formatMessage("deleteButtonText")}
              placement="right"
              visibleElement={
                <button
                  type="button"
                  onClick={() => removeItem()}
                  className="bg-transparent border-0"
                >
                  <FaTrash color="#e2574c" />
                </button>
              }
              className="float-end"
            />
          )}
        </div>
      ) : (
        <div className="mb-3">{emptyMessage}</div>
      )}
      {mode === "edit" && (
        <ResourceSelectField<T>
          {...props}
          name={name}
          label={selectName}
          onChange={addItem}
          onDataLoaded={onDataLoaded}
          filterList={() => !selected}
          placeholder={formatMessage("typeToSearch")}
          isDisabled={isDisabled}
        />
      )}
    </div>
  );
}
