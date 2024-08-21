import { TagSelectReadOnly } from "../../tag-editor/TagSelectField";

interface MetadataBadgesProps {
  tagsFieldName?: string;
  groupSelectorName?: string;
}

export default function MetadataBadges({
  tagsFieldName,
  groupSelectorName
}: MetadataBadgesProps) {
  return (
    <div>
      {" "}
      <div className="row">
        <TagSelectReadOnly
          tagsFieldName={tagsFieldName}
          groupSelectorName={groupSelectorName}
        />
      </div>
    </div>
  );
}
