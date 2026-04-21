import Router from 'express-promise-router';
import { db, dbCommonFunction } from '../common/db-client';
import { ObjectId, Cursor } from 'mongodb';
import Validator from '../common/validator';
import * as moment from 'moment';
import { CompTeamList, ParticipatingTeamListInfo, GetParticipatingTeamListRes } from 'defs/api';
import * as Crypto from '../common/cryptor';
import { Response, Request } from 'express';

const router = Router();

/**
 * 大会参加チームリスト取得(編集用・参照用共通)
 */
const getParticipatingTeamList = async (compId: string, res: Response<GetParticipatingTeamListRes>, req: Request): Promise<void> => {
  // 大会参加チーム取得
  const entryTeam = await dbCommonFunction(
    req,
    'teamGameRecords.aggregate',
    db.teamGameRecords.aggregate.bind(db.teamGameRecords),
    async (cursor: Cursor) => {
      return await cursor.toArray() as unknown as CompTeamList[];
    },
    undefined,
    [
      {$match: {
        compId
      }},
      {$lookup: {
        from: 'teams',
        localField: 'teamId',
        foreignField: '_id',
        as: 'teamInfo'
      }},
      {$project: {
        _id: 0,
        recordId: '$_id',
        teamId: 1,
        teamName: 1,
        gameRecord: 1,
        'teamInfo.teamName': 1
      }}
    ]
  );

  // データの整形・参加チームのrecordId取得
  const participatingTeamList: ParticipatingTeamListInfo[] = entryTeam.map(elm => {
    return{
      recordId: elm.recordId,
      teamId: elm?.teamId,
      teamName: elm.teamId ? elm.teamInfo[0].teamName : elm.teamName
      };
    }
  );

  // 返却値の設定
  res.json({
    result: 'ok',
    participatingTeamList: participatingTeamList
  });
};

/**
 * 大会参加チーム登録
 */
router.post('/addEntryTeam', async (req, res) => {
  // フロントから引き継いだデータ
  const data = req.body.data.regData;
  const isRegTeam = req.body.data.isRegTeam;
  const userId = req.body.loginInfo.userId;

  if (isRegTeam) {
    // DB登録済みチーム バリデーションチェック
    Validator(data, {
      teamInfo: [{
        compId: {
          type: 'string'
        },
        teamId: {
          type: 'string'
        }
      }]
    }, req);

    // 登録済みチームを選択していないかチェック
    const teamRes = await dbCommonFunction(
      req,
      'teamGameRecords.aggregate',
      db.teamGameRecords.aggregate.bind(db.teamGameRecords),
      async (cursor: Cursor) => {
        return await cursor.toArray();
      },
      undefined,
      [
        {$match: {
          compId: data.teamInfo[0].compId,
          teamId: {$ne : null}
        }},
        {$project: {
          _id: 0,
          teamId: '$teamId'
        }}
      ]
    );
    // 取得結果を比較用に整形
    const teamIdList = teamRes.map(elm => elm.teamId);

    // 追加済みチームを選択している場合はそのIDを抽出
    const dupTeamId = teamIdList.filter(id =>
      data.teamInfo.some(elm => elm.teamId == id.toString())
    );

    // チームの重複がある場合にはエラーとして返却
    if (dupTeamId.length) {
      res.json({
        result: 'ng',
        teamIdList: teamIdList
      });
      return;
    }

    // チームIDをオブジェクトID型に変更
    data.teamInfo.map(elm => {
      elm.teamId = new ObjectId(elm.teamId);
    });

  } else {
    // 手入力チーム バリデーションチェック
    Validator(data, {
      teamInfo: [{
        compId: {
          type: 'string'
        },
        teamName: {
          type: 'string',
          length: 50
        }
      }]
    }, req);
  }

  // 各コレクション共通情報を設定
  data.teamInfo.map(elm => {
    elm.docIsValid = true;
    elm.docCreUserID = userId;
    elm.docCreTimeStamp = moment().toJSON();
    elm.docModUserID = userId;
    elm.docModTimeStamp = moment().toJSON();
  });

  // DBに大会参加チームをまとめて登録
  await dbCommonFunction(
    req,
    'teamGameRecords.insertMany',
    db.teamGameRecords.insertMany.bind(db.teamGameRecords),
    undefined,
    undefined,
    data.teamInfo
  );

  // 正常時の返却値設定
  res.json({
    result: 'ok'
  });
});

/**
 * 大会参加チーム取得
 */
router.post('/getEntryTeam', async (req, res) => {
  // フロントから引き継いだデータ
  const data = req.body.data;

  // バリデーション
  Validator(data, {
    compId: {
      type: 'string'
    }
  }, req);

  // 大会参加チーム取得
  const entryTeam = await dbCommonFunction(
    req,
    'teamGameRecords.aggregate',
    db.teamGameRecords.aggregate.bind(db.teamGameRecords),
    async (cursor: Cursor) => {
      return await cursor.toArray() as unknown as CompTeamList[];
    },
    undefined,
    [
      {$match: {
        compId: data.compId
      }},
      {$lookup: {
        from: 'teams',
        localField: 'teamId',
        foreignField: '_id',
        as: 'teamInfo'
      }},
      {$project: {
        _id: 0,
        recordId: '$_id',
        teamId: 1,
        teamName: 1,
        gameRecord: 1,
        'teamInfo.teamName': 1
      }}
    ]
  );

  // データの整形・参加チームのrecordId取得
  const regTeamList = [];
  const inputTeamList = [];
  const teamIdList = [];
  entryTeam.forEach(elm => {
    if (elm?.teamId) {
      // DB登録済みチーム
      regTeamList.push({
        recordId: elm.recordId,
        teamName: elm?.teamInfo[0]?.teamName,
        isSelected: (elm?.gameRecord?.length) ? true : false
      });
      // 参加チームのteamIdをまとめる
      teamIdList.push(elm.teamId);
    } else {
      // DB未登録チーム
      inputTeamList.push({
        recordId: elm.recordId,
        teamName: elm.teamName,
        isSelected: (elm?.gameRecord?.length) ? true : false
      });
    }
  });

  // 返却値の設定
  res.json({
    result: 'ok',
    regTeamList: regTeamList,
    inputTeamList: inputTeamList,
    teamIdList: teamIdList
  });
});

// 大会参加チームリスト取得(編集用)
router.post('/getParticipatingTeamListForAdmin', async (req, res) => {
  // フロントから引き継いだデータ
  const data = req.body.data;

  // バリデーション
  Validator(data, {
    compId: {
      type: 'string'
    }
  }, req);

  // 大会参加チーム取得処理呼び出し
  await getParticipatingTeamList(data.compId, res, req);
});

// 大会参加チームリスト取得(参照用)
router.post('/getParticipatingTeamListForGuest', async (req, res) => {
  // フロントから引き継いだデータ
  const data = req.body.data;

  // バリデーション
  Validator(data, {
    compId: {
      type: 'string'
    }
  }, req);

  // 復号化
  const compId = Crypto.getDecryptedString(data.compId);

  // 大会参加チームリスト取得処理呼び出し
  await getParticipatingTeamList(compId, res, req);
});

/**
 * 大会参加チーム更新
 */
router.post('/updateEntryTeam', async (req, res) => {
  // フロントから受け継いだデータ
  const data = req.body.data;
  const userId = req.body.loginInfo.userId;

  Validator(data, {
    teamName: {
      type: 'string',
      length: 50
    },
    recordId: {
      type: 'string'
    }
  }, req);

  // 大会参加チーム名更新処理
  const result = await dbCommonFunction(
    req,
    'teamGameRecords.updateOne',
    db.teamGameRecords.updateOne.bind(db.teamGameRecords),
    undefined,
    undefined,
    { _id: new ObjectId(data.recordId)},
    {$set: {
        teamName: data.teamName,
        docIsValid: true,
        docModUserID: userId,
        docModTimeStamp: moment().toJSON()
    }}
  );

  // 更新結果判定と返却値の設定
  if(result.modifiedCount > 0) {
    res.json({
      result: 'ok'
    });
  } else {
    res.json({
      result: 'ng'
    });
  }
});

/**
 * 大会参加チーム削除
 */
router.post('/delEntryTeam', async (req, res) => {
  // フロントから引き継いだデータ
  const data = req.body.data;

  // バリデーション
  Validator(data, {
    recordId: {
      type: 'string'
    }
  }, req);

  // 削除対象のチームが試合にて選択されていないか確認
  const selectedChk = await dbCommonFunction(
    req,
    'teamGameRecords.findOne',
    db.teamGameRecords.findOne.bind(db.teamGameRecords),
    undefined,
    undefined,
    {_id: new ObjectId(data.recordId)},
    {projection: {
      _id: 0,
      gameRecord: 1
    }}
  );

  // 試合にて選択されているチームは削除を行わない
  if (selectedChk?.gameRecord?.length) {
    res.json({
      result: 'ng',
      message: '試合参加チームとして選択されています。'
    });
    return;
  }

  // 削除処理
  const deleteRes = await dbCommonFunction(
    req,
    'teamGameRecords.deleteOne',
    db.teamGameRecords.deleteOne.bind(db.teamGameRecords),
    undefined,
    undefined,
    {_id: new ObjectId(data.recordId)}
  );

  // 返却値の設定
  if (deleteRes.deletedCount < 1) {
    res.json({
      result: 'ng'
    });
  } else {
    res.json({
      result: 'ok'
    });
  }
});

/**
 * 試合詳細情報取得
 */
router.post('/getTeamGameRecord', async (req, res) => {
  // フロントから引き継いだデータ
  const data = req.body.data;

  // バリデーション
  if (data) {
    for(const recordId of data.recordIds) {
      const recordIds = {recordId};
      Validator(recordIds,{
        recordId: {
          type: 'string',
        }
      }, req);
    }
  }

  // ObjectId型に変換
  const objectIdRecordIds = data.recordIds.map(elm => new ObjectId(elm));

  // 取得処理
  const teamGameRecordRes = await dbCommonFunction(
    req,
    'teamGameRecords.find',
    db.teamGameRecords.find.bind(db.teamGameRecords),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    {
      _id: { $in: objectIdRecordIds },
    }
  );

  // 返却値設定
  res.json({
    result: 'ok',
    teamGameRecordRes
  });


});

export default router;
