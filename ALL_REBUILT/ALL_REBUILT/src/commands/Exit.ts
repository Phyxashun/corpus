// TYPE     : .TS
// PATH     : ALL_REBUILT/src/commands/Exit.ts
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-< START >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// TYPE     : .TS
// PATH     : src/commands/Exit.ts
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-< START >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// FILE-PATH: src/commands/Exit.ts

import { outro } from '@clack/prompts';
import type { ExitDeps, Theme } from '../types';
import { Command } from './Command';

/**
 * CONSTANTS
 */
const STRINGS = {
  key: 'exit',
  label: 'Exit Program',
  hint: 'Terminate CLI process',
  goodbye: 'Exiting CLI tool. System process ended.',
} as const;

/**
 * CONSOLIDATE CLASS
 */
export class Exit extends Command {
  private theme: Theme;
  readonly key = STRINGS.key;
  readonly label: string;
  readonly hint: string;

  private readonly exitProcess: (code?: number) => void;

  constructor(deps: ExitDeps) {
    super(deps);
    this.theme = deps.theme;

    this.label = `${this.theme(STRINGS.label).secondary}`;
    this.hint = `${this.theme(STRINGS.hint).secondary}`;

    this.exitProcess = deps.exit ?? process.exit;
  }

  async execute(): Promise<void> {
    outro(this.theme(STRINGS.goodbye).primary.muted);

    this.exitProcess(0);
  }
}
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-<  END  >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// TYPE     : .TS
// PATH     : src/commands/Exit.ts
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-<  END  >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// TYPE     : .TS
// PATH     : ALL_REBUILT/src/commands/Exit.ts