import {
  AreYouSureModal,
  CommonMessage,
  DinaForm,
  useApiClient,
  useModal
} from "common-ui";
import { fromPairs } from "lodash";
import { ViewPageLayout } from "../../components";
import { AgentIdentifierType } from "../../types/agent-api/resources/AgentIdentifierType";
import { IdentifierTypeFormLayout } from "./edit";
import { useRouter } from "next/router";

export default function IdentifierTypeDetailsPage() {
  const { openModal } = useModal();
  const { apiClient } = useApiClient();
  const router = useRouter();
  const id = String(router.query.id);
  return (
    <ViewPageLayout<AgentIdentifierType>
      form={(props) => (
        <DinaForm<AgentIdentifierType>
          {...props}
          initialValues={{
            ...props.initialValues,
            // Convert multilingualTitle to editable Dictionary format:
            multilingualTitle: fromPairs<string | undefined>(
              props.initialValues.multilingualTitle?.titles?.map(
                ({ title, lang }) => [lang ?? "", title ?? ""]
              )
            )
          }}
        >
          <IdentifierTypeFormLayout />
        </DinaForm>
      )}
      query={(id) => ({
        path: `agent-api/identifier-type/${id}`
      })}
      entityLink="/identifier"
      type="identifier-type"
      apiBaseUrl="/agent-api"
      deleteButton={() => (
        <button
          className={`btn btn-danger delete-button `}
          style={{ paddingLeft: "15px", paddingRight: "15px" }}
          onClick={() =>
            openModal(
              <AreYouSureModal
                actionMessage={<CommonMessage id="deleteButtonText" />}
                onYesButtonClicked={async () => {
                  await apiClient.axios.delete(
                    `agent-api/identifier-type/${id}`,
                    {
                      headers: {
                        "Content-Type": "application/vnd.api+json"
                      }
                    }
                  );

                  await router.push("/identifier/list");
                }}
              />
            )
          }
          type="button"
        >
          {<CommonMessage id="deleteButtonText" />}
        </button>
      )}
    />
  );
}
