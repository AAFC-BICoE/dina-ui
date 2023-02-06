import type { HotTableProps } from "@handsontable/react";
import { FormikContextType, useFormikContext } from "formik";
import type { GridSettings } from "handsontable";
import { cloneDeep, isEmpty, isEqual, zipWith } from "lodash";
import dynamic from "next/dynamic";
import { Component, useEffect, useState } from "react";
import { PartialDeep } from "type-fest";
import { FormikButton } from "../formik-connected/FormikButton";
import { OnFormikSubmit, safeSubmit } from "../formik-connected/safeSubmit";
import { CommonMessage } from "../intl/common-ui-intl";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import { difference } from "./difference";
import { getUserFriendlyAutoCompleteRenderer } from "./resource-select-cell";
import { useBulkEditorFrontEndValidation } from "./useBulkEditorFrontEndValidation";
import { useHeaderWidthFix } from "./useHeaderWidthFix";

export interface RowChange<TRow> {
  original: TRow;
  changes: PartialDeep<TRow>;
}

export interface BulkDataEditorProps<TRow> {
  columns: GridSettings[];
  loadData: () => Promise<TRow[]>;
  onSubmit: (
    changes: RowChange<TRow>[],
    formikValues: any,
    formikActions: FormikContextType<any>,
    workingTableData?: TRow[]
  ) => Promise<void>;
  applyCustomDefaultValues?: (rows: TRow[]) => Promise<void>;

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
  applyCustomDefaultValues,
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
  const { hasValidationErrors, afterValidate, validationAlertJsx } =
    useBulkEditorFrontEndValidation();

  const { tableWrapperRef } = useHeaderWidthFix({ columns });

  // Loads the initial data and shows an error message on fail:
  const loadDataInternal = safeSubmit(async () => {
    setLoading(true);

    // Load the initial data to be used later to check which fields are edited:
    const loadedData = await loadData();
    setInitialTableData(loadedData);

    // Create a copy of the initial data to receive edits:
    const newWorkingData = cloneDeep(loadedData);
    await applyCustomDefaultValues?.(newWorkingData);
    setWorkingTableData(newWorkingData);
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
    return <div />;
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
      : diffs.filter((diff) => !isEmpty(diff.changes));

    await onSubmit(editedDiffs, formikValues, formikActions, workingTableData);

    setLastSave(Date.now());
  };

  return (
    <div ref={tableWrapperRef}>
      <style>{`
        /* Prevent the handsontable header from covering the react-select menu options: */
        .ht_clone_top, .ht_clone_left, .ht_clone_top_left_corner {
          z-index: 0 !important;
        }
        /* Prevent the dropdowns from being from being hidden at the bottom of the table: https://github.com/handsontable/handsontable/issues/5032 */
        .handsontableEditor.autocompleteEditor, .handsontableEditor.autocompleteEditor .ht_master .wtHolder {
          min-height: 138px;
        }
        /* Fix the place holder color contrast */        
        .htPlaceholder.htAutocomplete {
          color: rgb(51,51,51);
        }
        /* Fix need to review issue (critical): .htDimmed:nth-child(2) need sufficient color contrast */
        .handsontable .htDimmed {
          color: rgb(108,117,125); 
        }
        /* Fix need to review issue : ..htAutocompleteArrow need sufficient color contrast */
        .htAutocomplete .htAutocompleteArrow {
          color: rgb(108,117,125);
        }
      `}</style>
      {validationAlertJsx}
      <div
        className="mb-3"
        // Setting the width/height and overflowX:hidden here is detected by Handsontable and enables horizontal scrolling:
        style={{
          height: "100%",
          width: "100%",
          overflowX: "hidden"
        }}
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
        {/** Spacer div to make room for Handsontable's dropdown menus: */}
        <div style={{ height: "140px" }} />
      </div>
      <FormikButton
        className="btn btn-primary bulk-editor-submit-button"
        onClick={onSubmitInternal}
        buttonProps={() => ({
          disabled: hasValidationErrors,
          style: { width: "10rem" }
        })}
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

    // One of the two import styles for "renderers" should work, depending on how typescript/babel resolves imports:
    const { renderers: renderersImport, default: handsontable } = await import(
      "handsontable"
    );
    const renderers = handsontable?.renderers ?? renderersImport;

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
          .filter((col) => col.type === "dropdown")
          .forEach((col) => (col.renderer = readableAutocompleteRenderer));

        return <HotTable {...this.props} />;
      }
    };
  },
  { ssr: false }
);
