import { TooltipProps, Tooltip } from "common-ui";
import { Footer, Head, Nav } from "../../components";
import { startCase } from "lodash";
import { useIntl } from "react-intl";
import ButtonBarLayout from "./ButtonBarLayout";

export interface PageLayoutProps {
  /**
   * React children to render in the page layout.
   */
  children: React.ReactNode;

  /**
   * The title of the page. Displayed in the browser tab and at the top of the main content as a
   * heading.
   *
   * Uses the DinaMessage component for internationalization, and key must be provided.
   */
  titleId: string;

  /**
   * Provide tooltip message for the title.
   */
  headingTooltip?: TooltipProps;

  /**
   * Display the title as a heading in the main content. Defaults to true.
   */
  displayHeading?: boolean;

  /**
   * If you would like to display the button bar just under the navigation, you can supply your
   * components in this prop.
   *
   * Please note: This button bar will "stick" to the top of the page after scrolling past it.
   */
  buttonBarContent?: React.ReactNode;
}

/**
 * Page layout component.
 *
 * This component is used to wrap the main content of a page. It provides the navigation, title,
 * main content container and footer.
 *
 * Check out the PageLayoutProps interface for all the optional feature props.
 *
 * All pages should be using this component as the root component eventually.
 */
export default function PageLayout({
  children,
  titleId,
  headingTooltip,
  displayHeading = true,
  buttonBarContent
}: PageLayoutProps) {
  const { formatMessage, messages } = useIntl();
  const title = messages[titleId]
    ? formatMessage({ id: titleId as any })
    : startCase(titleId);

  return (
    <>
      <Head title={title} />
      <Nav marginBottom={false} />

      {/* Button Bar */}
      {buttonBarContent && (
        <ButtonBarLayout>{buttonBarContent}</ButtonBarLayout>
      )}

      <main className="container-fluid px-5" role="main">
        {/* Display the title as a heading in the main content. */}
        {displayHeading && (
          <h1 id="wb-cont">
            {title}
            {headingTooltip && <Tooltip {...headingTooltip} />}
          </h1>
        )}
        {children}
      </main>
      <Footer />
    </>
  );
}
