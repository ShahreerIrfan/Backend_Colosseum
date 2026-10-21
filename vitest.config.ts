import { defineConfig } from 'vitest/config';
import path from 'node:path';

const rootDir = import.meta.dirname || process.cwd();

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@config\/(.*)\.js$/, replacement: path.resolve(rootDir, './src/config/$1.ts') },
      { find: /^@constants\/(.*)\.js$/, replacement: path.resolve(rootDir, './src/constants/$1.ts') },
      { find: /^@controllers\/(.*)\.js$/, replacement: path.resolve(rootDir, './src/controllers/$1.ts') },
      { find: /^@dtos\/(.*)\.js$/, replacement: path.resolve(rootDir, './src/dtos/$1.ts') },
      { find: /^@errors\/(.*)\.js$/, replacement: path.resolve(rootDir, './src/errors/$1.ts') },
      { find: /^@middlewares\/(.*)\.js$/, replacement: path.resolve(rootDir, './src/middlewares/$1.ts') },
      { find: /^@repositories\/(.*)\.js$/, replacement: path.resolve(rootDir, './src/repositories/$1.ts') },
      { find: /^@routes\/(.*)\.js$/, replacement: path.resolve(rootDir, './src/routes/$1.ts') },
      { find: /^@services\/(.*)\.js$/, replacement: path.resolve(rootDir, './src/services/$1.ts') },
      { find: /^@app-types\/(.*)\.js$/, replacement: path.resolve(rootDir, './src/types/$1.ts') },
      { find: /^@utils\/(.*)\.js$/, replacement: path.resolve(rootDir, './src/utils/$1.ts') },
      { find: /^@config\/(.*)$/, replacement: path.resolve(rootDir, './src/config/$1') },
      { find: /^@constants\/(.*)$/, replacement: path.resolve(rootDir, './src/constants/$1') },
      { find: /^@controllers\/(.*)$/, replacement: path.resolve(rootDir, './src/controllers/$1') },
      { find: /^@dtos\/(.*)$/, replacement: path.resolve(rootDir, './src/dtos/$1') },
      { find: /^@errors\/(.*)$/, replacement: path.resolve(rootDir, './src/errors/$1') },
      { find: /^@middlewares\/(.*)$/, replacement: path.resolve(rootDir, './src/middlewares/$1') },
      { find: /^@repositories\/(.*)$/, replacement: path.resolve(rootDir, './src/repositories/$1') },
      { find: /^@routes\/(.*)$/, replacement: path.resolve(rootDir, './src/routes/$1') },
      { find: /^@services\/(.*)$/, replacement: path.resolve(rootDir, './src/services/$1') },
      { find: /^@app-types\/(.*)$/, replacement: path.resolve(rootDir, './src/types/$1') },
      { find: /^@utils\/(.*)$/, replacement: path.resolve(rootDir, './src/utils/$1') },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/test/**/*.test.ts'],
  },
});
