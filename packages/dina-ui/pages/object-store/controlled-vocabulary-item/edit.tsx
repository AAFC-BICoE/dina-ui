import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { ControlledVocabularyItemEditPage } from "../../controlled-vocabulary-item/edit";

export default withRouter(({ router }: WithRouterProps) => (
  <ControlledVocabularyItemEditPage router={router} api="objectstore" />
));
