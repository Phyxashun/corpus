// FILE-PATH: tests/preload.ts

import { mock } from 'bun:test';
import path from 'path';

// Import the real module we want to partially mock.
import * as OriginalConstantsModule from '../src/components/Constants';

// Define the sandboxed path that all tests will use.
const SANDBOX_DIR = './test-sandbox';
const RUNTIME_CONFIG_PATH = path.join(process.cwd(), SANDBOX_DIR, 'runtime.config.json');

// This mock is now global. Any import of Constants.ts in any test file
// will receive this mocked version.
mock.module('../src/components/Constants.ts', () => {
  return {
    // Spread the original exports to preserve all of them.
    ...OriginalConstantsModule,
    // Then, override just the specific constant we need to control for tests.
    Constants: {
      ...OriginalConstantsModule.Constants,
      RUNTIME_CONFIG_PATH: RUNTIME_CONFIG_PATH,
    },
  };
});
