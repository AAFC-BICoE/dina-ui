import { useCookies } from "react-cookie";

/**
 * Collapse button to hide a UI. Uses a cookie per collapser to store the collaped state.
 */
export function useCollapser(id: string) {
  const COOKIE = `collapser-${id}-collapsed`;
  const [cookies, setCookie] = useCookies([COOKIE]);
  const collapsed = (cookies[COOKIE] ?? "true") === "true";

  function Collapser() {
    return (
      <button
        className="collapser-button m-2 btn btn-secondary"
        onClick={() => setCookie(COOKIE, String(!collapsed))}
        type="button"
      >
        <i
          style={{
            border: "solid black",
            borderWidth: "0 3px 3px 0",
            display: "inline-block",
            padding: "5px",
            ...(collapsed
              ? {
                  WebkitTransform: "rotate(45deg)",
                  transform: "rotate(45deg)"
                }
              : {
                  WebkitTransform: "rotate(-135deg)",
                  transform: "rotate(-135deg)"
                })
          }}
        />
      </button>
    );
  }

  return { Collapser, collapsed };
}
