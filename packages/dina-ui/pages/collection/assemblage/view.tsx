import {
  AreYouSureModal,
  DinaForm,
  Tooltip,
  useApiClient,
  useElasticSearchQuery,
  useModal
} from "common-ui";
import _ from "lodash";
import { useRouter } from "next/router";
import { FaTrash } from "react-icons/fa";
import { ResourceFormProps, ViewPageLayout } from "../../../components";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { Assemblage } from "../../../types/collection-api/resources/Assemblage";
import { AssemblageFormLayout } from "./edit";

export default function AssemblageDetailsPage() {
  return (
    <ViewPageLayout<Assemblage>
      form={(props) => (
        <DinaForm<Assemblage>
          {...props}
          initialValues={{
            ...props.initialValues,
            // Convert multilingualDescription to editable Dictionary format:
            multilingualDescription: _.fromPairs<string | undefined>(
              props.initialValues.multilingualDescription?.descriptions?.map(
                ({ desc, lang }) => [lang ?? "", desc ?? ""]
              )
            ),
            multilingualTitle: _.fromPairs<string | undefined>(
              props.initialValues.multilingualTitle?.titles?.map(
                ({ title, lang }) => [lang ?? "", title ?? ""]
              )
            )
          }}
        >
          <AssemblageFormLayout />
        </DinaForm>
      )}
      query={(id) => ({
        path: `collection-api/assemblage/${id}`,
        include: "attachment"
      })}
      entityLink="/collection/assemblage"
      type="assemblage"
      apiBaseUrl="/collection-api"
      showRevisionsLink={true}
      deleteButton={(formProps) => <AssemblageDeleteButton {...formProps} />}
      tooltipNode={
        <Tooltip
          id={"assemblage_tooltip"}
          link={
            "https://aafc-bicoe.github.io/dina-documentation/concepts-glossary/#assemblage"
          }
          linkText={"fromDinaUserGuide"}
          placement={"right"}
        />
      }
    />
  );
}

/** Custom delete button that unlinks material samples before deleting the assemblage. */
function AssemblageDeleteButton({
  initialValues
}: ResourceFormProps<Assemblage>) {
  const id = initialValues.id;
  const router = useRouter();
  const { openModal } = useModal();
  const { doOperations, bulkUpdateResources } = useApiClient();

  const linkedSamplesQuery = useElasticSearchQuery({
    indexName: "dina_material_sample_index",
    queryDSL: {
      _source: {
        includes: ["data.id", "data.relationships.assemblages"]
      },
      query: {
        term: {
          "data.relationships.assemblages.data.id": id
        }
      },
      size: 1000
    },
    disabled: !id
  });

  const linkedHits = linkedSamplesQuery?.response?.data?.hits?.hits ?? [];
  const hasLinkedSamples = linkedHits.length > 0;

  async function handleUnlinkAndDelete() {
    try {
      // Build bulk update resources for all linked material samples
      const sampleUpdates = linkedHits
        .filter((hit) => hit._source?.data?.id)
        .map((hit) => {
          const sampleId = hit._source.data.id;
          const currentAssemblages =
            hit._source.data.relationships?.assemblages?.data ?? [];

          const updatedAssemblages = Array.isArray(currentAssemblages)
            ? currentAssemblages.filter((a: any) => a.id !== id)
            : [];

          return {
            id: sampleId,
            type: "material-sample" as const,
            relationships: {
              assemblages: {
                data: updatedAssemblages.map((a: any) => ({
                  id: a.id,
                  type: "assemblage"
                }))
              }
            }
          };
        });

      // Bulk-unlink all material samples in one request
      if (sampleUpdates.length > 0) {
        await bulkUpdateResources(sampleUpdates, {
          apiBaseUrl: "/collection-api",
          resourceType: "material-sample"
        });
      }

      // Delete the assemblage
      await doOperations(
        [
          {
            op: "DELETE",
            path: `assemblage/${id}`
          }
        ],
        { apiBaseUrl: "/collection-api" }
      );

      await router.push("/collection/assemblage/list");
    } catch (error) {
      console.error("Failed to unlink and delete assemblage:", error);
    }
  }

  function handleDeleteClick() {
    openModal(
      <AreYouSureModal
        actionMessage={<DinaMessage id="deleteButtonText" />}
        messageBody={
          hasLinkedSamples ? (
            <div>
              <DinaMessage
                id="assemblageDeleteLinkedSamplesWarning"
                values={{ count: linkedHits.length }}
              />
            </div>
          ) : undefined
        }
        yesButtonText={<DinaMessage id="deleteButtonText" />}
        onYesButtonClicked={handleUnlinkAndDelete}
      />
    );
  }

  return (
    <button
      className="btn btn-danger delete-button"
      onClick={handleDeleteClick}
      type="button"
    >
      <FaTrash className="me-2" />
      <DinaMessage id="deleteButtonText" />
    </button>
  );
}
