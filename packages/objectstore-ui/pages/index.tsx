import Link from "next/link";
import React from "react";
import { Head, Nav } from "../components";
import { ObjectStoreMessage } from "../intl/objectstore-intl";

const Home: React.FunctionComponent = () => (
  <div>
    <Head title="Home" />
    <Nav />

    <div className="container">
      <h1>
        <ObjectStoreMessage id="appTitle" />
      </h1>
      <ul>
        <li>
          <Link href="/upload">
            <a>
              <ObjectStoreMessage id="uploadPageTitle" />
            </a>
          </Link>
        </li>
        <li>
          <Link href="/object/list">
            <a>
              <ObjectStoreMessage id="objectListTitle" />
            </a>
          </Link>
        </li>
        <li>
          <Link href="/managedAttributesView/listView">
            <a>
              <ObjectStoreMessage id="managedAttributeListTitle" />
            </a>
          </Link>
        </li>
      </ul>
    </div>
  </div>
);

export default Home;
