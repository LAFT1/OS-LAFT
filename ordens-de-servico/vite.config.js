import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Base relativa: faz o build funcionar tanto em
  // https://usuario.github.io/nome-do-repo/ quanto em domínio próprio,
  // sem precisar saber o nome do repositório de antemão.
  base: './',
  plugins: [react(), tailwindcss()],
})
