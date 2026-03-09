import Link from "next/link";
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
  resourceLink?: string;
  selectName?: string;
  emptyMessage?: string;
  mode?: string;
};

export function MultiSiteSelect<T extends KitsuResource & { name: string }>({
  name,
  resourceLink,
  selectName = `${name}`,
  emptyMessage = "",
  mode,
  ...props
}: Props<T>) {
  const { formatMessage } = useDinaIntl();
  const { values, setFieldValue } = useFormikContext<Record<string, any>>();
  const selected: PersistedResource<T>[] = values[name] ?? [];

  function addItem(item?: PersistedResource<T>) {
    if (!item) return;

    if (selected.some((s) => s.id === item.id)) {
      setFieldValue(
        name,
        selected.filter((s) => s.id !== item.id)
      );
    } else {
      setFieldValue(name, [...selected, item]);
    }
  }

  function removeItem(id: string) {
    setFieldValue(
      name,
      selected.filter((s) => s.id !== id)
    );
  }

  return (
    <div>
      <table className="ReactTable table table-striped">
        <tbody className="border-top-0 border-bottom-0">
          {selected.length ? (
            selected.map((item, index) => (
              <tr key={item.id} className={index % 2 ? "-even" : "-odd"}>
                <td style={{ width: "90%" }}>
                  {resourceLink ? (
                    <Link className="ms-1" href={resourceLink + item.id}>
                      {item.name as string}
                    </Link>
                  ) : (
                    <span>{item.name as string}</span>
                  )}
                </td>
                {mode === "edit" && (
                  <td className="text-center">
                    <Tooltip
                      directText={formatMessage("deleteButtonText")}
                      placement="right"
                      visibleElement={
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="bg-transparent border-0"
                        >
                          <FaTrash color="#e2574c" />
                        </button>
                      }
                    ></Tooltip>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td>
                <div className="ms-1">{emptyMessage}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <style jsx>
        {`
          .ReactTable tbody tr:last-child td {
            border-bottom: 0;
          }
          .ReactTable td {
            vertical-align: middle;
            padding-left: 5px;
          }
        `}
      </style>

      {mode === "edit" && (
        <ResourceSelectField<T>
          {...props}
          name={selectName}
          onChange={addItem}
          filterList={(item) => !selected.some((s) => s.id === item?.id)}
          placeholder={formatMessage("typeToSearch")}
        />
      )}
    </div>
  );
}
