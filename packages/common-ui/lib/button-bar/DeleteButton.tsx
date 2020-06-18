import { useRouter } from "next/router";
import { useContext } from "react";
import {
  ApiClientContext,
  DoOperationsOptions
} from "../api-client/ApiClientContext";
import { CommonMessage } from "../intl/common-ui-intl";
import { AreYouSureModal } from "../modal/AreYouSureModal";
import { useModal } from "../modal/modal";

interface DeleteButtonProps {
  /** The resource ID. */
  id?: string;

  /** The resource type. */
  type: string;

  /** URL to redirect to after deleting. */
  postDeleteRedirect: string;

  options?: DoOperationsOptions;
}

export function DeleteButton({
  id,
  options,
  postDeleteRedirect,
  type
}: DeleteButtonProps) {
  const { openModal } = useModal();
  const { doOperations } = useContext(ApiClientContext);
  const router = useRouter();

  async function doDelete() {
    await doOperations(
      [
        {
          op: "DELETE",
          path: `${type}/${id}`
        }
      ],
      options
    );

    await router.push(postDeleteRedirect);
  }

  if (!id) {
    return null;
  }

  return (
    <button
      className="btn btn-danger delete-button"
      onClick={() =>
        openModal(
          <AreYouSureModal
            actionMessage={<CommonMessage id="deleteButtonText" />}
            onYesButtonClicked={doDelete}
          />
        )
      }
      type="button"
    >
      <CommonMessage id="deleteButtonText" />
    </button>
  );
}
