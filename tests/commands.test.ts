// FILE-PATH: tests/commands.test.ts

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Consolidate } from '../src/commands/Consolidate';
import { Deconsolidate } from '../src/commands/Deconsolidate';
import { getDefaultConfig } from '../src/components/Config';
import { DarkTheme } from '../src/components/Theme';
import type { Config } from '../src/types';
import { cleanupSandbox, createSandbox } from './setup';

const SANDBOX = './test-sandbox-cmds';

describe('Core Commands (Consolidate & Deconsolidate)', () => {
  const originalCwd = process.cwd();
  let testConfig: Config;

  beforeEach(async () => {
    await createSandbox(SANDBOX);
    process.chdir(SANDBOX); // Run inside the sandbox

    testConfig = await getDefaultConfig();
    testConfig.outputDir = 'OUT';
    testConfig.rebuiltDir = 'REBUILT';

    // Add a job with a specific exclude to prove job-specific excludes work
    testConfig.include = [
      {
        filename: 'code.txt',
        include: ['src/**/*.ts'],
        exclude: ['**/ignore-me.ts']
      }
    ];

    // Create dummy files
    await Bun.$`mkdir -p src/utils`;
    await Bun.write('src/index.ts', 'console.log("hello");');
    await Bun.write('src/utils/ignore-me.ts', '// excluded file');
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await cleanupSandbox(SANDBOX);
  });

  test('Should consolidate and deconsolidate files accurately', async () => {
    const deps = { theme: DarkTheme, config: testConfig };

    // 1. Run Consolidate
    const consolidateCmd = new Consolidate(deps);
    await consolidateCmd.execute();

    // 2. Verify Consolidate
    const manifestPath = join('OUT', 'manifest.json');
    expect(existsSync(manifestPath)).toBe(true);

    const manifest = await Bun.file(manifestPath).json();
    const codeFiles = manifest.files['code.txt'];

    // Ensure job-specific exclude worked
    expect(codeFiles).toContain('src/index.ts');
    expect(codeFiles).not.toContain('src/utils/ignore-me.ts');

    // 3. Run Deconsolidate
    const deconsolidateCmd = new Deconsolidate(deps);
    await deconsolidateCmd.execute();

    // 4. Verify Deconsolidate
    const rebuiltIndex = join('REBUILT', 'src', 'index.ts');
    const rebuiltIgnored = join('REBUILT', 'src', 'utils', 'ignore-me.ts');

    const result = `// TYPE     : .TS
// PATH     : src/index.ts
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-< START >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
console.log("hello");
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-<  END  >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// TYPE     : .TS
// PATH     : src/index.ts`;

    expect(await Bun.file(rebuiltIndex).text()).toBe(result);
    expect(existsSync(rebuiltIgnored)).toBe(false);
  });

  test('logs an error and exits early if no manifest exists', async () => {
    const deconsolidateCmd = new Deconsolidate({ theme: DarkTheme, config: testConfig });
    await deconsolidateCmd.execute(); // no consolidate run first → no manifest.json
  });

  test('skips a job whose source .txt file is missing', async () => {
    // consolidate normally, then delete one of the output .txt files before deconsolidating
    await new Consolidate({ theme: DarkTheme, config: testConfig }).execute();
    await Bun.$`rm ${join('OUT', 'code.txt')}`;
    await new Deconsolidate({ theme: DarkTheme, config: testConfig }).execute();
  });
});
