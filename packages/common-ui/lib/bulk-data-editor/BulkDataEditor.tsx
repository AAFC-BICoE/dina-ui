import { HotTableProps } from "@handsontable/react";
import { FormikContextType, useFormikContext } from "formik";
import { GridSettings } from "handsontable";
import { cloneDeep, isEmpty, zipWith } from "lodash";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ErrorViewer } from "../formik-connected/ErrorViewer";
import { FormikButton } from "../formik-connected/FormikButton";
import { OnFormikSubmit } from "../formik-connected/safeSubmit";
import { CommonMessage } from "../intl/common-ui-intl";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import { difference, RecursivePartial } from "./difference";
import { getUserFriendlyAutoCompleteRenderer } from "./resource-select-cell";
import { safeSubmit } from "../formik-connected/safeSubmit";

export interface RowChange<TRow> {
  original: TRow;
  changes: RecursivePartial<TRow>;
}

export interface BulkDataEditorProps<TRow> {
  columns: GridSettings[];
  loadData: () => Promise<TRow[]>;
  onSubmit: (
    changes: RowChange<TRow>[],
    formikValues: any,
    formikActions: FormikContextType<any>
  ) => Promise<void>;
}

export function BulkDataEditor<TRow>({
  columns,
  loadData,
  onSubmit
}: BulkDataEditorProps<TRow>) {
  type TableData = TRow[];

  const formik = useFormikContext();

  const [initialTableData, setInitialTableData] = useState<TableData>();
  const [workingTableData, setWorkingTableData] = useState<TableData>();

  // Loads the initial data and shows an error message on fail:
  const loadDataInternal = safeSubmit(async () => {
    const loadedData = await loadData();
    setInitialTableData(loadedData);
    setWorkingTableData(cloneDeep(loadedData));
  });

  // Load the data once after mount:
  useEffect(() => {
    loadDataInternal({}, formik);
  }, []);

  // Show initial data loading errors here:
  const loadingFailed =
    (!workingTableData || !initialTableData) && formik.status;
  if (loadingFailed) {
    return <ErrorViewer />;
  }

  // Show loading state here:
  if (!workingTableData || !initialTableData) {
    return <LoadingSpinner loading={true} />;
  }

  const onSubmitInternal: OnFormikSubmit = async (
    formikValues,
    formikActions
  ) => {
    const diffs = zipWith<TRow, TRow, RowChange<TRow>>(
      workingTableData,
      initialTableData,
      (edited, original) => ({
        changes: difference(edited, original),
        original
      })
    );

    const editedDiffs = diffs.filter(diff => !isEmpty(diff.changes));

    await onSubmit(editedDiffs, formikValues, formikActions);
  };

  return (
    <>
      <style>{`
        /* Prevent the handsontable header from covering the Dropdown menu options: */
        .ht_clone_top {
          z-index: 0 !important;
        }  
      `}</style>
      <ErrorViewer />
      <div className="form-group">
        <DynamicHotTable
          columns={columns}
          data={workingTableData as any}
          manualColumnResize={true}
          maxRows={workingTableData.length}
        />
      </div>
      <FormikButton
        className="btn btn-primary bulk-editor-submit-button"
        onClick={onSubmitInternal}
      >
        <CommonMessage id="submitBtnText" />
      </FormikButton>
    </>
  );
}

const DynamicHotTable = dynamic(
  async () => {
    // Handsontable must only be loaded in the browser, because it depends on the global
    // navigator object to be available.
    const { HotTable } = await import("@handsontable/react");
    const { renderers } = await import("handsontable");

    const readableAutocompleteRenderer = getUserFriendlyAutoCompleteRenderer(
      renderers.AutocompleteRenderer
    );

    return (props: HotTableProps) => {
      // Hide the {type}/{UUID} identifier from the dropdown cell values:
      (props.columns as GridSettings[])
        .filter(col => col.type === "dropdown")
        .forEach(col => (col.renderer = readableAutocompleteRenderer));

      return <HotTable {...props} />;
    };
  },
  { ssr: false }
);
