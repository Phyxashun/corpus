// FILE-PATH: tests/settings.test.ts

import { confirm, select } from '@clack/prompts';
import { beforeEach, describe, expect, mock, test, type Mock } from 'bun:test';
import { Settings } from '../src/commands/Settings';
import { getDefaultConfig } from '../src/components/Config';
import { DarkTheme } from '../src/components/Theme';
import type { State } from '../src/types';
import './setup'; // Global mocks

type SelectSig = typeof select;
type ConfirmSig = typeof confirm;

const selectMock = select as Mock<SelectSig>;
const confirmMock = confirm as Mock<ConfirmSig>;

describe('Settings Command', () => {
  // Strictly typed state
  let mockState: State;

  // Strictly typed mock functions
  let saveConfigMock: Mock<() => Promise<void>>;
  let updateThemeMock: Mock<(theme: 'light' | 'dark') => void>;

  beforeEach(async () => {
    selectMock.mockClear();
    confirmMock.mockClear();

    // Create typed mock functions directly
    saveConfigMock = mock(async () => { });
    updateThemeMock = mock((_theme: 'light' | 'dark') => { });

    mockState = {
      config: await getDefaultConfig(),
      theme: DarkTheme,
    };
  });

  test('Should allow changing the theme and saving', async () => {
    selectMock
      .mockResolvedValueOnce('theme') // Select Theme menu
      .mockResolvedValueOnce('light') // Choose Light theme
      .mockResolvedValueOnce('back'); // Go back to main settings menu

    confirmMock.mockResolvedValueOnce(true); // Confirm save

    // Use the spread syntax as you designed it
    const cmd = new Settings({
      ...mockState,
      saveConfig: saveConfigMock,
      updateTheme: updateThemeMock
    });

    await cmd.execute();

    expect(updateThemeMock).toHaveBeenCalledWith('light');
    expect(saveConfigMock).toHaveBeenCalled();
  });

  test('Should cancel settings without saving', async () => {
    selectMock
      .mockResolvedValueOnce('theme')
      .mockResolvedValueOnce('light')
      .mockResolvedValueOnce('back');

    confirmMock.mockResolvedValueOnce(false); // Decline save

    const cmd = new Settings({
      ...mockState,
      saveConfig: saveConfigMock,
      updateTheme: updateThemeMock
    });

    await cmd.execute();

    expect(saveConfigMock).not.toHaveBeenCalled(); // Ensure save was skipped
  });
});
