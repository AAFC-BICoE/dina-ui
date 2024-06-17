import { FaRegCheckCircle } from "react-icons/fa";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { useSessionStorage } from "usehooks-ts";
import { defaultJsonTree } from "common-ui/lib/list-page/query-builder/QueryBuilder";
import { JsonTree } from "react-awesome-query-builder";
import { createSessionStorageLastUsedTreeKey } from "common-ui/lib/list-page/saved-searches/SavedSearch";
import { useRouter } from "next/router";
import { writeStorage } from "@rehooks/local-storage";
import { useEffect } from "react";

interface WorkbookConfirmationProps {
  /** To display the number of records created to the user. */
  totalRecordsCreated: number;

  /** Used for generating the search query on the material sample list page. */
  sourceSetValue: string;

  /** Used for generating the search query group on the material sample list page. */
  groupUsed: string;

  /** Callback function to reset the workbook back to the upload page. */
  onWorkbookReset: (resetCompleted: boolean) => void;
}

export function WorkbookConfirmation({
  totalRecordsCreated,
  sourceSetValue,
  groupUsed,
  onWorkbookReset
}: WorkbookConfirmationProps) {
  const router = useRouter();
  const uniqueName = "material-sample-list";

  const [_, setSessionStorageQueryTree] = useSessionStorage<JsonTree>(
    createSessionStorageLastUsedTreeKey(uniqueName),
    defaultJsonTree
  );

  // Groups selected for the search.
  const GROUP_STORAGE_KEY = uniqueName + "_groupStorage";

  const onViewWorkbook = () => {
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

    // Reset the workbook at this point, so if the user comes back they see the upload page.
    onWorkbookReset(false);

    // Redirect to to material-sample list page.
    router.push("/collection/material-sample/list");
  };

  /** Handle if they leave without selecting an option, reset the uploader. */
  useEffect(() => {
    const handleWindowClose = () => {
      onWorkbookReset(false);
    };
    const handleBrowseAway = () => {
      onWorkbookReset(false);
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
            values={{ total: totalRecordsCreated }}
          />
        </span>
      </div>

      <div className="row d-flex gap-2 mt-4 mb-5 align-items-center justify-content-center">
        <button
          className="btn btn-secondary col-sm-3"
          onClick={() => onWorkbookReset(true)}
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
