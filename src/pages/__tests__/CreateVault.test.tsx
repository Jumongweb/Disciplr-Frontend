import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CreateVault from "../CreateVault";

const successAddress = `G${"A".repeat(55)}`;
const failureAddress = `G${"B".repeat(55)}`;

function fillField(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("CreateVault", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders accessible inline errors and blocks invalid submissions", () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    render(<CreateVault />);

    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));

    expect(
      screen.getByText(
        "Enter a positive USDC amount with up to 7 decimal places.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Choose a future deadline.")).toBeInTheDocument();
    expect(
      screen.getAllByText("Enter a valid Stellar public key starting with G."),
    ).toHaveLength(2);

    const amount = screen.getByLabelText(/amount/i);
    expect(amount).toHaveAttribute("aria-invalid", "true");
    expect(amount).toHaveAttribute(
      "aria-describedby",
      "field-amount-(usdc)-error",
    );
    expect(consoleLog).not.toHaveBeenCalled();
  });

  it("rejects identical destination addresses", () => {
    render(<CreateVault />);

    fillField(/amount/i, "100");
    fillField(/deadline/i, "2030-01-01T00:00");
    fillField(/success destination/i, successAddress);
    fillField(/failure destination/i, successAddress);
    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));

    expect(
      screen.getByText(
        "Failure destination must be different from success destination.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/failure destination/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("shows the review step for valid values and confirms once", () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    render(<CreateVault />);

    fillField(/amount/i, "100.1234567");
    fillField(/deadline/i, "2030-01-01T00:00");
    fillField(/success destination/i, successAddress);
    fillField(/failure destination/i, failureAddress);
    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));

    expect(
      screen.getByRole("heading", { name: /review vault details/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Enter a positive USDC amount/),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirm vault/i }));

    expect(consoleLog).toHaveBeenCalledWith({
      amount: "100.1234567",
      deadline: "2030-01-01T00:00",
      successAddress,
      failureAddress,
    });
    expect(consoleLog).toHaveBeenCalledTimes(1);
  });

  it("returns to edit mode without losing entered values", () => {
    render(<CreateVault />);

    fillField(/amount/i, "55");
    fillField(/deadline/i, "2030-02-02T00:00");
    fillField(/success destination/i, successAddress);
    fillField(/failure destination/i, failureAddress);
    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));

    fireEvent.click(screen.getByRole("button", { name: /back to edit/i }));

    expect(screen.getByLabelText(/amount/i)).toHaveValue("55");
    expect(screen.getByLabelText(/deadline/i)).toHaveValue("2030-02-02T00:00");
    expect(screen.getByLabelText(/success destination/i)).toHaveValue(
      successAddress,
    );
    expect(screen.getByLabelText(/failure destination/i)).toHaveValue(
      failureAddress,
    );
  });
});
