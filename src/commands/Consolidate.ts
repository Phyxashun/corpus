// FILE-PATH: src/commands/Consolidate.ts
import { box, intro, log, note, tasks } from '@clack/prompts';
import path from 'path';
import { Constants } from '../components/Constants';
import type { Config, ConsolidateDeps, IncludePattern, Manifest, Theme } from '../types';
import { Command } from './Command';

const toPosixPath = (p: string) => p.replace(/\\/g, '/');

const STRINGS = {
  title: 'RUNNING CONSOLIDATION',
  key: 'consolidate',
  label: 'Consolidate Codebase',
  hint: 'Combines project files',
  excludedTitle: 'Global Excluded Patterns',
  success: 'Total project files successfully consolidated!',
  complete: 'Entire project consolidated inside',
  total: 'Total files processed:',
  error: 'Failed to consolidate codebase files.',
} as const;

export class Consolidate extends Command {
  readonly key = STRINGS.key;
  readonly label = STRINGS.label;
  readonly hint = STRINGS.hint;
  private gitignore: string[] = [];
  private theme: Theme;
  private config: Config;
  private totalCount: number = 0;

  constructor(deps: ConsolidateDeps) {
    super(deps);
    this.theme = deps.theme;
    this.config = deps.config;
  }

  private async loadGitignore(): Promise<void> {
    const gitignoreFile = Bun.file(Constants.GITIGNORE_PATH);
    if (await gitignoreFile.exists()) {
      const content = await gitignoreFile.text();
      this.gitignore = content
        .split(/\r?\n/)
        .filter(line => line.trim() && !line.startsWith('#'));
    }
  }

  private async findEmptyDirs(dir: string, excludes: string[]): Promise<string[]> {
    const results: string[] = [];
    const excludeGlobs = excludes.map(ex => new Bun.Glob(ex));

    // Create broad matcher to correctly catch naked directory paths during exclusion checks
    const directoryScanner = new Bun.Glob('**/');

    for await (const currentDir of directoryScanner.scan({ cwd: dir, onlyFiles: false })) {
      const posixDir = toPosixPath(currentDir);
      if (!posixDir || posixDir === './' || posixDir === '../') continue;

      // Clean trailing slash for standard directory evaluation comparisons
      const cleanDirCheck = posixDir.endsWith('/') ? posixDir.slice(0, -1) : posixDir;

      // Match against both the raw folder name and the broad nested contextual path
      if (excludeGlobs.some(glob => glob.match(cleanDirCheck) || glob.match(posixDir))) {
        continue;
      }

      try {
        let hasContents = false;
        const contentsScanner = new Bun.Glob(`${cleanDirCheck}/*`);

        for await (const _contents of contentsScanner.scan({ cwd: dir, onlyFiles: false })) { // eslint-disable-line @typescript-eslint/no-unused-vars
          hasContents = true;
          break; // Stop immediately on first file detection for rapid processing
        }

        if (!hasContents) {
          results.push(cleanDirCheck);
        }
      } catch {
        // Soft catch to bypass structural/permission locked folders
        continue;
      }
    }
    return results;
  }

  async execute(): Promise<void> {
    intro(`${this.theme(STRINGS.title).title()}`);
    await this.loadGitignore();

    // Define Global Excludes (Base Excludes + Gitignore)
    const globalExcludes = [...new Set([...this.config.exclude, ...this.gitignore])];
    note(`${this.theme.muted(globalExcludes.join(', '))}`, STRINGS.excludedTitle);

    const { outputDir } = this.config;

    try {
      await Bun.$`rm -rf ${outputDir}`;
      await Bun.$`mkdir -p ${outputDir}`;

      const manifestData: Manifest = { files: {}, emptyDirectories: [] };
      let counter = 0;
      this.totalCount = 0; // Explicit reset loop tracking point

      const allTasks = this.config.include.map((job) => ({
        title: `Consolidating ${this.theme.bold(job.description || job.filename)}`,
        task: async (): Promise<string> => {
          counter++;
          // Merge Global Excludes with this Job's specific Excludes
          const combinedExcludesForJob = [...new Set([...globalExcludes, ...job.exclude])];
          const fileCount = await this.processJob(job, combinedExcludesForJob, manifestData);

          const rawDesc = job.description || job.filename;
          const formattedDesc = rawDesc.charAt(0).toUpperCase() + rawDesc.slice(1).toLowerCase();
          const styledCount = `${this.theme.bold(this.theme.warning(`${fileCount}`))}`;

          return `${styledCount} ${this.theme.color(formattedDesc)} consolidated.`;
        },
      }));

      await tasks(allTasks);

      manifestData.emptyDirectories = await this.findEmptyDirs('.', globalExcludes);
      await Bun.write(path.join(outputDir, 'manifest.json'), JSON.stringify(manifestData, null, 2));

      const outputDirectory = `(${this.theme.muted('/' + outputDir)})`;
      const fileCount = `${this.theme.bold(this.totalCount.toString())}`;
      const countMessage = `${this.theme.bold(counter.toString())}`;

      const complete = `\n${this.theme.success(`${STRINGS.complete} ${outputDirectory}`)}\n`;
      const totalCount = `${this.theme.success(`${STRINGS.total} ${fileCount}`)}\n`;
      const success = `${this.theme.success(`${countMessage} ${STRINGS.success}`)}\n`;

      log.message();
      box(`${complete}${totalCount}${success}`, 'Consolidate Results');
    } catch (err) {
      log.error(`${this.theme.error(STRINGS.error)}`);
      if (err instanceof Error) log.error(`${this.theme.error(err.message)}`);
    }
  }

  private async processJob(job: IncludePattern, excludes: string[], manifest: Manifest): Promise<number> {
    const excludeGlobs = excludes.map(ex => new Bun.Glob(ex));
    const includePaths = new Set<string>();

    for (const pattern of job.include) {
      const glob = new Bun.Glob(pattern);
      for await (const file of glob.scan({ cwd: '.' })) {
        const posixFile = toPosixPath(file);
        if (!excludeGlobs.some(g => g.match(posixFile))) {
          includePaths.add(file);
        }
      }
    }

    const uniquePaths = [...includePaths];
    if (uniquePaths.length === 0) return 0;

    manifest.files[job.filename] = uniquePaths.map(p => toPosixPath(p));

    const fileContents = await Promise.all(
      uniquePaths.map(async (filePath) => {
        const content = await Bun.file(filePath).text();
        return `${Constants.getStartBanner(filePath)}\n${content.trim()}\n${Constants.getEndBanner(filePath)}`;
      })
    );

    // Increment absolute file totals safely after parallel promises resolve to prevent memory races
    this.totalCount += uniquePaths.length;

    await Bun.write(
      path.join(this.config.outputDir, job.filename),
      fileContents.join(`\n\n${Constants.TEARLINE_MARKER}\n\n`)
    );

    return uniquePaths.length;
  }
}
