// FILE-PATH: src/commands/Command.ts

import type { ICommand } from '../types';

/**
 * ABSTRACT COMMAND CLASS
 */
export abstract class Command implements ICommand {
  abstract readonly key: string;
  abstract readonly label: string;
  abstract readonly hint: string;

  /**
   * The constructor is a generic placeholder.
   * Each command will define its own dependency interface.
   */
  constructor(_deps: unknown) { }

  abstract execute(): Promise<void>;
}
