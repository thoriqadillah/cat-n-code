/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				'black': "#010002",
				'dark': '#242424',
				'darker': "#121212",
				'grey': "#373737",
				'bright': '#f8efd4',
				'white': '#FFFFFF',
				'second': "#d7385e",
				'main': '#edc988'
			},
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
	],
}
