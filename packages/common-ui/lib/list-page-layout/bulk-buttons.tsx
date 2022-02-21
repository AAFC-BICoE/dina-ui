import { FormikContextType } from "formik";
import { compact, toPairs } from "lodash";
import { useRouter } from "next/router";
import {
  AreYouSureModal,
  BulkSelectableFormValues,
  CommonMessage,
  FormikButton,
  useApiClient,
  useModal
} from "..";

/** Common button props for the bulk edit/delete buttons */
function bulkButtonProps(ctx: FormikContextType<BulkSelectableFormValues>) {
  // Disable the button if none are selected:
  const disabled =
    !ctx.values.selectedResources ||
    !compact(Object.values(ctx.values.selectedResources)).length;
  return { disabled };
}

export interface BulkDeleteButtonProps {
  typeName: string;
  apiBaseUrl: string;
}

export function BulkDeleteButton({
  apiBaseUrl,
  typeName
}: BulkDeleteButtonProps) {
  const router = useRouter();
  const { openModal } = useModal();
  const { doOperations } = useApiClient();

  return (
    <FormikButton
      buttonProps={bulkButtonProps}
      className="btn btn-danger bulk-delete-button"
      onClick={(values: BulkSelectableFormValues) => {
        const resourceIds = toPairs(values.selectedResources)
          .filter(pair => pair[1])
          .map(pair => pair[0]);

        openModal(
          <AreYouSureModal
            actionMessage={
              <span>
                <CommonMessage id="deleteSelectedButtonText" /> (
                {resourceIds.length})
              </span>
            }
            onYesButtonClicked={async () => {
              await doOperations(
                resourceIds.map(id => ({
                  op: "DELETE",
                  path: `${typeName}/${id}`
                })),
                { apiBaseUrl }
              );

              // Refresh the page:
              await router.reload();
            }}
          />
        );
      }}
    >
      <CommonMessage id="deleteSelectedButtonText" />
    </FormikButton>
  );
}

export interface BulkEditButtonProps {
  bulkEditPath: (ids: string[]) => {
    pathname: string;
    query: Record<string, string>;
  };
}

export function BulkEditButton({ bulkEditPath }: BulkEditButtonProps) {
  const router = useRouter();

  return (
    <FormikButton
      buttonProps={bulkButtonProps}
      className="btn btn-primary ms-2 bulk-edit-button"
      onClick={async (values: BulkSelectableFormValues) => {
        const ids = toPairs(values.selectedResources)
          .filter(pair => pair[1])
          .map(pair => pair[0]);

        const path = bulkEditPath(ids);
        await router.push(path);
      }}
    >
      <CommonMessage id="editSelectedButtonText" />
    </FormikButton>
  );
}
