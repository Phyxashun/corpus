import { confirm, select } from '@clack/prompts';
import { afterEach, beforeEach, describe, expect, mock, test, type Mock } from 'bun:test';
import { HeaderComments } from '../src/utils/HeaderComments';
import { cleanupSandbox, createSandbox } from './setup';

const SANDBOX = './test-sandbox-headers';
const selectMock = select as Mock<typeof select>;
const confirmMock = confirm as Mock<typeof confirm>;

const mkApp = () =>
  new HeaderComments({
    theme: { primary: (t) => t, success: (t) => t, error: (t) => t, muted: (t) => t },
    config: { outputDir: 'OUT', exclude: ['**/skip-me.ts'] },
  });

describe('HeaderComments.enforceHeaderComments', () => {
  beforeEach(async () => await createSandbox(SANDBOX));
  afterEach(async () => await cleanupSandbox(SANDBOX));

  test('does nothing if header is already present', async () => {
    const p = `${SANDBOX}/a.ts`;
    await Bun.write(p, `// FILE-PATH: a.ts\nconsole.log(1);`);
    const res = await mkApp().enforceHeaderComments(p);
    expect(res.modified).toBe(false);
  });

  test('injects header after shebang line, with trailing content', async () => {
    const p = `${SANDBOX}/b.ts`;
    await Bun.write(p, `#!/usr/bin/env bun\nconsole.log(1);`);
    const res = await mkApp().enforceHeaderComments(p);
    expect(res.modified).toBe(true);
    expect(await Bun.file(p).text()).toContain('#!/usr/bin/env bun\n// FILE-PATH:');
  });

  test('injects header after shebang line with no trailing content', async () => {
    const p = `${SANDBOX}/c.ts`;
    await Bun.write(p, `#!/usr/bin/env bun`);
    const res = await mkApp().enforceHeaderComments(p);
    expect(res.modified).toBe(true);
  });

  test('prepends header when there is no shebang and file has content', async () => {
    const p = `${SANDBOX}/d.ts`;
    await Bun.write(p, `console.log(1);`);
    const res = await mkApp().enforceHeaderComments(p);
    expect(res.modified).toBe(true);
    expect(await Bun.file(p).text()).toStartWith('// FILE-PATH:');
  });

  test('prepends header when the file is empty', async () => {
    const p = `${SANDBOX}/e.ts`;
    await Bun.write(p, '');
    const res = await mkApp().enforceHeaderComments(p);
    expect(res.modified).toBe(true);
  });
});

describe('HeaderComments.removeHeaderComments', () => {
  beforeEach(async () => await createSandbox(SANDBOX));
  afterEach(async () => await cleanupSandbox(SANDBOX));

  test('does nothing if header is absent', async () => {
    const p = `${SANDBOX}/f.ts`;
    await Bun.write(p, `console.log(1);`);
    const res = await mkApp().removeHeaderComments(p);
    expect(res.modified).toBe(false);
  });

  test('strips header on the second line (after a shebang)', async () => {
    const p = `${SANDBOX}/g.ts`;
    await Bun.write(p, `#!/usr/bin/env bun\n// FILE-PATH: g.ts\nconsole.log(1);`);
    const res = await mkApp().removeHeaderComments(p);
    expect(res.modified).toBe(true);
    expect(await Bun.file(p).text()).not.toContain('FILE-PATH');
  });

  test('strips header found later in the file (after a shebang)', async () => {
    const p = `${SANDBOX}/h.ts`;
    await Bun.write(p, `#!/usr/bin/env bun\nconsole.log(1);\n// FILE-PATH: h.ts\n`);
    const res = await mkApp().removeHeaderComments(p);
    expect(res.modified).toBe(true);
    expect(await Bun.file(p).text()).not.toContain('FILE-PATH');
  });

  test('strips header on the first line (no shebang)', async () => {
    const p = `${SANDBOX}/i.ts`;
    await Bun.write(p, `// FILE-PATH: i.ts\nconsole.log(1);`);
    const res = await mkApp().removeHeaderComments(p);
    expect(res.modified).toBe(true);
  });

  test('strips header found later in the file (no shebang)', async () => {
    const p = `${SANDBOX}/j.ts`;
    await Bun.write(p, `console.log(1);\n// FILE-PATH: j.ts\n`);
    const res = await mkApp().removeHeaderComments(p);
    expect(res.modified).toBe(true);
    expect(await Bun.file(p).text()).not.toContain('FILE-PATH');
  });
});

describe('HeaderComments.execute', () => {
  beforeEach(async () => {
    await createSandbox(SANDBOX);
    selectMock.mockClear();
    confirmMock.mockClear();
  });
  afterEach(async () => await cleanupSandbox(SANDBOX));

  test('aborts when user picks "exit"', async () => {
    selectMock.mockResolvedValueOnce('exit');
    await mkApp().execute();
    expect(confirmMock).not.toHaveBeenCalled();
  });

  test('aborts when user cancels the confirmation', async () => {
    selectMock.mockResolvedValueOnce('inject');
    confirmMock.mockResolvedValueOnce(false);
    await mkApp().execute();
  });

  test('runs an inject sweep end-to-end', async () => {
    process.chdir(SANDBOX);
    await Bun.write('keep.ts', 'console.log(1);');
    await Bun.write('skip-me.ts', 'console.log(2);');

    selectMock.mockResolvedValueOnce('inject');
    confirmMock.mockResolvedValueOnce(true);

    await mkApp().execute();

    expect(await Bun.file('keep.ts').text()).toContain('FILE-PATH');
    expect(await Bun.file('skip-me.ts').text()).not.toContain('FILE-PATH');

    process.chdir('..');
  });

  test('logs a failure if processBatch throws', async () => {
    selectMock.mockResolvedValueOnce('strip');
    confirmMock.mockResolvedValueOnce(true);

    const app = mkApp();
    const spy = mock(() => { throw new Error('boom'); });
    // @ts-expect-error - reaching into private method for the failure branch
    app.processBatch = spy;

    await app.execute();
    expect(spy).toHaveBeenCalled();
  });
});
