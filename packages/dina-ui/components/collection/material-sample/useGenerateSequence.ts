import { KitsuResource, PersistedResource } from "kitsu";
import { SequenceGenerator } from "../../../../dina-ui/types/collection-api/resources/SequenceGenerator";
import {
  DeleteArgs,
  DoOperationsOptions,
  SaveArgs
} from "../../../../common-ui/lib";

interface UseGenerateSequenceProps {
  collectionId: string;
  amount: number;
  save: <TData extends KitsuResource = KitsuResource>(
    args: (SaveArgs | DeleteArgs)[],
    options?: DoOperationsOptions
  ) => Promise<PersistedResource<TData>[]>;
}

export async function useGenerateSequence({
  collectionId,
  amount,
  save
}: UseGenerateSequenceProps) {
  const input: SequenceGenerator = {
    id: collectionId,
    amount,
    type: "collection-sequence-generator"
  };

  const response = await save<SequenceGenerator>(
    [
      {
        resource: input,
        type: "collection-sequence-generator"
      }
    ],
    { apiBaseUrl: "/collection-api" }
  );

  return response?.[0];
}
