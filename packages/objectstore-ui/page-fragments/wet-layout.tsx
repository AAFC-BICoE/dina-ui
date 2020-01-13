import WETFooter from "./wet-footer";
import WETHeader from "./wet-header";
const MainLayout = ({ children }) => (
  <div className="main-container">
    <WETHeader />

    <div className="content-wrapper">{children}</div>

    <WETFooter />
  </div>
);

export default MainLayout;
