/* eslint-disable @typescript-eslint/no-explicit-any */
// FILE-PATH: tests/setup.ts

import { mock } from 'bun:test';

// Globally mock @clack/prompts so tests don't hang waiting for user input
mock.module('@clack/prompts', () => ({
  intro: mock(),
  outro: mock(),
  box: mock(),
  note: mock(),
  text: mock(),
  select: mock(),
  confirm: mock(),
  multiselect: mock(),
  cancel: mock(),   // ← add this
  isCancel: (val: any) => val === Symbol.for('cancel'),
  spinner: () => ({ start: mock(), stop: mock(), message: mock() }),
  tasks: mock(async (tasks) => {
    for (const t of tasks) {
      if (typeof t.task === 'function') await t.task();
    }
  }),
  log: {
    success: mock(),
    warn: mock(),
    error: mock(),
    info: mock(),
    step: mock(),
    message: mock()
  },
}));

// Utility functions for sandbox management
import { mkdir, rm } from 'node:fs/promises';

export async function createSandbox(dir: string) {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
}

export async function cleanupSandbox(dir: string) {
  await rm(dir, { recursive: true, force: true });
}
