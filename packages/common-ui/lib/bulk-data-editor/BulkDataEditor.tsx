import { GridSettings } from "handsontable";
import dynamic from "next/dynamic";
import { SubmitButton } from "../formik-connected/SubmitButton";

export interface BulkDataEditorProps<TRow> {
  columns: GridSettings[];
  data: TRow[];
}

export const BulkDataEditor = dynamic(
  async () => {
    // Handsontable must only be loaded in the browser, because it depends on the global
    // navigator object to be available.
    const { HotTable } = await import("@handsontable/react");

    return function BulkDataEditorComponent<TRow>({
      columns,
      data
    }: BulkDataEditorProps<TRow>) {
      return (
        <>
          <HotTable
            columns={columns}
            data={data as any[]}
            manualColumnResize={true}
          />
          <SubmitButton />
        </>
      );
    };
  },
  { ssr: false }
);
