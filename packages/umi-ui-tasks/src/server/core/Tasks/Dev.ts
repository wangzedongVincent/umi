import { ChildProcess } from 'child_process';
import { join } from 'path';
import { BaseTask, ITaskOptions } from './Base';
import { TaskState, TaskEventType, TaskType } from '../enums';
import {
  runCommand,
  parseScripts,
  // getAnalyzeEnv,
  // parseChartData,
  getChartData,
} from '../../util';

const STATS_FILE_NAME = 'webpack-stats-dev.json';

export class DevTask extends BaseTask {
  // 是否已经启动
  private started: boolean = false;
  // local url
  private localUrl: string = '';
  // lan url
  private lanUrl: string = '';
  // 启动中也会有 hasError 的情况
  private hasError: boolean = false;

  // private stats: any;

  constructor(opts: ITaskOptions) {
    super(opts);
    this.type = TaskType.DEV;
  }

  public async run(args, env: any = {}) {
    await super.run();
    const { script, envs: scriptEnvs } = this.getScript();
    // const analyzeEnv = await getAnalyzeEnv({
    //   analyze: args.analyze,
    //   dbPath: args.dbPath,
    //   fileName: STATS_FILE_NAME,
    // });
    const analyzeEnv = {};

    this.proc = await runCommand(script, {
      cwd: this.cwd,
      env: {
        ...env, // 前端 env
        ...analyzeEnv, // analyze env
        ...scriptEnvs, // script 解析到的
      },
    });

    this.handleChildProcess(this.proc);
  }

  public async cancel() {
    this.started = false;
    const { proc } = this;
    if (!proc) {
      return;
    }

    // 子任务执行结束
    if ([TaskState.FAIL].indexOf(this.state) > -1) {
      return;
    }

    this.state = TaskState.INIT;
    proc.kill('SIGTERM');
  }

  public getDetail() {
    return {
      ...super.getDetail(),
      started: this.started,
      localUrl: this.localUrl,
      lanUrl: this.lanUrl,
      progress: this.progress,
      hasError: this.hasError,
    };
  }

  public async getStats(dbPath: string) {
    // return parseChartData(this.stats);
    return getChartData(join(dbPath, STATS_FILE_NAME));
  }

  protected handleChildProcess(proc: ChildProcess) {
    proc.on('message', msg => {
      this.updateState(msg);
    });

    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', log => {
      this.emit(TaskEventType.STD_OUT_DATA, log);
    });

    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', log => {
      this.emit(TaskEventType.STD_ERR_DATA, log);
    });

    proc.on('exit', (code, signal) => {
      this.state = code === 1 ? TaskState.FAIL : TaskState.INIT;
      this.emit(TaskEventType.STATE_EVENT, this.getDetail());
    });

    process.on('exit', () => {
      proc.kill('SIGTERM');
    });
  }

  protected updateProgress(msg) {
    if (this.hasError) {
      this.hasError = false;
    }
    super.updateProgress(msg);
  }

  private getScript(): { script: string; envs: object } {
    let res = parseScripts({
      pkgPath: this.pkgPath,
      key: 'start',
    });
    if (!res.exist) {
      res = parseScripts({
        pkgPath: this.pkgPath,
        key: 'dev',
      });
    }

    const { succes, exist, errMsg, envs, bin } = res;

    // No specified dev or start script
    if (!exist) {
      return {
        script: this.isBigfishProject ? 'bigfish dev' : 'umi dev',
        envs: [],
      };
    }
    // Parse script error
    if (!succes) {
      this.error(errMsg);
    }

    return {
      script: `${bin} dev`,
      envs,
    };
  }

  private updateState(msg) {
    if (this.started) {
      return;
    }

    const { type } = msg;
    switch (type) {
      case 'DONE':
        this.success(msg);
        break;
      case 'STARTING':
        this.updateProgress(msg);
        break;
      case 'ERROR':
        this.updateError();
        break;
      default:
    }
  }

  private updateError() {
    this.hasError = true;
    this.emit(TaskEventType.STATE_EVENT, this.getDetail());
  }

  private success(msg) {
    const { urls } = msg;
    this.hasError = false;
    this.started = true;
    this.localUrl = urls.rawLocal;
    this.lanUrl = urls.rawLanUrl;
    this.state = TaskState.SUCCESS;
    this.emit(TaskEventType.STATE_EVENT, this.getDetail());
  }
}
