#!/usr/bin/env bun

/**
 * Build TypeScript files for Unreal Engine integration
 * This builds from the root level to handle cross-directory imports properly
 */

import { $ } from 'bun';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

interface BuildConfig {
  readonly sourceDir: string;
  readonly outputDir: string;
  readonly tsConfigPath: string;
}

const buildConfig: BuildConfig = {
  sourceDir: './unreal/Scripts',
  outputDir: './unreal/dist',
  tsConfigPath: './unreal/tsconfig-build.json'
};

async function main(): Promise<void> {
  console.log('🚀 Building Kinopticon Unreal Integration...');

  try {
    // Create temporary TypeScript config for cross-project builds
    await createBuildTsConfig();
    
    // Ensure output directory exists
    ensureOutputDirectory();
    
    // Compile TypeScript using the build config
    await compileTypeScript();
    
    // Validate build output
    await validateBuildOutput();
    
    // Clean up temporary config
    await cleanupTempConfig();
    
    console.log('✅ Unreal integration build complete!');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

async function createBuildTsConfig(): Promise<void> {
  console.log('📋 Creating build configuration...');
  
  const buildTsConfig = {
    "compilerOptions": {
      "target": "ES2022",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "allowImportingTsExtensions": false,
      "allowJs": false,
      "checkJs": false,
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true,
      "strictFunctionTypes": true,
      "strictBindCallApply": true,
      "noImplicitReturns": true,
      "noImplicitThis": true,
      "noImplicitOverride": true,
      "exactOptionalPropertyTypes": true,
      "noUncheckedIndexedAccess": true,
      "noFallthroughCasesInSwitch": true,
      "declaration": true,
      "declarationMap": true,
      "sourceMap": true,
      "outDir": buildConfig.outputDir,
      "rootDir": ".",
      "baseUrl": ".",
      "paths": {
        "@kinopticon/simulation/*": ["./simulation/src/*"],
        "@kinopticon/types/*": ["./simulation/src/types/*"]
      },
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true,
      "allowSyntheticDefaultImports": true,
      "esModuleInterop": true
    },
    "include": [
      "./unreal/Scripts/**/*",
      "./simulation/src/**/*"
    ],
    "exclude": [
      "node_modules",
      "**/node_modules",
      "**/*.test.ts",
      "**/*.spec.ts",
      "unreal/KinopticonUE/Binaries",
      "unreal/KinopticonUE/Intermediate",
      "unreal/dist"
    ]
  };
  
  await Bun.write(buildConfig.tsConfigPath, JSON.stringify(buildTsConfig, null, 2));
}

function ensureOutputDirectory(): void {
  if (!existsSync(buildConfig.outputDir)) {
    mkdirSync(buildConfig.outputDir, { recursive: true });
  }
}

async function compileTypeScript(): Promise<void> {
  console.log('🔨 Compiling TypeScript...');
  
  try {
    await $`bun tsc --project ${buildConfig.tsConfigPath}`;
  } catch (error) {
    throw new Error(`TypeScript compilation failed: ${error}`);
  }
}

async function validateBuildOutput(): Promise<void> {
  console.log('✅ Validating build output...');
  
  // Check that main files were compiled
  const requiredFiles = [
    'unreal/Scripts/main-controller.js',
    'unreal/Scripts/bridges/unreal-input-bridge.js'
  ];
  
  for (const file of requiredFiles) {
    const outputPath = path.join(buildConfig.outputDir, path.relative('unreal/Scripts', file));
    if (!existsSync(outputPath)) {
      throw new Error(`Required build output missing: ${outputPath}`);
    }
  }
  
  // Validate TypeScript-only policy
  await validateTypeScriptOnly();
  
  console.log('Build validation passed');
}

async function validateTypeScriptOnly(): Promise<void> {
  // Check for any .js files in source directories (excluding dist)
  const jsFiles = await $`find unreal/Scripts -name "*.js" 2>/dev/null || true`.text();
  
  if (jsFiles.trim()) {
    throw new Error(`TypeScript-only policy violation: Found .js files in source:\n${jsFiles}`);
  }
}

async function cleanupTempConfig(): Promise<void> {
  if (existsSync(buildConfig.tsConfigPath)) {
    await $`rm ${buildConfig.tsConfigPath}`;
  }
}

// Run the build
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});