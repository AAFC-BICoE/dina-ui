import { SelectField, SelectOption, TextField } from "common-ui/lib";

export interface OtherIdentifiersRowProps {
  rootName: string;
  typeOptions?: SelectOption<string | undefined>[];
}

export function OtherIdentifiersRow({
  rootName,
  typeOptions
}: OtherIdentifiersRowProps) {
  return (
    <div className="row">
      <div className="col-md-6">
        {typeOptions && (
          <SelectField
            name={rootName + ".type"}
            options={typeOptions as any}
            label={"Type"}
          />
        )}
      </div>
      <div className="col-md-6">
        <TextField name={rootName + ".value"} label={"Value"} />
      </div>
    </div>
  );
}
