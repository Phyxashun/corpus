// TYPE     : .TS
// PATH     : src/components/Constants.ts
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-< START >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// FILE-PATH: src/components/Constants.ts

import path from 'path';

class ConstantsManager {
  private readonly WIDTH = 40;
  private readonly DASH = '-';
  private readonly BLOCK = '█';
  private readonly CUBE = '■';
  private readonly COMMENT = '//';

  public readonly BASE_DIR = process.cwd();
  public readonly OUTPUT_DIR = 'ALL';
  public readonly REBUILT_DIR = 'ALL_REBUILT';
  public readonly GITIGNORE_PATH = path.join(this.BASE_DIR, '.gitignore');

  private readonly SPACER = (char: string, num: number = 1): string => {
    return char.repeat(num);
  };

  public readonly DIVIDER = this.SPACER(this.BLOCK, this.WIDTH);

  public readonly TEARLINE_MARKER = `${this.COMMENT} ${this.SPACER(this.DASH, this.WIDTH)}TEARLINE${this.SPACER(this.DASH, this.WIDTH)}`;

  public readonly RUNTIME_CONFIG_PATH = path.join(this.BASE_DIR, 'runtime.config.json');
  public readonly ENCODING = 'utf-8';

  public getStartBanner(filePath: string): string {
    return this.createBanner(filePath, 'start');
  }

  public getEndBanner(filePath: string): string {
    return this.createBanner(filePath, 'end');
  }

  private createBanner(filePath: string, type: 'start' | 'end'): string {
    const tag = type === 'start' ? '-< START >-' : '-<  END  >-';
    const bannerSpacer = this.SPACER(this.CUBE, this.WIDTH);
    const meta = {
      baseName: path.basename(filePath),
      extension: path.extname(filePath),
      filePath: filePath,
    };

    const banner = [
      `${this.COMMENT}${bannerSpacer}${tag}${bannerSpacer}`,
      `${this.COMMENT} FILE NAME: : ${meta.baseName} `,
      `${this.COMMENT} TYPE     : .${meta.extension.toUpperCase().replace('.', '') || 'TXT'}`,
      `${this.COMMENT} PATH     : ${meta.filePath.replace(/\\/g, '/')}`,
      `${this.COMMENT} PROCESSED: ${new Date().toISOString()}`,
      `${this.COMMENT}${bannerSpacer}${tag}${bannerSpacer}`,
    ];

    return banner.join('\n');
  }
}

export const Constants = new ConstantsManager();
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-<  END  >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// TYPE     : .TS
// PATH     : src/components/Constants.ts