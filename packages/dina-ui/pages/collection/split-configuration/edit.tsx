import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  useQuery,
  withResponseOrDisabled
} from "common-ui";
import { NextRouter, useRouter } from "next/router";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { SplitConfiguration } from "packages/dina-ui/types/collection-api/resources/SplitConfiguration2";

export default function SplitConfigurationEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;

  const { formatMessage } = useDinaIntl();

  const splitConfigurationQuery = useQuery<SplitConfiguration>(
    { path: `collection-api/split-configuration/${id}` },
    { disabled: id === undefined }
  );

  const titleId =
    id === undefined ? "splitConfigurationAdd" : "splitConfigurationEdit";

  return (
    <div>
      <Head title={formatMessage(titleId)} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id={titleId} />
        </h1>
        {withResponseOrDisabled(splitConfigurationQuery, (response) => (
          <SplitConfigurationForm
            splitConfiguration={response ? response.data : undefined}
            router={router}
          />
        ))}
      </main>
      <Footer />
    </div>
  );
}

interface SplitConfigurationFormProps {
  splitConfiguration?: SplitConfiguration;
  router: NextRouter;
}

export function SplitConfigurationForm({
  splitConfiguration: splitConfigurationData,
  router
}: SplitConfigurationFormProps) {
  const initialValues: SplitConfiguration = splitConfigurationData
    ? splitConfigurationData
    : {
        type: "split-configuration"
      };

  const onSubmit: DinaFormOnSubmit<SplitConfiguration> = async ({
    api: { save },
    submittedValues
  }) => {
    const updatedSplitConfiguration = {
      id: submittedValues.id,
      type: submittedValues.type
    } as SplitConfiguration;

    await save(
      [
        {
          resource: updatedSplitConfiguration,
          type: updatedSplitConfiguration.type
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    await router.push(
      `/collection/split-configuration/view?id=${submittedValues.id}`
    );
  };

  return (
    <DinaForm<SplitConfiguration>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <ButtonBar className="mb-4">
        <div className="col-md-6 col-sm-12 mt-2">
          <BackButton
            entityId={initialValues.id as string}
            entityLink="/split-configuration"
          />
        </div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
        </div>
      </ButtonBar>
    </DinaForm>
  );
}
