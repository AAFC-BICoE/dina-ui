import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { useState } from "react";

export default function SplitRunAction() {
  const { formatMessage } = useDinaIntl();
  const [numOfChildToCreate, setNumOfChildToCreate] = useState(1);

  return <div>Hello World!</div>;
}
