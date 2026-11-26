import { MetaWithTotal, Tooltip, useQuery } from "common-ui";
import { useState } from "react";
import { LuArrowUpDown } from "react-icons/lu";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { ControlledVocabularyItem } from "../../types/collection-api/resources/ControlledVocabularyItem";
import { ChangeOrderModal, ChangeOrderModalProps } from "./ChangeOrderModal";

export type ChangeOrderButtonProps = Omit<ChangeOrderModalProps, "onClose">;

/** Opens the Change Order modal for an ordered vocabulary's items. */
export function ChangeOrderButton(props: ChangeOrderButtonProps) {
  const [open, setOpen] = useState(false);

  // Counts the vocabulary's items, ignoring the table's filters.
  const { response } = useQuery<ControlledVocabularyItem[], MetaWithTotal>({
    path: `${props.apiBaseUrl}/controlled-vocabulary-item`,
    filter: { "controlledVocabulary.uuid": { EQ: props.vocabularyId } },
    page: { limit: 1 }
  });

  // Reordering needs at least two items.
  const disabled = (response?.meta?.totalResourceCount ?? 0) < 2;

  const button = (
    <button
      type="button"
      className="btn btn-primary"
      onClick={() => setOpen(true)}
      disabled={disabled}
      // Disabled buttons don't get hover events, so let them reach the tooltip.
      style={disabled ? { pointerEvents: "none" } : undefined}
    >
      <LuArrowUpDown className="me-2" />
      <DinaMessage id="changeOrder" />
    </button>
  );

  return (
    <>
      {disabled ? (
        <Tooltip
          id="changeOrderNotEnoughItems"
          visibleElement={<span className="d-inline-block">{button}</span>}
          disableSpanMargin={true}
        />
      ) : (
        button
      )}
      {open && <ChangeOrderModal {...props} onClose={() => setOpen(false)} />}
    </>
  );
}
