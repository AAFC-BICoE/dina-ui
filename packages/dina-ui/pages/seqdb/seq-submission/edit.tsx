import { useQuery, withResponse } from "common-ui";
import {
  SeqSubmission,
  seqSubmissionParser
} from "../../../../dina-ui/types/seqdb-api/resources/SeqSubmission";
import { Footer, Head, Nav } from "../../../components";
import { useRouter } from "next/router";
import { SeqdbMessage, useSeqdbIntl } from "packages/dina-ui/intl/seqdb-intl";
import { SeqSubmissionForm } from "packages/dina-ui/components/seqdb/seq-submission/SeqSubmissionForm";

export default function SeqSubmissionEditPage() {
  const router = useRouter();
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();

  const query = useQuery<SeqSubmission>(
    {
      path: `seqdb-api/seq-submission/${id}`,
      include: "seqBatch,submittedBy,sequencingFacility"
    },
    { parser: seqSubmissionParser }
  );

  const title = id ? "editSeqSubmissionTitle" : "addSeqSubmissionTitle";
  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="editSeqSubmissionTitle" />
            </h1>
            {withResponse(query, ({ data }) => (
              <SeqSubmissionForm seqSubmission={data} />
            ))}
          </div>
        ) : (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="addSeqSubmissionTitle" />
            </h1>
            <SeqSubmissionForm />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
