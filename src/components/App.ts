// FILE-PATH: src/components/App.ts
import * as CLACK from '@clack/prompts';
import type { Command } from '../commands/Command';
import { Consolidate } from '../commands/Consolidate';
import { Deconsolidate } from '../commands/Deconsolidate';
import { Exit } from '../commands/Exit';
import { Settings } from '../commands/Settings';
import type { MainMenuOptions, State } from '../types';
import { loadConfig, saveConfigToDisk } from './Config';
import { DarkTheme, LightTheme, type ThemeMode } from './Theme';

/**
 * CONSTANTS
 */
const STRINGS = {
  dark: 'dark',
  light: 'light',
  exit: 'exit',
  title: ' CODEBASE CORPUS CONSOLIDATOR UTILITY ',
  mainMenu: 'Main Menu:',
  returnToMenu: 'Press Enter to return to main panel...',
} as const;

/**
 * APP CLASS
 */
export class Application {
  private static instance: Application | null = null;
  private state!: State;
  private commands: Command[] = [];
  private mainMenuOptions: MainMenuOptions[] = [];

  private constructor() { }

  public static getInstance(): Application {
    if (!this.instance) {
      this.instance = new Application();
    }
    return this.instance;
  }

  private saveConfig = async (): Promise<void> => {
    await saveConfigToDisk(this.state.config);
  };

  private updateTheme = (type: ThemeMode): void => {
    this.state.theme = type === STRINGS.light ? LightTheme : DarkTheme;

    // Type Safe Upgraded Boundary: Cast and execute safely via exposed public method
    const settingsCmd = this.commands.find((cmd): cmd is Settings => cmd instanceof Settings);
    if (settingsCmd) {
      settingsCmd.updateThemeContext(this.state.theme);
    }
  };

  public async init(exitFn: (code?: number) => void): Promise<void> {
    // Load configuration
    const config = await loadConfig();

    // Set the current state
    this.state = {
      config,
      theme: config.theme === STRINGS.light ? LightTheme : DarkTheme
    };

    // Load all Commands
    this.commands = [
      new Consolidate(this.state),
      new Deconsolidate(this.state),
      new Settings({ ...this.state, saveConfig: this.saveConfig, updateTheme: this.updateTheme }),
      new Exit({ ...this.state, exit: exitFn }),
    ];

    // Load all main menu options by mapping commands and
    // appending the exit option cleanly using spread
    this.mainMenuOptions = [
      ...this.commands.map(cmd => ({
        value: cmd.key,
        label: cmd.label,
        hint: cmd.hint
      }))
    ];
  }

  public async run(exitFn?: (code?: number) => void): Promise<void> {
    // Initialize the app
    await this.init(exitFn ?? process.exit);

    // Main Menu Loop
    let shouldContinue = true;
    while (shouldContinue) {
      console.clear();
      CLACK.intro(this.state.theme.title(STRINGS.title));

      const choice = await CLACK.select({
        message: this.state.theme(STRINGS.mainMenu).info,
        options: this.mainMenuOptions,
      });

      // If user cancels (Ctrl+C) or chooses 'exit', break the loop.
      if (CLACK.isCancel(choice) || choice === STRINGS.exit) {
        shouldContinue = false;
        break;
      }

      const command = this.commands.find(cmd => cmd.key === choice);
      if (command) {
        console.clear();
        await command.execute();

        // UI Performance Optimization: Bypass redundant extra confirmations
        // when returning cleanly out of Settings configuration flows
        if (command instanceof Settings) {
          continue;
        }

        // After operational processing commands run, ask if the user wants to continue.
        const wantsToReturn = await CLACK.confirm({
          message: STRINGS.returnToMenu,
        });

        // If they cancel or say no, break the loop.
        if (CLACK.isCancel(wantsToReturn) || !wantsToReturn) {
          shouldContinue = false;
        }
      }
    }

    // The Exit command's execute method is called ONCE, at the very end.
    const exitCmd = this.commands.find((cmd): cmd is Exit => cmd instanceof Exit);
    if (exitCmd) {
      await exitCmd.execute();
    }
  }
}

const App = Application.getInstance();
export default App;
