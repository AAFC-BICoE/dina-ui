import { Promisable } from "type-fest";
import { AcquisitionEventListLayout } from "../../pages/collection/acquisition-event/list";
import { AcquisitionEvent } from "../../types/collection-api";

export interface AcquisitionEventLinkerProps {
  onAcquisitionEventSelect: (selected: AcquisitionEvent) => Promisable<void>;
}

export function AcquisitionEventLinker({
  onAcquisitionEventSelect
}: AcquisitionEventLinkerProps) {
  return (
    <AcquisitionEventListLayout
      briefColumns={true}
      onSelect={async event => await onAcquisitionEventSelect(event)}
      hideGroupFilter={true}
      hideTopPagination={true}
    />
  );
}
