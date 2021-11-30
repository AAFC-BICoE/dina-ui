import { Nav } from "../../../../../dina-ui/components/button-bar/nav/nav";
import { Head } from "../../../../../dina-ui/components/head";
import {
  DinaMessage,
  useDinaIntl
} from "../../../../../dina-ui/intl/dina-ui-intl";
import React from "react";
import Link from "next/link";
import useLocalStorage from "@rehooks/local-storage";
import { MaterialSampleRunActionResult } from "../../../../../dina-ui/types/collection-api/resources/MaterialSampleRunActionResult";
import { SPLIT_CHILD_SAMPLE_RUN_ACTION_RESULT_KEY } from "./split-run";
import { MaterialSampleRunConfig } from "../../../../../dina-ui/types/collection-api/resources/MaterialSampleRunConfig";
import { SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY } from "./split-config";
import { ButtonBar, DinaForm } from "common-ui";
import { useRouter } from "next/router";

export default function SplitRunActionResult() {
  const { formatMessage } = useDinaIntl();
  const router = useRouter();

  const [splitChildSampleRunActionResult] = useLocalStorage<
    MaterialSampleRunActionResult | null | undefined
  >(SPLIT_CHILD_SAMPLE_RUN_ACTION_RESULT_KEY);

  const [splitChildSampleRunConfig, _setSplitChildSampleRunConfig] =
    useLocalStorage<MaterialSampleRunConfig | null | undefined>(
      SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY
    );

  const buttonBar = (
    <ButtonBar className="justify-content-center">
      <Link href="/collection/material-sample/workflows/split-config">
        <a className="btn btn-info">
          <DinaMessage id="startNewRunConfigLabel" />
        </a>
      </Link>
    </ButtonBar>
  );

  return (
    <div>
      <Head title={formatMessage("workflowCompleteTitle")} />
      <Nav />
      <main className="container-fluid ">
        <h1 id="wb-cont">
          <DinaMessage id="workflowCompleteTitle" />
        </h1>

        <DinaForm initialValues={{}}>
          <span>
            <h3>{formatMessage("results")}:</h3>
            <span className="fw-bold">
              {formatMessage("originalMaterialSampleLabel")}:
            </span>
            <span className="d-flex flex-row">
              {splitChildSampleRunActionResult?.parentSampleId ? (
                <span className="d-flex flex-row mx-3">
                  <Link
                    href={`/collection/material-sample/view?id=${splitChildSampleRunActionResult?.parentSampleId}`}
                  >
                    <a target="_blank">
                      {splitChildSampleRunConfig?.configure.baseName}
                    </a>
                  </Link>
                </span>
              ) : (
                <span className="text-primary mx-3">
                  {" "}
                  {splitChildSampleRunConfig?.configure.baseName}
                </span>
              )}
              {splitChildSampleRunConfig?.configure.destroyOriginal ? (
                <>
                  <img src="/static/images/originalDestroyed.png" />
                  <span className="text-danger mx-1">
                    {" "}
                    <DinaMessage id="destroyedLabel" />{" "}
                  </span>
                </>
              ) : null}
            </span>
            <span className="fw-bold">
              {formatMessage("childMaterialSamplesCreatedLabel")}:
            </span>
            {splitChildSampleRunActionResult?.childrenGenerated?.map(
              (result, idx) => (
                <span className="d-flex flex-row mx-3" key={idx}>
                  <Link
                    href={`/collection/material-sample/view?id=${result.id}`}
                  >
                    <a target="_blank">{result.name}</a>
                  </Link>
                </span>
              )
            )}
          </span>
          {buttonBar}
        </DinaForm>
      </main>
    </div>
  );
}
