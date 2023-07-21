import { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import { ReactTable8 } from "packages/common-ui/lib";
import { useMemo, useState } from "react";
import { makeData, Person } from "./mockData";

export default function Table() {
  const originalData = useMemo(() => makeData(5000), []);
  const [data, setData] = useState<Person[]>(() => originalData);

  function filterData(columnFilters: ColumnFiltersState) {
    setData(
      originalData.filter((person) => {
        for (const { id, value } of columnFilters) {
          if (
            (person[id] as string)
              .toLocaleLowerCase()
              .indexOf(("" + value).toLocaleLowerCase()) < 0
          ) {
            return false;
          }
        }
        return true;
      })
    );
  }

  const columns = useMemo<ColumnDef<Person, any>[]>(
    () => [
      {
        accessorKey: "firstName",
        cell: (info) => info.getValue(),
        footer: (props) => props.column.id,
        enableColumnFilter: true,
        enableSorting: true
      },
      {
        accessorFn: (row) => row.lastName,
        id: "lastName",
        cell: (info) => info.getValue(),
        header: () => <span>Last Name</span>,
        footer: (props) => props.column.id
      },
      {
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        id: "fullName",
        header: "Full Name",
        cell: (info) => info.getValue(),
        footer: (props) => props.column.id,
        enableColumnFilter: false
      },
      {
        accessorKey: "age",
        header: () => "Age",
        footer: (props) => props.column.id
      },

      {
        accessorKey: "visits",
        header: () => <span>Visits</span>,
        footer: (props) => props.column.id
      },
      {
        accessorKey: "status",
        header: "Status",
        footer: (props) => props.column.id
      },
      {
        accessorKey: "progress",
        header: "Profile Progress",
        footer: (props) => props.column.id
      }
    ],
    []
  );

  return (
    <ReactTable8<Person>
      columns={columns}
      data={data}
      showPagination={true}
      enableFilters={true}
      manualFiltering={true}
      onColumnFiltersChange={(columnFilters) => {
        filterData(columnFilters);
      }}
    />
  );
}
