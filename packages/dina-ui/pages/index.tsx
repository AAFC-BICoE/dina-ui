import Link from "next/link";
import React from "react";
import { Head, Nav } from "../components";
import { DinaMessage } from "../intl/dina-ui-intl";

const Home: React.FunctionComponent = () => (
  <div>
    <Head title="Home" />
    <Nav />

    <div className="container">
      <h2>
        <DinaMessage id="objectStoreTitle" />
      </h2>
      <ul>
        <li>
          <Link href="/object-store/upload">
            <a>
              <DinaMessage id="uploadPageTitle" />
            </a>
          </Link>
        </li>
        <li>
          <Link href="/object-store/object/list">
            <a>
              <DinaMessage id="objectListTitle" />
            </a>
          </Link>
        </li>
        <li>
          <Link href="/object-store/managedAttributesView/listView">
            <a>
              <DinaMessage id="managedAttributeListTitle" />
            </a>
          </Link>
        </li>
        <li>
          <Link href="/object-store/object-subtype/list">
            <a>
              <DinaMessage id="objectSubtypeListTitle" />
            </a>
          </Link>
        </li>
      </ul>
      <h2>
        <DinaMessage id="agentsSectionTitle" />
      </h2>
      <ul>
        <li>
          <Link href="/agent/list">
            <a>
              <DinaMessage id="agentListTitle" />
            </a>
          </Link>
        </li>
      </ul>
    </div>
  </div>
);

export default Home;
