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
import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { PersistedResource } from "kitsu";
import { simpleSearchFilterToFiql } from "../filter-builder/fiql";

export interface AreYouSureModalProps {
  /** Describes the acion you're asking the user about. */
  actionMessage: ReactNode;

  onYesButtonClicked: OnFormikSubmit;

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

export function AreYouSureModalPersonDelete({
  actionMessage,
  onYesButtonClicked,
  yesButtonText,
  noButtonText
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

  async function getRelatedObjects(uuid: string): Promise<PersistedResource[]> {
    // fields with person relationships to check
    const relationshipFields = {
      "objectstore-api": {
        metadata: {
          fields: ["dcCreator", "acMetadataCreator"]
        }
      },
      "collection-api": {
        "material-sample": {
          fields: ["preparedBy"]
        }
      }
    };

    const relatedObjects: PersistedResource[] = [];

    for (const api of Object.keys(relationshipFields)) {
      for (const resourceType of Object.keys(relationshipFields[api])) {
        // Create a new filter for each resource type

        // for each field in resourceType, check for relationships to the given UUID
        for (const field in relationshipFields[api][resourceType]["fields"]) {
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
        {relatedObjects.length > 0 &&
          relatedObjects.map((object) => (
            <div className="d-flex flex-row mx-3" key={object.id}>
              {["metadata"].includes(object.type) ? (
                <Link
                  href={`/object-store/${object.type}/view?id=${object.id}`}
                >
                  {object.id}
                </Link>
              ) : (
                <Link href={`/collection/${object.type}/view?id=${object.id}`}>
                  {object.id}
                </Link>
              )}
            </div>
          ))}
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
