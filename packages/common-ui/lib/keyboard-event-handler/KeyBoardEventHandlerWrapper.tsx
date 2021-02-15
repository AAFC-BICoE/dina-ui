import dynamic from "next/dynamic";
import { ComponentType, ReactNode } from "react";

const KeyboardEventHandler: ComponentType<any> = dynamic(
  () => {
    return import("react-keyboard-event-handler");
  },
  { ssr: false }
);

interface KeyboardEventHandlerWrapperProps {
  children: ReactNode;
  handleKeys: string[];
  onKeyEvent: (key, e) => void;
}
export function KeyboardEventHandlerWrapper({
  children,
  handleKeys,
  onKeyEvent
}: KeyboardEventHandlerWrapperProps) {
  return (
    <KeyboardEventHandler handleKeys={handleKeys} onKeyEvent={onKeyEvent}>
      {children}
    </KeyboardEventHandler>
  );
}
