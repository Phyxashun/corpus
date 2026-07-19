// FILE-PATH: src/components/Config.ts
import path from 'path';
import type { Config, IncludePattern, RawIncludePattern, RawTomlConfig } from '../types';
import { Constants } from './Constants';
import type { ThemeMode } from './Theme';

/**
 * CONSTANTS
 */
const RUNTIME_CONFIG_PATH = Constants.RUNTIME_CONFIG_PATH;
const BASE_CONFIG_PATH = path.join(import.meta.dir, '../config/config.toml');
const CONFIG_KEYS = ['theme', 'outputDir', 'rebuiltDir', 'exclude', 'include'] as const;

/**
 * MAIN FUNCTIONS
 */
export function assignKey<T, K extends keyof T>(target: T, source: Partial<T>, key: K): void {
  const value = source[key];
  if (value !== undefined) {
    target[key] = value;
  }
}

export async function getDefaultConfig(): Promise<Config> {
  const tomlText = await Bun.file(BASE_CONFIG_PATH).text();

  // Cast directly to the strict intermediate type structure instead of 'any'
  const parsedConfig = Bun.TOML.parse(tomlText) as unknown as RawTomlConfig;

  const parsedInclude = Array.isArray(parsedConfig.include) ? parsedConfig.include : [];
  const parsedExclude = Array.isArray(parsedConfig.exclude) ? parsedConfig.exclude : [];

  // Preserve job-specific excludes safely without any runtime type-stripping leaks
  const mappedIncludes: IncludePattern[] = parsedInclude.map((inc: RawIncludePattern) => ({
    filename: inc.filename ?? 'untitled.txt',
    description: inc.description ?? '',
    include: Array.isArray(inc.include) ? inc.include : [],
    exclude: Array.isArray(inc.exclude) ? inc.exclude : []
  }));

  return {
    theme: (parsedConfig.theme === 'light' ? 'light' : 'dark') as ThemeMode,
    outputDir: parsedConfig.outputDir ?? './output',
    rebuiltDir: parsedConfig.rebuiltDir ?? './rebuilt',
    exclude: [...parsedExclude, RUNTIME_CONFIG_PATH],
    include: mappedIncludes,
  };
}

export async function loadConfig(): Promise<Config> {
  const configFile = Bun.file(RUNTIME_CONFIG_PATH);
  const tomlConfig = await getDefaultConfig();

  if (!(await configFile.exists())) return tomlConfig;

  try {
    // Deep clone using the strict Config structural schema target type
    const userConfig: Config = JSON.parse(JSON.stringify(tomlConfig)) as Config;
    const parsed = await configFile.json() as Partial<Config>;

    CONFIG_KEYS.forEach((key) => {
      assignKey(userConfig, parsed, key);
    });

    return userConfig;
  } catch {
    return tomlConfig;
  }
}

export async function saveConfigToDisk(config: Config): Promise<void> {
  await Bun.write(RUNTIME_CONFIG_PATH, JSON.stringify(config, null, 2));
}
