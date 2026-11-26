import { afterEach, describe, expect, it } from "vitest";
import { createCanekTheme } from "./CanekThemeProvider";

const css = `
:root { --cn-color-text: #222831; --cn-color-surface: #ffffff; }
[data-cn-theme="dark"] { --cn-color-text: #eef0f3; --cn-color-surface: #181b22; }
`;

const withTokens = () => {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  return style;
};

describe("createCanekTheme", () => {
  afterEach(() => {
    document.head.innerHTML = "";
    document.documentElement.removeAttribute("data-cn-theme");
  });

  it("en oscuro lee los roles oscuros aunque <html> todavía no tenga el atributo", () => {
    withTokens();
    const theme = createCanekTheme("dark");
    expect(theme.palette.text.primary).toBe("#eef0f3");
    expect(theme.palette.background.paper).toBe("#181b22");
  });

  it("en claro lee los roles claros aunque <html> siga en oscuro", () => {
    withTokens();
    document.documentElement.setAttribute("data-cn-theme", "dark");
    const theme = createCanekTheme("light");
    expect(theme.palette.text.primary).toBe("#222831");
    expect(document.documentElement.getAttribute("data-cn-theme")).toBe("dark");
  });
});
