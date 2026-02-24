import { FormattedMessage } from "react-intl";
import { useField } from "formik";
import { usePopup } from "packages/dina-ui/hooks/usePopup";
import { PostMessage } from "packages/dina-ui/types/geo/post-message.types";
import { PostMessageType } from "packages/dina-ui/types/geo/post-message.types";
import { POLYGON_EDITOR_MODE } from "packages/dina-ui/types/geo/polygon-editor-mode.types";
import type { PolygonEditorMode } from "packages/dina-ui/types/geo/polygon-editor-mode.types";

type Props = {
  type: string;
  fieldName: string;
  url: string;
  messageId: string;
};

export default function GeometryMapEditorLauncher(props: Props) {
  const { openPopup } = usePopup();
  const [{ value }] = useField(props.fieldName);

  let messageType: string = PostMessageType.PolygonCreated;
  let mode: PolygonEditorMode = POLYGON_EDITOR_MODE.CREATE;
  if (props.messageId === "viewOnMap") {
    messageType = PostMessageType.PolygonViewed;
    mode = POLYGON_EDITOR_MODE.VIEW;
  } else if (props.messageId === "editOnMap") {
    messageType = PostMessageType.PolygonEdited;
    mode = POLYGON_EDITOR_MODE.EDIT;
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const popup = openPopup({ url: `${props.url}?mode=${mode}` });
    if (!popup) return;

    if (value !== undefined) {
      // Wait for popup to signal readiness
      const handleMessage = (event: MessageEvent<PostMessage>) => {
        if (event.origin !== window.location.origin) return;
        if (event.source !== popup) return;

        if (event.data?.type === PostMessageType.PopupReady) {
          popup.postMessage(
            { type: messageType, coordinates: value },
            window.location.origin
          );
          window.removeEventListener("message", handleMessage);
        }
      };

      window.addEventListener("message", handleMessage);
    }
  };

  return (
    <a href={props.url} onClick={handleClick} className="btn btn-info">
      <FormattedMessage id={props.messageId} />
    </a>
  );
}
