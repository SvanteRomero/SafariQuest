import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // A production build with no VITE_API_URL used to succeed and then ship a
  // bundle hardcoded to http://localhost:8000, so the deployed site failed
  // every request with an opaque network error. Failing the build puts that
  // in front of whoever is deploying instead of in front of a visitor — a
  // runtime throw would just be a white screen.
  if (command === 'build') {
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    if (!env.VITE_API_URL) {
      throw new Error(
        'VITE_API_URL is not set. Set it to the deployed API origin ' +
          '(e.g. https://api.example.com) before building, or the bundle will ' +
          'point at localhost. See .env.example.',
      )
    }
  }

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
  }
})
