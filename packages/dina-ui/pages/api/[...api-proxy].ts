import { NextApiRequest, NextApiResponse } from "next";
import httpProxyMiddleware from "next-http-proxy-middleware";

/**
 * Proxy the UI application paths to the REST APIs.
 * TODO use next.config.js instead of this file if Next.js ever allows
 * rewriting headers in the "rewrites" function:
 * https://nextjs.org/docs/api-reference/next.config.js/rewrites
 * https://github.com/vercel/next.js/discussions/19078
 */
export default (req: NextApiRequest, res: NextApiResponse) => {
  // Remove this header because it causes an exception in Crnk:
  delete req.headers["x-forwarded-proto"];

  const url = req.url ?? "";

  for (const { source, destination } of API_PROXY_REWRITES) {
    if (url.startsWith(source)) {
      // Do the URL rewrite to the REST API:
      return httpProxyMiddleware(req, res, {
        target: destination,
        pathRewrite: [
          {
            patternStr: `^${source}`,
            replaceStr: ""
          }
        ]
      });
    }
  }
};

/** Proxy the UI application paths to the REST APIs. */
const API_PROXY_REWRITES = [
  {
    // The base URL that the browser sends a request to:
    source: "/api/objectstore-api",
    // The back-end API address that the Next.js server sends a request to:
    destination: `http://${process.env.OBJECTSTORE_API_ADDRESS}/api/v1`
  },
  {
    source: "/api/agent-api",
    destination: `http://${process.env.AGENT_API_ADDRESS}/api/v1`
  },
  {
    source: "/api/user-api",
    destination: `http://${process.env.USER_API_ADDRESS}/api/v1`
  },
  {
    source: "/api/seqdb-api",
    destination: `http://${process.env.SEQDB_API_ADDRESS}/api`
  },
  {
    source: "/api/collection-api",
    destination: `http://${process.env.COLLECTION_API_ADDRESS}/api/v1`
  },
  {
    source: "/api/search-api",
    destination: `http://${process.env.SEARCH_API_ADDRESS}`
  }
];

export const config = {
  api: {
    // Disable body parsing, which causes an error on file uploads when used
    // together with next-http-proxy-middleware.
    bodyParser: false
  }
};
