// Clean PostCSS config (sanitized)
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
