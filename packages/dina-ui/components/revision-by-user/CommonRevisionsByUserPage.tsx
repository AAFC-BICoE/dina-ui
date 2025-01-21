import { DinaForm, DinaFormOnSubmit, SubmitButton, TextField } from "common-ui";
import { useRouter } from "next/router";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { RevisionsPageLayout } from "../revisions/RevisionsPageLayout";
import { RevisionRowConfigsByType } from "../revisions/revision-row-config";
import PageLayout from "../../components/page/PageLayout";

export type RevisionsByUserPageProps = {
  snapshotPath: string;
  revisionRowConfigsByType: RevisionRowConfigsByType;
};

export default function RevisionsByUserPage({
  snapshotPath,
  revisionRowConfigsByType
}: RevisionsByUserPageProps) {
  const { query } = useRouter();
  const { formatMessage } = useDinaIntl();

  const author = query.author?.toString();

  const pageTitle = formatMessage("revisionsByUserPageTitle");

  return (
    <>
      <PageLayout titleId={pageTitle}>
        <AuthorFilterForm />
        {
          // Only show the revisions table if the author is set:
          author && (
            <RevisionsPageLayout
              auditSnapshotPath={snapshotPath}
              author={author}
              revisionRowConfigsByType={revisionRowConfigsByType}
            />
          )
        }
      </PageLayout>
    </>
  );
}

export function AuthorFilterForm() {
  const { pathname, push, query } = useRouter();

  /** Update the query string with the searched author. */
  const onSubmit: DinaFormOnSubmit = async ({
    submittedValues: { author }
  }) => {
    await push({ pathname, query: { author } });
  };

  return (
    <DinaForm
      initialValues={{ author: query.author?.toString() ?? "" }}
      onSubmit={onSubmit}
    >
      <ul className="list-inline">
        <li className="list-inline-item">
          <TextField name="author" />
        </li>
        <li className="list-inline-item">
          <SubmitButton>
            <DinaMessage id="searchButton" />
          </SubmitButton>
        </li>
      </ul>
    </DinaForm>
  );
}
