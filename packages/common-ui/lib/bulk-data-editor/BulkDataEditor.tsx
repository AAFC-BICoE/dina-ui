import { FormikActions } from "formik";
import { GridSettings } from "handsontable";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import { cloneDeep, isEmpty, zipWith } from "lodash";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { FormikButton } from "../formik-connected/FormikButton";
import { OnFormikSubmit, safeSubmit } from "../formik-connected/safeSubmit";
import { CommonMessage } from "../intl/common-ui-intl";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import { difference, RecursivePartial } from "./difference";

export interface BulkEditRow<TRow> {
  /** Resource Type+ID identifier for this row. */
  identifier: ResourceIdentifierObject;
  /** The editable data in this row. */
  data: TRow;
}

export type RowChange<TRow> = BulkEditRow<RecursivePartial<TRow>>;

export interface BulkDataEditorProps<TRow> {
  columns: GridSettings[];
  loadData: () => Promise<Array<BulkEditRow<TRow>>>;
  onSubmit: (
    changes: Array<RowChange<TRow>>,
    formikValues: any,
    formikActions: FormikActions<any>
  ) => Promise<void>;
}

// Wrap the component to re-enable the generic params lost by wrapping with next.js' dynamic(...) function.
export function BulkDataEditor<TRow>(props: BulkDataEditorProps<TRow>) {
  return <BulkDataEditorInternal {...props} />;
}

export const BulkDataEditorInternal = dynamic(
  async () => {
    // Handsontable must only be loaded in the browser, because it depends on the global
    // navigator object to be available.
    const { HotTable } = await import("@handsontable/react");

    return function BulkDataEditorComponent<TRow>({
      columns,
      loadData,
      onSubmit
    }: BulkDataEditorProps<TRow>) {
      type TableData = Array<BulkEditRow<TRow>>;

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

      const editableData = workingTableData.map(row => row.data);

      const onSubmitInternal: OnFormikSubmit = async (
        formikValues,
        formikActions
      ) => {
        const diffs = zipWith<
          BulkEditRow<TRow>,
          BulkEditRow<TRow>,
          RowChange<TRow>
        >(workingTableData, initialTableData, (edited, original) => ({
          data: difference(edited.data, original.data),
          identifier: original.identifier
        }));

        const editedDiffs = diffs.filter(diff => !isEmpty(diff.data));

        await onSubmit(editedDiffs, formikValues, formikActions);
      };

      return (
        <>
          <HotTable
            columns={columns}
            data={editableData as any}
            manualColumnResize={true}
          />
          <FormikButton className="btn btn-primary" onClick={onSubmitInternal}>
            <CommonMessage id="submitBtnText" />
          </FormikButton>
        </>
      );
    };
  },
  { ssr: false }
);
