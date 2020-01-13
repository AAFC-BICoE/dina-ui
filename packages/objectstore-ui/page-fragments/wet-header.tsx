export default function WETHeader() {
  return (
    <header>
      <div id="wb-bnr" className="container">
        <section id="wb-lng" className="text-right">
          <h2 className="wb-inv">Language selection</h2>
          <ul className="list-inline margin-bottom-none">
            <li>
              <a lang="fr" href="archived-fr.html">
                Français
              </a>
            </li>
          </ul>
        </section>
        <div className="row">
          <div
            className="brand col-xs-5 col-md-4"
            property="publisher"
            typeof="GovernmentOrganization"
          >
            {" "}
            <a href="https://www.canada.ca/en.html" property="url">
              <img
                src="https://wet-boew.github.io/themes-dist/GCWeb/assets/sig-blk-en.svg"
                alt=""
                property="logo"
              />
              <span className="wb-inv" property="name">
                {" "}
                Government of Canada /
              </span>{" "}
              <span lang="fr">Gouvernement du Canada</span>
            </a>
            <meta property="areaServed" typeof="Country" content="Canada" />
          </div>
          <section id="wb-srch" className="col-lg-8 text-right">
            <h2>Search</h2>
            <form
              action="#"
              method="post"
              name="cse-search-box"
              role="search"
              className="form-inline"
            >
              <div className="form-group">
                <label htmlFor="wb-srch-q" className="wb-inv">
                  Search Canada.ca
                </label>
                <input
                  id="wb-srch-q"
                  list="wb-srch-q-ac"
                  className="wb-srch-q form-control"
                  name="q"
                  type="search"
                  placeholder="Search Canada.ca"
                />
                <datalist id="wb-srch-q-ac" />
              </div>
              <div className="form-group submit">
                <button
                  type="submit"
                  id="wb-srch-sub"
                  className="btn btn-primary btn-small"
                  name="wb-srch-sub"
                >
                  <span className="glyphicon-search glyphicon" />
                  <span className="wb-inv">Search</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
      <nav className="gcweb-menu" typeof="SiteNavigationElement">
        <div className="container">
          <h2 className="wb-inv">Menu</h2>
          <button type="button" aria-haspopup="true" aria-expanded="false">
            <span className="wb-inv">Main </span>Menu{" "}
            <span className="expicon glyphicon glyphicon-chevron-down" />
          </button>
          <ul
            role="menu"
            aria-orientation="vertical"
            data-ajax-replace="https://wet-boew.github.io/themes-dist/GCWeb/ajax/sitemenu-v5-en.html"
          >
            <li role="presentation">
              <a
                role="menuitem"
                href="https://www.canada.ca/en/services/jobs.html"
              >
                Jobs and the workplace
              </a>
            </li>
            <li role="presentation">
              <a
                role="menuitem"
                href="https://www.canada.ca/en/services/immigration-citizenship.html"
              >
                Immigration and citizenship
              </a>
            </li>
            <li role="presentation">
              <a role="menuitem" href="https://travel.gc.ca/">
                Travel and tourism
              </a>
            </li>
            <li role="presentation">
              <a
                role="menuitem"
                href="https://www.canada.ca/en/services/business.html"
              >
                Business and industry
              </a>
            </li>
            <li role="presentation">
              <a
                role="menuitem"
                href="https://www.canada.ca/en/services/benefits.html"
              >
                Benefits
              </a>
            </li>
            <li role="presentation">
              <a
                role="menuitem"
                href="https://www.canada.ca/en/services/health.html"
              >
                Health
              </a>
            </li>
            <li role="presentation">
              <a
                role="menuitem"
                href="https://www.canada.ca/en/services/taxes.html"
              >
                Taxes
              </a>
            </li>
            <li role="presentation">
              <a
                role="menuitem"
                href="https://www.canada.ca/en/services/environment.html"
              >
                Environment and natural resources
              </a>
            </li>
            <li role="presentation">
              <a
                role="menuitem"
                href="https://www.canada.ca/en/services/defence.html"
              >
                National security and defence
              </a>
            </li>
            <li role="presentation">
              <a
                role="menuitem"
                href="https://www.canada.ca/en/services/culture.html"
              >
                Culture, history and sport
              </a>
            </li>
            <li role="presentation">
              <a
                role="menuitem"
                href="https://www.canada.ca/en/services/policing.html"
              >
                Policing, justice and emergencies
              </a>
            </li>
            <li role="presentation">
              <a
                role="menuitem"
                href="https://www.canada.ca/en/services/transport.html"
              >
                Transport and infrastructure
              </a>
            </li>
            <li role="presentation">
              <a
                role="menuitem"
                href="https://international.gc.ca/world-monde/index.aspx?lang=eng"
              >
                Canada and the world
              </a>
            </li>
            <li role="presentation">
              <a
                role="menuitem"
                href="https://www.canada.ca/en/services/finance.html"
              >
                Money and finances
              </a>
            </li>
            <li role="presentation">
              <a
                role="menuitem"
                href="https://www.canada.ca/en/services/science.html"
              >
                Science and innovation
              </a>
            </li>
          </ul>
        </div>
      </nav>
      <nav id="wb-bc" property="breadcrumb">
        <h2>You are here:</h2>
        <div className="container">
          <ol className="breadcrumb">
            <li>
              <a href="https://www.canada.ca/en.html">Home</a>
            </li>
          </ol>
        </div>
      </nav>
    </header>
  );
}

// export default WETHeader;
