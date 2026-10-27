import type { Preview } from "@storybook/react";
import "../src/styles/tokens.css";
import { CanekThemeProvider } from "../src/theme";

const preview: Preview = {
  decorators: [
    (Story) => (
      <CanekThemeProvider mode="light">
        <div style={{ padding: "1.5rem" }}>
          <Story />
        </div>
      </CanekThemeProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#fafbfc" },
        { name: "white", value: "#ffffff" },
      ],
    },
    a11y: {
      config: {
        rules: [{ id: "color-contrast", enabled: true }],
      },
    },
  },
};

export default preview;
