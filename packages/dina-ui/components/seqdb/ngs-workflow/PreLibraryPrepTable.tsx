import { CellContext, ColumnDef } from "@tanstack/react-table";
import { PersistedResource } from "kitsu";
import {
  ReactTable,
  ReadOnlyResourceLink,
  ResourceSelect,
  SimpleSearchFilterBuilder,
  filterBy
} from "packages/common-ui/lib";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { Protocol } from "packages/dina-ui/types/collection-api";
import { PreLibraryPrep, Product } from "packages/dina-ui/types/seqdb-api";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import styles from "./PreLibraryPrepTable.module.css";
import classNames from "classnames";

export interface PreLibraryPrepTableProps {
  readOnly: boolean;
  data: PreLibraryPrep[];
  setData: Dispatch<SetStateAction<PreLibraryPrep[] | undefined>>;
}

export function PreLibraryPrepTable({
  readOnly = true,
  data,
  setData
}: PreLibraryPrepTableProps) {
  const tableColumns: ColumnDef<PreLibraryPrep>[] = [
    {
      id: "materialSampleName",
      cell: ({ row: { original } }) => (
        <div>
          {original.libraryPrep?.materialSample?.materialSampleName ?? ""}
        </div>
      ),
      header: () => (
        <b>
          <DinaMessage id={"materialSampleName"} />
        </b>
      )
    },
    {
      accessorKey: "inputAmount",
      cell: readOnly
        ? ({ row: { original } }) => <div>{original.inputAmount}</div>
        : NumberInputCell,
      header: () => (
        <b>
          <DinaMessage id={"field_inputAmount"} />
        </b>
      ),
      enableSorting: false
    },
    {
      accessorKey: "concentration",
      cell: readOnly
        ? ({ row: { original } }) => <div>{original.concentration}</div>
        : NumberInputCell,
      header: () => (
        <b>
          <DinaMessage id={"field_concentration"} />
        </b>
      ),
      enableSorting: false
    },
    {
      accessorKey: "targetBpSize",
      cell: readOnly
        ? ({ row: { original } }) => <div>{original.targetBpSize}</div>
        : NumberInputCell,
      header: () => (
        <b>
          <DinaMessage id={"field_targetBpSize"} />
        </b>
      ),
      enableSorting: false
    },
    {
      accessorKey: "averageFragmentSize",
      cell: readOnly
        ? ({ row: { original } }) => <div>{original.averageFragmentSize}</div>
        : NumberInputCell,
      header: () => (
        <b>
          <DinaMessage id={"field_averageFragmentSize"} />
        </b>
      ),
      enableSorting: false
    },
    {
      accessorKey: "quality",
      cell: readOnly
        ? ({ row: { original } }) => <div>{original.quality}</div>
        : NumberInputCell,
      header: () => (
        <b>
          <DinaMessage id={"field_quality"} />
        </b>
      ),
      enableSorting: false
    },
    {
      accessorKey: "protocol",
      meta: {
        style: { overflow: "visible" }
      },
      cell: readOnly
        ? ({ row: { original } }) => (
            <ReadOnlyResourceLink<Protocol>
              value={original.protocol as any}
              resourceSelectFieldProps={{
                readOnlyLink: "/collection/protocol",
                model: "collection-api/protocol",
                optionLabel: (protocol) => protocol.name
              }}
            />
          )
        : ({ row: { index, original }, column: { id: columnId }, table }) => {
            const initialValue = original[columnId];
            const [protocol, setProtocol] = useState<Protocol>(
              original.protocol as PersistedResource<Protocol>
            );

            // If the initialValue is changed external, sync it up with our state
            useEffect(() => {
              setProtocol(initialValue);
            }, [initialValue]);

            return (
              <ResourceSelect<Protocol>
                placeholder=""
                value={
                  !!protocol
                    ? (protocol as PersistedResource<Protocol>)
                    : undefined
                }
                isMulti={false}
                onChange={(value) => {
                  (table.options.meta as any).updateData(
                    index,
                    columnId,
                    value
                  );
                  setProtocol(value as PersistedResource<Protocol>);
                }}
                filter={(searchValue: string) =>
                  SimpleSearchFilterBuilder.create<Protocol>()
                    .searchFilter("name", searchValue)
                    .build()
                }
                model="collection-api/protocol"
                optionLabel={(resource) => resource.name}
              />
            );
          },
      header: () => (
        <b>
          <DinaMessage id={"field_protocol"} />
        </b>
      ),
      enableSorting: false
    },
    {
      accessorKey: "product",
      meta: {
        style: { overflow: "visible" }
      },
      cell: readOnly
        ? ({ row: { original } }) => (
            <ReadOnlyResourceLink<Product>
              value={original.product as any}
              resourceSelectFieldProps={{
                readOnlyLink: "/seqdb/product",
                model: "seqdb-api/product",
                optionLabel: (product) => product.name
              }}
            />
          )
        : ({ row: { index, original }, column: { id: columnId }, table }) => {
            const initialValue = original[columnId];
            const [product, setProduct] = useState<Product>(
              original.product as PersistedResource<Product>
            );

            // If the initialValue is changed external, sync it up with our state
            useEffect(() => {
              setProduct(initialValue);
            }, [initialValue]);

            return (
              <ResourceSelect<Product>
                value={
                  !!product
                    ? (product as PersistedResource<Product>)
                    : undefined
                }
                isMulti={false}
                placeholder=""
                onChange={(value) => {
                  (table.options.meta as any).updateData(
                    index,
                    columnId,
                    value
                  );
                  setProduct(value as PersistedResource<Product>);
                }}
                filter={filterBy(["name"])}
                model="seqdb-api/product"
                optionLabel={(resource) => resource.name}
              />
            );
          },
      header: () => (
        <b>
          <DinaMessage id={"field_product"} />
        </b>
      ),
      enableSorting: false
    },
    {
      accessorKey: "notes",
      cell: readOnly
        ? ({ row: { original } }) => <div>{original.notes}</div>
        : TextInputCell,
      header: () => (
        <b>
          <DinaMessage id={"field_notes"} />
        </b>
      ),
      enableSorting: false
    }
  ];

  return (
    <ReactTable
      data={data}
      columns={tableColumns}
      onDataChanged={setData}
      enableEditing={!readOnly}
    />
  );
}

export function TextInputCell<TData>({
  row: { index, original },
  column: { id: columnId },
  table
}: CellContext<TData, unknown>) {
  const initialValue = original[columnId] ?? "";
  // We need to keep and update the state of the cell normally
  const [value, setValue] = useState<string>(initialValue);
  const [valueChanged, setValueChanged] = useState(false);

  // When the input is blurred, we'll call our table meta's updateData function
  const onBlur = () => {
    if (valueChanged) {
      (table.options.meta as any).updateData(index, columnId, value);
      setValueChanged(false);
    }
  };

  // If the initialValue is changed external, sync it up with our state
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <input
      className="form-control w-100"
      value={value as string}
      onChange={(e) => {
        setValue(e.target.value);
        setValueChanged(true);
      }}
      onBlur={onBlur}
    />
  );
}

export function NumberInputCell<TData>({
  row: { index, original },
  column: { id: columnId },
  table
}: CellContext<TData, unknown>) {
  const initialValue = original[columnId] ?? "";
  // We need to keep and update the state of the cell normally
  const [value, setValue] = useState<number>(initialValue);
  const [valueChanged, setValueChanged] = useState(false);

  // When the input is blurred, we'll call our table meta's updateData function
  const onBlur = () => {
    if (valueChanged) {
      (table.options.meta as any).updateData(index, columnId, value);
      setValueChanged(false);
    }
  };

  // If the initialValue is changed external, sync it up with our state
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <input
      className={classNames("form-control w-100", styles.noArrowNumberInput)}
      type="number"
      value={value}
      onChange={(e) => {
        setValue(Number(e.target.value));
        setValueChanged(true);
      }}
      onBlur={onBlur}
    />
  );
}
