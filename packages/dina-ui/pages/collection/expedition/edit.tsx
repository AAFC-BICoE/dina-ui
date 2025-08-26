import {
  ApiClientContext,
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  useQuery,
  withResponse
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import _ from "lodash";
import { useRouter } from "next/router";
import { useContext } from "react";
import PageLayout from "../../../components/page/PageLayout";
import { ExpeditionFormLayout } from "../../../components/collection/expedition/ExpeditionFormLayout";
import { Expedition } from "../../../types/collection-api/resources/Expedition";

interface ExpeditionFormProps {
  fetchedExpedition?: Expedition;
  onSaved: (expedition: PersistedResource<Expedition>) => Promise<void>;
}

export default function ExpeditionEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;

  async function goToViewPage(expedition: PersistedResource<Expedition>) {
    await router.push(`/collection/expedition/view?id=${expedition.id}`);
  }

  const title = id ? "editExpeditionTitle" : "addExpeditionTitle";

  const query = useQuery<Expedition>({
    path: `collection-api/expedition/${id}?include=attachment`
  });

  return (
    <PageLayout titleId={title}>
      <div>
        {id ? (
          withResponse(query, ({ data }) => (
            <ExpeditionForm fetchedExpedition={data} onSaved={goToViewPage} />
          ))
        ) : (
          <ExpeditionForm onSaved={goToViewPage} />
        )}
      </div>
    </PageLayout>
  );
}

export interface ExpeditionFormValues extends InputResource<Expedition> {}

export function ExpeditionForm({
  fetchedExpedition,
  onSaved
}: ExpeditionFormProps) {
  const { save } = useContext(ApiClientContext);
  // Process loaded back-end data into data structure that Forkmiks can use

  const initialValues: ExpeditionFormValues = fetchedExpedition
    ? {
        ...fetchedExpedition,
        // Convert multilingualDescription to editable Dictionary format:
        multilingualDescription: _.fromPairs<string | undefined>(
          fetchedExpedition.multilingualDescription?.descriptions?.map(
            ({ desc, lang }) => [lang ?? "", desc ?? ""]
          )
        )
      }
    : { type: "expedition" };

  const onSubmit: DinaFormOnSubmit<ExpeditionFormValues> = async ({
    submittedValues
  }) => {
    (submittedValues as any).relationships = {};
    const input: InputResource<Expedition> = {
      ...submittedValues,
      // Convert the editable format to the stored format:
      multilingualDescription: {
        descriptions: _.toPairs(submittedValues.multilingualDescription).map(
          ([lang, desc]) => ({ lang, desc })
        )
      }
    };

    // Add attachments if they were selected:
    (input as any).relationships.participants = {
      data:
        input.participants?.map((it) => ({
          id: it.id,
          type: it.type
        })) ?? []
    };

    // Delete the 'participants' attribute because it should stay in the relationships field:
    delete input.participants;

    const [savedExpedition] = await save<Expedition>(
      [
        {
          resource: input,
          type: "expedition"
        }
      ],
      {
        apiBaseUrl: "/collection-api"
      }
    );
    await onSaved(savedExpedition);
  };

  return (
    <DinaForm<ExpeditionFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <ButtonBar className="mb-4">
        <div className="col-md-6 col-sm-12 mt-2">
          <BackButton
            entityId={fetchedExpedition?.id}
            entityLink="/collection/expedition"
          />
        </div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
        </div>
      </ButtonBar>
      <ExpeditionFormLayout />
    </DinaForm>
  );
}
