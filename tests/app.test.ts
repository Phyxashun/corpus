// FILE-PATH: tests/app.test.ts

import { beforeEach, describe, expect, spyOn, test, type Mock } from 'bun:test';
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
    selectMock.mockClear();
    confirmMock.mockClear();
    outroMock.mockClear();
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
    // 1. Simulate the user's choices in sequence
    selectMock
      .mockResolvedValueOnce('settings') // First, choose 'settings'
      .mockResolvedValueOnce('exit');     // On the next loop, choose 'exit'

    // 2. After the settings command runs, simulate the user pressing Enter to continue.
    confirmMock.mockResolvedValueOnce(true);

    // 3. Spy on the prototype to catch the execution of the Settings command.
    const settingsSpy = spyOn(Settings.prototype, 'execute').mockResolvedValue(undefined);
    const exitSpy = spyOn(Exit.prototype, 'execute').mockResolvedValue(undefined);

    // 4. Run the app with the dummy exit function.
    await App.run(() => { });

    // 5. Verify the sequence of events.
    expect(settingsSpy).toHaveBeenCalledTimes(1); // Settings was run
    expect(confirmMock).toHaveBeenCalledTimes(1); // The user was asked to continue
    expect(exitSpy).toHaveBeenCalledTimes(1);     // The exit command was run at the end

    settingsSpy.mockRestore();
    exitSpy.mockRestore();
  });

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
