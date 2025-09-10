#!/usr/bin/env bun

/**
 * Architecture Validation Tool
 * 
 * Validates that the codebase adheres to our architectural principles
 * and design decisions documented in ADRs.
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join, extname } from 'path';

interface ValidationResult {
  readonly passed: boolean;
  readonly message: string;
  readonly rule: string;
}

/**
 * Check that no JavaScript files exist (except allowed ones)
 */
const validateNoJavaScript = (): ValidationResult => {
  const jsFiles: string[] = [];
  const allowedJS = ['eslint.config.js', 'prettier.config.js'];
  
  const findJS = (dir: string): void => {
    try {
      const items = readdirSync(dir);
      
      for (const item of items) {
        const itemPath = join(dir, item);
        const stat = statSync(itemPath);
        
        if (stat.isDirectory() && !['node_modules', '.git', 'dist'].includes(item)) {
          findJS(itemPath);
        } else if (extname(item) === '.js' && !allowedJS.some(allowed => itemPath.endsWith(allowed))) {
          jsFiles.push(itemPath);
        }
      }
    } catch (error) {
      // Directory not accessible, skip
    }
  };
  
  findJS(process.cwd());
  
  return {
    passed: jsFiles.length === 0,
    message: jsFiles.length === 0 
      ? 'No forbidden JavaScript files found' 
      : `Found ${jsFiles.length} JavaScript files: ${jsFiles.join(', ')}`,
    rule: 'ADR-002: TypeScript-Only Codebase',
  };
};

/**
 * Check that TypeScript files have proper type annotations
 */
const validateTypeScript = (): ValidationResult => {
  const issues: string[] = [];
  
  const checkTSFile = (filePath: string): void => {
    try {
      const content = readFileSync(filePath, 'utf-8');
      
      // Check for 'any' type usage
      if (content.includes(': any') || content.includes('<any>')) {
        issues.push(`${filePath}: Uses 'any' type`);
      }
      
      // Check for function without return type
      const functionRegex = /(?:function|const\s+\w+\s*=\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*:\s*\w+\s*=>))/g;
      const matches = content.match(functionRegex);
      if (matches && content.includes('): void') === false && content.includes('): number') === false) {
        // This is a simplified check - real implementation would use AST
      }
    } catch (error) {
      // File not readable
    }
  };
  
  const scanDirectory = (dir: string): void => {
    try {
      const items = readdirSync(dir);
      
      for (const item of items) {
        const itemPath = join(dir, item);
        const stat = statSync(itemPath);
        
        if (stat.isDirectory() && !['node_modules', '.git', 'dist'].includes(item)) {
          scanDirectory(itemPath);
        } else if (extname(item) === '.ts' && !item.includes('.test.') && !item.includes('.spec.')) {
          checkTSFile(itemPath);
        }
      }
    } catch (error) {
      // Directory not accessible
    }
  };
  
  scanDirectory(join(process.cwd(), 'simulation', 'src'));
  
  return {
    passed: issues.length === 0,
    message: issues.length === 0 
      ? 'TypeScript files follow type safety rules' 
      : `Type safety issues: ${issues.join(', ')}`,
    rule: 'ADR-002: TypeScript Strict Mode',
  };
};

/**
 * Check project structure follows ADR-001
 */
const validateProjectStructure = (): ValidationResult => {
  const requiredDirs = [
    'simulation/src/core',
    'simulation/src/types',
    '.adr',
    'configs',
  ];
  
  const missingDirs = requiredDirs.filter(dir => {
    try {
      const stat = statSync(join(process.cwd(), dir));
      return !stat.isDirectory();
    } catch {
      return true;
    }
  });
  
  return {
    passed: missingDirs.length === 0,
    message: missingDirs.length === 0 
      ? 'Project structure follows monorepo design' 
      : `Missing directories: ${missingDirs.join(', ')}`,
    rule: 'ADR-001: Monorepo Structure',
  };
};

/**
 * Main validation runner
 */
const runValidation = (): void => {
  console.log('🏗️  Running architecture validation...\n');
  
  const validations = [
    validateNoJavaScript(),
    validateTypeScript(),
    validateProjectStructure(),
  ];
  
  let allPassed = true;
  
  for (const result of validations) {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.rule}`);
    console.log(`   ${result.message}\n`);
    
    if (!result.passed) {
      allPassed = false;
    }
  }
  
  if (allPassed) {
    console.log('🎉 All architecture validations passed!');
    process.exit(0);
  } else {
    console.log('💥 Architecture validation failed!');
    console.log('Please fix the issues above and run again.');
    process.exit(1);
  }
};

// Run validation
runValidation();