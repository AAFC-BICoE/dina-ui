import { useInstanceContext } from "common-ui";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import Link from "next/link";
import { FaExternalLinkAlt } from "react-icons/fa";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";

export function Feedback() {
  const instanceContext = useInstanceContext();

  return (
    <PageLayout titleId="feedbackButtonText">
      <>
        <p>
          <DinaMessage id="feedbackTitle" />
        </p>
        <strong>
          <DinaMessage id="feedbackWarningTitle" />
        </strong>
        <p className="mt-2">
          <DinaMessage id="feedbackWarningDescription" />
          <br />
          <br />
          <DinaMessage id="feedbackContactUs" />
        </p>

        <p className="mt-3">
          <DinaMessage id="feedbackLinkHeader" />{" "}
          <Link
            href={`https://github.com/AAFC-BICoE/dina-feedback/issues/new?template=bug_report.md&labels=template&title=%5B${
              instanceContext?.instanceName ?? "AAFC"
            }%5D%20`}
            passHref={true}
            target="_blank"
          >
            <>
              <DinaMessage id="feedbackLinkTitle" />
              {"  "}
              <FaExternalLinkAlt />
            </>
          </Link>{" "}
          <DinaMessage id="feedbackExternal" />
        </p>
      </>
    </PageLayout>
  );
}

export default Feedback;
