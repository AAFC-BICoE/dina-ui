import Link from "next/link";
import React from "react";
import { Head, Nav } from "../components";

const Home: React.FunctionComponent = () => (
  <div>
    <Head title="Home" />
    <Nav />

    <div className="container">
      <h1>Object Store</h1>
      <ul>
        <li>
          <Link href="/upload">
            <a>Upload</a>
          </Link>
        </li>
        <li>
          <Link href="/object/list">
            <a>Stored Object List</a>
          </Link>
        </li>
      </ul>
    </div>
  </div>
);

export default Home;
