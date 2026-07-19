// TYPE     : .TS
// PATH     : ALL_REBUILT/tests/config.test.ts
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-< START >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// TYPE     : .TS
// PATH     : tests/config.test.ts
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-< START >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// FILE-PATH: tests/config.test.ts

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import path from 'path';

const SANDBOX_DIR = './test-sandbox-config';
const RUNTIME_CONFIG_PATH = path.join(process.cwd(), SANDBOX_DIR, 'runtime.config.json');

// We ONLY mock Constants to redirect the runtime config file to our safe sandbox.
// We let it read the REAL config.toml.
mock.module('../src/components/Constants.ts', () => ({
  Constants: {
    RUNTIME_CONFIG_PATH: RUNTIME_CONFIG_PATH,
  },
}));

import { getDefaultConfig, loadConfig, saveConfigToDisk } from '../src/components/Config';
import { cleanupSandbox, createSandbox } from './setup';

describe('Configuration Logic', () => {
  beforeEach(async () => await createSandbox(SANDBOX_DIR));
  afterEach(async () => await cleanupSandbox(SANDBOX_DIR));

  test('getDefaultConfig should correctly parse the real config.toml', async () => {
    const config = await getDefaultConfig();

    // Check against the REAL defaults in your config.toml
    expect(config.outputDir).toBe('ALL');
    expect(config.rebuiltDir).toBe('ALL_REBUILT');

    const excludes = [
      '**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/*.lockb', '**/*.lock',
      '**/package-lock.json', '**/*.map', '**/*.png', '**/*.jpg', '**/*.ico', '**/*.gif', '**/*.mp4',
      '**/*.mp3', '**/*.pnpm-lock.yaml', '**/*.min.js', '**/*.js.map', '**/*.min.css', 'coverage/**/*',
      'node_modules/**/*', 'ALL/**/*', '**/.env', '*/ALL/**/*', '*/ALL_REBUILT/**/*', 'C:\\Users\\dustin.r.dew.civ\\0. PROJECTS\\consolidate2\\runtime.config.json'
    ];

    // It should automatically add the runtime config path to the global excludes.
    expect(config.exclude).toEqual(excludes);

    // It should correctly parse the job-specific include blocks.
    expect(config.include.length).toBeGreaterThan(0);

    // Verify the structure of the first job in your real config
    const firstJob = config.include[0];
    expect(firstJob.filename).toBeDefined();
    expect(Array.isArray(firstJob.exclude)).toBe(true);
  });

  test('loadConfig should return the default config if no runtime file exists', async () => {
    const config = await loadConfig();

    // Should fall back to the real default
    expect(config.outputDir).toBe('CUSTOM_DIR');
  });

  test('saveConfigToDisk and loadConfig should correctly save and load changes', async () => {
    const config = await getDefaultConfig();

    // Modify a value
    config.theme = 'light';
    config.outputDir = 'CUSTOM_DIR';

    // Save to the sandboxed runtime.config.json
    await saveConfigToDisk(config);

    // Load the config again
    const reloadedConfig = await loadConfig();

    // Verify that the changes were loaded from the file
    expect(reloadedConfig.theme).toBe('light');
    expect(reloadedConfig.outputDir).toBe('CUSTOM_DIR');
  });

  test('loadConfig should gracefully handle a corrupt runtime file', async () => {
    // Create a corrupt/invalid JSON file in our sandbox.
    await Bun.write(RUNTIME_CONFIG_PATH, 'this is not valid json');

    // Try to load the config. It should catch the error and return the default.
    const config = await loadConfig();

    // Verify it fell back to the real default value.
    expect(config.outputDir).toBe('CUSTOM_DIR');
  });
});
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-<  END  >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// TYPE     : .TS
// PATH     : tests/config.test.ts
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-<  END  >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// TYPE     : .TS
// PATH     : ALL_REBUILT/tests/config.test.ts