import ReactSwitch, { ReactSwitchProps } from "react-switch";

export function SmallSwitch(props: ReactSwitchProps) {
  return (
    <ReactSwitch
      height={18}
      width={34}
      handleDiameter={14}
      onColor="#335075"
      offColor="#d5dae0"
      checkedIcon={false}
      uncheckedIcon={false}
      {...props}
    />
  );
}
