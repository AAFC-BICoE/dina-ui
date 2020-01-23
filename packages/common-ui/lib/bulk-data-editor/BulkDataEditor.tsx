import { FormikActions } from "formik";
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

export interface RowChange<TRow> {
  original: TRow;
  changes: RecursivePartial<TRow>;
}

export interface BulkDataEditorProps<TRow> {
  columns: GridSettings[];
  loadData: () => Promise<TRow[]>;
  onSubmit: (
    changes: Array<RowChange<TRow>>,
    formikValues: any,
    formikActions: FormikActions<any>
  ) => Promise<void>;
}

export function BulkDataEditor<TRow>({
  columns,
  loadData,
  onSubmit
}: BulkDataEditorProps<TRow>) {
  type TableData = TRow[];

  const [initialTableData, setInitialTableData] = useState<TableData>();
  const [workingTableData, setWorkingTableData] = useState<TableData>();

  // Load the data once after mount:
  useEffect(() => {
    (async () => {
      const loadedData = await loadData();
      setInitialTableData(loadedData);
      setWorkingTableData(cloneDeep(loadedData));
    })();
  }, []);

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
      <ErrorViewer />
      <DynamicHotTable
        columns={columns}
        data={workingTableData as any}
        manualColumnResize={true}
      />
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
    return HotTable;
  },
  { ssr: false }
);
