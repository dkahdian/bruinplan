import adapterAuto from '@sveltejs/adapter-auto';
import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const isDev = process.env.NODE_ENV === 'development';
const adapter = isDev ? adapterAuto : adapterStatic;
/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: 'index.html'
    }),
    ...(!isDev && {
      paths: {
        base: '/bruinplan'
      }
    })
  }
};