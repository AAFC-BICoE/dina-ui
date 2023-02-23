import { useQuery, withResponse } from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { ProtocolForm } from "../../../../dina-ui/components/collection/protocol/ProtocolForm";
import { Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Protocol } from "../../../types/collection-api/resources/Protocol";

export default function ProtocolEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();

  async function goToViewPage(protocol: PersistedResource<Protocol>) {
    await router.push(`/collection/protocol/view?id=${protocol.id}`);
  }

  const title = id ? "editProtocolTitle" : "addProtocolTitle";

  const query = useQuery<Protocol>(
    {
      path: `collection-api/protocol/${id}?include=attachments`
    },
    {
      disabled: !id
    }
  );

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container">
        <div>
          <h1 id="wb-cont">
            <DinaMessage id={title} />
          </h1>
          {id ? (
            withResponse(query, ({ data }) => (
              <ProtocolForm fetchedProtocol={data} onSaved={goToViewPage} />
            ))
          ) : (
            <ProtocolForm onSaved={goToViewPage} />
          )}
        </div>
      </main>
    </div>
  );
}
