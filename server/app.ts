import * as express from 'express';
import * as bodyParser from 'body-parser';
import { config } from 'node-config-ts';
import helmet = require('helmet');
import * as https from 'https';
import * as fs from 'fs';
import * as http from 'http';

import { connect } from './common/db-client';
import logger, { stringifyAndExcludeImage } from './common/logger';
import userRoute from './route/user-route';
import teamRoute from './route/team-route';
import competitionRoute from './route/competition-route';
import organRoute from './route/organ-route';
import gameRoute from './route/game-route';
import competitionInfRoute from './route/competitionInf-route';
import gameInfRoute from './route/gameInf-route';
import teamGameRecordRoute from './route/teamGameRecord-route';
import { RunEnvironment } from './common/constants';

process.on('warning', (warning) => {
  logger.warnLogger.warn(`${warning.message}\n${warning.stack || 'No stack trace'}`);
});

// 稼働環境判定
export function judgeRunEnvironment(): number {
  let ret = RunEnvironment.LOCAL;
  if (config.https) {
    ret = config.cloudMode ? RunEnvironment.AWS : RunEnvironment.PRODUCTION;
  }
  return ret;
}

const initialize = (): void => {
  const app = express();
  const port = config.expressPort;

  app.use(helmet());
  app.use(bodyParser.json({limit: '12mb'}));
  // 静的リソースのリクエストを処理（静的ファイル（CSS、JS、画像など）に該当するリクエストはここで完結し、次のミドルウェアには進まない）
  app.use(express.static(__dirname + '/../client'));
  // 全リクエスト共通で呼ばれる（静的ファイル以外のリクエスト）
  app.use((req: express.Request, res: express.Response, next) => {
    // 処理開始時刻
    const startTime = Date.now();
    // ユーザーID(未ログイン等ユーザーIDが無い場合はGuestとする)
    const userId = req.body?.loginInfo?.userId ?? 'Guest';
    // JSON文字列のリクエストデータ
    const strRequestData = stringifyAndExcludeImage(req.body.data);
    // ログ出力(アクセス・アプリケーション)
    logger.accessLogger.info(`Request Start: method=${req.method}, path=${req.originalUrl}, userId=${userId}, ip=${req.ip}, user-agent=${req.headers['user-agent']}`);
    logger.appLogger.info(`Request Start: path=${req.originalUrl}, userId=${userId}, ip=${req.ip}, request-data=${strRequestData}`);

    // API処理終了時
    res.on('finish', () => {
      // 処理終了時刻
      const duration = Date.now() - startTime;
      // 500msを超える場合は警告ログを出力
      if (duration > 500) {
        logger.accessLogger.warn(`method=${req.method}, path=${req.originalUrl}, userId=${userId}, ip=${req.ip}, API response time exceeded 500ms: ${duration}ms`);
      }
      // レスポンスサイズ
      const responseSize = res.getHeader('Content-Length') || 0;
      // ログ出力(アクセス・アプリケーション)
      logger.accessLogger.info(`Request End: method=${req.method}, path=${req.originalUrl}, userId=${userId}, ip=${req.ip}, status=${res.statusCode}, time=${duration}ms, responseSize=${responseSize}B`);
      logger.appLogger.info(`Request End: path=${req.originalUrl}, userId=${userId}, ip=${req.ip}, time=${duration}ms`);
    });
    next();
  });

  // ここもモジュール化する？
  app.use('/api/user', userRoute);
  app.use('/api/team', teamRoute);
  app.use('/api/competition', competitionRoute);
  app.use('/api/organ', organRoute);
  app.use('/api/game', gameRoute);
  app.use('/api/competitionInf', competitionInfRoute);
  app.use('/api/gameInf', gameInfRoute);
  app.use('/api/teamGameRecord', teamGameRecordRoute);
  // 特殊なパスなのでルーティングの最後に記述する
  app.use('*', express.static(__dirname + '/../client/index.html'));

  // 処理中にエラーになったらここにくる
  app.use((err: express.Errback, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    // ユーザーID(未ログイン等ユーザーIDが無い場合はGuestとする)
    const userId = req.body?.loginInfo?.userId ?? 'Guest';
    // JSON文字列のリクエストデータ
    const strRequestData = stringifyAndExcludeImage(req.body.data);
    // エラーログ出力
    logger.errorLogger.error(err, `\nInformation: path=${req.originalUrl}, userId=${userId}, ip=${req.ip}, request-data=${strRequestData}`);
    res.status(500);
    // エラーの詳細を伏せるため、特に意味のない文言を設定
    res.send({ error: 'Something failed!' });
  });

  // DBへの接続が完了したら待ち受け開始
  connect().then(() => {
    // 稼働環境判定
    const runEnv = judgeRunEnvironment();
    if (runEnv === RunEnvironment.LOCAL) {
      // ローカル環境で起動
      app.listen(port, () => logger.appLogger.info('server started!'));
    } else {
      // AWS・オンプレ環境で起動
      const url = runEnv === RunEnvironment.AWS ? 'www.sportshist.com' : 'psh.bestaff.co.jp';
      const options = {
        key: fs.readFileSync(`/etc/letsencrypt/live/${url}/privkey.pem`),
        cert: fs.readFileSync(`/etc/letsencrypt/live/${url}/cert.pem`),
        ca: fs.readFileSync(`/etc/letsencrypt/live/${url}/chain.pem`)
      };
      https.createServer(options, app).listen(port);
      logger.appLogger.info(`${runEnv === RunEnvironment.AWS ? 'history webserver' : 'HTTPS server'} started!`);
  }});
};

initialize();
// AWSやcluster用モジュールから参照できるようエクスポート
export default initialize;
