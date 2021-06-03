import { Head, Nav } from "../../../../../dina-ui/components";
import {
  DinaMessage,
  useDinaIntl
} from "../../../../../dina-ui/intl/dina-ui-intl";
import React from "react";
import StepWizard from "react-step-wizard";
import ConfigAction from "./split-config";
import SplitRunAction from "./split-run";
import StepNav from "./step-nav";

export default function SplitSteppers() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("splitSubsampleTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1>
          <DinaMessage id="splitSubsampleTitle" />
        </h1>
        <StepWizard nav={<StepNav />}>
          <ConfigAction />
          <SplitRunAction />
        </StepWizard>
      </main>
    </div>
  );
}
