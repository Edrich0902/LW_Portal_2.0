import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const aliases = {
  '@': path.resolve(__dirname, 'src'),
  '@views': path.resolve(__dirname, 'src/views'),
  '@components': path.resolve(__dirname, 'src/components'),
  '@stores': path.resolve(__dirname, 'src/stores'),
  '@assets': path.resolve(__dirname, 'src/assets'),
}

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
        alias: aliases
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
        alias: aliases
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
        alias: aliases
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
      alias: aliases
    },
  }
})
