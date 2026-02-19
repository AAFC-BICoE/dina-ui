import { FormattedMessage } from "react-intl";
import { useField } from "formik";
import { usePopup } from "packages/dina-ui/hooks/usePopup";

export default function Editor(props: {
  type: string;
  fieldName: string;
  url: string;
  messageId: string;
}) {
  const { openPopup } = usePopup();
  const [{ value }, {}, {}] = useField(props.fieldName);
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const geometry = {
      type: props.type,
      coordinates: value
    };

    const popup = openPopup({ url: props.url });
    if (!popup) return;

    // Wait for popup to signal readiness
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "POPUP_READY") {
        // send the data
        popup.postMessage(
          { type: props.type, payload: geometry },
          window.location.origin
        );
        window.removeEventListener("message", handleMessage);
      }
    };

    window.addEventListener("message", handleMessage);
  };

  return (
    <a href={props.url} onClick={handleClick} className="btn btn-info">
      <FormattedMessage id={props.messageId} />
    </a>
  );
}
