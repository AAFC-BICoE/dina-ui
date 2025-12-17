import { ReactNode } from "react";
import { DinaForm, DinaFormSubmitParams } from "../formik-connected/DinaForm";
import { FormikButton } from "../formik-connected/FormikButton";
import { OnFormikSubmit } from "../formik-connected/safeSubmit";
import { SubmitButton } from "../formik-connected/SubmitButton";
import { CommonMessage } from "../intl/common-ui-intl";
import { useModal } from "./modal";
import _ from "lodash";
import { FaCheck, FaTimes } from "react-icons/fa";
import { SimpleSearchFilterBuilder } from "../util/simpleSearchFilterBuilder";
import { useApiClient } from "../api-client/ApiClientContext";
import { useDinaIntl } from "../../../../packages/dina-ui/intl/dina-ui-intl";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { KitsuResource, PersistedResource } from "kitsu";
import { simpleSearchFilterToFiql } from "../filter-builder/fiql";
import { ReactTable } from "../table/ReactTable";
import { ColumnDef } from "@tanstack/react-table";
import {
  getResourceName,
  getResourceApi,
  RelationshipFields
} from "./RelatedObjectUtils";
export interface AreYouSureModalProps {
  /** Describes the acion you're asking the user about. */
  actionMessage: ReactNode;

  onYesButtonClicked: OnFormikSubmit;

  /** Fields to check for relationships to object being deleted. */
  relationshipFields: RelationshipFields;

  /** Describes the message displaying to the user in order to make action decision. */
  messageBody?: ReactNode;

  /**
   * Replace the "Yes" button with a custom element
   */
  yesButtonText?: ReactNode;

  /**
   * Replace the "No" button with a custom element.
   */
  noButtonText?: ReactNode;
}

/**
 * A modal component that prompts the user with a confirmation dialog before deleting a resource.
 * It displays related objects that reference the resource to be deleted, allowing the user to review
 * potential impacts before confirming the deletion.
 *
 * @param actionMessage - The message to display in the modal header, describing the action.
 * @param onYesButtonClicked - Callback function invoked when the "Yes" button is clicked, receiving the form values and Formik helpers.
 * @param yesButtonText - Optional custom text for the "Yes" button.
 * @param noButtonText - Optional custom text for the "No" button.
 * @param relationshipFields - An object describing the API endpoints, resource types, and fields to check for relationships to the resource being deleted.
 *
 * @remarks
 * - Fetches and displays related objects that reference the resource by its UUID.
 * - Uses a table to list related objects, each with a link to its view page.
 */
export function AreYouSureModalDelete({
  actionMessage,
  onYesButtonClicked,
  yesButtonText,
  noButtonText,
  relationshipFields
}: AreYouSureModalProps) {
  const { closeModal } = useModal();
  const { apiClient } = useApiClient();
  const { formatMessage } = useDinaIntl();
  const router = useRouter();
  const uuid = router.query.id as string;

  async function onYesClickInternal(
    dinaFormSubmitParams: DinaFormSubmitParams<any>
  ) {
    const yesBtnParam = _.pick(
      dinaFormSubmitParams,
      "submittedValues",
      "formik"
    );

    await onYesButtonClicked(yesBtnParam.submittedValues, yesBtnParam.formik);
    closeModal();
  }

  const RELATED_OBJECTS_COLUMNS: ColumnDef<KitsuResource>[] = [
    {
      id: "type",
      accessorKey: "type",
      header: () => <strong>{formatMessage("resourceType")}</strong>,
      cell: ({ row }) => {
        const object = row.original;
        return (
          <div className="d-flex flex-row mx-3" key={object.id}>
            {object.type}
          </div>
        );
      }
    },
    {
      id: "resourceName",
      accessorKey: "resourceName",
      header: () => <strong>{formatMessage("resourceName")}</strong>,
      cell: ({ row }) => {
        const object = row.original;
        return (
          <div className="d-flex flex-row mx-3" key={object.id}>
            <Link
              onClick={closeModal}
              href={`/${getResourceApi(object.type)}/${object.type}/view?id=${
                object.id
              }`}
            >
              {getResourceName(object.type, object) || object.id}
            </Link>
          </div>
        );
      }
    }
  ];

  async function getRelatedObjects(uuid: string): Promise<PersistedResource[]> {
    const relatedObjects: PersistedResource[] = [];

    for (const api of Object.keys(relationshipFields)) {
      for (const resourceType of Object.keys(relationshipFields[api])) {
        // Create a new filter for each resource type
        // for each field in resourceType, check for relationships to the given UUID
        for (const field of relationshipFields[api][resourceType]["fields"]) {
          const filter = SimpleSearchFilterBuilder.create();
          filter.where(`${field}.id`, "EQ", uuid);
          // Make one API call per resource type
          const response = await apiClient.get(`${api}/${resourceType}`, {
            filter: simpleSearchFilterToFiql(filter.build())
          });
          if (response?.data && (response.data as any).length > 0) {
            relatedObjects.push(...(response.data as any));
          }
        }
      }
    }

    // Remove duplicates based on id
    return [...new Map(relatedObjects.map((item) => [item.id, item])).values()];
  }

  const RelatedObjects = ({
    relatedObjects
  }: {
    relatedObjects: PersistedResource[];
  }) => {
    return (
      <div>
        <div>{formatMessage("relatedObjectsPerson")}</div>
        <ReactTable columns={RELATED_OBJECTS_COLUMNS} data={relatedObjects} />
      </div>
    );
  };

  const [relatedObjects, setRelatedObjects] = useState<PersistedResource[]>([]);

  useEffect(() => {
    async function fetchRelatedObjects() {
      const result = await getRelatedObjects(uuid);
      setRelatedObjects(result ?? []);
    }
    if (uuid) {
      fetchRelatedObjects();
    }
    return;
  }, [uuid]);

  return (
    <DinaForm initialValues={{}} onSubmit={onYesClickInternal}>
      <div className="modal-content are-you-sure-modal">
        <div className="modal-header">
          <div className="modal-title h3">{actionMessage}</div>
        </div>
        <div className="modal-body">
          <main>
            <div className="message-body text-center">
              <div>
                <div>
                  <RelatedObjects relatedObjects={relatedObjects} />
                </div>
              </div>
            </div>
          </main>
        </div>
        <div className="modal-footer" style={{ justifyContent: "center" }}>
          <div className="d-flex gap-3">
            <FormikButton
              className="btn btn-dark no-button"
              onClick={closeModal}
              buttonProps={() => ({ style: { width: "10rem" } })}
            >
              <FaTimes className="me-2" />
              {noButtonText ?? <CommonMessage id="no" />}
            </FormikButton>

            <SubmitButton className="yes-button" showSaveIcon={false}>
              <FaCheck className="me-2" />
              {yesButtonText ?? <CommonMessage id="yes" />}
            </SubmitButton>
          </div>
        </div>
      </div>
    </DinaForm>
  );
}
