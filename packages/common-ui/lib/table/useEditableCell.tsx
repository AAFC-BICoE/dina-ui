import { Promisable } from "type-fest";

export interface UseEditableCellParams {
  data: any[];
  setData: (data: any[]) => Promisable<void>;
  readonly?: boolean;
}

export const useEditableCell = ({
  data,
  setData,
  readonly = false
}: UseEditableCellParams) => {
  const renderEditable = readonly
    ? (formatter?: (value: any) => string) => {
        return (cellInfo) =>
          formatter
            ? formatter(data[cellInfo.index][cellInfo.column.id])
            : data[cellInfo.index][cellInfo.column.id];
      }
    : (formatter?: (value: any) => string, parser?: (value: string) => any) => {
        return (cellInfo) => (
          <div
            style={{ backgroundColor: "#fafafa" }}
            contentEditable={true}
            suppressContentEditableWarning={true}
            onBlur={(e) => {
              const tempData = [...data];
              tempData[cellInfo.index][cellInfo.column.id] = parser
                ? parser(e.target.innerHTML)
                : e.target.innerHTML;
              setData(tempData);
            }}
            dangerouslySetInnerHTML={{
              __html: formatter
                ? formatter(data[cellInfo.index][cellInfo.column.id])
                : data[cellInfo.index][cellInfo.column.id]
            }}
          />
        );
      };

  return renderEditable;
};
