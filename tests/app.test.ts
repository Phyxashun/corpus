// FILE-PATH: tests/app.test.ts

import { afterEach, beforeEach, describe, expect, mock, spyOn, test, type Mock } from 'bun:test';
import { Settings } from '../src/commands/Settings';
import App from '../src/components/App';
import './setup'; // Load global mocks

// Use standard imports for the mocked library, adding `confirm`
import { confirm, outro, select } from '@clack/prompts';
import { Exit } from '../src/commands/Exit';

// Define the function signatures to create strongly-typed mocks
type SelectSig = typeof select;
type ConfirmSig = typeof confirm;
type OutroSig = typeof outro;

// Cast the imports to their proper Mock types
const selectMock = select as Mock<SelectSig>;
const confirmMock = confirm as Mock<ConfirmSig>;
const outroMock = outro as Mock<OutroSig>;

describe('Application Orchestrator (App.ts)', () => {

  beforeEach(() => {
    // Reset all mock call counts before each test
    selectMock.mockReset();
    confirmMock.mockReset();
    outroMock.mockReset();
  });

  afterEach(() => {
    mock.restore(); // restores every spyOn() created in this test, pass or fail
  });

  test('Should exit gracefully when user selects "Exit" from the main menu', async () => {
    // 1. Simulate the user selecting 'exit' from the main menu
    selectMock.mockResolvedValueOnce('exit');

    // Spy on the Exit command's execute method to ensure it's called.
    const exitSpy = spyOn(Exit.prototype, 'execute').mockResolvedValue(undefined);

    // 2. Run the app with a dummy exit function to prevent the test process from terminating.
    await App.run(() => { });

    // 3. Verify that the Exit command was executed at the end of the lifecycle.
    expect(exitSpy).toHaveBeenCalled();

    exitSpy.mockRestore();
  });

  test('Should route to a command, then return to the menu, then exit', async () => {
    selectMock
      .mockResolvedValueOnce('settings')
      .mockResolvedValueOnce('exit');

    const settingsSpy = spyOn(Settings.prototype, 'execute').mockResolvedValue(undefined);
    const exitSpy = spyOn(Exit.prototype, 'execute').mockResolvedValue(undefined);

    await App.run(() => { });

    expect(settingsSpy).toHaveBeenCalledTimes(1);
    expect(confirmMock).not.toHaveBeenCalled(); // Settings bypasses the confirm prompt
    expect(exitSpy).toHaveBeenCalledTimes(1);
  }, 5000); // bun test's third arg — ms before it force-fails

  test('Should run a command and then exit if user declines to return to menu', async () => {
    // 1. Simulate user choosing 'settings'.
    selectMock.mockResolvedValueOnce('settings');

    // 2. Simulate user pressing "No" on the "return to menu" prompt.
    confirmMock.mockResolvedValueOnce(false);

    const settingsSpy = spyOn(Settings.prototype, 'execute').mockResolvedValue(undefined);
    const exitSpy = spyOn(Exit.prototype, 'execute').mockResolvedValue(undefined);

    // 3. Run the app.
    await App.run(() => { });

    // 4. Verify the sequence.
    expect(settingsSpy).toHaveBeenCalledTimes(1); // Settings command ran.
    expect(exitSpy).toHaveBeenCalledTimes(1); // The loop terminated and the exit command ran.

    settingsSpy.mockRestore();
    exitSpy.mockRestore();
  });

  test('Should handle user cancelling the main menu (Ctrl+C)', async () => {
    // 1. Simulate user pressing Ctrl+C at the main menu.
    selectMock.mockResolvedValueOnce(Symbol.for('cancel'));

    const exitSpy = spyOn(Exit.prototype, 'execute').mockResolvedValue(undefined);

    // 2. Run the app.
    await App.run(() => { });

    // 3. Verify the loop was broken and the final exit command was called.
    expect(exitSpy).toHaveBeenCalled();

    exitSpy.mockRestore();
  });
});
