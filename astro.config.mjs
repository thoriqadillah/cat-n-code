import { defineConfig } from 'astro/config';

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
import mdx from "@astrojs/mdx";

// https://astro.build/config
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: 'https://thoriqadillah.github.io',
  base: '/cat-n-code/',
  integrations: [tailwind(), mdx(), sitemap()]
});