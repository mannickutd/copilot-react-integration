import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['**/*.test.jsx'],
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.js', // <-- Add this line
  },
})