import Router from 'express-promise-router';
import Validator from '../common/validator';
import { db, dbCommonFunction } from '../common/db-client';
import { Organ, InvitationInf, AdminInf } from 'defs';
import { OrganDetail } from 'defs/api';
import { ObjectId, FilterQuery, Cursor } from 'mongodb';
import * as moment from 'moment';
import CheckAdmin from '../common/check-admin';
import * as express from 'express';

const router = Router();

  // 団体情報の取得
  const GetOrganAdminInfo = async(_id: ObjectId, req: express.Request): Promise<AdminInf[]> => {
    const organ = await dbCommonFunction(
      req,
      'organizations.findOne',
      db.organizations.findOne.bind(db.organizations),
      undefined,
      undefined,
      {_id: new ObjectId(_id)}
    );
    return organ.organAdminInf;
  };

/**
 * 団体登録
 * @param req req.body.data = フロントデータ
 * @param res
 */
router.post('/createOrgan', async (req, res) => {
  // dataを取得
  const data = req.body.data;
  const loginInfo = req.body.loginInfo;

  // 必須項目のバリデーションチェック
  Validator(data, {
    organName: {
      type: 'string',
      length: 50
    },
    sports: {
      type: 'string'
    },
    organAddInf: {
      organCountry: {type: 'string'},
      organPrefecture: {type: 'string'},
      organCity: {type: 'string', length: 100}
    },
    organAdminInf: [{
      adminUserID: {
        type: 'string'
      },
      adminFlg: {
        type: 'string',
        pattern: /1|2/
      },
      adminIsValid: {
        type: 'boolean'
      },
      lastUpdDate: {
        type: 'string'
      }
    }]
  }, req);

  // 任意項目のバリデーションチェック
  if (data.organIntro) {
    Validator(data, {
      organIntro: {
        type: 'string',
        length: 1000
      }
    }, req);
  }

  // 重複チェックを行う
  const chkResult = await dbCommonFunction(
    req,
    'organizations.countDocuments',
    db.organizations.countDocuments.bind(db.organizations),
    undefined,
    undefined,
    {
      organName: data.organName,
      sports: data.sports,
      organAddInf: {
        organCountry: data.organAddInf.organCountry,
        organPrefecture: data.organAddInf.organPrefecture,
        organCity: data.organAddInf.organCity
      }
    },
    {limit: 1}
  );

  // 検索結果が取得出来た場合、結果NGとして処理を終了する
  if(chkResult > 0) {
    res.json({
      result: 'ng',
      message: '同一の競技、団体名、所在地の団体が存在します。'
    });
    return;
  }

  // チェックがOKな場合、DBにデータ登録を実施する。
  data.docIsValid = true;
  data.docCreUserID= loginInfo.userId;
  data.docCreTimeStamp= moment().toJSON();
  data.docModUserID= loginInfo.userId;
  data.docModTimeStamp= moment().toJSON();

  const result = await dbCommonFunction(
    req,
    'organizations.insertOne',
    db.organizations.insertOne.bind(db.organizations),
    undefined,
    undefined,
    data
  );

  // 正常にデータ登録できた場合、RESULTを返却する
  res.json({
    result: 'ok',
    id: result.insertedId
  });

});

/**
 * 団体情報編集
 * @param req req.body.data = フロントデータ
 * @param res
 */
router.post('/editOrgan', async (req, res) => {
  // データの整合性チェック
  const data = req.body.data;

  // 必須項目のバリデーションチェック
  Validator(data, {
    organName: {
      type: 'string',
      length: 50
    },
    sports: {
      type: 'string'
    },
    organAddInf: {
      organCountry: {type: 'string'},
      organPrefecture: {type: 'string'},
      organCity: {type: 'string', length: 100}
    },
    _id: {
      type: 'string'
    }
  }, req);

  // 任意項目のバリデーションチェック
  if (data.organIntro) {
    Validator(data, {
      organIntro: {
        type: 'string',
        length: 1000
      }
    }, req);
  }

  // 権限チェック
  const loginInfo = req.body.loginInfo;
  const organAdminInf = (await GetOrganAdminInfo(data._id, req));
  CheckAdmin(organAdminInf, loginInfo.userId);

  // 重複チェックを行う
  const chkResult = await dbCommonFunction(
    req,
    'organizations.countDocuments',
    db.organizations.countDocuments.bind(db.organizations),
    undefined,
    undefined,
    {
      _id: {$ne: new ObjectId(data._id)},
      organName: data.organName,
      sports: data.sports,
      organAddInf: {
        organCountry: data.organAddInf.organCountry,
        organPrefecture: data.organAddInf.organPrefecture,
        organCity: data.organAddInf.organCity
      }
    },
    {limit: 1}
  );

  // 検索結果が取得出来た場合、結果NGとして処理を終了する
  if(chkResult > 0) {
    res.json({
      result: 'ng',
      message: '同一の団体名、競技、所在地の団体が存在します。'
    });
    return;
  }

  // チェックが正常な場合、データを登録する
  const condition = {_id: new ObjectId(data._id)};
  delete data._id;
  data.docModUserID= loginInfo.userId;
  data.docModTimeStamp= moment().toJSON();
  await dbCommonFunction(
    req,
    'organizations.updateOne',
    db.organizations.updateOne.bind(db.organizations),
    undefined,
    undefined,
    condition, {$set: data}
  );

  // 結果を返却
    res.json({
      result: 'ok'
    });
});

/**
 * 団体データ取得
 * @param req
 * @param res
 */
router.post('/organList', async (req, res) =>{

  const data = req.body.data;

  // 必須項目のバリデーションチェック
  Validator(data, {
    sports: {
      type: 'string'
    },
    organPrefecture: {
      type: 'string'
    }
  }, req);

  // 任意項目のバリデーションチェック
  if (data.organName) {
    Validator(data, {
      organName: {
        type: 'string',
        length: 50
      }
    }, req);
  }
  const query: FilterQuery<Organ> = {};

  // 検索条件が設定されている場合、条件を検索用に形式変換して登録
  if (data.organName) {
    query.organName = new RegExp(data.organName);
  }

  query.sports = data.sports;

  // 都道府県の設定
  query['organAddInf.organPrefecture'] = data.organPrefecture;

  // 団体数の取得
  const organCnt = await dbCommonFunction(
    req,
    'organizations.countDocuments',
    db.organizations.countDocuments.bind(db.organizations),
    undefined,
    undefined,
    query
  );

  // 該当データ取得
  const organList = await dbCommonFunction(
    req,
    'organizations.aggregate',
    db.organizations.aggregate.bind(db.organizations),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    [
      {$match: query},
      {$limit: 100},
      {$sort: {organName: 1}},
      {$project: {
          _id: 0,
          organID: '$_id',
          organName: 1,
          organAddInf: 1,
          organLogo: 1,
        }
      }
    ]
  );

  // データ返却
  res.json({
    result: 'ok',
    organList,
    organCnt
  });
});

/**
 * 大会主催団体検索
 */
router.post('/searchCompOrganList', async (req, res) => {
  // フロントから引き継いだデータ
  const data = req.body.data;

  // バリデーション
  Validator(data, {
    organName: {
      type: 'string',
      length: 50
    },
    prefecture: {
      type: 'string'
    }
  }, req);

  // 検索条件設定
  const query: FilterQuery<Organ> = {};
  // 団体名の設定
  query.organName = new RegExp(data.organName);
  // 都道府県の設定
  query['organAddInf.organPrefecture'] = data.prefecture;

  // 検索条件を元に団体情報を取得
  const compOrganList = await dbCommonFunction(
    req,
    'organizations.aggregate',
    db.organizations.aggregate.bind(db.organizations),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    [
      {$match: query},
      {$limit: 100},
      {$sort: {organName: 1}},
      {$project: {
        _id: 0,
        organId: '$_id',
        organName: 1,
        organAddInf: 1,
        organLogo: 1
      }}
    ]
  );

  // 検索条件に一致する団体の件数を取得
  const organsCnt = await dbCommonFunction(
    req,
    'organizations.countDocuments',
    db.organizations.countDocuments.bind(db.organizations),
    undefined,
    undefined,
    query
  );

  // データ返却
  res.json({
    result: 'ok',
    compOrganList: compOrganList,
    organsCnt: organsCnt
  });
});

/**
 * 1件の団体データ取得
 *
 * @param req
 * @param res
 */
router.post('/getOrganFromId', async (req, res) => {
  // 返却用オブジェクト
  const returnObj: OrganDetail = {
    result: 'ng',
    organInfo: {} as Organ,
    staffList: [],
    compList: [],
    invitationStaff: []
  };

  // 検索条件を取得
  const conditions = req.body.data;

  // バリデーションチェック
  Validator(conditions, {
    _id: {
      type: 'string'
    }
  }, req);

  // 検索条件にIDが含まれていない場合、ngを返却する
  if(conditions == void 0 || conditions._id == void 0){
    res.json(returnObj);
  }

  // データを取得
  const data = await dbCommonFunction(
    req,
    'organizations.findOne',
    db.organizations.findOne.bind(db.organizations),
    undefined,
    undefined,
    {_id: new ObjectId(conditions._id)}
  );

  // データが取得できた場合、1件目を返却要オブジェクトに設定
  if(data != void 0){
    returnObj.result = 'ok';
    returnObj.organInfo = data;

    // スタッフ一覧取得
    const userId = data.organAdminInf.map(admin => new ObjectId(admin.adminUserID));
    const staffList = await dbCommonFunction(
      req,
      'users.aggregate',
      db.users.aggregate.bind(db.users),
      async (cursor: Cursor) => {
        return await cursor.toArray();
      },
      undefined,
      [{
        $match:{
          _id: {
            $in: userId
          }
        }
      }, {
        $project: {
          _id: 1,
          userId: '$_id',
          userUniqueID: 1,
          nickname: 1
        }
      }]
    );
    returnObj.staffList = staffList;

    // 主催している大会の大会名、開催日、大会方式の取得
    const compList = await dbCommonFunction(
      req,
      'competitionInfs.aggregate',
      db.competitionInfs.aggregate.bind(db.competitionInfs),
      async (cursor: Cursor) => {
        return await cursor.toArray();
      },
      undefined,
      [
        {
          $match: {
            'organizer.orgId': conditions._id
          }
        },
        {
          $unwind: '$compSystemInf'
        },
        {
          $project: {
            _id: 0,
            compName: 1,
            openingDate: 1,
            'compSystemInf.compSystem': 1
          }
        }
      ]
    );
    returnObj.compList = compList;

    // 招待中のスタッフの情報取得
    const invitedUserId = await getInviteStaffs(conditions._id, req);
    if (invitedUserId.length > 0) {
      const invitationStaff = await dbCommonFunction(
        req,
        'users.find',
        db.users.find.bind(db.users),
        async (cursor: Cursor) => {
          return await cursor.toArray();
        },
        undefined,
        {
          _id: {
            $in: invitedUserId.map(id => new ObjectId(id))
          }
        },
        {
          projection: {
            _id: 0,
            nickname: 1
          }
        }
      );
      returnObj.invitationStaff = invitationStaff;
    }

  }

  // データを返却
  res.json(returnObj);
});

/**
 * 招待済みのデータ一覧取得処理
 * @param organId
 */
async function getInviteStaffs(organId: string, req: express.Request): Promise<string[]>{

  // データ取得条件設定
  const condition = {
    relationID: organId,
    authType: 'organStaff',
    expirDate: {$gte: moment().toJSON()}
  };

  // 招待テーブルからユーザーIDを取得
  const invitationInfs = await dbCommonFunction(
    req,
    'invitationInfs.find',
    db.invitationInfs.find.bind(db.invitationInfs),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    condition
  );
  // 招待先ユーザーID一覧に変換
  const invitedUser = invitationInfs.map(auth => auth.authDstUserID);

  // 返却
  return invitedUser;
}

/**
 * 招待済みのスタッフ取得処理
 *
 * @param req
 * @param res
 */
router.post('/getInvitedStaff', async (req, res) => {
  // 取得データの形式が問題ないか確認
  const data = req.body.data;
  Validator(data, {
    organId: {
      type: 'string'
    }
  }, req);

  // 招待先ユーザー一覧取得
  const invitedUser = await getInviteStaffs(data.organId, req);

  // データ返却
  res.json({
    result: 'ok',
    invitedUser
  });
});

/**
 * ユーザー招待処理
 *
 * @param req
 * @param res
 */
router.post('/inviteStaff', async (req, res) => {
  // ログイン中のユーザー情報を取得
  const userId = req.body.loginInfo.userId;

  // データのバリデーションチェック
  const data = req.body.data;
  Validator(data, {
    userId: {
      type: 'string'
    },
    organId: {
      type: 'string'
    }
  }, req);

  const organAdminInf = (await GetOrganAdminInfo(data.organId, req));

  // 権限チェック
  CheckAdmin(organAdminInf, userId);

  // 所属済みチェック
  const chkBelong = organAdminInf.find(admin => {
    return admin.adminUserID == data.userId;
  });
  if(chkBelong) {
    res.json({
      result: 'ng'
    });
    return;
  }

  // 登録データ生成
  const entity: InvitationInf = {
    authDstUserID: data.userId,
    authOriUserID: req.body.loginInfo.userId,
    authType: 'organStaff',
    relationID: data.organId,
    expirDate: moment().add(24, 'hours').toJSON(),
    docIsValid: true,
    docCreUserID: userId,
    docCreTimeStamp: moment().toJSON(),
    docModUserID: userId,
    docModTimeStamp: moment().toJSON()
  };

  // データ登録
  await dbCommonFunction(
    req,
    'invitationInfs.insertOne',
    db.invitationInfs.insertOne.bind(db.invitationInfs),
    undefined,
    undefined,
    entity
  );

  // 認証済みのデータ一覧取得
  const invitedUser = await getInviteStaffs(data.organId, req);

  // データ返却
  res.json({
    result: 'ok',
    invitedUser
  });
});

/**
 * 団体管理者削除処理
 * @param req
 * @param res
 */
router.post('/removeAdminInf', async (req, res) => {

  // ログイン中のユーザー情報を取得
  const userId = req.body.loginInfo.userId;

  // データのバリデーションチェック
  const data = req.body.data;
  Validator(data, {
    id: {
      type: 'string'
    },
    organId: {
      type: 'string'
    },
  }, req);

  // 権限チェック
  const organAdminInf = (await GetOrganAdminInfo(data.organId, req));
  CheckAdmin(organAdminInf, userId);

  // 管理者が2人以上の場合、更新(削除)処理実行
  if(organAdminInf.length >= 2) {
    const result = await dbCommonFunction(
      req,
      'organizations.updateOne',
      db.organizations.updateOne.bind(db.organizations),
      undefined,
      undefined,
      {_id: new ObjectId(data.organId)},
      {$pull: { organAdminInf: { adminUserID: data.id}}}
    );

    // データ更新(削除)が成功した場合、処理結果'ok'と権限の状態を返却
    if(result.modifiedCount > 0) {
      // 自分自身を所属スタッフから削除した場合、他に管理している団体が存在するか確認する
      // 権限判定用変数
      let isAdminOrgan = true;
      if(userId === data.id) {
        // 管理している団体を検索
        const organ = await dbCommonFunction(
          req,
          'organizations.findOne',
          db.organizations.findOne.bind(db.organizations),
          undefined,
          undefined,
          {
            'organAdminInf.adminUserID': userId
          },{
            projection: {_id: 1}
          }
        );
        // 他に管理している団体が存在しない場合は権限変更
        if(!organ) {
          isAdminOrgan = false;
        }
      }
      res.json({
        result: 'ok',
        isAdminOrgan
      });
    // データ更新(削除)が失敗した場合処理結果'ng'を返却
    } else {
      res.json({
        result: 'ng'
      });
    }

  // 管理者が2人未満の場合、処理結果'ng'を返却
  } else {
    res.json({
      result: 'ng',
      message: '所属スタッフが2名以上の場合のみ解除可能です。'
    });
  }
});

export default router;
