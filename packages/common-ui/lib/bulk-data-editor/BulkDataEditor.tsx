import { FormikActions } from "formik";
import { GridSettings } from "handsontable";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { FormikButton } from "../formik-connected/FormikButton";
import { CommonMessage } from "../intl/common-ui-intl";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";

export interface BulkDataEditorProps<TRow> {
  columns: GridSettings[];
  loadData: () => Promise<TRow[]>;
  onSubmit: (
    data: TRow[],
    formikValues: any,
    formikActions: FormikActions<any>
  ) => Promise<void>;
}

export const BulkDataEditor = dynamic(
  async () => {
    // Handsontable must only be loaded in the browser, because it depends on the global
    // navigator object to be available.
    const { HotTable } = await import("@handsontable/react");

    return function BulkDataEditorComponent<TRow>({
      columns,
      loadData,
      onSubmit
    }: BulkDataEditorProps<TRow>) {
      const [tableData, setTableData] = useState<TRow[]>();

      // Load the data once after mount:
      useEffect(() => {
        (async () => {
          const loadedData = await loadData();
          setTableData(loadedData);
        })();
      }, []);

      if (!tableData) {
        return <LoadingSpinner loading={true} />;
      }

      return (
        <>
          <HotTable
            columns={columns}
            data={tableData as any}
            manualColumnResize={true}
          />
          <FormikButton
            className="btn btn-primary"
            onClick={(formikValues, formikActions) =>
              onSubmit(tableData, formikValues, formikActions)
            }
          >
            <CommonMessage id="submitBtnText" />
          </FormikButton>
        </>
      );
    };
  },
  { ssr: false }
);
