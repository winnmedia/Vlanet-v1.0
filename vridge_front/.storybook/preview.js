/** @type { import('@storybook/react').Preview } */

import '../src/styles/main.scss';
import '../src/design-system/tokens.scss';

const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'gray',
          value: '#f3f4f6',
        },
        {
          name: 'dark',
          value: '#111827',
        },
      ],
    },
  },
};

export default preview;