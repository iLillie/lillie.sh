import theme from 'astro-theme-meo'
import { defineConfig } from 'astro/config'

export default defineConfig({
	site: 'https://lillie.sh',
	integrations: [
		theme({
			site: {
				title: `lillie.sh`,
				description: 'ctf-player and nerd :3',
				locale: 'en-GB',
				url: 'https://lillie.sh',
			},
			author: {
				name: 'LillieFox',
				email: '',
				signature: 'ctf player, and nerd',
				avatar: {
					url: 'https://avatars.githubusercontent.com/u/75392499?v=4',
					alt: 'Lillie',
				},
			},
			pages: {
				aboutMe: '/about',
			},
		}),
	],
})