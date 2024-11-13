import { useInstanceContext } from "common-ui";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import Link from "next/link";
import { FaExternalLinkAlt } from "react-icons/fa";

export function Feedback() {
  const instanceContext = useInstanceContext();

  return (
    <PageLayout titleId="feedbackButtonText">
      <>
        <p>Feedback is recorded in public GitHub Issues.</p>
        <strong>
          Warning: GitHub Issues are publicly visible, allowing anyone to view
          and search the content.
        </strong>
        <p className="mt-2">
          Before posting, review your text and attachments to ensure they don’t
          inadvertently disclose sensitive details. Private data, credentials,
          or proprietary project information should be considered exposed if
          included in issue descriptions, comments, or attachments.
          <br />
          <br />
          If you need to discuss sensitive matters, please communicate via
          email.
        </p>

        <p className="mt-3">
          Submit GitHub Issue here:{" "}
          <Link
            href={`https://github.com/AAFC-BICoE/dina-feedback/issues/new?template=bug_report.md&labels=template&title=%5B${
              instanceContext?.instanceName ?? "AAFC"
            }%5D%20`}
            passHref={true}
          >
            <a target="_blank">
              <>
                GitHub Issues{"  "}
                <FaExternalLinkAlt />
              </>
            </a>
          </Link>{" "}
          (external, GitHub account required)
        </p>
      </>
    </PageLayout>
  );
}

export default Feedback;
