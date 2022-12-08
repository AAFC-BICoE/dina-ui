import {
  filterBy,
  MetaWithTotal,
  ResourceSelectField,
  ResourceSelectFieldProps,
  useAccount,
  useQuery,
  withResponse
} from "common-ui";
import { useField } from "formik";
import { PcrBatch } from "packages/dina-ui/types/seqdb-api";
import { SetOptional } from "type-fest";

type ProvidedProps = "readOnlyLink" | "filter" | "model" | "optionLabel";

export function PcrBatchSelectField(
  props: SetOptional<ResourceSelectFieldProps<PcrBatch>, ProvidedProps>
) {
  const [{ value }] = useField(props.name);
  const { isAdmin, groupNames } = useAccount();

  const filter = filterBy(
    ["name"],
    !isAdmin
      ? {
          extraFilters: [
            // Restrict the list to just the user's groups:
            {
              selector: "group",
              comparison: "=in=",
              arguments: groupNames || []
            }
          ]
        }
      : undefined
  );

  const collectionQuery = useQuery<PcrBatch[], MetaWithTotal>({
    path: "seqdb-api/pcr-batch",
    filter: filter("")
  });

  return withResponse(collectionQuery, ({ data, meta }) => {
    // Disable this input when the collection set is the only one available:
    const resourceCannotBeChanged =
      !isAdmin && meta?.totalResourceCount === 1 && data[0].id === value?.id;

    return (
      <ResourceSelectField<PcrBatch>
        key={String(isAdmin)}
        readOnlyLink="/seqdb/pcr-batch/view?id="
        filter={filter}
        model="seqdb-api/pcr-batch"
        optionLabel={(pcrBatch) => `${pcrBatch.name || pcrBatch.id}`}
        isDisabled={resourceCannotBeChanged}
        omitNullOption={true}
        {...props}
      />
    );
  });
}
