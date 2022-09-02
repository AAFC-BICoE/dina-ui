import { useQuery, withResponse } from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { ThermocyclerProfile } from "../../../types/seqdb-api/resources/ThermocyclerProfile";
import { ThermocyclerProfileForm } from "../../../components/thermocycler-profile/ThermocyclerProfileForm";

export function ThermocyclerProfileEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();
  const title = id
    ? "editThermocyclerProfileTitle"
    : "addThermocyclerProfileTitle";

  const query = useQuery<ThermocyclerProfile>({
    include: "region",
    path: `seqdb-api/thermocycler-profile/${id}`
  });

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="editThermocyclerProfileTitle" />
            </h1>
            {withResponse(query, ({ data }) => (
              <ThermocyclerProfileForm
                readOnly={false}
                thermocyclerProfile={data}
                router={router}
              />
            ))}
          </div>
        ) : (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="addThermocyclerProfileTitle" />
            </h1>
            <ThermocyclerProfileForm router={router} readOnly={false} />
          </div>
        )}
      </main>
    </div>
  );
}

export default withRouter(ThermocyclerProfileEditPage);
