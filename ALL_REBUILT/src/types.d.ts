// TYPE     : .TS
// PATH     : src/types.d.ts
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-< START >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// FILE-PATH: src/types.d.ts

import type { Config, IncludePattern } from './components/Config';
import type { Theme, ThemeMode } from './components/Theme';

export { Config, IncludePattern, Theme, ThemeMode };


export interface MainMenuOptions {
  value: string;
  label: string;
  hint?: string;
}

/**
 * Represents the application's global state, including the
 * active theme and the loaded configuration.
 */
export interface State {
  theme: Theme;
  config: Config;
}

/**
 * Defines the interface for the abstract Command class
 */
export interface ICommand {
  readonly key: string;
  //static readonly label: string;
  //static readonly hint: string;
  execute(): Promise<void>;
}

/**
 * Defines the dependencies required by the Consolidate command.
 */
export type ConsolidateDeps = State;

/**
 * Defines the dependencies required by the Deconsolidate command.
 */
export type DeconsolidateDeps = State;

export interface DirectoryPreset {
  out: string;
  rebuilt: string;
}

export type ExcludePreset = MainMenuOptions;

export interface PresetsStructure {
  directory: Record<string, DirectoryPreset[]>;
  exclude_options: ExcludePreset[];
}

/**
 * Defines the dependencies required by the Settings command,
 * including callbacks to modify the application state.
 */
export interface SettingsDeps extends State {
  saveConfig: () => Promise<void>;
  updateTheme: (type: ThemeMode) => void;
}

/**
 * Defines the structure of the manifest file, which tracks
 * consolidated files and empty directories.
 */
export interface Manifest {
  files: Record<string, string[]>;
  emptyDirectories: string[];
}

export interface IncludePattern {
  readonly filename: string;
  readonly description: string;
  readonly include: readonly string[];
  readonly exclude: readonly string[];
}

export interface Config {
  theme: ThemeMode;
  outputDir: string;
  rebuiltDir: string;
  exclude: string[];
  include: IncludePattern[];
}

/**
 * STRICT INTERMEDIATE INTERFACES FOR TYPE-SAFE PARSING
 */
export interface RawIncludePattern {
  filename?: string;
  description?: string;
  include?: string[];
  exclude?: string[];
}

export interface RawTomlConfig {
  theme?: string;
  outputDir?: string;
  rebuiltDir?: string;
  exclude?: string[];
  include?: RawIncludePattern[];
}

/**
 * Defines the dependencies required by the Exit command.
 */
export interface ExitDeps extends State {
  exit: (code?: number) => void;
}
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-<  END  >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// TYPE     : .TS
// PATH     : src/types.d.ts