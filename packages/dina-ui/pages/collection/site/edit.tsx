import { useRouter } from "next/router";
import { PersistedResource } from "kitsu";
import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  withResponse
} from "common-ui";
import { Head, useSiteQuery, useSiteSave } from "packages/dina-ui/components";
import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { Site } from "packages/dina-ui/types/collection-api/resources/Site";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import SiteFormLayout from "packages/dina-ui/components/collection/site/SiteFormLayout";
import { POLYGON_EDITOR_MODE } from "packages/dina-ui/types/geo/polygon-editor-mode.types";

export default function EditPage() {
  const { formatMessage } = useDinaIntl();
  const router = useRouter();
  const { id } = router.query;
  const title = id ? formatMessage("editSite") : formatMessage("addSite");

  const siteQuery = useSiteQuery(id?.toString());

  if (!router.isReady) {
    return <div>{formatMessage("loadingSpinner")}</div>;
  }
  return (
    <PageLayout titleId={title}>
      <Head title={title} />
      {id ? (
        <div>
          {withResponse(siteQuery, ({ data }) => (
            <SiteForm site={data} />
          ))}
        </div>
      ) : (
        <div>
          <SiteForm />
        </div>
      )}
    </PageLayout>
  );
}

function SiteForm({ site }: { site?: PersistedResource<Site> }) {
  const router = useRouter();
  const { siteInitialValues, saveSite } = useSiteSave({ fetchedSite: site });

  const onSubmit: DinaFormOnSubmit<Site> = async ({
    submittedValues,
    formik
  }) => {
    const performSave = async () => {
      const savedSite = await saveSite(submittedValues, formik);
      await router.push(`/collection/site/view?id=${savedSite?.id}`);
    };

    await performSave();
  };

  const buttonBar = (
    <ButtonBar className="mb-4">
      <div className="col-md-6 col-sm-12 mt-2">
        <BackButton entityId={site?.id} entityLink="/collection/site" />
      </div>
      <div className="col-md-6 col-sm-12 d-flex">
        <SubmitButton className="ms-auto" />
      </div>
    </ButtonBar>
  );

  const initValues = {
    ...siteInitialValues,
    type: "site" as const,
    name: siteInitialValues.name ?? ""
  };

  return (
    <DinaForm<Site>
      initialValues={initValues}
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
      {buttonBar}
      <SiteFormLayout mode={POLYGON_EDITOR_MODE.EDIT} />
    </DinaForm>
  );
}
