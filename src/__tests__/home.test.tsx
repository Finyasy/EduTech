import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/(public)/page";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/shared/SiteHeader", () => ({
  default: () => <div data-testid="site-header" />,
}));

describe("HomePage", () => {
  it("renders the hero content", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /help kids master math and logic/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /explore courses/i }),
    ).toHaveAttribute("href", "/courses");
  });
});
