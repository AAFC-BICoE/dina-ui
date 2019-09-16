import ReactTable, { Column } from "react-table";
import { useQuery } from "../..";
import {
  LibraryPrep,
  LibraryPrepBatch,
  PcrPrimer
} from "../../../types/seqdb-api";

interface LibraryPrepGridProps {
  libraryPrepBatch: LibraryPrepBatch;
}

export function IndexGrid({ libraryPrepBatch }: LibraryPrepGridProps) {
  // TODO: this should fetch the index set primers.
  const { loading: primersLoading, response: primerResponse } = useQuery<
    PcrPrimer[]
  >({
    path: "pcrPrimer"
  });

  const {
    loading: libraryPrepsLoading,
    response: libraryPrepsResponse
  } = useQuery<LibraryPrep[]>({ path: `library` });

  if (primerResponse || libraryPrepsResponse) {
    const primers = primerResponse.data;

    const columns = primers.map<Column>(primer => ({
      // The header row should show the primer names.
      Header: () => primer.name
    }));

    const tableData = [];

    return (
      <ReactTable
        columns={columns}
        data={tableData}
        minRows={0}
        showPagination={false}
      />
    );
  }

  return null;
}
