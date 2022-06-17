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
import { setArray } from "../util/localStorageUtil";

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
  /** Where to perform the request for the bulk edit. */
  pathname: string;
}

/**
 * Key value where the bulk edit ids will be stored.
 *
 * This constant is available to use for setting and retrieving the value.
 */
export const BULK_EDIT_IDS_KEY = "bulkEditIds";

/**
 *
 *
 * @param param0
 * @returns
 */
export function BulkEditButton({ pathname }: BulkEditButtonProps) {
  const router = useRouter();

  return (
    <FormikButton
      buttonProps={bulkButtonProps}
      className="btn btn-primary ms-2 bulk-edit-button"
      onClick={async (values: BulkSelectableFormValues) => {
        const ids = toPairs(values.selectedResources)
          .filter(pair => pair[1])
          .map(pair => pair[0]);

        setArray(BULK_EDIT_IDS_KEY, ids);
        await router.push({ pathname });
      }}
    >
      <CommonMessage id="editSelectedButtonText" />
    </FormikButton>
  );
}
