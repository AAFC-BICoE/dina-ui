import { FaRegCheckCircle } from "react-icons/fa";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { useSessionStorage } from "usehooks-ts";
import { defaultJsonTree } from "common-ui/lib/list-page/query-builder/QueryBuilder";
import { JsonTree } from "@react-awesome-query-builder/ui";
import { createSessionStorageLastUsedTreeKey } from "common-ui/lib/list-page/saved-searches/SavedSearch";
import { useRouter } from "next/router";
import { writeStorage } from "@rehooks/local-storage";
import { useEffect } from "react";
import { getGroupStorageKey, Tooltip } from "common-ui";

interface WorkbookConfirmationProps {
  /** The total number of resources in the workbook. */
  totalWorkbookResourcesCount: number;

  /** Used for generating the search query on the material sample list page. */
  sourceSetValue: string;

  /** Used for generating the search query group on the material sample list page. */
  groupUsed: string;

  /** Callback function to reset the workbook back to the upload page. */
  onWorkbookReset: () => void;

  /** When this callback is triggered, it will prevent the workbook uploader from updating the state. */
  preventRendering: () => void;

  /** The number of resources updated due to already existing and user chose appendData. */
  resourcesUpdatedCount?: number;
}

export function WorkbookConfirmation({
  totalWorkbookResourcesCount,
  sourceSetValue,
  groupUsed,
  onWorkbookReset,
  preventRendering,
  resourcesUpdatedCount
}: WorkbookConfirmationProps) {
  const router = useRouter();
  const uniqueName = "material-sample-list";

  const [_, setSessionStorageQueryTree] = useSessionStorage<JsonTree>(
    createSessionStorageLastUsedTreeKey(uniqueName),
    defaultJsonTree
  );

  // Groups selected for the search.
  const GROUP_STORAGE_KEY = getGroupStorageKey(uniqueName);

  const onViewWorkbook = () => {
    // Stop rendering this page since we will be redirecting and don't need to see updates anymore.
    preventRendering();

    // Set the query to be displayed on the material sample list page.
    const groupId = "71024654-0076-403c-b331-8b805c970760";
    const ruleId = "cabda278-e560-475c-8f36-58438308a10d";
    const sourceSetQuery = {
      id: groupId,
      type: "group",
      children1: [
        {
          id: ruleId,
          type: "rule",
          properties: {
            field: "data.attributes.sourceSet",
            operator: "exactMatch",
            value: [sourceSetValue],
            valueSrc: ["value"],
            valueError: [],
            valueType: ["text"]
          }
        }
      ],
      properties: { conjunction: "AND" }
    } as JsonTree;
    setSessionStorageQueryTree(sourceSetQuery);
    writeStorage(GROUP_STORAGE_KEY, [groupUsed]);

    // Redirect to to material-sample list page.
    router.push("/collection/material-sample/list");
  };

  /** Handle if they leave without selecting an option, reset the uploader. */
  useEffect(() => {
    const handleWindowClose = () => {
      onWorkbookReset();
    };
    const handleBrowseAway = () => {
      onWorkbookReset();
    };

    window.addEventListener("beforeunload", handleWindowClose);
    router.events.on("routeChangeStart", handleBrowseAway);
    return () => {
      window.removeEventListener("beforeunload", handleWindowClose);
      router.events.off("routeChangeStart", handleBrowseAway);
    };
  }, []);

  return (
    <>
      <style>{`
        .check-icon {
          font-size: 4em;
          color: #33B17C;
        }
      `}</style>

      <div className="align-items-center justify-content-center d-flex flex-column">
        <span className="check-icon">
          <FaRegCheckCircle />
        </span>
        <h2 className="mt-2">
          <DinaMessage id="workbook_confirmation_title" />
        </h2>
        <span>
          <DinaMessage
            id="workbook_confirmation_total"
            values={{
              total: totalWorkbookResourcesCount - (resourcesUpdatedCount ?? 0)
            }}
          />
        </span>
        <span>
          <DinaMessage
            id="workbook_updated_total"
            values={{
              total: resourcesUpdatedCount
            }}
          />
        </span>
        <span className="mt-2">
          <strong>
            <DinaMessage id="field_sourceSet" />
            {": "}
          </strong>
          <span>{sourceSetValue}</span>
          <Tooltip
            id="sourceSet_workbook_tooltip"
            placement="right"
            className="no-select ms-1"
          />
        </span>
      </div>

      <div className="row d-flex gap-2 mt-4 mb-5 align-items-center justify-content-center">
        <button
          className="btn btn-secondary col-sm-3"
          onClick={() => onWorkbookReset()}
        >
          <DinaMessage id="workbook_confirmation_new" />
        </button>

        <button className="btn btn-primary col-sm-3" onClick={onViewWorkbook}>
          <DinaMessage id="workbook_confirmation_view" />
        </button>
      </div>
    </>
  );
}
