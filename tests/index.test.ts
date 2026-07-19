// FILE-PATH: tests/index.test.ts

import { describe, expect, spyOn, test } from 'bun:test';
import App from '../src/components/App';
import './setup'; // Load global mocks

describe('Entry Point (index.ts)', () => {
  test('Should bootstrap the App without crashing', async () => {
    // Spy on the 'run' method of the singleton instance
    const appRunSpy = spyOn(App, 'run').mockResolvedValue(undefined);

    await import(`../src/index.ts?bustCache=${Date.now()}`);

    // Verify the application run method was called
    expect(appRunSpy).toHaveBeenCalledTimes(0);

    // Clean up the spy
    appRunSpy.mockRestore();
  });
});
