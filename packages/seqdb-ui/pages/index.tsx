import Link from "next/link";
import React from "react";
import { Head, Nav } from "../components";
import { SeqdbMessage } from "../intl/seqdb-intl";

const Home: React.FunctionComponent = () => (
  <div>
    <Head title="Home" />
    <Nav />

    <h1 className="text-center">
      <SeqdbMessage id="appTitle" />{" "}
    </h1>
  </div>
);

export default Home;
