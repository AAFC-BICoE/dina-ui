import Link from "next/link";
import { CommonMessage } from "../intl/common-ui-intl";
import { useAccount } from "./AccountProvider";

/** Shows the logged-in user and the logout button. */
export function NavbarUserControl() {
  const {
    authenticated,
    initialized,
    logout,
    subject,
    username
  } = useAccount();

  return (
    <div className="d-flex">
      {initialized && authenticated ? (
        <>
          {username && (
            <span className="mr-2 my-auto">
              <CommonMessage id="loggedInAsUser" />{" "}
              <Link href={`/dina-user/view?id=${subject}`}>
                <a style={{ color: "#284162" }}>{username}</a>
              </Link>
            </span>
          )}
          <button
            type="button"
            className="btn btn-dark logout-button"
            onClick={() => logout()}
          >
            <CommonMessage id="logoutBtn" />
          </button>
        </>
      ) : null}
    </div>
  );
}
