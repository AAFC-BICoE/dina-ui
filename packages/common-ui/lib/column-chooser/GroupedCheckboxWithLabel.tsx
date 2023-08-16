import { startCase } from "lodash";
import React, { useEffect, useState } from "react";
import { useIntl } from "react-intl";

export interface CheckboxProps {
  id: string;
  name?: string;
  handleClick: (e: any) => void;
  isChecked: boolean;
  isField?: boolean;
}

export function Checkbox({
  id,
  name,
  handleClick,
  isChecked,
  isField
}: CheckboxProps) {
  const { formatMessage, messages } = useIntl();
  // Try to use dina messages first, if not just use the string directly.
  const messageKey = isField ? `field_${id}` : id;
  const label =
    name ??
    (messages[messageKey]
      ? formatMessage({ id: messageKey as any })
      : startCase(id));
  return (
    <div>
      <input
        id={id}
        type={"checkbox"}
        onChange={handleClick}
        checked={isChecked}
        style={{
          marginRight: "0.3rem",
          height: "1.3rem",
          width: "1.3rem"
        }}
      />
      <span>{label}</span>
    </div>
  );
}

interface CheckboxResource {
  id: string;
  [key: string]: any;
}
export interface UseGroupedCheckboxWithLabelProps {
  resources: CheckboxResource[];
  isField?: boolean;
}

export function useGroupedCheckboxWithLabel({
  resources,
  isField
}: UseGroupedCheckboxWithLabelProps) {
  const [list, setList] = useState<CheckboxResource[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>(
    resources.map((resource) => resource.id ?? "")
  );
  const [isCheckAll, setIsCheckAll] = useState<boolean>(true);
  useEffect(() => {
    setList(resources);
  }, [resources]);

  const handleSelectAll = (_e) => {
    setIsCheckAll(!isCheckAll);
    setCheckedIds(list.map((li) => li.id));
    if (isCheckAll) {
      setCheckedIds([]);
    }
  };

  const handleClick = (e) => {
    const { id, checked } = e.target;
    if (!checked) {
      setCheckedIds(checkedIds.filter((item) => item !== id));
      setIsCheckAll(false);
    } else {
      setCheckedIds(() => {
        if ([...checkedIds, id].length === list.length) {
          setIsCheckAll(true);
        }
        return [...checkedIds, id];
      });
    }
  };

  const groupedCheckBoxes = GroupedCheckboxes({
    handleSelectAll,
    isCheckAll,
    list,
    handleClick,
    checkedIds,
    isField
  });

  return { groupedCheckBoxes, checkedIds };
}

export interface GroupedCheckboxesProps {
  handleSelectAll: (_e: any) => void;
  isCheckAll: boolean;
  list: CheckboxResource[];
  handleClick: (e: any) => void;
  checkedIds: any;
  isField: boolean | undefined;
}

function GroupedCheckboxes({
  handleSelectAll,
  isCheckAll,
  list,
  handleClick,
  checkedIds,
  isField
}: GroupedCheckboxesProps) {
  return (
    <div>
      <Checkbox
        id="selectAll"
        handleClick={handleSelectAll}
        isChecked={isCheckAll}
      />
      {list.map(({ id }) => {
        return (
          <>
            <Checkbox
              key={id}
              id={id}
              handleClick={handleClick}
              isChecked={checkedIds.includes(id)}
              isField={isField}
            />
          </>
        );
      })}
    </div>
  );
}
