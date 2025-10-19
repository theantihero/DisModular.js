#!/usr/bin/env node

/**
 * Version Bump Script
 * Automatically bumps version and creates release commit
 * @author fkndean_
 * @date 2025-10-15
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const VERSION_TYPES = ['patch', 'minor', 'major'];
const versionType = process.argv[2];

if (!versionType || !VERSION_TYPES.includes(versionType)) {
  console.error('Usage: node scripts/bump-version.js [patch|minor|major]');
  console.error('Example: node scripts/bump-version.js patch');
  process.exit(1);
}

try {
  console.log(`🚀 Bumping ${versionType} version...`);
  
  // Read current package.json
  const packagePath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  const currentVersion = packageJson.version;
  
  console.log(`📦 Current version: ${currentVersion}`);
  
  // Bump version using npm
  execSync(`npm version ${versionType} --no-git-tag-version`, { stdio: 'inherit' });
  
  // Read new version
  const newPackageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  const newVersion = newPackageJson.version;
  
  console.log(`✨ New version: ${newVersion}`);
  
  // Update CHANGELOG.md
  const changelogPath = join(process.cwd(), 'CHANGELOG.md');
  let changelog = readFileSync(changelogPath, 'utf8');
  
  const today = new Date().toISOString().split('T')[0];
  const changelogEntry = `## [${newVersion}] - ${today}

### Changed
- Version bump to ${newVersion}

`;
  
  // Replace [Unreleased] with new version entry
  changelog = changelog.replace('## [Unreleased]', changelogEntry + '## [Unreleased]');
  writeFileSync(changelogPath, changelog);
  
  console.log('📝 Updated CHANGELOG.md');
  
  // Create commit
  execSync(`git add package.json CHANGELOG.md`, { stdio: 'inherit' });
  execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });
  
  console.log('✅ Version bump complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Push to main: git push origin main');
  console.log('2. The release automation workflow will create a GitHub release automatically');
  console.log('');
  console.log(`🎉 Version ${newVersion} is ready for release!`);
  
} catch (error) {
  console.error('❌ Error during version bump:', error.message);
  process.exit(1);
}
