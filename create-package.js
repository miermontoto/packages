#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
// colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// obtener el nombre del paquete desde los argumentos
const packageName = process.argv[2];

if (!packageName) {
  console.error(`${colors.red}Error: You must provide a package name${colors.reset}`);
  console.log(`Usage: ${colors.cyan}node create-package.js <package-name>${colors.reset}`);
  process.exit(1);
}

// validar nombre del paquete
if (!/^[a-z0-9-]+$/.test(packageName)) {
  console.error(`${colors.red}Error: Package name can only contain lowercase letters, numbers and hyphens${colors.reset}`);
  process.exit(1);
}

const packagePath = path.join(__dirname, 'packages', packageName);

// verificar si el paquete ya existe
if (fs.existsSync(packagePath)) {
  console.error(`${colors.red}Error: Package ${packageName} already exists${colors.reset}`);
  process.exit(1);
}

console.log(`${colors.bright}${colors.cyan}Creating package: ${packageName}${colors.reset}`);

// crear estructura de directorios
const directories = [
  packagePath,
  path.join(packagePath, 'src'),
  path.join(packagePath, 'src', 'types'),
  path.join(packagePath, 'src', 'utils')
];

directories.forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`${colors.green}✓${colors.reset} Created: ${dir.replace(__dirname, '.')}`);
});

// plantilla para package.json
const packageJson = {
  name: `@miermontoto/${packageName}`,
  version: "1.0.0",
  description: `TypeScript package for ${packageName}`,
  main: "dist/index.js",
  types: "dist/index.d.ts",
  scripts: {
    build: "rimraf dist && tsc",
    "build:watch": "tsc --watch",
    prepublishOnly: "pnpm build"
  },
  keywords: [
    packageName,
    "typescript"
  ],
  author: "Juan Mier",
  license: "CC BY-NC-ND 4.0",
  repository: {
    type: "git",
    url: "git+https://github.com/miermontoto/packages.git"
  },
  homepage: "https://github.com/miermontoto/packages#readme",
  bugs: {
    url: "https://github.com/miermontoto/packages/issues"
  },
  files: ["dist"],
  engines: {
    node: ">=16.0.0"
  },
  publishConfig: {
    access: "public",
    registry: "https://registry.npmjs.org/"
  },
  devDependencies: {
    "@types/node": "^20.0.0",
    "rimraf": "^6.0.1",
    "typescript": "^5.9.2"
  },
  dependencies: {},
  pnpm: {
    neverBuiltDependencies: []
  }
};

// plantilla para tsconfig.json
const tsconfigJson = {
  compilerOptions: {
    target: "ES2020",
    module: "commonjs",
    lib: ["ES2020"],
    declaration: true,
    outDir: "./dist",
    rootDir: "./src",
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    removeComments: true,
    sourceMap: true
  },
  include: ["src/**/*"],
  exclude: ["node_modules", "dist", "**/*.test.ts"]
};

// plantilla para index.ts
const indexTs = `// exportar todo desde este archivo principal
export * from './types';
export * from './utils';

/**
 * función de ejemplo para ${packageName}
 */
export function example(): string {
  return 'Hello from ${packageName}';
}
`;

// plantilla para types/index.ts
const typesIndexTs = `// definir las interfaces y tipos aquí

/**
 * interfaz de ejemplo
 */
export interface ExampleInterface {
  id: string;
  name: string;
}
`;

// plantilla para utils/index.ts
const utilsIndexTs = `// funciones de utilidad

/**
 * ejemplo de función de utilidad
 */
export function formatString(input: string): string {
  return input.trim().toLowerCase();
}
`;

// plantilla para README.md
const readmeMd = `# @miermontoto/${packageName}

${packageJson.description}

## Installation

\`\`\`bash
pnpm add @miermontoto/${packageName}
\`\`\`

## Usage

\`\`\`typescript
import { example } from '@miermontoto/${packageName}';

const result = example();
console.log(result);
\`\`\`

## License

${packageJson.license}
`;

// plantilla para .gitignore
const gitignore = `node_modules/
dist/
*.log
.DS_Store
`;

// escribir archivos
const files = [
  { path: path.join(packagePath, 'package.json'), content: JSON.stringify(packageJson, null, 2) },
  { path: path.join(packagePath, 'tsconfig.json'), content: JSON.stringify(tsconfigJson, null, 2) },
  { path: path.join(packagePath, 'src', 'index.ts'), content: indexTs },
  { path: path.join(packagePath, 'src', 'types', 'index.ts'), content: typesIndexTs },
  { path: path.join(packagePath, 'src', 'utils', 'index.ts'), content: utilsIndexTs },
  { path: path.join(packagePath, 'README.md'), content: readmeMd },
  { path: path.join(packagePath, '.gitignore'), content: gitignore }
];

files.forEach(file => {
  fs.writeFileSync(file.path, file.content);
  console.log(`${colors.green}✓${colors.reset} Created: ${file.path.replace(__dirname, '.')}`);
});

// ejecutar pnpm install automáticamente
console.log(`\n${colors.cyan}Installing dependencies...${colors.reset}`);
try {
  execSync('pnpm install', {
    cwd: packagePath,
    stdio: 'inherit'
  });
  console.log(`${colors.green}✓${colors.reset} Dependencies installed successfully`);
} catch (error) {
  console.error(`${colors.yellow}⚠${colors.reset} Could not run pnpm install automatically`);
  console.log(`  Please run manually: cd packages/${packageName} && pnpm install`);
}

console.log(`\n${colors.bright}${colors.green}Package ${packageName} created successfully!${colors.reset}`);
console.log(`\n${colors.yellow}Next steps:${colors.reset}`);
console.log(`  1. cd packages/${packageName}`);
console.log(`  2. pnpm build`);
console.log(`\n${colors.cyan}For development:${colors.reset}`);
console.log(`  - Edit files in src/`);
console.log(`  - Run 'pnpm build:watch' for automatic compilation`);
