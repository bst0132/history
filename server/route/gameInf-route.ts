import Router from 'express-promise-router';
import { db, dbCommonFunction, startSession } from '../common/db-client';
import { ObjectId, Cursor } from 'mongodb';
import Validator, { ValidateSetting } from '../common/validator';
import { GameGroups, TeamGameRecord } from 'defs/entity';
import { GameGroupRes, GetGameGroupsRes, CommonRes } from 'defs/api';
import * as Crypto from '../common/cryptor';
import { Response, Request } from 'express';
import { transactionOptions } from '../../client/app/common/defines';

const router = Router();

// 重複チェックの条件に設定する型定義
interface DupCheck {
  _id?: object;
  compId: string;
  gameSystem: string;
  gameGroupTitle: string;
}

/**
 * 重複チェック・チーム記録ID存在チェック
 */
const dupCheck = async (dupCheckTerms: DupCheck, req: Request, session): Promise<CommonRes | void> => {
  // 重複チェック
  const dupCheck = await dbCommonFunction(
    req,
    'gameGroups.countDocuments',
    db.gameGroups.countDocuments.bind(db.gameGroups),
    undefined,
    { session },
    dupCheckTerms,
    {limit: 1}
  );
  // 重複データがあればエラー内容を返却
  if (dupCheck > 0) {
    return {
      result: 'ng',
      message: '試合方式・試合グループ名が重複する試合が既に登録されています。'
    };
  }
};

const existCheck = async (data: GameGroups, req: Request, session): Promise<GameGroupRes | void> => {
  // 選択したチームの記録ID格納配列
  const selectedIds: string[] = [];

  // チェック対象のチーム記録IDを抽出する
  data['gameGroupInf'].forEach(game => {
    if (game.criteriaRecordId) {
      selectedIds.push(game.criteriaRecordId.toString());
    }
    if (game.opponentRecordId) {
      selectedIds.push(game.opponentRecordId.toString());
    }
  });

  // チームを選択していない場合はチェック終了
  if (!selectedIds.length) {
    return;
  }

  // 重複を削除
  const checkIds: string[] = Array.from(new Set(selectedIds));

  // チーム記録ID存在チェック
  const existingIds = await dbCommonFunction(
    req,
    'teamGameRecords.find',
    db.teamGameRecords.find.bind(db.teamGameRecords),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    { session },
    {
      $and: [
        {_id: {$in: checkIds.map(id => new ObjectId(id))}},
        {compId: data.compId}
      ]
    },
    {
      projection: {_id: 1}
    }
  );

  // 選択したチームの記録IDが全て存在していればチェック終了
  if (existingIds.length == checkIds.length) {
    return;
  }

  // 存在しないチーム記録IDを選択している場合はそのIDをまとめる
  const missingIds: string[] = checkIds.filter(selectId =>
    !existingIds.some(existId => existId._id.toHexString() == selectId)
  );

  // 存在しないチーム記録IDがある場合はエラー内容を返却
  if (missingIds.length) {
    return {
      result: 'ng',
      message: '大会に参加しないチームを選択しています。',
      missingIds: missingIds.map(id => new ObjectId(id))
    };
  }
};

/**
 * 数値の桁数判定
 */
const validateDigitNumber = (checkData: number, lengthNumber: number, message: string): void => {
  if (checkData.toString().length > lengthNumber) {
    throw new Error(`The number of digits in ${message} is not correct.`);
  }
};

/**
 * gameGroups登録・更新共通バリデーション
 */
const validateArrayData = (data: GameGroups['gameGroupInf'], req: Request): void => {
  // 試合情報のバリデーションチェック
  for (const elm of data) {
    const gameInfValiSet = new Object() as ValidateSetting;

    /** 試合年月日 */
    if (elm.gameDate) {
      gameInfValiSet['gameDate'] = {
        type: 'string'
      };
    }
    /** 試合会場 */
    if (elm.gamePlace) {
      gameInfValiSet['gamePlace'] = {
        type: 'string',
        length: 50
      };
    }
    /** 試合開始時間 */
    if (elm.gameStartTime || elm.gameStartTime === 0) {
      gameInfValiSet['gameStartTime'] = {
        type: 'number'
      };
      validateDigitNumber(elm.gameStartTime, 4, 'gameStartTime');
    }
    /** 試合ID(必須項目) */
    gameInfValiSet['gameId'] = {
      type: 'number'
    };
    validateDigitNumber(elm.gameId, 3, 'gameId');
    /** 基準チーム記録ID */
    if (elm.criteriaRecordId) {
      gameInfValiSet['criteriaRecordId'] = {
        type: 'string'
      };
    }
    /** 基準チーム得点 */
    if (elm.criteriaScore || elm.criteriaScore === 0) {
      gameInfValiSet['criteriaScore'] = {
        type: 'number'
      };
      validateDigitNumber(elm.criteriaScore, 3, 'score');
    }
    /** 基準チームID */
    if (elm.criteriaTeamId) {
      gameInfValiSet['criteriaTeamId'] = {
        type: 'string'
      };
    }
    /** 対戦チーム記録ID */
    if (elm.opponentRecordId) {
      gameInfValiSet['opponentRecordId'] = {
        type: 'string'
      };
    }
    /** 対戦チーム得点 */
    if (elm.opponentScore || elm.opponentScore === 0) {
      gameInfValiSet['opponentScore'] = {
        type: 'number'
      };
      validateDigitNumber(elm.opponentScore, 3, 'score');
    }
    /** 対戦チームID */
    if (elm.opponentTeamId) {
      gameInfValiSet['opponentTeamId'] = {
        type: 'string'
      };
    }

    // gameInfValiSetに含まれる項目をチェック
    Validator(elm, gameInfValiSet, req);
  }
};

/**
 * teamGameRecords登録・更新共通バリデーション
 */
const validateTeamGameRecords = (data: TeamGameRecord['gameRecord'], req: Request): void => {
  // 試合情報のバリデーションチェック
  for (const gameRecord of data) {
    const gameRecordValiSet = new Object() as ValidateSetting;

    /** 試合グループID(必須項目) */
    gameRecordValiSet['gameGroupId'] = {
      type: 'string'
    };
    /** 順位 */
    if (gameRecord.rank) {
      gameRecordValiSet['rank'] = {
        type: 'number',
      };
      validateDigitNumber(gameRecord.rank, 2, 'rank');
    }

    for (const perGameInf of gameRecord.perGameInf) {
      const perGameValiSet = new Object() as ValidateSetting;

      /** 試合ID(必須項目) */
      perGameValiSet['gameId'] = {
        type: 'number'
      };
      validateDigitNumber(perGameInf.gameId, 3, 'gameId');
      /** 勝ち */
      perGameValiSet['isWon'] = {
        type: 'number',
      };
      validateDigitNumber(perGameInf.isWon, 1, 'isWon');
      /** 負け */
      perGameValiSet['isLost'] = {
        type: 'number',
      };
      validateDigitNumber(perGameInf.isLost, 1, 'isLost');
      /** 引き分け */
      perGameValiSet['isDrew'] = {
        type: 'number',
      };
      validateDigitNumber(perGameInf.isDrew, 1, 'isDrew');
      /** 得点 */
      perGameValiSet['score'] = {
        type: 'number',
      };
      validateDigitNumber(perGameInf.score, 3, 'score');
      /** 失点 */
      perGameValiSet['loss'] = {
        type: 'number',
      };
      validateDigitNumber(perGameInf.loss, 3, 'loss');

      // perGameValiSetに含まれる項目をチェック
      Validator(perGameInf, perGameValiSet, req);
    }

    // gameRecordValiSetに含まれる項目をチェック
    Validator(gameRecord, gameRecordValiSet, req);
  }
};

/**
 * ObjectId変換、データのないフィールド削除
 */
const stringToObjectId = (data: GameGroups['gameGroupInf']): GameGroups['gameGroupInf'] => {
  // string型となっているIDをObjectId型に変換し、データのないnumber型・ObjectId型のフィールドを削除する
  data.forEach(elm => {
    /** 試合開始時間 */
    if (!elm.gameStartTime && elm.gameStartTime !== 0) {
      delete elm.gameStartTime;
    }
    /** 基準チーム記録ID */
    if (elm.criteriaRecordId) {
      elm.criteriaRecordId = new ObjectId(elm.criteriaRecordId);
    } else {
      delete elm.criteriaRecordId;
    }
    /** 基準チーム得点 */
    if (!elm.criteriaScore && elm.criteriaScore !== 0) {
      delete elm.criteriaScore;
    }
    /** 基準チームID */
    if (elm.criteriaTeamId) {
      elm.criteriaTeamId = new ObjectId(elm.criteriaTeamId);
    } else {
      delete elm.criteriaTeamId;
    }
    /** 対戦チーム記録ID */
    if (elm.opponentRecordId) {
      elm.opponentRecordId = new ObjectId(elm.opponentRecordId);
    } else {
      delete elm.opponentRecordId;
    }
    /** 対戦チーム得点 */
    if (!elm.opponentScore && elm.opponentScore !== 0) {
      delete elm.opponentScore;
    }
    /** 対戦チームID */
    if (elm.opponentTeamId) {
      elm.opponentTeamId = new ObjectId(elm.opponentTeamId);
    } else {
      delete elm.opponentTeamId;
    }
  });

  // 整形したgameGroupInfを返却する
  return data;
};

  /**
   * 試合情報取得処理(編集用・参照用共通)
   */
  const getGameGroupInfo = async (gameId: string, res: Response<GetGameGroupsRes | CommonRes>, req: Request): Promise<void> => {
    // gameIdが同じ試合情報取得
    const gameGroupInfo = await dbCommonFunction(
      req,
      'gameGroups.findOne',
      db.gameGroups.findOne.bind(db.gameGroups),
      undefined,
      undefined,
      {
        _id: new ObjectId(gameId)
      }
    );

    // 試合情報が取得できた場合、フロントへ返り値として渡す
    if (gameGroupInfo) {
      res.json({
        result: 'ok',
        gameGroupInfo,
        gameId
      });
    } else {
      res.json({
        result: 'ng',
      });
    }
  };

/**
 * 試合登録処理
 */
router.post('/createGameGroups', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data;
  const gameGroupsData = data.gameGroups;
  const teamGameRecordsData = data.teamGameRecords;
  const userId = req.body.loginInfo.userId;

  // gameGroupsバリデーション
  Validator(gameGroupsData, {
    compId: {
      type: 'string'
    },
    gameSystem: {
      type: 'string',
      length: 1
    },
    gameGroupTitle: {
      type: 'string',
      length: 20
    },
    teamCount: {
      type: 'number'
    },
    gameStartedFlg: {
      type: 'boolean'
    }
  }, req);
  // gameGroups登録・更新の共通バリデーション
  validateArrayData(gameGroupsData.gameGroupInf, req);

  // セッション開始
  const session = await startSession();

  try {
    // トランザクション開始
    session.startTransaction(transactionOptions);

    // 重複チェックの一致条件
    const dupCheckTerms: DupCheck = {
      compId: gameGroupsData.compId,
      gameSystem: gameGroupsData.gameSystem,
      gameGroupTitle: gameGroupsData.gameGroupTitle,
    };

    // 重複チェック
    const dupAnswer = await dupCheck(dupCheckTerms, req, session);

    // エラー内容があればこちらで処理終了
    if (dupAnswer) {
      res.json(dupAnswer);
      return;
    }

    // チーム記録ID存在チェック
    const existAnswer = await existCheck(gameGroupsData, req, session);

    // エラー内容があればこちらで処理終了
    if (existAnswer) {
      res.json(existAnswer);
      return;
    }

    // ObjectId変換、データのないフィールド削除
    gameGroupsData.gameGroupInf = stringToObjectId(gameGroupsData.gameGroupInf);

    // 大会方式別で登録済み試合グループ数を数える
    const groupPlaceNumCnt = await dbCommonFunction(
      req,
      'gameGroups.countDocuments',
      db.gameGroups.countDocuments.bind(db.gameGroups),
      undefined,
      { session },
      {
        compId: gameGroupsData.compId,
        gameSystem: gameGroupsData.gameSystem,
      }
    );

    // 試合グループ配置番号の設定
    gameGroupsData.groupPlaceNum = groupPlaceNumCnt;

    // 共通項目の設定
    gameGroupsData.docIsValid = true;
    gameGroupsData.docCreUserID = userId;
    gameGroupsData.docCreTimeStamp = new Date().toISOString();
    gameGroupsData.docModUserID = userId;
    gameGroupsData.docModTimeStamp = new Date().toISOString();

    // gameGroupsへのDB登録処理と登録時に払いだされた_idを取得するために結果を変数へ代入
    const insertedResult = await dbCommonFunction(
      req,
      'gameGroups.insertOne',
      db.gameGroups.insertOne.bind(db.gameGroups),
      undefined,
      { session },
      gameGroupsData
    );

    // teamGameRecords更新処理結果 modifiedCountプロパティ格納用
    const updatedResult: number[] = [];

    // teamGameRecordsへのDB更新処理
    if (teamGameRecordsData && teamGameRecordsData.length > 0) {
      // rank(number型)がnullの場合フィールド削除
      for (const gameRecord of teamGameRecordsData) {
        if (!gameRecord.rank) {
          delete gameRecord.rank;
        }
      }
      // gameGroups登録時に払いだされた_idを各gameRecordのgameGroupIdに設定
      teamGameRecordsData.forEach(game => {
        game.gameGroupId = insertedResult.insertedId.toHexString();
      });
      // teamGameRecords登録・更新の共通バリデーション
      validateTeamGameRecords(teamGameRecordsData, req);

      for (const game of teamGameRecordsData) {
        // recordIdフィールドを削除する前にrecordIdの値を保管
        const recordId = game.recordId;
        // 更新に必要ないrecordIdフィールドを削除
        delete game.recordId;
        // DB更新(大会IDとチームIDが一致するところへ)
        const updatedRes = await dbCommonFunction(
          req,
          'teamGameRecords.updateOne',
          db.teamGameRecords.updateOne.bind(db.teamGameRecords),
          undefined,
          { session },
          {
            $and: [
              {_id: new ObjectId(recordId)},
              {compId: gameGroupsData.compId},
            ]
          },
          {
            $set: {
              docIsValid: true,
              docModUserID: userId,
              docModTimeStamp: new Date().toISOString()
            },
            $addToSet: {
              gameRecord: {
                $each: [game]
              }
            }
          }
        );

        updatedResult.push(updatedRes.modifiedCount);
      }
    }

    // teamGameRecord更新処理が問題なく完了したか判定
    // 空配列の場合（選択チームがなく、処理を行っていない場合）はtrue判定
    const updatedCheck = updatedResult.every(result => result === 1);

    // 返却値の設定
    // トランザクション処理の破棄/確定
    if (insertedResult.insertedCount !== 1 || updatedCheck !== true) {
      // ロールバック
      await session.abortTransaction();

      res.json({
        result: 'ng'
      });

    } else {
      // コミット
      await session.commitTransaction();

      // 返却値の設定
      res.json({
        result: 'ok'
      });
    }

  } catch (error) {
    // ロールバック
    await session.abortTransaction();
    throw error;

  } finally {
    // セッション終了
    session.endSession();
  }
});

/**
 * 試合更新処理
 */
router.post('/updateGameGroups', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data;
  const gameGroupsData = data.gameGroups;
  const teamGameRecordsData = data.teamGameRecords;
  const userId = req.body.loginInfo.userId;
  const id = gameGroupsData.gameGroupId;

  // 入力値のチェック
  Validator(gameGroupsData, {
    compId: {
      type: 'string'
    },
    gameSystem: {
      type: 'string',
      length: 1
    },
    gameGroupTitle: {
      type: 'string',
      length: 20
    },
    teamCount: {
      type: 'number'
    },
    groupPlaceNum: {
      type: 'number',
    },
    gameStartedFlg: {
      type: 'boolean'
    }
  }, req);
  // 桁数チェック
  validateDigitNumber(gameGroupsData.groupPlaceNum, 3, 'groupPlaceNum');
  // gameGroups登録・更新の共通バリデーション
  validateArrayData(gameGroupsData.gameGroupInf, req);

  // セッション開始
  const session = await startSession();

  try {
    // トランザクション開始
    session.startTransaction(transactionOptions);

    // 重複チェックの一致条件
    const dupCheckTerms: DupCheck = {
      _id: {$ne: new ObjectId(id)},
      compId: gameGroupsData.compId,
      gameSystem: gameGroupsData.gameSystem,
      gameGroupTitle: gameGroupsData.gameGroupTitle
    };

    // 重複チェック
    const dupAnswer = await dupCheck(dupCheckTerms, req, session);

    // エラー内容があればこちらで処理終了
    if (dupAnswer) {
      res.json(dupAnswer);
      return;
    }

    // チーム記録ID存在チェック
    const existAnswer = await existCheck(gameGroupsData, req, session);

    // エラー内容があればこちらで処理終了
    if (existAnswer) {
      res.json(existAnswer);
      return;
    }

    // ObjectId変換、データのないフィールド削除
    gameGroupsData.gameGroupInf = stringToObjectId(gameGroupsData.gameGroupInf);

    // 共通項目の設定
    gameGroupsData.docIsValid = true;
    gameGroupsData.docModUserID = userId;
    gameGroupsData.docModTimeStamp = new Date().toISOString();

    // 更新時に不要なオブジェクトIDを削除
    delete gameGroupsData.gameGroupId;

    // DB更新処理
    const updateGameResult = await dbCommonFunction(
      req,
      'gameGroups.updateOne',
      db.gameGroups.updateOne.bind(db.gameGroups),
      undefined,
      { session },
      {_id: new ObjectId(id)}, {$set: gameGroupsData}
    );

    // 処理結果の判定に使用するフラグ格納用
    let commitFlg: boolean = true;
    let deletePropertyFlg: boolean = true;

    // teamGameRecordsへのDB更新処理（試合参加チームが無い場合）
    if (!teamGameRecordsData || !teamGameRecordsData.length) {
      // 試合に参加しているチームを全て不参加にして更新をかけた場合、今のgameGroupIdに関するgameRecordは必要ない為
      // 今のgameGroupIdに関するgameRecordを一括で削除
      const pullRecordResult = await dbCommonFunction(
        req,
        'teamGameRecords.updateMany',
        db.teamGameRecords.updateMany.bind(db.teamGameRecords),
        undefined,
        { session },
        {
          $and: [
            {compId: gameGroupsData.compId},
            {'gameRecord.gameGroupId': id}
          ]
        },
        {
          $pull: {
            gameRecord: {
              gameGroupId: id
            }
          },
          $set: {
            docIsValid: true,
            docModUserID: userId,
            docModTimeStamp: new Date().toISOString()
          }
        }
      );
      // プロパティが空になったときプロパティごと削除
      if (pullRecordResult.modifiedCount > 0) {
        const deleteProperty = await dbCommonFunction(
          req,
          'teamGameRecords.updateMany',
          db.teamGameRecords.updateMany.bind(db.teamGameRecords),
          undefined,
          { session },
          {
            $and: [
              { compId: gameGroupsData.compId },
              { gameRecord: { $size: 0 } }
            ]
          },
          {
            $unset: { gameRecord: '' },
            $set: {
              docIsValid: true,
              docModUserID: userId,
              docModTimeStamp: new Date().toISOString()
            }
          }
        );
        deletePropertyFlg = deleteProperty?.result.ok === 1;
      }

      // 処理結果の判定フラグ設定
      if (updateGameResult.modifiedCount !== 1 || pullRecordResult.result.ok !== 1 || deletePropertyFlg !== true) {
        commitFlg = false;
      }
      // teamGameRecordsへのDB更新処理（試合参加チームがある場合）
    } else {
      // rank(number型)がnullの場合フィールド削除
      for (const gameRecord of teamGameRecordsData) {
        if (!gameRecord.rank) {
          delete gameRecord.rank;
        }
      }
      // teamGameRecords登録・更新の共通バリデーション
      validateTeamGameRecords(teamGameRecordsData, req);

      // APIに渡ってきたrecordIdをまとめる
      const apiRecordIds = teamGameRecordsData.map(game => game.recordId);
      // 今のgameGroupIdのgameRecordが一度登録されたのに次更新時にその試合から消された場合、消されたチームに今のgameGroupIdに関するgameRecordは必要ない為
      // APIに渡されていないrecordIdで今のgameGroupIdのgameRecordがあるところを一括で削除(削除する部分をなくして更新)
      const pullRecordResult = await dbCommonFunction(
        req,
        'teamGameRecords.updateMany',
        db.teamGameRecords.updateMany.bind(db.teamGameRecords),
        undefined,
        { session },
        {
          $and: [
            // $ninは"not in"の略で一致しないドキュメントを検索
            {_id: {$nin: apiRecordIds.map(id => new ObjectId(id))}},
            {compId: gameGroupsData.compId},
            {'gameRecord.gameGroupId': teamGameRecordsData[0].gameGroupId}
          ]
        },
        {
          $pull: {
            gameRecord: {
              gameGroupId: teamGameRecordsData[0].gameGroupId
            }
          },
          $set: {
            docIsValid: true,
            docModUserID: userId,
            docModTimeStamp: new Date().toISOString()
          }
        }
      );
      // プロパティが空になったときプロパティごと削除
      if (pullRecordResult.modifiedCount > 0) {
        const deleteProperty =await dbCommonFunction(
          req,
          'teamGameRecords.updateMany',
          db.teamGameRecords.updateMany.bind(db.teamGameRecords),
          undefined,
          { session },
          {
            $and: [
              { compId: gameGroupsData.compId },
              { gameRecord: { $size: 0 } }
            ]
          },
          {
            $unset: { gameRecord: '' },
            $set: {
              docIsValid: true,
              docModUserID: userId,
              docModTimeStamp: new Date().toISOString()
            }
          }
        );
        deletePropertyFlg = deleteProperty?.result.ok === 1;
      }

      // gameRecord更新処理結果 modifiedCountプロパティ格納用
      const updateRecordResult: number[] = [];

      for (const game of teamGameRecordsData) {
        // recordIdフィールドを削除する前にrecordIdの値を保管
        const recordId = game.recordId;
        // 更新に必要ないrecordIdフィールドを削除
        delete game.recordId;
        // 既にgameGroupIdに関する試合情報がDBに存在しているかチェック
        const gameGroupId = await dbCommonFunction(
          req,
          'teamGameRecords.findOne',
          db.teamGameRecords.findOne.bind(db.teamGameRecords),
          undefined,
          { session },
          {
            $and: [
              {_id: new ObjectId(recordId)},
              {compId: gameGroupsData.compId},
              {'gameRecord.gameGroupId': game.gameGroupId}
            ]
          }
        );
        // 存在していなければgameRecord(Array)に追加する処理
        if (gameGroupId === null) {
          const updateRecordRes = await dbCommonFunction(
            req,
            'teamGameRecords.updateOne',
            db.teamGameRecords.updateOne.bind(db.teamGameRecords),
            undefined,
            { session },
            {
              $and: [
                {_id: new ObjectId(recordId)},
                {compId: gameGroupsData.compId},
              ]
            },
            {
              $set: {
                docIsValid: true,
                docModUserID: userId,
                docModTimeStamp: new Date().toISOString()
              },
              $addToSet: {
                gameRecord: {
                  $each: [game]
                }
              }
            }
          );

          updateRecordResult.push(updateRecordRes.modifiedCount);

        } else {
          // 存在していればgameGroupIdが一致するgameRecordの値を上書きする処理
          const updateRecordRes = await dbCommonFunction(
            req,
            'teamGameRecords.updateOne',
            db.teamGameRecords.updateOne.bind(db.teamGameRecords),
            undefined,
            { session },
            {
              _id: new ObjectId(recordId),
              compId: gameGroupsData.compId,
              'gameRecord.gameGroupId': game.gameGroupId
            },
            {
              $set: {
                'gameRecord.$': game,
                docIsValid: true,
                docModUserID: userId,
                docModTimeStamp: new Date().toISOString()
              }
            }
          );

          updateRecordResult.push(updateRecordRes.modifiedCount);
        }
      }

      // gameRecord更新処理が問題なく完了したか判定
      const updateRecordCheck = updateRecordResult.every(result => result === 1);

      // 処理結果の判定フラグ設定
      if (updateGameResult.modifiedCount !== 1 || pullRecordResult.result.ok !== 1 || updateRecordCheck !== true || deletePropertyFlg !== true) {
        commitFlg = false;
      }
    }

    // 返却値の設定
    // トランザクション処理の破棄/確定
    if (commitFlg !== true) {
      // ロールバック
      await session.abortTransaction();

      // 返却値の設定
      res.json({
        result: 'ng'
      });

    } else {
      // コミット
      await session.commitTransaction();

      // 返却値の設定
      res.json({
        result: 'ok'
      });
    }

  } catch (error) {
    // ロールバック
    await session.abortTransaction();
    throw error;

  } finally {
    // セッション終了
    session.endSession();
  }
});

/**
 * 単体試合取得処理(編集用)
 */
router.post('/getGameGroupInfoForAdmin', async (req, res) => {

  // gameGroups内の各試合毎の_idを受け取る
  const data = req.body.data;

  // 入力値のチェック
  Validator(data, {
    gameId: {
      type: 'string'
    }
  }, req);

  // 試合情報取得処理呼び出し
  await getGameGroupInfo(data.gameId, res, req);
});

/**
 * 単体試合取得処理(参照用)
 */
router.post('/getGameGroupInfoForGuest', async (req, res) => {

  // フロントから引き継いだデータ
  const data = req.body.data;

  // データのチェック
  Validator(data, {
    gameId: {
      type: 'string'
    }
  }, req);

  // 復号化処理
  const gameId = Crypto.getDecryptedString(data.gameId);

  // 試合情報取得処理呼び出し
  await getGameGroupInfo(gameId, res, req);
});

/**
 * 試合削除
 */
router.post('/delGameGroups', async (req, res) => {
  // 画面入力値の受け取り
  const data = req.body.data;
  const userId = req.body.loginInfo.userId;
  const { compId, gameGroupId, gameSystem } = data;

  // 入力値のチェック
  Validator(data, {
    compId: {
      type: 'string'
    },
    gameGroupId: {
      type: 'string'
    },
    gameSystem: {
      type: 'string',
      length: 1
    }
  }, req);

  // セッション開始
  const session = await startSession();

  try {
    // トランザクション開始
    session.startTransaction(transactionOptions);

    // 削除処理
    const deleteRes = await dbCommonFunction(
      req,
      'gameGroups.deleteOne',
      db.gameGroups.deleteOne.bind(db.gameGroups),
      undefined,
      { session },
      {
        _id: new ObjectId(gameGroupId)
      }
    );

    // 登録済み試合グループ（大会id,大会方式が一致する試合グループ）を取得
    const registeredGame = await dbCommonFunction(
      req,
      'gameGroups.aggregate',
      db.gameGroups.aggregate.bind(db.gameGroups),
      async (cursor: Cursor) => {
        return await cursor.toArray();
      },
      { session },
      [
        {$match: {
          compId: compId,
          gameSystem: gameSystem
        }},
        {$sort: {groupPlaceNum: 1}},
        {$project: {_id: 1}}
      ]
    );

    // groupPlaceNum振り直し処理結果 modifiedCountプロパティ格納用
    const updateNumResult: number[] = [];

    // 登録済み試合グループがある場合、groupPlaceNum振り直し（削除した試合のgroupPlaceNumが飛んでしまうため）
    if (registeredGame.length > 0) {
      for (let i = 0; i < registeredGame.length; i++) {
        const updateNumRes = await dbCommonFunction(
          req,
          'gameGroups.updateOne',
          db.gameGroups.updateOne.bind(db.gameGroups),
          undefined,
          { session },
          {_id: registeredGame[i]._id},
          {$set: {
            groupPlaceNum: i,
            docIsValid: true,
            docModUserID: userId,
            docModTimeStamp: new Date().toISOString()
          }}
        );

        updateNumResult.push(updateNumRes.modifiedCount);
      }
    }

    // groupPlaceNum振り直し処理が問題なく完了したか判定
    // 空配列の場合（登録済み試合グループがなく、処理を行っていない場合）はtrue判定
    const updateNumCheck = updateNumResult.every(result => result === 1);

    // 試合に選択されていたチームのteamGameRecords更新処理
    const updateTeamRes = await dbCommonFunction(
      req,
      'teamGameRecords.updateMany',
      db.teamGameRecords.updateMany.bind(db.teamGameRecords),
      undefined,
      { session },
      // 大会id,試合グループidが入力値と一致するレコードを取得
      {
        $and: [
          {compId: compId},
          {'gameRecord.gameGroupId': gameGroupId}
        ]
      },
      // 試合グループidが入力値と一致するgameRecordを除いて更新
      {
        $pull: {
          gameRecord: {gameGroupId: gameGroupId}
        },
        $set: {
          docIsValid: true,
          docModUserID: userId,
          docModTimeStamp: new Date().toISOString(),
        }
      }
    );
    // プロパティが空になったときプロパティごと削除
    let deletePropertyFlg: boolean = true;
    if (updateTeamRes.modifiedCount > 0) {
      const deleteProperty = await dbCommonFunction(
        req,
        'teamGameRecords.updateMany',
        db.teamGameRecords.updateMany.bind(db.teamGameRecords),
        undefined,
        { session },
        {
          $and: [
            { compId: compId },
            { gameRecord: { $size: 0 } }
          ]
        },
        {
          $unset: { gameRecord: '' },
          $set: {
            docIsValid: true,
            docModUserID: userId,
            docModTimeStamp: new Date().toISOString()
          }
        }
      );
      deletePropertyFlg = deleteProperty?.result.ok === 1;
    }

    // 返却値の設定
    // トランザクション処理の破棄/確定
    if (deleteRes.deletedCount < 1 || updateNumCheck !== true || updateTeamRes.result.ok !== 1 || deletePropertyFlg !== true) {
      // ロールバック
      await session.abortTransaction();

      res.json({
        result: 'ng'
      });

    } else {
      // コミット
      await session.commitTransaction();

      res.json({
        result: 'ok'
      });
    }

  } catch (error) {
    // ロールバック
    await session.abortTransaction();
    throw error;

  } finally {
    // セッション終了
    session.endSession();
  }
});

/**
 * 試合グループID暗号化処理
 */
router.post('/encryptionGameId', async (req, res) => {
  // フロントから引き継いだデータ
  const data = req.body.data;

  // 引き継いだデータのチェック
  Validator(data, {
    gameId: {
      type: 'string'
    }
  }, req);

  // 引き継いだデータを暗号化し返却
  res.json({
    result: 'ok',
    encryptedGameId: Crypto.getEncryptedString(data.gameId)
  });
});

export default router;
