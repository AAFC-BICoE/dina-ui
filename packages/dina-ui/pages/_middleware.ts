import { NextRequest, NextResponse } from "next/server";

/** This function runs before every HTTP request. */
export function middleware(req: NextRequest) {
  const isInternetExplorerRequest = /.*(MSIE|Trident).*/.test(
    req.headers.get("user-agent")?.toString() ?? ""
  );

  // Serve the unsupported-browser.html page when requesting from Internet Explorer:
  if (!process.env.DISABLE_BROWSER_CHECK && isInternetExplorerRequest) {
    return NextResponse.rewrite("/static/unsupported-browser.html");
  }
}
