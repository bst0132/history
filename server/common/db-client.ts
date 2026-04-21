// DB接続用共通モジュール
import { MongoClient, Collection, Cursor, ClientSession } from 'mongodb';
import { config } from 'node-config-ts';
import { User, Team, TeamHistory, InvitationInf, Organ, Competition, Game, GameResult, PartTeamHistory, PlaceHistory, PlayerHistory, MailAddHistory,
CompetitionInf, GameGroups, TeamGameRecord } from 'defs/entity';
import { RunEnvironment } from './constants';
import { judgeRunEnvironment } from '../app';
import logger, { stringifyAndExcludeImage } from '../common/logger';
import * as express from 'express';


const dbSetting = config.db;
// 設定からDB接続文字列を生成
const connectionString = `mongodb://${dbSetting.user}:${dbSetting.password}@${dbSetting.dbServers.join(',')}`;
// MongoDBクライアント格納用
let client: MongoClient;

// collection名を間違えると新しいcollectionが作られてしまうので
// コレクション名をキーとしたアクセッサーを定義
// collection追加の際はusersを参考に増やすこと
export const db: {
  users: Collection<User>;
  teams: Collection<Team>;
  teamHistories: Collection<TeamHistory>;
  invitationInfs: Collection<InvitationInf>;
  competitions: Collection<Competition>;
  organizations: Collection<Organ>;
  games: Collection<Game>;
  gameResults: Collection<GameResult>;
  partTeamHistories: Collection<PartTeamHistory>;
  placeHistories: Collection<PlaceHistory>;
  playerHistories: Collection<PlayerHistory>;
  mailAddHistories: Collection<MailAddHistory>;
  competitionInfs: Collection<CompetitionInf>;
  gameGroups: Collection<GameGroups>;
  teamGameRecords: Collection<TeamGameRecord>;
} = {
  users: null,
  teams: null,
  teamHistories: null,
  invitationInfs: null,
  competitions: null,
  organizations: null,
  games: null,
  gameResults: null,
  partTeamHistories: null,
  placeHistories: null,
  playerHistories: null,
  mailAddHistories: null,
  competitionInfs: null,
  gameGroups: null,
  teamGameRecords: null
};

export const connect = async (): Promise<void> => {
  // 稼働環境判定
  const runEnv = judgeRunEnvironment();

  // mondodBクライアントの初期化
  client = await MongoClient.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tlsCAFile: `${runEnv === RunEnvironment.AWS ? 'rds-combined-ca-bundle.pem' : ''}`
  });
  const dbConnect = client.db(dbSetting.dbName);
  // DBへの接続ができたらアクセッサーを追加していく
  db.users = dbConnect.collection<User>('users');
  db.teams = dbConnect.collection<Team>('teams');
  db.teamHistories = dbConnect.collection<TeamHistory>('teamHistories');
  db.invitationInfs = dbConnect.collection<InvitationInf>('invitationInfs');
  db.competitions = dbConnect.collection<Competition>('competitions');
  db.organizations = dbConnect.collection<Organ>('organizations');
  db.games = dbConnect.collection<Game>('games');
  db.gameResults = dbConnect.collection<GameResult>('gameResults');
  db.partTeamHistories = dbConnect.collection<PartTeamHistory>('partTeamHistories');
  db.placeHistories = dbConnect.collection<PlaceHistory>('placeHistories');
  db.playerHistories = dbConnect.collection<PlayerHistory>('playerHistories');
  db.mailAddHistories = dbConnect.collection<MailAddHistory>('mailAddHistories');
  db.competitionInfs = dbConnect.collection<CompetitionInf>('competitionInfs');
  db.gameGroups = dbConnect.collection<GameGroups>('gameGroups');
  db.teamGameRecords = dbConnect.collection<TeamGameRecord>('teamGameRecords');
};

export const startSession = async (): Promise<ClientSession> => {
  // トランザクション処理：セッション開始
  return client.startSession();
};

// DB共通処理(ログ出力とDB処理)
export const dbCommonFunction = async (req: express.Request, operationName: string, dbOperation, toArrayCastFn?, session?, ...args) => {
  // 処理開始時刻
  const startTime = Date.now();
  // ユーザーID(未ログイン等ユーザーIDが無い場合はGuestとする)
  const userId = req.body?.loginInfo?.userId ?? 'Guest';
  // JSON文字列のクエリ又はデータ(レスト構文...によって『複数の引数を配列としてまとめて受け取った引数』を渡す場合はtrueも渡してisRestArray=trueを指定)
  const strQueryData = stringifyAndExcludeImage(args, true);
  // アプリケーションログ出力
  logger.appLogger.info(`DB Connection Start: path=${req.originalUrl}, userId='${userId}', ip=${req.ip}, operation='${operationName}', query-or-data='${strQueryData}'`);

  // 実際のDB操作を実行
  // (スプレッド構文...を使いargs配列を展開して関数に渡す、セッション情報がある場合はセッションを渡してトランザクション管理を行う)
  let result = session === undefined
    ? await dbOperation(...args)
    : await dbOperation(...args, session);
  // 結果がカーソルオブジェクト(find()とaggregate())の場合、toArray()を呼び出して、型キャスト関数があればそれも行う
  if (result && result instanceof Cursor) {
    // toArray()や型キャスト処理を呼び出す
    result = await toArrayCastFn(result);
  }
  // 処理終了時刻
  const duration = Date.now() - startTime;
  // JSON文字列のDB結果
  const strResult = stringifyAndExcludeImage(result);
  // アプリケーションログ出力
  logger.appLogger.info(`DB Connection End: path=${req.originalUrl}, userId='${userId}', ip=${req.ip}, operation='${operationName}', duration=${duration}ms, result='${strResult}'`);
  // 結果を返す
  return result;
};
