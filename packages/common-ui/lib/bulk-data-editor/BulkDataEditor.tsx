import { HotTableProps } from "@handsontable/react";
import { FormikContextType, useFormikContext } from "formik";
import { GridSettings } from "handsontable";
import { cloneDeep, isEmpty, isEqual, zipWith } from "lodash";
import dynamic from "next/dynamic";
import { Component, useEffect, useState } from "react";
import { ErrorViewer } from "../formik-connected/ErrorViewer";
import { FormikButton } from "../formik-connected/FormikButton";
import { OnFormikSubmit, safeSubmit } from "../formik-connected/safeSubmit";
import { CommonMessage } from "../intl/common-ui-intl";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import { difference, RecursivePartial } from "./difference";
import { getUserFriendlyAutoCompleteRenderer } from "./resource-select-cell";
import { useBulkEditorFrontEndValidation } from "./useBulkEditorFrontEndValidation";
import { useHeaderWidthFix } from "./useHeaderWidthFix";

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

  /**
   * Submit unchanged rows, e.g. when inserting new data instead of editing existing data.
   * Default false.
   */
  submitUnchangedRows?: boolean;
}

export function BulkDataEditor<TRow>({
  columns,
  loadData,
  onSubmit,
  submitUnchangedRows = false
}: BulkDataEditorProps<TRow>) {
  type TableData = TRow[];

  const formik = useFormikContext();

  const [initialTableData, setInitialTableData] = useState<TableData>();
  const [workingTableData, setWorkingTableData] = useState<TableData>();

  const [loading, setLoading] = useState(true);
  const [lastSave, setLastSave] = useState(Date.now());

  // Client-side validation errors caught by the handsontable's built-in error catching.
  // These should prevent submission of the table:
  const {
    hasValidationErrors,
    afterValidate,
    validationAlertJsx
  } = useBulkEditorFrontEndValidation();

  const { tableWrapperRef } = useHeaderWidthFix({ columns });

  // Loads the initial data and shows an error message on fail:
  const loadDataInternal = safeSubmit(async () => {
    setLoading(true);
    const loadedData = await loadData();
    setInitialTableData(loadedData);
    setWorkingTableData(cloneDeep(loadedData));
    setLoading(false);
  });

  // Load the data once after mount, and after every save:
  useEffect(() => {
    loadDataInternal({}, formik);
  }, [lastSave]);

  // Show initial data loading errors here:
  const loadingFailed =
    (!workingTableData || !initialTableData) && formik.status;
  if (loadingFailed) {
    return <ErrorViewer />;
  }

  // Show loading state here:
  if (loading || !workingTableData || !initialTableData) {
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

    const editedDiffs = submitUnchangedRows
      ? diffs
      : diffs.filter(diff => !isEmpty(diff.changes));

    await onSubmit(editedDiffs, formikValues, formikActions);

    setLastSave(Date.now());
  };

  return (
    <div ref={tableWrapperRef}>
      <style>{`
        /* Prevent the handsontable header from covering the Dropdown menu options: */
        .ht_clone_top, .ht_clone_left, .ht_clone_top_left_corner {
          z-index: 0 !important;
        }
      `}</style>
      <ErrorViewer />
      {validationAlertJsx}
      {/** Setting the width/height and overflow:hidden here is detected by Handsontable and enables horizontal scrolling: */}
      <div
        className="form-group"
        style={{ width: "100%", height: "100%", overflowX: "hidden" }}
      >
        <DynamicHotTable
          afterValidate={afterValidate}
          columns={columns}
          data={workingTableData as any}
          manualColumnResize={true}
          maxRows={workingTableData.length}
          rowHeaders={true}
          // Disables handsontable's feature to hide off-screen rows/columns for performance.
          // This fixes the scrolling inside a modal, but maybe change this later to improve performance
          // for 100s or more rows.
          viewportColumnRenderingOffset={1000}
          viewportRowRenderingOffset={1000}
        />
      </div>
      <FormikButton
        className="btn btn-primary bulk-editor-submit-button"
        onClick={onSubmitInternal}
        buttonProps={() => ({ disabled: hasValidationErrors })}
      >
        <CommonMessage id="submitBtnText" />
      </FormikButton>
    </div>
  );
}

/**
 * A wrapper around Handsontable that avoids server-side rendering Handsontable, which would cause errors.
 */
const DynamicHotTable = dynamic(
  async () => {
    // Handsontable must only be loaded in the browser, because it depends on the global
    // navigator object to be available.
    const { HotTable } = await import("@handsontable/react");
    const { renderers } = await import("handsontable");

    const readableAutocompleteRenderer = getUserFriendlyAutoCompleteRenderer(
      renderers.AutocompleteRenderer
    );

    return class extends Component<HotTableProps> {
      // Re-rendering the table is expensive, so only do it if the data or columns change:
      public shouldComponentUpdate(nextProps: HotTableProps) {
        return (
          !isEqual(this.props.data, nextProps.data) ||
          !isEqual(
            (this.props.columns as GridSettings[]).map(({ data }) => data),
            (nextProps.columns as GridSettings[]).map(({ data }) => data)
          )
        );
      }

      public render() {
        (this.props.columns as GridSettings[])
          .filter(col => col.type === "dropdown")
          .forEach(col => (col.renderer = readableAutocompleteRenderer));

        return <HotTable {...this.props} />;
      }
    };
  },
  { ssr: false }
);
