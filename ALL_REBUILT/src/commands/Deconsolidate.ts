// TYPE     : .TS
// PATH     : src/commands/Deconsolidate.ts
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-< START >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// FILE-PATH: src/commands/Deconsolidate.ts

import { intro, log, note, tasks } from '@clack/prompts';
import path from 'path';
import { Constants } from '../components/Constants';
import type { Config, DeconsolidateDeps, Manifest, Theme } from '../types';
import { Command } from './Command';

/**
 * CONSTANTS
 */
const STRINGS = {
  title: 'RUNNING DECONSOLIDATION',
  key: 'deconsolidate',
  label: 'Deconsolidate Archive',
  hint: 'Rebuild everything',
  excludedTitle: 'Excluded Patterns',
  success: 'Entire directory state restored inside',
  error: 'Deconsolidation sequence crashed.',
} as const;

// Refined Regex to be more specific and avoid removing legitimate code.
//const PATH_REGEX = /^\/\/ FILE NAME: : ([^\n]+)/m;
const START_BANNER_REGEX = /^\s*\/\/(?:■+)-< START >-(?:■+)\s*/;
const END_BANNER_REGEX = /\/\/(?:■+)-< {2}END {2}>-(?:■+)\s*$/;
const METADATA_LINE_REGEX = /^\/\/ (FILE NAME|TYPE|PATH|PROCESSED):[^\n]*\n?/gm;


/**
 * DECONSOLIDATE CLASS
 */
export class Deconsolidate extends Command {
  readonly key = STRINGS.key;

  readonly label = STRINGS.label;
  readonly hint = STRINGS.hint;

  private theme: Theme;
  private config: Config;

  constructor(deps: DeconsolidateDeps) {
    super(deps);
    this.theme = deps.theme;
    this.config = deps.config;
  }

  async execute(): Promise<void> {
    intro(`${this.theme.title(STRINGS.title)}`);

    const { outputDir, rebuiltDir, exclude } = this.config;
    const manifestPath = path.join(outputDir, 'manifest.json');

    if (!(await Bun.file(manifestPath).exists())) {
      log.error(`${this.theme.error(`No manifest found in /${outputDir}. Please consolidate first.`)}`);
      return;
    }

    note(`${this.theme.muted(exclude.join(', '))}`, STRINGS.excludedTitle);

    try {
      await Bun.$`rm -rf ${rebuiltDir}`;
      const manifest: Manifest = await Bun.file(manifestPath).json();

      if (manifest.emptyDirectories?.length > 0) {
        await Promise.all(
          manifest.emptyDirectories.map((dir: string) =>
            Bun.$`mkdir -p ${path.join(rebuiltDir, dir)}`
          )
        );
      }

      let totalFilesRecreated = 0;

      const allTasks = Object.entries(manifest.files).map(([filename, _filePaths]) => ({
        title: `Deconsolidating from ${this.theme.bold(filename)}`,
        task: async (): Promise<string> => {
          const txtFile = path.join(outputDir, filename);
          if (!(await Bun.file(txtFile).exists())) {
            return `${this.theme.muted('Source .txt file not found, skipping.')}`;
          }

          const rawText = await Bun.file(txtFile).text();
          const fileSegments = rawText.split(Constants.TEARLINE_MARKER);

          let filesProcessedInJob = 0;

          for (const segment of fileSegments) {
            const trimmedSegment = segment.trim();
            if (!trimmedSegment) continue;

            // Use a more reliable way to get the original path from the banner
            const bannerLines = trimmedSegment.split('\n');
            const pathLine = bannerLines.find(line => line.startsWith('// PATH     :'));
            if (pathLine) {
              const originalPath = pathLine.split(':')[1]!.trim();

              // More robustly strip the generated banner and metadata
              const content = trimmedSegment
                .replace(START_BANNER_REGEX, '')
                .replace(END_BANNER_REGEX, '')
                .replace(METADATA_LINE_REGEX, '')
                .trim();

              const writePath = path.join(rebuiltDir, originalPath);
              const dirToWrite = path.dirname(writePath);
              await Bun.$`mkdir -p ${dirToWrite}`;
              await Bun.write(writePath, content);

              filesProcessedInJob++;
            }
          }
          totalFilesRecreated += filesProcessedInJob;
          const styledCount = `${this.theme.bold(this.theme.warning(filesProcessedInJob.toString()))}`;
          return `${styledCount} ${this.theme.color('files recreated from this segment.')}`;
        },
      }));

      await tasks(allTasks);

      const styledTotal = `${this.theme.bold(this.theme.warning(totalFilesRecreated.toString()))}`;
      const styledRebuiltDir = `${this.theme.muted('/' + rebuiltDir)}`;
      const success = `${this.theme.success(`${STRINGS.success} ${styledRebuiltDir}.`)}`;
      const finalCount = `${this.theme.success(`Total files recreated: `)}${styledTotal}`;

      log.step(`${success}`);
      log.success(`${finalCount}`);
    } catch (err) {
      log.error(`${this.theme.error(STRINGS.error)}`);
      if (err instanceof Error) {
        log.error(`${this.theme.error(err.message)}`);
      }
    }
  }
}
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-<  END  >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// TYPE     : .TS
// PATH     : src/commands/Deconsolidate.ts