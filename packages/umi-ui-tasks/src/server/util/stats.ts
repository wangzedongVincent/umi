import { isPlainObject, isEmpty } from 'lodash';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

interface IGetAnalyzeEnvOpts {
  analyze: boolean;
  dbPath: string;
  fileName: string;
}

export const getAnalyzeEnv = async ({ analyze, dbPath, fileName }: IGetAnalyzeEnvOpts) => {
  if (!analyze) {
    return {};
  }

  // 创建 db 目录
  try {
    if (!existsSync(dbPath)) {
      mkdirSync(dbPath);
    }

    const analyzeStatsPath = join(dbPath, fileName);
    return {
      ANALYZE: '1',
      ANALYZE_MODE: 'disabled',
      ANALYZE_DUMP: analyzeStatsPath,
      ANALYZE_LOG_LEVEL: 'silent',
    };
  } catch (_) {
    console.log(_.stack);
    return {};
  }
};

export function parseChartData(stats) {
  if (!stats) {
    return null;
  }
  let chartData;
  const analyzer = require('webpack-bundle-analyzer/lib/analyzer');

  try {
    /**
     * outputPath:
     *  1. build: stats.outputPath
     *  2. dev: null
     */
    chartData = analyzer.getViewerData(stats, stats.outputPath, {
      excludeAssets: null,
    });
  } catch (err) {
    chartData = null;
  }

  if (isPlainObject(chartData) && isEmpty(chartData)) {
    chartData = null;
  }

  return chartData;
}

export const getChartData = (statsPath: string) => {
  if (!statsPath) {
    return null;
  }
  if (!existsSync(statsPath)) {
    return null;
  }

  let stats;
  try {
    stats = JSON.parse(
      readFileSync(statsPath, {
        encoding: 'utf8',
      }),
    );
  } catch (_) {
    return null;
  }
  return parseChartData(stats);
};
