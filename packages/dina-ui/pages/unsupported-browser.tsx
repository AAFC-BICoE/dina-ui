import { Footer, Head } from "../components";
import { DinaMessage } from "../intl/dina-ui-intl";

const UnSupportedBrowser: React.FunctionComponent = () =>
    <div>
        <Head title="Home" />
        <div className="container">
            <h2>
                <DinaMessage id="unsupportedBrowserMessage" />
            </h2>
        </div>
        <Footer />
    </div>

export default UnSupportedBrowser;