import Link from "next/link";
import { CommonMessage } from "../intl/common-ui-intl";
import { useAccount } from "./AccountProvider";
import { FaUserCircle } from "react-icons/fa";
import { FaRightFromBracket } from "react-icons/fa6";

/** Shows the logged-in user and the logout button. */
export function NavbarUserControl() {
  const { authenticated, initialized, logout, subject, username } =
    useAccount();

  return (
    <div className="d-flex align-items-center text-end">
      {initialized && authenticated ? (
        <>
          {username && (
            <>
              {/* User Icon */}
              <span className="me-2 my-auto h4">
                <FaUserCircle />
              </span>

              {/* Profile Link */}
              <span className="me-4 my-auto h5">
                <Link
                  href={{
                    pathname: `/dina-user/view`,
                    query: {
                      id: subject,
                      hideBackButton: true
                    }
                  }}
                >
                  {username}
                </Link>
              </span>
            </>
          )}

          {/* Logout Button */}
          <button
            type="button"
            className="btn btn-info logout-button my-auto"
            onClick={() => logout()}
          >
            <FaRightFromBracket className="me-2" />
            <CommonMessage id="logoutBtn" />
          </button>
        </>
      ) : null}
    </div>
  );
}
