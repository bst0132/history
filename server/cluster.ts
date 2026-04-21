import app from './app';
import Logger from './common/logger';
import * as os from 'os';
import * as cluster from 'cluster';

// CPUの数分スレッドを分割する
// 設定で任意の数に分割しても良いが、CPU数分以下にすること
const cpus = os.cpus().length;

if(cluster.isMaster) {
  Logger.appLogger.info('Master');

  // Worker を生成する
  for(let i = 0; i < cpus; i++) {
    Logger.appLogger.info(`Master : Cluster Fork ${i}`);
    cluster.fork();
  }

  // Worker がクラッシュしたら再生成する
  cluster.on('exit', (worker, code, signal) => {
    Logger.appLogger.warn(`[${worker.id}] Worker died : [PID ${worker.process.pid}] [Signal ${signal}] [Code ${code}]`);
    cluster.fork();
  });
}
else {
  Logger.appLogger.info(`[${cluster.worker.id}] [PID ${cluster.worker.process.pid}] Worker`);
  // Express サーバの実装は元のまま変更なし
  app();
}
