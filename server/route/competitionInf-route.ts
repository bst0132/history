import Router from 'express-promise-router';
import { db, dbCommonFunction, startSession } from '../common/db-client';
import { ObjectId, InsertOneWriteOpResult, Cursor } from 'mongodb';
import Validator, { ValidateSetting, ArrayValidator } from '../common/validator';
import { CompDetailInf, CompTeamList, GameGroups, CompCollectionInfsList, CompBaseInfo, GetCompDetailRes, CommonRes } from 'defs/api';
import * as moment from 'moment';
import CompetitionInf from 'defs/entity/competitionInf';
import ImageInf from 'defs/entity/imageInf';
import { CNS, transactionOptions } from '../../client/app/common/defines';
import * as Crypto from '../common/cryptor';
import { TeamGameRecord, GameGroups as GameGroupForDb } from 'defs/entity';
import { MSG } from '../../client/app/common/message-defines';
import * as express from 'express';
import { config } from 'node-config-ts';

const router = Router();

interface GetOrganizerNamesRes {
  _id: string;
  name: string;
}

interface CopyTeamGameRecord extends TeamGameRecord {
  oldRecordId: ObjectId;
}

interface CopyGameGroup extends GameGroupForDb {
  _id: ObjectId;
  oldGameGroupId: ObjectId;
}

/**
 * 登録・更新共通バリデーション
 */
const CommonValidator = (data: CompetitionInf, req: express.Request): void => {
  // 必須項目のバリデーションチェック
  Validator(data, {
    compName: {
      type: 'string',
      length: 50
    },
    openingDate: {
      type: 'string'
    },
    closingDate: {
      type: 'string'
    }
  }, req);

  // 省略可能項目のバリデーションチェック
  const valiSet = new Object() as ValidateSetting;

  // データのある配列以外の項目・複数プロパティを持つ配列をvaliSetに設定
  if (data.openingTime) {
    valiSet['openingTime'] = {
      type: 'string',
      length: 10
    };
  }
  if (data.closingTime) {
    valiSet['closingTime'] = {
      type: 'string',
      length: 10
    };
  }
  if (data.purpose) {
    valiSet['purpose'] = {
      type: 'string',
      length: 100
    };
  }
  if (data.entryQual) {
    valiSet['entryQual'] = {
      type: 'string',
      length: 100
    };
  }
  // 正規表現用の変数設定
  const patternData = new RegExp(CNS.tournament + '|' + CNS.league + '|' + CNS.leagueTournament);
  if (data.compSystemInf && data.compSystemInf.compSystem) {
    valiSet['compSystemInf'] = {
      compSystem: {
        type: 'string',
        length: 1,
        // pattern: /1|2|3/
        pattern: patternData
      }
    };
    if (data.compSystemInf.winningPointInf) {
      if (data.compSystemInf.winningPointInf.winPoint || data.compSystemInf.winningPointInf.winPoint === 0) {
        valiSet['compSystemInf']['winningPointInf'] = {
          winPoint: {
            type: 'number',
            length: 3
          }
        };
      }
      if (data.compSystemInf.winningPointInf.losePoint || data.compSystemInf.winningPointInf.losePoint === 0) {
        valiSet['compSystemInf']['winningPointInf']['losePoint'] = {
          type: 'number',
          length: 3
        };
      }
      if (data.compSystemInf.winningPointInf.drawPoint || data.compSystemInf.winningPointInf.drawPoint === 0) {
        valiSet['compSystemInf']['winningPointInf']['drawPoint'] = {
          type: 'number',
          length: 3
        };
      }
    }
  }
  if (data.awards) {
    valiSet['awards'] = {
      type: 'string',
      length: 100
    };
  }
  if (data.entryFee) {
    valiSet['entryFee'] = {
      type: 'string',
      length: 100
    };
  }
  if (data.remarks) {
    valiSet['remarks'] = {
      type: 'string',
      length: 200
    };
  }
  if (data.contact.name) {
    valiSet['contact'] = {
      name: {
        type: 'string',
        length: 20
      }
    };
    if (data.contact.phoneNumber) {
      valiSet['contact']['phoneNumber'] = {
        type: 'string',
        length: 20
      };
    }
  } else if (data.contact.phoneNumber) {
    valiSet['contact'] = {
      phoneNumber: {
        type: 'string',
        length: 20
      }
    };
  }
  if (data.organizer && data.organizer?.length) {
    valiSet['organizer'] = [{
      orgId: {
        type: 'string',
      },
      orgEditFlag: {
        type: 'boolean',
      },
      orgFlag: {
        type: 'string',
        length: 1,
      },
    }];
  }

  // valiSetに含まれる項目をチェック
  if (Object.keys(valiSet).length) {
    Validator(data, valiSet, req);
  }

  // 配列(プロパティが1つ)のバリデーションチェック
  const arrayValiSet = new Object() as ValidateSetting;

  // データのある配列の項目をarrayValiSetに設定（単一のプロパティを持つ配列限定・複数プロパティがある場合は不可）
  if (data.compPlace && data.compPlace?.length) {
    arrayValiSet['compPlace'] = {
      type: 'string',
      length: 20
    };
  }
  if (data.otherOrgs && data.otherOrgs?.length) {
    arrayValiSet['otherOrgs'] = {
      type: 'string',
      length: 50
    };
  }
  if (data.supervisor && data.supervisor?.length) {
    arrayValiSet['supervisor'] = {
      type: 'string',
      length: 50
    };
  }
  if (data.cosponsor && data.cosponsor?.length) {
    arrayValiSet['cosponsor'] = {
      type: 'string',
      length: 50
    };
  }
  if (data.gameRules && data.gameRules?.length) {
    arrayValiSet['gameRules'] = {
      type: 'string',
      length: 100
    };
  }
  if (data.notes && data.notes?.length) {
    arrayValiSet['notes'] = {
      type: 'string',
      length: 100
    };
  }

  // arrayValiSetに含まれる項目をチェック
  if (Object.keys(arrayValiSet).length) {
    ArrayValidator(data, arrayValiSet, req);
  }
};

/**
 * 主催団体・チーム名取得処理
 * @param organizer
 */
async function getOrganizerNames(organizer, req: express.Request): Promise<{ orgName: GetOrganizerNamesRes[]; editorList: string[] }> {
  // 主催団体ID格納用
  const hostOrgId = [];
  // 主催チームID格納用
  const hostTeamId = [];
  // 編集権限ありの主催ID格納用
  const editorList: string[] = [];
  // 主催名まとめ用
  const orgName: GetOrganizerNamesRes[] = [];

  organizer?.forEach(elm => {
    // 団体／チームで主催IDを分ける
    if (elm.orgFlag === '1') {
      hostOrgId.push(elm.orgId);
    } else if (elm.orgFlag === '2') {
      hostTeamId.push(elm.orgId);
    }
    // 編集権限のある主催IDをまとめる
    if (elm.orgEditFlag) {
      editorList.push(elm.orgId);
    }
  });

  // 主催が団体を含む場合は団体名を取得
  if (hostOrgId?.length > 0) {
    const hostOrgName = await dbCommonFunction(
      req,
      'organizations.aggregate',
      db.organizations.aggregate.bind(db.organizations),
      async (cursor: Cursor) => {
        return await cursor.toArray();
      },
      undefined,
      [
        {$match : {
          _id: {$in : hostOrgId.map(hostId => new ObjectId(hostId))}
        }},
        {$project: {
          _id: 1,
          organName: 1
        }}
      ]
    );
    // 主催名を一つの配列にまとめる
    hostOrgName.forEach(org =>{
      orgName.push({
        _id: org._id.toString(),
        name: org.organName
      });
    });
  }

  // 主催がチームを含む場合はチーム名を取得
  if (hostTeamId?.length > 0) {
    const hostTeamName = await dbCommonFunction(
      req,
      'teams.aggregate',
      db.teams.aggregate.bind(db.teams),
      async (cursor: Cursor) => {
        return await cursor.toArray();
      },
      undefined,
      [
        {$match : {
          _id: {$in : hostTeamId.map(hostId => new ObjectId(hostId))}
        }},
        {$project: {
          _id: 1,
          teamName: 1
        }}
      ]
    );
    // 主催名を一つの配列にまとめる
    hostTeamName.forEach(team =>{
      orgName.push({
          _id: team._id.toString(),
          name: team.teamName
        });
    });
  }

  return {orgName, editorList};
}

// 大会要綱画面 試合グループ情報取得時の型
interface GameGroupList {
  groupInf: {
    gameGroupId: ObjectId;
    gameSystem: string;
    gameGroupTitle: string;
    groupPlaceNum: number;
    perDate: {
      gameDate?: string;
      gamesInf: {
        gameDate?: string;
        gamePlace?: string;
        gameStartTime?: number;
        gameId: number;
        criteriaRecordId?: ObjectId;
        criteriaScore?: number;
        criteriaTeamId?: ObjectId;
        opponentRecordId?: ObjectId;
        opponentScore?: number;
        opponentTeamId?: ObjectId;
      };
    };
  };
  criteriaName?: string;
  opponentName?: string;
  criteriaInfo?: {
    teamName: string;
    teamLogo?: ImageInf;
  };
  opponentInfo?: {
    teamName: string;
    teamLogo?: ImageInf;
  };
}

const getCompDetail = async(compId: string, req: express.Request): Promise<GetCompDetailRes> => {

  // フロント返却値の定義
  const response = {
    result: 'ng',
    message: '',
    compBaseInf: {},
    gameGroups: [],
    regTeamList: [],
    inputTeamList: [],
    teamIdList: []
  };

  // 大会要綱タブで表示するデータを取得
  const compBaseInf = await dbCommonFunction(
    req,
    'competitionInfs.findOne',
    db.competitionInfs.findOne.bind(db.competitionInfs),
    undefined,
    undefined,
    {_id : new ObjectId(compId)},
    {projection: {
      _id: 0,
      docIsValid: 0,
      docCreUserID: 0,
      docCreTimeStamp: 0,
      docModUserID: 0,
      docModTimeStamp: 0
    }}
  );

  // 情報を取得できていない場合は'ng'を返す
  if (!compBaseInf) {
    response.message = '大会情報が取得できませんでした。';
    return;
  }

  const resOrg = await getOrganizerNames(compBaseInf?.organizer, req);

  // その他主催のデータがある場合は、主催名をまとめた配列に格納
  if (compBaseInf.otherOrgs?.length) {
    compBaseInf.otherOrgs.forEach(other =>{
      resOrg.orgName.push({ _id: '', name: other });
    });
  }

  // 大会要綱タブ情報の返却値を設定
  const compData: CompDetailInf = {
    compName: compBaseInf.compName,
    compLogo: compBaseInf.compLogo,
    openingDate: compBaseInf.openingDate,
    closingDate: compBaseInf.closingDate,
    openingTime: compBaseInf.openingTime,
    closingTime: compBaseInf.closingTime,
    compPlace: compBaseInf.compPlace,
    supervisor: compBaseInf.supervisor,
    cosponsor: compBaseInf.cosponsor,
    purpose: compBaseInf.purpose,
    entryQual: compBaseInf.entryQual,
    gameRules: compBaseInf.gameRules,
    compSystemInf: compBaseInf.compSystemInf,
    awards: compBaseInf.awards,
    notes: compBaseInf.notes,
    entryFee: compBaseInf.entryFee,
    remarks: compBaseInf.remarks,
    contact: compBaseInf.contact,
    compAdminInf: compBaseInf.compAdminInf,
    qrcodeParts: compBaseInf.qrcodeParts,
    compOrgName: resOrg.orgName.map(elm => elm.name),
    editorList: resOrg.editorList
  };
  // 大会要綱タブ情報の返却値を更新
  response.compBaseInf = compData;

  // 試合グループ情報をチーム情報と共に取得
  const gameGroupRes = await dbCommonFunction(
    req,
    'gameGroups.aggregate',
    db.gameGroups.aggregate.bind(db.gameGroups),
    async (cursor: Cursor) => {
      return await cursor.toArray() as unknown as GameGroupList[];
    },
    undefined,
    [
      {$match: {compId: compId}},
      {$unwind: {path: '$gameGroupInf'}},
      {$lookup: {
        from: 'teamGameRecords',
        localField: 'gameGroupInf.criteriaRecordId',
        foreignField: '_id',
        as: 'criteriaName'
      }},
      {$lookup:{
        from: 'teamGameRecords',
        localField: 'gameGroupInf.opponentRecordId',
        foreignField: '_id',
        as: 'opponentName'
      }},
      {$lookup:{
        from: 'teams',
        localField: 'gameGroupInf.criteriaTeamId',
        foreignField: '_id',
        as: 'criteriaInfo'
      }},
      {$lookup:{
        from: 'teams',
        localField: 'gameGroupInf.opponentTeamId',
        foreignField: '_id',
        as: 'opponentInfo'
      }},
      {$group: {
        _id: {
          gameGroupId: '$_id',
          gameSystem: '$gameSystem',
          gameGroupTitle: '$gameGroupTitle',
          groupPlaceNum: '$groupPlaceNum',
          gameStartedFlg: '$gameStartedFlg',
          perDate:{
            gameDate: '$gameGroupInf.gameDate',
            gamesInf: '$gameGroupInf'
          }
        },
        criteriaName: {$first: '$criteriaName.teamName'},
        opponentName: {$first: '$opponentName.teamName'},
        criteriaInfo: {$first: '$criteriaInfo'},
        opponentInfo: {$first: '$opponentInfo'}
      }},
      {$sort: {
        '_id.gameSystem': 1,
        '_id.groupPlaceNum': 1,
        '_id.perDate.gameDate': 1,
        '_id.perDate.gamesInf.gameStartTime': 1
      }},
      {$unwind: {
        path: '$criteriaName',
        preserveNullAndEmptyArrays: true
      }},
      {$unwind: {
        path: '$opponentName',
        preserveNullAndEmptyArrays: true
      }},
      {$unwind: {
        path: '$criteriaInfo',
        preserveNullAndEmptyArrays: true
      }},
      {$unwind: {
        path: '$opponentInfo',
        preserveNullAndEmptyArrays: true
      }},
      {$project: {
        _id: 0,
        groupInf: '$_id',
        criteriaName: 1,
        opponentName: 1,
        'criteriaInfo.teamName': 1,
        'criteriaInfo.teamLogo': 1,
        'opponentInfo.teamName': 1,
        'opponentInfo.teamLogo': 1
      }}
    ]
  );

  // 試合グループ情報フロント返却用配列
  const gameGroupList: GameGroups[] = [];

  // 取得した試合グループ情報とチーム情報を整理する
  gameGroupRes?.forEach((elm, index) => {

    // 試合開始後かつ不参加チームが含まれている試合はフロントに返さない
    if (elm.groupInf.gameStartedFlg && (elm.groupInf.perDate.gamesInf?.criteriaNoEntry || elm.groupInf.perDate.gamesInf?.opponentNoEntry)) {
      return;
    }

    // 不要なプロパティ削除
    delete elm.groupInf.gameStartedFlg;

    // 1試合グループの各試合日の情報を整形
    const perDateData = {
      gameDate: elm.groupInf.perDate?.gameDate,
      gamesInf: [{
        gamePlace: elm.groupInf.perDate.gamesInf?.gamePlace,
        gameStartTime: elm.groupInf.perDate.gamesInf?.gameStartTime,
        criteriaName: elm?.criteriaName ? elm.criteriaName : elm?.criteriaInfo?.teamName ? elm.criteriaInfo.teamName : null ,
        criteriaLogo: elm?.criteriaInfo?.teamLogo,
        criteriaScore: elm.groupInf.perDate.gamesInf?.criteriaScore,
        opponentName: elm?.opponentName ? elm.opponentName : elm?.opponentInfo?.teamName ? elm.opponentInfo.teamName : null,
        opponentLogo: elm?.opponentInfo?.teamLogo,
        opponentScore: elm.groupInf.perDate.gamesInf?.opponentScore
      }]
    };

    // gameGroupListの最新要素インデックス
    const idx = gameGroupList.length - 1;

    if (gameGroupList.length === 0 || elm.groupInf.gameGroupId.toHexString() != gameGroupRes[index-1]?.groupInf?.gameGroupId.toHexString()) {
      // gameGroupListの最初の要素、もしくは1つ前の要素と異なる試合グループの場合
      gameGroupList.push({
        ...elm.groupInf,
        perDate: [perDateData]
      });
    } else {
      // 1つ前の要素と同じ試合グループの場合
      if (elm.groupInf.perDate?.gameDate == gameGroupRes[index-1].groupInf.perDate?.gameDate) {
        // 1つ前の要素と同じ試合日である場合は1試合情報を格納
        const num = gameGroupList[idx].perDate.length - 1;
        gameGroupList[idx].perDate[num].gamesInf.push(perDateData.gamesInf[0]);
      } else {
        // 1つ前の要素と異なる試合日である場合は1試合日情報を格納
        gameGroupList[idx].perDate.push(perDateData);
      }
    }
  });

  // スケジュールタブ情報の返却値を更新
  response.gameGroups = gameGroupList;

  // 大会参加チームを取得
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
        compId: compId
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

  // フロント返却値設定
  response.result = 'ok';
  response.regTeamList = regTeamList;
  response.inputTeamList = inputTeamList;
  response.teamIdList = teamIdList;

  return response as GetCompDetailRes;
};

/**
 * 大会登録・編集画面と大会複製時でのデータ取得の共通処理
 */
const getCompBaseInfo = async(compId: string, req: express.Request, session?): Promise<CompBaseInfo> => {

  const compBaseInf = (await dbCommonFunction(
    req,
    'competitionInfs.findOne',
    db.competitionInfs.findOne.bind(db.competitionInfs),
    undefined,
    { session },
    {_id : new ObjectId(compId)},
    {projection: {
      _id: 0,
      compAdminInf: 0,
      docIsValid: 0,
      docCreUserID: 0,
      docCreTimeStamp: 0,
      docModUserID: 0,
      docModTimeStamp: 0
    }}
  )) as unknown as CompBaseInfo;

  return compBaseInf;
};

/**
 * 大会新規登録・複製の共通処理
 */
const commonRegCompInfo = async(data: CompetitionInf, userId: string, req: express.Request, session?): Promise<CommonRes | InsertOneWriteOpResult<{ _id: ObjectId }>> => {
  // 重複チェック(大会名・開会年月日・閉会年月日・登録ユーザーの一致)
  const chkResult = await dbCommonFunction(
    req,
    'competitionInfs.countDocuments',
    db.competitionInfs.countDocuments.bind(db.competitionInfs),
    undefined,
    { session },
    {
      compName: data.compName,
      openingDate: data.openingDate,
      closingDate: data.closingDate,
      docCreUserID: userId
    },
    {limit: 1}
  );

  // 異常返却
  if (chkResult > 0) {
    return {
      result: 'ng',
      message: '同一の大会名、大会開催期間の大会を既に登録しています。'
    };
  }

  // 大会システム管理者情報を設定
  data.compAdminInf = {
    adminUserID: userId,
    adminFlg: '1',
    adminIsValid: true,
    lastUpdDate: moment().toJSON()
  };

  // 各コレクション共通情報を設定
  data.docIsValid = true;
  data.docCreUserID = userId;
  data.docCreTimeStamp = moment().toJSON();
  data.docModUserID = userId;
  data.docModTimeStamp = moment().toJSON();

  // 大会情報を新規登録し、結果を返す
  return await dbCommonFunction(
    req,
    'competitionInfs.insertOne',
    db.competitionInfs.insertOne.bind(db.competitionInfs),
    undefined,
    { session },
    data
  );
};

/**
 * 大会要綱画面 データ取得(編集用)
 */
router.post('/getCompDetailForAdmin', async (req, res) => {
  // フロントから引き継いだデータ
  const data = req.body.data;
  const compId = data.id;

  // 引き継いだデータのバリデーションチェック
  Validator(data, {
    id: {
      type: 'string'
    }
  }, req);

  const response = await getCompDetail(compId, req);

  res.json(response);
});

/**
 * 大会登録・編集画面 データ登録
 */
router.post('/regCompInfo', async (req, res) => {
  // フロントから引き継いだデータ
  const data = req.body.data;
  const userId = req.body.loginInfo.userId;

  // バリデーションチェック
  CommonValidator(data, req);

  // 重複チェックと大会新規登録
  const result = await commonRegCompInfo(data, userId, req);

  // 大会が重複していたら登録せずにこちらで処理終了、ngをフロントに返す
  if (result.result === 'ng') {
    res.json(result);
    return;
  }

  // 正常返却
  res.json({
    result: 'ok',
    compId: (result as InsertOneWriteOpResult<{ _id: ObjectId }>).insertedId
  });
});

/**
 * 大会登録・編集画面 データ取得
 */
router.post('/getCompBaseInfo', async (req, res) => {
  // フロントから引き継いだデータ
  const data = req.body.data;
  const compId = data.id;

  // 引き継いだデータのバリデーションチェック
  Validator(data, {
    id: {
      type: 'string'
    },
  }, req);

  const compBaseInf = await getCompBaseInfo(compId, req);

  // 主催名取得処理
  const resOrg = await getOrganizerNames(compBaseInf?.organizer, req);

  // データが取得できている場合、organizerに主催名を追加する
  if (compBaseInf && resOrg) {
    compBaseInf.organizer?.forEach(elm => {
      // organizerのorgIdと一致するidのresOrg.orgNameを取得
      const matchedOrg = resOrg.orgName.find(entry => entry._id === elm.orgId);
      // 一致した場合、主催名をorgNameに格納
      if (matchedOrg) {
        elm.orgName = matchedOrg.name;
      }
  });
  }

  // 返却値設定
  if(!compBaseInf) {
    // 異常返却
    res.json({
      result: 'ng',
      message: '大会情報が取得できませんでした。'
    });
  } else {
    // 正常返却
    res.json({
      result: 'ok',
      compBaseInfo: compBaseInf
    });
  }
});

/**
 * 大会登録・編集画面 データ更新
 */
router.post('/modCompInfo', async (req, res) => {
  // フロントから引き継いだデータ
  const data = req.body.data;
  const compId = data.compId;
  const userId = req.body.loginInfo.userId;

  // バリデーションチェック
  CommonValidator(data, req);

  // 重複チェック(大会名・開会年月日・閉会年月日・登録ユーザーの一致)
  const chkResult = await dbCommonFunction(
    req,
    'competitionInfs.countDocuments',
    db.competitionInfs.countDocuments.bind(db.competitionInfs),
    undefined,
    undefined,
    {
      _id: {$ne: new ObjectId(compId)},
      compName: data.compName,
      openingDate: data.openingDate,
      closingDate: data.closingDate,
      docCreUserID: userId
    },
    {limit: 1}
  );

  // 異常返却
  if (chkResult > 0) {
    res.json({
      result: 'ng',
      message: '同一の大会名、大会開催期間の大会を既に登録しています。'
    });
    return;
  }

  // 更新する各コレクション共通情報を設定
  data.docIsValid = true;
  data.docModUserID = userId;
  data.docModTimeStamp = moment().toJSON();

  // 更新不要のオブジェクトIDを削除
  delete data.compId;

  // 大会情報を更新する
  await dbCommonFunction(
    req,
    'competitionInfs.updateOne',
    db.competitionInfs.updateOne.bind(db.competitionInfs),
    undefined,
    undefined,
    {_id: new ObjectId(compId)}, {$set: data}
  );

  // 正常返却
  res.json({
    result: 'ok'
  });
});

/**
 * 大会一覧・データ取得
 */
router.post('/getCompCollectionInfs', async (req, res) => {
  // フロントから引き継いだデータ
  const data = req.body.data;

  Validator(data, {
    openingDate: {
      type: 'string'
    },
    closingDate: {
      type: 'string'
    }
  }, req);

  let query = {};

  // 開催日
  if (data.openingDate && data.closingDate) {
    query = {
      'openingDate': { $gte: data.openingDate },
      'closingDate': { $lte: data.closingDate }
    };
  }

  const compCollectionInfs = await dbCommonFunction(
    req,
    'competitionInfs.find',
    db.competitionInfs.find.bind(db.competitionInfs),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    query,
    {
      projection: {
        _id: 1,
        compName: 1,
        openingDate: 1,
        compPlace: 1,
        compAdminInf: 1,
      }
    }
  );

  const compCollectionList = [];

  // 取得した大会情報を整理
  compCollectionInfs.forEach(collection => {
    const collectionInfs: CompCollectionInfsList = {
      compId: collection._id,
      compName: collection.compName,
      openingDate: collection.openingDate,
      compPlace: collection.compPlace,
      compAdminInf: collection.compAdminInf
    };
    compCollectionList.push(collectionInfs);
  });

  // 返却
  res.json({
    result: 'ok',
    compCollectionList
  });
});

/**
 * QRコード作成パーツ登録・更新処理
 */
router.post('/regModQrcodeParts', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data;
  const compId = data.compId;
  const qrcodeParts = data.qrcodeParts;
  const userId = req.body.loginInfo.userId;

  // バリデーションチェック
  Validator(data, {
    compId: {
      type: 'string'
    },
    qrcodeParts: {
      encryptedCompId: {
        type: 'string'
      },
      encryptedDate: {
        type: 'string'
      },
      expirationDate: {
        type: 'string'
      }
    }
  }, req);

  // DBを更新
  await dbCommonFunction(
    req,
    'competitionInfs.updateOne',
    db.competitionInfs.updateOne.bind(db.competitionInfs),
    undefined,
    undefined,
    {_id: new ObjectId(compId)},
    {
      $set: {
        qrcodeParts: qrcodeParts,
        docIsValid: true,
        docModUserID: userId,
        docModTimeStamp: new Date().toISOString()
      }
    }
  );

  // 返却値の設定
  res.json({
    result: 'ok'
  });
});

/**
 * 大会要綱画面 データ取得(参照用)
 */
router.post('/getCompDetailForGuest', async (req, res) => {
  // フロントから引き継いだデータ
  const data = req.body.data;

  // 引き継いだデータのバリデーションチェック
  Validator(data, {
    encryptedId: {
      type: 'string'
    },
    encryptedDate: {
      type: 'string'
    }
  }, req);

  // 復号化
  const compId = Crypto.getDecryptedString(data.encryptedId);
  const expirationDate = Crypto.getDecryptedString(data.encryptedDate);

  // 有効期限を現在日時と比較のため日付型へ
  const year = parseInt(expirationDate.substring(0, 4));
  const month = parseInt(expirationDate.substring(4, 6));
  const date = parseInt(expirationDate.substring(6, 8));
  const expirationDateForCompare = new Date(year, month - 1, date + 1);
  // 現在日時
  const now = new Date();

  // 有効期限切れの場合は'ng'とメッセージを返して処理終了
  if (expirationDateForCompare < now){
    // フロント返却値の定義
    const response = {
      result: 'ng',
      message: '有効期限が切れています。',
      compBaseInf: {},
      gameGroups: [],
      regTeamList: [],
      inputTeamList: [],
      teamIdList: []
    };
    res.json(response);
    return;
  }

  // DBに登録してある有効期限を取得
  const dbData = await dbCommonFunction(
    req,
    'competitionInfs.findOne',
    db.competitionInfs.findOne.bind(db.competitionInfs),
    undefined,
    undefined,
    {_id: new ObjectId(compId)},
    {
      projection: {
        _id: 0,
        'qrcodeParts.expirationDate': 1
      }
    }
  );

  // URLの有効期限とDBの有効期限が一致しているか判断
  if (expirationDate === moment(dbData.qrcodeParts.expirationDate).format('YYYYMMDD')){
    // getCompDetailの呼び出し
    const response = await getCompDetail(compId, req);
    // フロント返却値設定
    res.json(response);
  } else {
    // フロント返却値の定義
    const response = {
      result: 'ng',
      message: 'このURLは無効です。',
      compBaseInf: {},
      gameGroups: [],
      regTeamList: [],
      inputTeamList: [],
      teamIdList: []
    };
    res.json(response);
  }
});

// QRコード作成: 有効期限と大会IDを取得し暗号化
router.post('/encryptionForQrcode', async (req, res) => {
  // 有効期限、大会IDの受け取り
  const data = req.body.data;

  Validator(data, {
    compId: {
      type: 'string'
    },
    expirationDate: {
      type: 'string'
    }
  }, req);

  res.json({
    result: 'ok',
    // 受け取ったデータを暗号化して返却
    encryptedId: Crypto.getEncryptedString(data.compId),
    encryptedDate: Crypto.getEncryptedString(data.expirationDate)
  });
});

/**
 * QRコード作成: 元URL設定
 */
router.post('/createBaseUrlForQrcode', async (req, res) => {

  // 環境に応じて元URLを設定
  const protocol = config.https ? 'https' : 'http';
  const baseUrl = `${protocol}://${config.clientHost}/referenceCompetitionGuide`;

  res.json({
    result: 'ok',
    baseUrl
  });
});

/**
 * 大会複製データ登録
 */
router.post('/regCopyCompInfo', async (req, res) => {
  // フロントから引き継いだデータ
  const data = req.body.data;
  const copyAll = data.copyAll;
  const baseCompId = data.compId;
  const userId = req.body.loginInfo.userId;

  // 入力値のバリデーションチェック
  Validator(data, {
    compId: {
      type: 'string'
    },
    copyAll: {
      type: 'boolean'
    }
  }, req);

  // セッション開始
  const session = await startSession();

  try {
    // トランザクション開始
    session.startTransaction(transactionOptions);

    // competitionInfsデータ取得
    const compBaseInf = await getCompBaseInfo(baseCompId, req, session) as CompetitionInf;

    // 取得できなかったらngを返しこちらで処理終了
    if(!compBaseInf) {
      // 異常返却
      res.json({
        result: 'ng',
      });
      return;
    }

    // 複製したものだと分かるように大会名の先頭に複製の文字を追加
    compBaseInf.compName = `複製_${compBaseInf.compName}`.substring(0, 50);
    // 開会・閉会年月日を今日に設定(タイムゾーンなし⇒時間部分が00:00:00に設定された日付)
    // ※new Date()を直接設定するとタイムゾーンが含まれ、後の大会重複チェックにチェックが引っかからないため)
    const today = new Date();
    const noTimeToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    compBaseInf.openingDate = noTimeToday.toISOString();
    compBaseInf.closingDate = noTimeToday.toISOString();
    // QRコード情報を削除
    delete compBaseInf.qrcodeParts;

    // competitionInfs複製データ登録
    const compResult = await commonRegCompInfo(compBaseInf, userId, req, session);

    // 大会が重複していたら登録せずにこちらで処理終了、ngをフロントに返す
    if (compResult.result === 'ng') {
      compResult.message = 'この大会は既に複製されています。\n再度複製する場合は、以前複製した大会の大会名または開催期間を変更してください。';
      res.json(compResult);
      return;
    }

    // competitionInf複製 処理結果判定
    if ((compResult as InsertOneWriteOpResult<{ _id: ObjectId}>).insertedCount !== 1) {
      // ロールバック
      await session.abortTransaction();
      // 異常返却
      res.json({
        result: 'ng',
      });
      return;
    }

    // 大会登録時に払い出されたID(大会ID)を格納
    const newCompId = (compResult as InsertOneWriteOpResult<{ _id: ObjectId }>).insertedId.toHexString();

    // teamGameRecordsデータ取得処理(後のチーム紐づけで必要なためgameRecordがあればoldRecordIdとして元の_idを残しておく)
    const teamGameRecords = await dbCommonFunction(
      req,
      'teamGameRecords.aggregate',
      db.teamGameRecords.aggregate.bind(db.teamGameRecords),
      async (cursor: Cursor) => {
        return await cursor.toArray() as unknown as CopyTeamGameRecord[];
      },
      { session },
      [
        {$match: { compId: baseCompId }},
        {$project: {
          _id: 0,
          compId: '$compId',
          teamId: '$teamId',
          teamName: '$teamName',
          gameRecord: '$gameRecord',
          oldRecordId: {
            $cond: {
              if: { $ne: [{ $type: '$gameRecord' }, 'missing'] },
              then: '$_id',
              else: null
            }
          }
        }}
      ]
    );

    // teamGameRecordsデータ(チーム情報)がある場合は登録処理へ
    if(teamGameRecords.length > 0) {
      // 試合情報なしを選択の場合
      if(!copyAll) {
        // データ整形(大会IDを複製後のものにし、不要なプロパティを削除)
        teamGameRecords.forEach(item => {
          item.compId = newCompId;
          delete item.gameRecord;
          delete item.oldRecordId;
          item.docIsValid = true;
          item.docCreUserID = userId;
          item.docCreTimeStamp = moment().toJSON();
          item.docModUserID = userId;
          item.docModTimeStamp = moment().toJSON();
        });

        // 試合情報なしのteamGameRecords複製データ登録
        const insRes = await dbCommonFunction(
          req,
          'teamGameRecords.insertMany',
          db.teamGameRecords.insertMany.bind(db.teamGameRecords),
          undefined,
          { session },
          teamGameRecords
        );

        // teamGameRecords複製 処理結果判定
        if (insRes.insertedCount !== teamGameRecords.length) {
          // ロールバック
          await session.abortTransaction();

          // 異常返却
          res.json({
            result: 'ng',
          });
          return;

        } else {
          // コミット
          await session.commitTransaction();

          // 正常返却
          res.json({
            result: 'ok',
            compId: new ObjectId(newCompId)
          });
          return;
        }
      }

      // データ整形(大会IDを複製後のものにし、結果をない状態にする)
      teamGameRecords.forEach(item => {
        item.compId = newCompId;
        if(item.gameRecord) {
          item.gameRecord.forEach(elm => {
            delete elm.rank;
            elm.perGameInf.forEach(inf => {
              inf.isWon = 0;
              inf.isLost = 0;
              inf.isDrew = 0;
              inf.score = 0;
              inf.loss = 0;
            });
          });
        }
        item.docIsValid = true;
        item.docCreUserID = userId;
        item.docCreTimeStamp = moment().toJSON();
        item.docModUserID = userId;
        item.docModTimeStamp = moment().toJSON();
      });

      // 試合情報ありのteamGameRecords複製データ登録
      const insRes = await dbCommonFunction(
        req,
        'teamGameRecords.insertMany',
        db.teamGameRecords.insertMany.bind(db.teamGameRecords),
        undefined,
        { session },
        teamGameRecords
      );

      // teamGameRecords複製 処理結果判定
      if (insRes.insertedCount !== teamGameRecords.length) {
        // ロールバック
        await session.abortTransaction();
        // 異常返却
        res.json({
          result: 'ng',
        });
        return;
      }
    }

    // gameGroupsデータ取得処理(取得時にチームを紐づけ、criteria/opponentRecordIdを複製後のチームの_idにする)
    const gameGroups = await dbCommonFunction(
      req,
      'gameGroups.aggregate',
      db.gameGroups.aggregate.bind(db.gameGroups),
      async (cursor: Cursor) => {
        return await cursor.toArray() as unknown as CopyGameGroup[];
      },
      { session },
      [
        {$match: {compId: baseCompId}},
        {$unwind: {path: '$gameGroupInf'}},
        {$lookup: {
          from: 'teamGameRecords',
          localField: 'gameGroupInf.criteriaRecordId',
          foreignField: 'oldRecordId',
          as: 'criteriaTeamInfo'
        }},
        {$addFields: {
          criteriaTeamInfo: {
            $filter: {
              input: '$criteriaTeamInfo',
              as: 'criteriaTeam',
              cond: {
                $eq: ['$$criteriaTeam.compId', newCompId]
              }
            }
          }
        }},
        {$lookup: {
          from: 'teamGameRecords',
          localField: 'gameGroupInf.opponentRecordId',
          foreignField: 'oldRecordId',
          as: 'opponentTeamInfo'
        }},
        {$addFields: {
          opponentTeamInfo: {
            $filter: {
              input: '$opponentTeamInfo',
              as: 'opponentTeam',
              cond: {
                $eq: ['$$opponentTeam.compId', newCompId]
              }
            }
          }
        }},
        {$addFields: {
          'gameGroupInf.criteriaRecordId': {
            $cond: {
              if: { $ne: [{ $type: '$gameGroupInf.criteriaRecordId' }, 'missing'] },
              then: { $arrayElemAt: ['$criteriaTeamInfo._id', 0] },
              else: null
            }
          },
          'gameGroupInf.opponentRecordId': {
            $cond: {
              if: { $ne: [{ $type: '$gameGroupInf.opponentRecordId' }, 'missing'] },
              then: { $arrayElemAt: ['$opponentTeamInfo._id', 0] },
              else: null
            }
          }
        }},
        {$group: {
          _id: '$_id',
          oldGameGroupId: {
            $first: '$_id',
          },
          compId: {
            $first: newCompId
          },
          gameSystem: {
            $first: '$gameSystem'
          },
          gameGroupTitle: {
            $first: '$gameGroupTitle'
          },
          teamCount: {
            $first: '$teamCount'
          },
          groupPlaceNum: {
            $first: '$groupPlaceNum'
          },
          gameStartedFlg: {
            $first: false
          },
          gameGroupInf: {
            $push: '$gameGroupInf'
          }
        }},
        {$project: {
          _id: 0
        }}
      ]
    );

    // gameGroupsデータ(試合情報)があれば登録処理へ
    if(gameGroups.length > 0) {
      // 試合情報なしを選択の場合
      if(!copyAll) {
        // コミット
        await session.commitTransaction();
        // 正常返却
        res.json({
          result: 'ok',
          compId: new ObjectId(newCompId)
        });
        return;
      }

      // データ整形(日時・結果をない状態にする)
      // ※criteria/opponentReordIdがnullの場合は削除する
      // ※トーナメントの場合は2回戦目以降のgameIdにcriteria/opponentRecordIdが設定されている場合があるため、その部分のcriteria/opponentRecordIdは削除する
      // また、不参加チームを選択しているところに関してはcriteriaWinFlgの設定をする
      gameGroups.forEach(item => {
        item.gameGroupInf.forEach(elm => {
          elm.gameDate = '';
          delete elm.gameStartTime;
          elm.gameProgressStatus = CNS.beforeGame;
          delete elm.criteriaScore;
          delete elm.opponentScore;
        });
        item.gameGroupInf.forEach(elm => {
          ['criteriaRecordId', 'opponentRecordId'].forEach((key) => {
            if (elm[key as keyof typeof elm] === null) {
              delete elm[key as keyof typeof elm];
            }
          });
        });

        if(item.gameSystem === CNS.tournament) {
          item.gameGroupInf.forEach(elm => {
            if(elm.gameId >= item.teamCount / 2) {
              delete elm.criteriaRecordId;
              delete elm.opponentRecordId;
            }
            if (elm.criteriaNoEntry && !elm.opponentNoEntry) {
              elm.criteriaWinFlg = false;
              elm.gameProgressStatus = CNS.afterGame;
            } else if (!elm.criteriaNoEntry && elm.opponentNoEntry) {
              elm.criteriaWinFlg = true;
              elm.gameProgressStatus = CNS.afterGame;
            } else {
              elm.criteriaWinFlg = null;
            }
            elm.freeText = '';
          });
        }
        item.docIsValid = true;
        item.docCreUserID = userId;
        item.docCreTimeStamp = moment().toJSON();
        item.docModUserID = userId;
        item.docModTimeStamp = moment().toJSON();
      });

      // gameGroups複製データ登録
      const insRes = await dbCommonFunction(
        req,
        'gameGroups.insertMany',
        db.gameGroups.insertMany.bind(db.gameGroups),
        undefined,
        { session },
        gameGroups
      );

      // gameGroups複製 処理結果判定
      if (insRes.insertedCount !== gameGroups.length) {
        // ロールバック
        await session.abortTransaction();
        // 異常返却
        res.json({
          result: 'ng',
          message: MSG.communicationErr
        });
        return;
      }
    }

    // teamGameRecordsデータ(チーム情報)とgameRecordが存在する場合はgameGroupIdを複製後のもの更新する
    if(teamGameRecords.length > 0 && teamGameRecords.some(record => record.gameRecord)) {
      // 複製後のgameGroupsを取得
      const newGameGroups = await dbCommonFunction(
        req,
        'gameGroups.aggregate',
        db.gameGroups.aggregate.bind(db.gameGroups),
        async (cursor: Cursor) => {
          return await cursor.toArray() as unknown as CopyGameGroup[];
        },
        { session },
        [
          {$match: {
            compId : newCompId
          }},
          {$project: {
            docIsValid: 0,
            docCreUserID: 0,
            docCreTimeStamp: 0,
            docModUserID: 0,
            docModTimeStamp: 0
          }}
        ]
      );

      // データ整形(gameGroupIdを複製後のものにし、トーナメントの2回戦目以降の情報を持っている場合はなくす)
      teamGameRecords.forEach(item => {
        if(item.gameRecord) {
          item.gameRecord.forEach(elm => {
            const newGame = newGameGroups.find(record => record.oldGameGroupId.toHexString() === elm.gameGroupId);
            elm.gameGroupId = newGame._id.toHexString();
            if(newGame.gameSystem === CNS.tournament) {
              elm.perGameInf = elm.perGameInf.filter(perGame => perGame.gameId < newGame.teamCount / 2);
            }
          });
        }
      });

      // teamGameRecords複製データ更新処理結果 result.okプロパティ格納用
      const updResult: number[] = [];

      // teamGameRecords複製データ更新(整形したデータで更新し、oldRecordIdは必要ないのでプロパティを削除する)
      for(const team of teamGameRecords) {
        const updRes = await dbCommonFunction(
          req,
          'teamGameRecords.updateOne',
          db.teamGameRecords.updateOne.bind(db.teamGameRecords),
          undefined,
          { session },
          {oldRecordId: team.oldRecordId},
          {
            $set: {gameRecord: team.gameRecord},
            $unset: {oldRecordId: ''}
          }
        );

        updResult.push(updRes.result.ok);
      }

      // teamGameRecords更新 処理結果判定
      if (updResult.some(result => result === 0)) {
        // ロールバック
        await session.abortTransaction();
        // 異常返却
        res.json({
          result: 'ng',
          message: MSG.communicationErr
        });
        return;
      }
    }

    // gameGroupsデータ(試合情報)がある場合はoldGameGroupIdは必要ないのでプロパティを削除する
    if(gameGroups.length > 0) {
      const updRes = await dbCommonFunction(
        req,
        'gameGroups.updateMany',
        db.gameGroups.updateMany.bind(db.gameGroups),
        undefined,
        { session },
        {compId: newCompId},
        {
          $unset: {oldGameGroupId: ''}
        }
      );

      // gameGroups更新 処理結果判定
      if (updRes.modifiedCount !== gameGroups.length) {
        // ロールバック
        await session.abortTransaction();
        // 異常返却
        res.json({
          result: 'ng',
          message: MSG.communicationErr
        });
        return;
      }
    }

    // コミット
    await session.commitTransaction();

    // 正常返却
    res.json({
      result: 'ok',
      compId: new ObjectId(newCompId)
    });

  } catch (error) {
    // ロールバック
    await session.abortTransaction();
    throw error;

  } finally {
    // セッション終了
    session.endSession();
  }
});

export default router;
