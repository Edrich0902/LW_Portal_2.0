import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  if (mode === 'development') {
    return {
      plugins: [
        vue(),
        vueDevTools(),
        tailwindcss(),
        Components({
          resolvers: [PrimeVueResolver()],
        }),
      ],
      appType: 'spa',
      build: {
        outDir: './dist/dev',
        sourcemap: true,
      },
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
      },
    }
  } else if (mode === 'staging') {
    return {
      plugins: [
        vue(),
        vueDevTools(),
        tailwindcss(),
        Components({
          resolvers: [PrimeVueResolver()],
        }),
      ],
      appType: 'spa',
      build: {
        outDir: './dist/stage',
        sourcemap: false,
      },
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
      },
    }
  } else if (mode === 'production') {
    return {
      plugins: [
        vue(),
        vueDevTools(),
        tailwindcss(),
        Components({
          resolvers: [PrimeVueResolver()],
        }),
      ],
      appType: 'spa',
      build: {
        outDir: './dist/prod',
        sourcemap: false,
      },
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
      },
    }
  }

  // default config
  return {
    mode: mode,
    plugins: [
      vue(),
      vueDevTools(),
      tailwindcss(),
      Components({
        resolvers: [PrimeVueResolver()],
      }),
    ],
    appType: 'spa',
    build: {
      outDir: './dist/dev',
      sourcemap: true,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
