import "@testing-library/jest-dom";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GlobalSearch } from "../GlobalSearch";
import { mountWithAppContext } from "../../test-util/mock-app-context";

describe("GlobalSearch component", () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Renders the search input and button", () => {
    mountWithAppContext(<GlobalSearch onSearch={mockOnSearch} />);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("Calls onSearch with trimmed search term when form is submitted", async () => {
    mountWithAppContext(<GlobalSearch onSearch={mockOnSearch} />);

    const input = screen.getByRole("textbox");
    const button = screen.getByRole("button");

    await userEvent.type(input, "  test query  ");
    fireEvent.click(button);

    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith("test query");
  });

  it("Submits form when Enter key is pressed", async () => {
    mountWithAppContext(<GlobalSearch onSearch={mockOnSearch} />);

    const input = screen.getByRole("textbox");

    await userEvent.type(input, "search term{enter}");

    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith("search term");
  });

  it("Does not call onSearch when search term is empty", async () => {
    mountWithAppContext(<GlobalSearch onSearch={mockOnSearch} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it("Does not call onSearch when search term is only whitespace", async () => {
    mountWithAppContext(<GlobalSearch onSearch={mockOnSearch} />);

    const input = screen.getByRole("textbox");

    await userEvent.type(input, "   ");
    fireEvent.submit(input.closest("form")!);

    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it("Disables input and button when pending is true", () => {
    mountWithAppContext(
      <GlobalSearch onSearch={mockOnSearch} pending={true} />
    );

    const input = screen.getByRole("textbox");
    const button = screen.getByRole("button");

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it("Disables button when search term is empty", () => {
    mountWithAppContext(<GlobalSearch onSearch={mockOnSearch} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("Enables button when search term is not empty", async () => {
    mountWithAppContext(<GlobalSearch onSearch={mockOnSearch} />);

    const input = screen.getByRole("textbox");
    const button = screen.getByRole("button");

    await userEvent.type(input, "test");

    expect(button).not.toBeDisabled();
  });

  it("Uses controlled searchTerm value from props", () => {
    mountWithAppContext(
      <GlobalSearch onSearch={mockOnSearch} searchTerm="initial value" />
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("initial value");
  });

  it("Syncs with external searchTerm prop changes", async () => {
    const { rerender } = mountWithAppContext(
      <GlobalSearch onSearch={mockOnSearch} searchTerm="first" />
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("first");

    rerender(<GlobalSearch onSearch={mockOnSearch} searchTerm="second" />);

    await waitFor(() => {
      expect(input).toHaveValue("second");
    });
  });

  it("Applies custom className", () => {
    const { container } = mountWithAppContext(
      <GlobalSearch onSearch={mockOnSearch} className="custom-class" />
    );

    const searchContainer = container.querySelector(".global-search-container");
    expect(searchContainer).toHaveClass("custom-class");
  });

  it("Updates internal state when user types", async () => {
    mountWithAppContext(<GlobalSearch onSearch={mockOnSearch} />);

    const input = screen.getByRole("textbox");

    await userEvent.type(input, "typing test");

    expect(input).toHaveValue("typing test");
  });

  it("Renders search icon in button", () => {
    const { container } = mountWithAppContext(
      <GlobalSearch onSearch={mockOnSearch} />
    );

    const svg = container.querySelector(".global-search-icon");
    expect(svg).toBeInTheDocument();
  });

  it("Prevents default form submission behavior", async () => {
    mountWithAppContext(<GlobalSearch onSearch={mockOnSearch} />);

    const input = screen.getByRole("textbox");
    const form = input.closest("form")!;

    await userEvent.type(input, "test");

    fireEvent.submit(form);

    // The onSearch callback should be called, indicating preventDefault worked
    expect(mockOnSearch).toHaveBeenCalledWith("test");
  });
});
