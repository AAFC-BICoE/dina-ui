import { useRouter } from "next/router";
import { CSSProperties, ReactNode, useContext } from "react";
import {
  ApiClientContext,
  DoOperationsOptions,
  useApiClient
} from "../api-client/ApiClientContext";
import { CommonMessage } from "../intl/common-ui-intl";
import { AreYouSureModal } from "../modal/AreYouSureModal";
import { useModal } from "../modal/modal";
import { MaterialSample } from "../../../dina-ui/types/collection-api";
import { StorageUnitCoordinates } from "../../../dina-ui/types/collection-api/resources/StorageUnitCoordinates";
import { KitsuResponse } from "kitsu";

interface DeleteButtonProps {
  /** Additional button classes. */
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;

  /** Replaces all classNames */
  replaceClassName?: string;

  disabled?: boolean;

  /** The resource ID. */
  id?: string;

  /** The resource type. */
  type: string;

  /** URL to redirect to after deleting. */
  postDeleteRedirect?: string;

  onDeleted?: () => void;

  options?: DoOperationsOptions;

  withLeadingSlash?: boolean;

  reload?: boolean;

  deleteRelationships?: boolean;
}

export function DeleteButton({
  className,
  replaceClassName,
  disabled,
  id,
  options,
  postDeleteRedirect,
  type,
  withLeadingSlash,
  reload,
  onDeleted,
  children,
  style,
  deleteRelationships = false
}: DeleteButtonProps) {
  const { openModal } = useModal();
  const { doOperations } = useContext(ApiClientContext);
  const router = useRouter();
  const { apiClient, save } = useApiClient();

  async function doDelete() {
    let materialSample: KitsuResponse<MaterialSample, undefined> = {
      data: { id: "", type: "material-sample" },
      meta: undefined
    };
    if (type === "material-sample" && deleteRelationships) {
      materialSample = await apiClient.get<MaterialSample>(
        `collection-api/material-sample/${id}`,
        {
          include: "storageUnitCoordinates"
        }
      );
    }
    await doOperations(
      [
        {
          op: "DELETE",
          path: `${type}/${id}`
        }
      ],
      options
    );

    // Delete StorageUnitCoordinates if there is one linked
    if (materialSample.data.storageUnitCoordinates?.id && deleteRelationships) {
      await save<StorageUnitCoordinates>(
        [
          {
            delete: {
              id: materialSample.data.storageUnitCoordinates?.id ?? null,
              type: "storage-unit-coordinates"
            }
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      );
    }

    onDeleted?.();

    // Force reload the postredirect page after deletion
    if (reload) {
      router.reload();
    } else if (postDeleteRedirect) {
      await router.push(
        withLeadingSlash ? "/" + postDeleteRedirect : postDeleteRedirect
      );
    }
  }

  if (!id) {
    return null;
  }

  return (
    <button
      className={
        replaceClassName ?? `btn btn-danger delete-button ${className}`
      }
      style={{ paddingLeft: "15px", paddingRight: "15px", ...style }}
      disabled={disabled}
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
      {children || <CommonMessage id="deleteButtonText" />}
    </button>
  );
}
