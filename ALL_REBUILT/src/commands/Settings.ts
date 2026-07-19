// TYPE     : .TS
// PATH     : src/commands/Settings.ts
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-< START >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// FILE-PATH: src/commands/Settings.ts
import { confirm, intro, isCancel, log, multiselect, note, select } from '@clack/prompts';
import { getDefaultConfig } from '../components/Config';
import Presets from '../config/presets.toml';
import type { Config, DirectoryPreset, ExcludePreset, PresetsStructure, SettingsDeps, Theme, ThemeMode } from '../types';
import { Command } from './Command';

/**
 * CONSTANTS
 */
const STRINGS = {
  title: ' RUNTIME SETTINGS MANAGEMENT PANEL ',
  subtitle: 'Select an environment item to adjust:',
  key: 'settings',
  label: 'App Settings Configuration',
  hint: 'Modify settings',
  optTheme: 'Switch Visual Theme Style',
  optDirs: 'Select Preset Workspace Folders',
  optGlobs: 'Manage Global Exclusion Rules',
  optReset: 'Reset Application to Defaults',
  optBack: 'Return to Main Control Menu',
  themePrompt: 'Choose an interface theme style:',
  themeDark: 'Dark Mode (High Contrast Cyan)',
  themeLight: 'Light Mode (Classic Bold Blue)',
  themeSuccess: 'Theme updated successfully!',
  dirPrompt: 'Select an active directory profile configuration:',
  dirPresetStandard: 'Standard Mapping (ALL / ALL_REBUILT)',
  dirPresetMirror: 'Mirror Mapping (DIST / DIST_REBUILT)',
  dirPresetHidden: 'Hidden Dot-Mapping (.archive / .restored)',
  dirSuccess: 'Workspace target routing profile applied.',
  globPrompt: 'Toggle path filters (Space to toggle, Enter to confirm):',
  globSuccess: 'Exclusion rules successfully synced with configuration.',
  cardTitle: 'STAGED CHANGES SUMMARY',
  cardConfirmMessage: 'Apply and save these settings to disk?',
  cardSaved: 'Configuration permanently written to disk.',
  cardCancelled: 'Changes discarded. Reverted to previous settings.',
  resetTitle: 'FACTORY RESET RUNTIME CONFIGURATION',
  resetPrompt: 'Are you absolutely sure you want to restore defaults?',
  resetSuccess: 'System preferences completely restored to defaults.',
  resetAborted: 'Reset sequence cancelled. Core profile intact.',
} as const;

const PRESETS: PresetsStructure = {
  directory: Presets.directory,
  exclude_options: Presets.exclude_options,
} as const;

/**
 * SETTINGS CLASS
 */
export class Settings extends Command {
  readonly key = STRINGS.key;
  readonly label = STRINGS.label;
  readonly hint = STRINGS.hint;
  private deps: SettingsDeps;

  constructor(deps: SettingsDeps) {
    super(deps);
    this.deps = deps;
  }

  // Main Method: Orchestrates the settings flow
  async execute(): Promise<void> {
    const stagedConfig = structuredClone(this.deps.config);
    let hasChanges = false;

    while (true) {
      console.clear();
      intro(this.deps.theme.primary(STRINGS.title));

      const choice = await select({
        message: STRINGS.subtitle,
        options: [
          { value: 'theme', label: STRINGS.optTheme, hint: `[ ${stagedConfig.theme} ]` },
          { value: 'dirs', label: STRINGS.optDirs, hint: `Out: ${stagedConfig.outputDir} | In: ${stagedConfig.rebuiltDir}` },
          { value: 'globs_ex', label: STRINGS.optGlobs, hint: `${stagedConfig.exclude.length} targets active` },
          { value: 'reset', label: STRINGS.optReset, hint: '⚠️ Restore factory configuration' },
          { value: 'back', label: STRINGS.optBack, hint: hasChanges ? '👉 Review Staged Changes' : '' }
        ]
      });

      if (isCancel(choice) || choice === 'back') break;

      let changeMade = false;

      switch (choice) {
        case 'theme':
          changeMade = await this._handleThemeChange(stagedConfig);
          break;
        case 'dirs':
          changeMade = await this._handleDirectoryChange(stagedConfig);
          break;
        case 'globs_ex':
          changeMade = await this._handleGlobChange(stagedConfig);
          break;
        case 'reset':
          changeMade = await this._handleFactoryReset(stagedConfig);
          break;
      }

      hasChanges = hasChanges || changeMade;
      if (choice === 'reset' && changeMade) break;
    }

    if (hasChanges) {
      await this._confirmAndSaveChanges(stagedConfig);
    }
  }

  public updateThemeContext(newTheme: Theme): void {
    this.deps.theme = newTheme;
  }

  // Helper Methods for Each Setting
  private async _handleThemeChange(stagedConfig: Config): Promise<boolean> {
    const selectedTheme = await select<ThemeMode>({
      message: STRINGS.themePrompt,
      options: [
        { value: 'dark', label: STRINGS.themeDark },
        { value: 'light', label: STRINGS.themeLight }
      ]
    });

    if (isCancel(selectedTheme) || stagedConfig.theme === selectedTheme) {
      return false;
    }

    stagedConfig.theme = selectedTheme;
    return true;
  }

  private async _handleDirectoryChange(stagedConfig: Config): Promise<boolean> {
    const presetKey = await select<string>({
      message: STRINGS.dirPrompt,
      options: Object.entries(PRESETS.directory).map(([key, profiles]) => {
        const profile = (profiles as DirectoryPreset[])[0];
        return { value: key, label: `${profile!.out} / ${profile!.rebuilt} (${key})` };
      })
    });

    if (isCancel(presetKey)) return false;

    const profile = (PRESETS.directory[presetKey] as DirectoryPreset[] | undefined)?.[0];
    if (!profile) return false;

    if (stagedConfig.outputDir === profile.out && stagedConfig.rebuiltDir === profile.rebuilt) {
      return false;
    }

    stagedConfig.outputDir = profile.out;
    stagedConfig.rebuiltDir = profile.rebuilt;
    return true;
  }

  private async _handleGlobChange(stagedConfig: Config): Promise<boolean> {
    const updatedSelection = await multiselect({
      message: STRINGS.globPrompt,
      options: PRESETS.exclude_options.map((opt: ExcludePreset) => ({
        value: opt.value,
        label: opt.label,
        hint: opt.hint
      })),
      initialValues: stagedConfig.exclude,
      required: false,
    });

    if (isCancel(updatedSelection)) return false;

    const selectedList = updatedSelection as string[];

    if (stagedConfig.exclude.length === selectedList.length && stagedConfig.exclude.every((val, idx) => val === selectedList[idx])) {
      return false;
    }

    stagedConfig.exclude = selectedList;
    return true;
  }

  private async _handleFactoryReset(stagedConfig: Config): Promise<boolean> {
    note(
      `Visual Theme: dark\nOutput Location: /ALL\nRebuilt Location: /ALL_REBUILT`,
      STRINGS.resetTitle
    );

    const confirmReset = await confirm({ message: STRINGS.resetPrompt });

    if (isCancel(confirmReset) || !confirmReset) {
      log.warn(STRINGS.resetAborted);
      await Bun.sleep(1000);
      return false;
    }

    // Unwrapped Async Reference Bug Fix
    const defaultData = await getDefaultConfig();
    Object.assign(stagedConfig, defaultData);

    log.success(STRINGS.resetSuccess);
    await Bun.sleep(1000);
    return true;
  }

  private async _confirmAndSaveChanges(stagedConfig: Config): Promise<void> {
    console.clear();
    note(
      `Visual Theme: ${stagedConfig.theme.toUpperCase()}\nOutput Location: /${stagedConfig.outputDir}\nRebuilt Location: /${stagedConfig.rebuiltDir}\nActive Excludes: ${stagedConfig.exclude.length} rule(s) configured`,
      STRINGS.cardTitle
    );

    const confirmSave = await confirm({ message: STRINGS.cardConfirmMessage });

    if (isCancel(confirmSave) || !confirmSave) {
      log.warn(STRINGS.cardCancelled);
      await Bun.sleep(1200);
      return;
    }

    Object.assign(this.deps.config, stagedConfig);
    this.deps.updateTheme(stagedConfig.theme as ThemeMode);
    await this.deps.saveConfig();

    log.success(STRINGS.cardSaved);
    await Bun.sleep(1200);
  }
}
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-<  END  >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// TYPE     : .TS
// PATH     : src/commands/Settings.ts