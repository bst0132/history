import Router from 'express-promise-router';
import Validator, { ValidateSetting } from '../common/validator';
import { db, dbCommonFunction } from '../common/db-client';
import { AuthType } from '../common/constants';
import { InvitationInf, User, TeamHistory, AdminInf, Team } from 'defs/entity';
import { ManagePlayerInfo, InviteMemberInfo } from 'defs/api';
import { ObjectId, FilterQuery, Cursor } from 'mongodb';
import * as moment from 'moment';
import CheckAdmin from '../common/check-admin';
import * as express from 'express';

const router = Router();

// チーム情報の取得
const GetTeamAdminInfo = async(_id: ObjectId, req: express.Request): Promise<AdminInf[]> => {
  const team = await dbCommonFunction(
    req,
    'teams.findOne',
    db.teams.findOne.bind(db.teams),
    undefined,
    undefined,
    {_id: new ObjectId(_id)}
  );
  return team.teamAdminInf;
};

// 選手リスト作成
const GetPlayerlist = async (teamHistories: TeamHistory[], req: express.Request): Promise<ManagePlayerInfo[]> => {
  const playerList: ManagePlayerInfo[] = [];
  for (let i = 0; i < teamHistories.length; i++) {
    const userQuery = {
      _id: new ObjectId(teamHistories[i].userID)
    };
    const user = await dbCommonFunction(
      req,
      'users.findOne',
      db.users.findOne.bind(db.users),
      undefined,
      undefined,
      userQuery
    );
    if(!user) {
      throw new Error('failed to get user data!');
    }
    const playerInfo: ManagePlayerInfo = {
      userId: user._id,
      playerName: `${user.playerInf.lastName} ${user.playerInf.firstName}`,
      uniNum: teamHistories[i].teamSportsHisInf?.uniNum,
      gamePosition: teamHistories[i].teamSportsHisInf?.gamePosition,
      teamStartDate: teamHistories[i].teamStartDate,
      teamEndDate: teamHistories[i].teamEndDate || '',
      userImage: user.userImage,
      teamHistoryId: teamHistories[i]._id
    };
    playerList.push(playerInfo);
  }
  return playerList;
};

// チーム登録
router.post('/createTeam', async (req, res) => {
  const data = req.body.data;
  const loginInfo = req.body.loginInfo;

  // 必須項目のバリデーションチェック
  Validator(data, {
    teamName: {
      type: 'string',
      length: 50
    },
    sports: {
      type: 'string'
    },
    teamEstDate: {
      type: 'string'
    },
    teamAddInf: {
      teamCountry: {type: 'string'},
      teamPrefecture: {type: 'string'},
      teamCity: {type: 'string', length: 100}
    },
    teamAdminInf:[{
        adminUserID: {
          type: 'string'
        },
        /** 運営区分(1：管理者、2：スタッフ) */
        adminFlg: {
          type: 'string',
          pattern: /1|2/
        },
        adminIsValid: {
          type: 'boolean'
        },
        lastUpdDate: {
          type: 'string' // パターンチェック入れる？
        }
    }]
  }, req);

  // 任意項目のバリデーションチェック
  const valiSet = new Object() as ValidateSetting;

  // データのある項目をvaliSetに設定
  if (data.teamIntro) {
    valiSet['teamIntro'] = {
      type: 'string',
      length: 1000
    };
  }
  if (data.teamTel) {
    valiSet['teamTel'] = {
      type: 'string',
      length: 20
    };
  }

  // valiSetに含まれる項目をチェック
  if (Object.keys(valiSet).length) {
    Validator(data, valiSet, req);
  }

  // 重複チェックを行う
  const chkResult = await dbCommonFunction(
    req,
    'teams.countDocuments',
    db.teams.countDocuments.bind(db.teams),
    undefined,
    undefined,
    {
      teamName: data.teamName,
      sports: data.sports,
      teamEstDate: data.teamEstDate,
      teamAddInf: {
        teamCountry: data.teamAddInf.teamCountry,
        teamPrefecture: data.teamAddInf.teamPrefecture,
        teamCity: data.teamAddInf.teamCity
      }
    },
    {limit: 1}
  );

  // 検索結果が取得出来た場合、結果NGとして処理を終了する
  if(chkResult > 0) {
    res.json({
      result: 'ng',
      message: '同一の競技、チーム名、設立日、所在地のチームが存在します。'
    });
    return;
  }

  data.docIsValid = true;
  data.docCreUserID= loginInfo.userId;
  data.docCreTimeStamp= moment().toJSON();
  data.docModUserID= loginInfo.userId;
  data.docModTimeStamp= moment().toJSON();

  const result = await dbCommonFunction(
    req,
    'teams.insertOne',
    db.teams.insertOne.bind(db.teams),
    undefined,
    undefined,
    data
  );

  res.json({
    result: 'ok',
    id: result.insertedId
  });
});

// チーム編集
router.post('/editTeam', async (req, res) => {
  const data = req.body.data;
  const loginInfo = req.body.loginInfo;

  // 必須項目のバリデーションチェック
  Validator(data, {
    teamId: {
      type: 'string'
    },
    teamName: {
      type: 'string',
      length: 50
    },
    sports: {
      type: 'string'
    },
    teamEstDate: {
      type: 'string'
    },
    teamAddInf: {
      teamCountry: {type: 'string'},
      teamPrefecture: {type: 'string'},
      teamCity: {type: 'string', length: 100}
    },
  }, req);

  // 任意項目のバリデーションチェック
  const valiSet = new Object() as ValidateSetting;

  // データのある項目をvaliSetに設定
  if (data.teamIntro) {
    valiSet['teamIntro'] = {
      type: 'string',
      length: 1000
    };
  }
  if (data.teamTel) {
    valiSet['teamTel'] = {
      type: 'string',
      length: 20
    };
  }

  // valiSetに含まれる項目をチェック
  if (Object.keys(valiSet).length) {
    Validator(data, valiSet, req);
  }

  const teamId = data.teamId;

  // 権限チェック
  const teamAdminInf = (await GetTeamAdminInfo(teamId, req));
  CheckAdmin(teamAdminInf, loginInfo.userId);

  delete data.teamId;
  data.docModUserID= loginInfo.userId;
  data.docModTimeStamp= moment().toJSON();
  await dbCommonFunction(
    req,
    'teams.updateOne',
    db.teams.updateOne.bind(db.teams),
    undefined,
    undefined,
    {_id: new ObjectId(teamId)}, {$set: data}
  );
  res.json({
    result: 'ok'
  });

});

/**
 * チームデータ取得
 * @param req
 * @param res
 */
router.post('/teamList', async (req, res) => {

  const data = req.body.data;

  // 必須項目のバリデーションチェック
  Validator(data, {
    sports: {
      type: 'string'
    },
    teamPrefecture: {
      type: 'string'
    }
  }, req);

  // 任意項目のバリデーションチェック
  if (data.teamName) {
    Validator(data, {
      teamName: {
        type: 'string',
        length: 50
      }
    }, req);
  }

  // 検索パラメータの設定
  const query: FilterQuery<Team> = {};

  // チーム名の設定
  if (data.teamName) {
    query.teamName = new RegExp(data.teamName);
  }

  // 競技の設定
  query.sports = data.sports;

  // 都道府県の設定
  query['teamAddInf.teamPrefecture'] = data.teamPrefecture;

  // チーム数の取得
  const teamsCnt = await dbCommonFunction(
    req,
    'teams.countDocuments',
    db.teams.countDocuments.bind(db.teams),
    undefined,
    undefined,
    query
  );

  // チームの検索
  const teamList = await dbCommonFunction(
    req,
    'teams.aggregate',
    db.teams.aggregate.bind(db.teams),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    [
      {$match: query},
      {$limit: 100},
      {$sort: {teamName: 1}},
      {$project: {
        _id: 0,
        teamID: '$_id',
        teamName: 1,
        teamAddInf: 1,
        teamLogo: 1
      }}
    ]
  );

  res.json({
    result: 'ok',
    teamList,
    teamsCnt
  });
});

/**
 * チーム参照情報取得
 */
router.post('/teamDetail', async (req, res) => {
  const data = req.body.data;
  Validator(data, {
    id: {
      type: 'string'
    },
    type: {
      type: 'string',
      pattern: /team/
    }
  }, req);
  const teamId = data.id as string;

  const teamInfo = await dbCommonFunction(
    req,
    'teams.findOne',
    db.teams.findOne.bind(db.teams),
    undefined,
    undefined,
    {
      _id: new ObjectId(teamId)
    }, {
      projection: {
        _id: 0
      }
    }
  );

  if(!teamInfo) {
    throw new Error('failed to get team data!');
  }

  // 現在所属している選手の検索
  const playerQuery = {
    teamID: teamId,
    teamStartDate: {
      $lte: moment().toJSON()
    },
    $or: [{
      teamEndDate: {
        $gte: moment().toJSON()
      }
    },{
      teamEndDate: {
        $exists: false
      }
    },{
      teamEndDate: ''
    }]
  };

  const teamHistories = await dbCommonFunction(
    req,
    'teamHistories.find',
    db.teamHistories.find.bind(db.teamHistories),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    playerQuery
  );
  const playerList = await GetPlayerlist(teamHistories, req);

  // 将来所属予定の選手の検索
  const futurePlayerQuery = {
    teamID: teamId,
    teamStartDate: {
      $gt: moment().toJSON()
    }
  };

  const futureTeamHistories = await dbCommonFunction(
    req,
    'teamHistories.find',
    db.teamHistories.find.bind(db.teamHistories),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    futurePlayerQuery
  );
  const futurePlayerList = await GetPlayerlist(futureTeamHistories, req);

  // 過去に所属していた選手の検索
  const pastPlayerQuery = {
    teamID: teamId,
    $and: [{teamEndDate: {
      $lt: moment().toJSON()
    }},{
      teamEndDate: {
        $exists: true
      }
    },{
      teamEndDate: {
        $ne: ''
      }
    }]
  };
  const pastTeamHistories = await dbCommonFunction(
    req,
    'teamHistories.find',
    db.teamHistories.find.bind(db.teamHistories),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    pastPlayerQuery
  );
  const pastPlayerList = await GetPlayerlist(pastTeamHistories, req);

  // チームが参加している大会IDの取得
  const organizeComp = await dbCommonFunction(
    req,
    'teamGameRecords.find',
    db.teamGameRecords.find.bind(db.teamGameRecords),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    {
      teamId: new ObjectId(teamId)
    },{
      projection: {
        compId: 1,
        _id: 0
      }
    }
  );
  // 大会IDのみの一覧に変換
  const compIdList = organizeComp.map(comp => comp.compId);

  // 参加している大会(compIdList)の大会名、開催日、主催団体情報の取得
    const partCompHisList = await dbCommonFunction(
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
            _id: {
              $in: compIdList.map(id => new ObjectId(id))
            }
          }
        },
        {
          $project: {
            _id: 0,
            compName: 1,
            openingDate: 1,
            organizer: 1,
          }
        }
      ]
    );

  // 主催団体IDの配列
  const organIDList: ObjectId[] = [];
  // 主催チームIDの配列
  const teamIDList: ObjectId[] = [];

  // partCompHisListの配列情報を1つずつ取得
  partCompHisList.forEach(item => {
    // organizerの配列情報を１つずつ取得
    item.organizer.forEach(org => {
      // orgFlagが1(団体)の場合organIDListに追加
      if(org.orgFlag == '1') {
        organIDList.push(new ObjectId(org.orgId));
        // orgFlagが2(チーム)の場合teamListに追加
      } else if(org.orgFlag == '2') {
        teamIDList.push(new ObjectId(org.orgId));
      }
    });
  });

  // 団体情報の取得
  const organList = await dbCommonFunction(
    req,
    'organizations.aggregate',
    db.organizations.aggregate.bind(db.organizations),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    [
      {
        // organIDListよりorganIDをオブジェクトに変換し主催団体情報を取得
        $match:{
          _id: {$in: organIDList}
        }
      },{
        $project: {
          _id: 0,
          organID: '$_id',
          organName: 1
        }
      }
    ]
  );

  // チーム情報の取得
  const teamList = await dbCommonFunction(
    req,
    'teams.aggregate',
    db.teams.aggregate.bind(db.teams),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    [
      {
        // teamIDListよりorganIDをオブジェクトに変換し主催チーム情報を取得
        $match:{
          _id: {$in: teamIDList}
        }
      },{
        $project: {
          _id: 0,
          teamID: '$_id',
          teamName: 1
        }
      }
    ]
  );

  // TODO データ入れてから関連情報取って加工する
  res.json({
    result: 'ok',
    teamInfo: teamInfo,
    players: playerList,
    futurePlayers: futurePlayerList,
    pastPlayers: pastPlayerList,
    organizeComp: organizeComp,
    partCompHisList: partCompHisList,
    organList: organList,
    teamList: teamList
  });
});

// 選手/スタッフ検索（DB検索）
async function findUserList(authType: string, teamId: string, req: express.Request): Promise<User[]> {

  const query: FilterQuery<InvitationInf> =
    {
      relationID: teamId,
      authType: authType,
      expirDate: {$gte: moment().toJSON()}
    };

  // 招待中のユーザーを検索
  const invitationUser = await dbCommonFunction(
    req,
    'invitationInfs.find',
    db.invitationInfs.find.bind(db.invitationInfs),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    query, {projection: {authDstUserID: 1}}
  );

  // ユーザー検索を実行し、招待中のユーザーリストへ名前を格納する
  const matchNamelist = await dbCommonFunction(
    req,
    'users.aggregate',
    db.users.aggregate.bind(db.users),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    [
      {
        $match: {
          _id: {
          $in: invitationUser.map(invitationUser => new ObjectId(invitationUser.authDstUserID))
        }}
      },
      {
        $project: {
          'playerInf.lastName': 1
          ,'playerInf.firstName': 1
          ,nickname: 1
          ,_id: 1
        }
      }
    ]
  );

  return matchNamelist;
}

// 選手/スタッフ検索
async function getUserList(authType: string, teamId: string, req: express.Request): Promise<string[]> {

  const invitationUserList: string[] = [];

  const matchNamelist = await findUserList(authType, teamId, req);

  // 正常に検索できた場合、string配列に詰め替える
  for (let i = 0; i < matchNamelist.length; i++) {
    let nm = '';
    if (authType == AuthType.PLAYER) {
      nm = matchNamelist[i].playerInf.lastName + ' ' + matchNamelist[i].playerInf.firstName;
    } else {
      nm = matchNamelist[i].nickname;
    }
    invitationUserList.push(nm);
  }

  return invitationUserList;
}

/**
 * チーム編集情報取得
 */
router.post('/editTeamInit', async (req, res) => {
  const data = req.body.data;
  Validator(data, {
    id: {
      type: 'string'
    },
    type: {
      type: 'string',
      pattern: /team/
    }
  }, req);
  const teamId = data.id as string;

  // チーム情報取得
  const teamInfoList = await dbCommonFunction(
    req,
    'teams.aggregate',
    db.teams.aggregate.bind(db.teams),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    [
      {
        $match: {
          '_id': new ObjectId(teamId)
        }
      }, {
        $project: {
          _id: 0,
          teamID: '$_id',
          teamName: 1,
          sports: 1,
          teamIntro: 1,
          teamEstDate: 1,
          teamAddInf: 1,
          teamTel: 1,
          teamLogo: 1,
          teamAdminInf: 1
        }}
    ]
  );

  // チーム情報格納
  const teamInfo = teamInfoList[0];

  // チーム情報存在確認
  if(!teamInfo) {
    throw new Error('failed to get team data!');
  }

  // 現在所属している選手の検索
  // 検索条件作成
  const playerQuery = {
    teamID: teamId,
    $or: [{
      teamEndDate: {
        $exists: false
      }
    },{
      teamEndDate: {
        $gte: moment().toJSON()
      }
    },{
      teamEndDate: ''
    }]
  };

  // 選手検索
  const teamHistories = await dbCommonFunction(
    req,
    'teamHistories.find',
    db.teamHistories.find.bind(db.teamHistories),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    playerQuery
  );
  // 選手リスト作成
  const playerList = await GetPlayerlist(teamHistories, req);

  // 招待中の選手を検索
  const invitationPlayerList = await getUserList(AuthType.PLAYER, teamId, req);

  // 招待中のスタッフを検索
  const invitationStaffList = await getUserList(AuthType.STAFF, teamId, req);

  // チーム管理者の検索
  const adminList: InviteMemberInfo[] = [];
  for(let i = 0; i < teamInfo.teamAdminInf.length; i++) {
    // 検索条件作成
    const adminQuery = {
      _id: new ObjectId(teamInfo.teamAdminInf[i].adminUserID)
    };
    // チーム管理者のユーザ情報取得
    const admin = await dbCommonFunction(
      req,
      'users.findOne',
      db.users.findOne.bind(db.users),
      undefined,
      undefined,
      adminQuery
    );
    // ユーザ情報存在確認
    if(!admin) {
      throw new Error('failed to get admin data!');
    }
    // チーム管理者情報成形
    const adminInfo: InviteMemberInfo = {
      _id: admin._id,
      adminFlg: teamInfo.teamAdminInf[i].adminFlg,
      name: admin.nickname
    };
    // 管理者配列に追加
    adminList.push(adminInfo);
  }

  res.json({
    result: 'ok',
    teamInfo: teamInfo,
    players: playerList,
    admins: adminList,
    invitationPlayer: invitationPlayerList,
    invitationStaff: invitationStaffList
  });
});

router.post('/inviteStaff', async (req, res) => {
  const userId = req.body.loginInfo.userId;
  const data = req.body.data;
  Validator(data, {
    userId: {
      type: 'string'
    },
    teamId: {
      type: 'string'
    }
  }, req);

  const teamId = data.teamId;
  const teamAdminInf = (await GetTeamAdminInfo(teamId, req));

  // 権限チェック
  CheckAdmin(teamAdminInf, userId);

  // 所属済みチェック
  const chkBelong = teamAdminInf.find(admin => {
    return admin.adminUserID == data.userId;
  });
  if(chkBelong) {
    res.json({
      result: 'ng'
    });
    return;
  }

  const entity: InvitationInf = {
    authDstUserID: data.userId,
    authOriUserID: req.body.loginInfo.userId,
    authType: 'teamStaff',
    relationID: data.teamId,
    expirDate: moment().add(24, 'hours').toJSON(),
    docIsValid: true,
    docCreUserID: userId,
    docCreTimeStamp: moment().toJSON(),
    docModUserID: userId,
    docModTimeStamp: moment().toJSON()
  };

  await dbCommonFunction(
    req,
    'invitationInfs.insertOne',
    db.invitationInfs.insertOne.bind(db.invitationInfs),
    undefined,
    undefined,
    entity
  );
  const query = {
    relationID: data.teamId,
    authType: 'teamStaff',
    expirDate: {$gte: moment().toJSON()}
  };
  const invitationInfs = await dbCommonFunction(
    req,
    'invitationInfs.find',
    db.invitationInfs.find.bind(db.invitationInfs),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    query
  );
  const invitedUser = invitationInfs.map(inf => inf.authDstUserID);
  res.json({
    result: 'ok',
    invitedUser
  });

});

router.post('/getInvitedStaff', async (req, res) => {
  const data = req.body.data;
  Validator(data, {
    teamId: {
      type: 'string'
    }
  }, req);

  const query = {
    relationID: data.teamId,
    authType: 'teamStaff',
    expirDate: {$gte: moment().toJSON()}
  };
  const invitationInfs = await dbCommonFunction(
    req,
    'invitationInfs.find',
    db.invitationInfs.find.bind(db.invitationInfs),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    query
  );
  const invitedUser = invitationInfs.map(inf => inf.authDstUserID);
  res.json({
    result: 'ok',
    invitedUser
  });
});

router.post('/managePlayerList', async (req, res) => {
  const data = req.body.data;
  Validator(data, {
    teamId: {
      type: 'string'
    }
  }, req);


  const query = {
    teamID: data.teamId,
    $or: [{
      teamEndDate: {
        $exists: false
      }
    },{
      teamEndDate: {
        $gte: moment().toJSON()
      }
    },{
      teamEndDate: ''
    }]
  };

  const teamInfo = await dbCommonFunction(
    req,
    'teams.findOne',
    db.teams.findOne.bind(db.teams),
    undefined,
    undefined,
    {
      _id: new ObjectId(data.teamId)
    }
  );
  const teamHistories = await dbCommonFunction(
    req,
    'teamHistories.find',
    db.teamHistories.find.bind(db.teamHistories),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    query
  );
  const playerList = [];
  for (let i = 0; i < teamHistories.length; i++) {
    const userQuery = {
      _id: new ObjectId(teamHistories[i].userID)
    };
    const user = await dbCommonFunction(
      req,
      'users.findOne',
      db.users.findOne.bind(db.users),
      undefined,
      undefined,
      userQuery
    );
    const playerInfo = {
      userId: user._id,
      playerName: `${user.playerInf.lastName} ${user.playerInf.firstName}`,
      uniNum: teamHistories[i].teamSportsHisInf?.uniNum,
      gamePosition: teamHistories[i].teamSportsHisInf?.gamePosition,
      teamStartDate: teamHistories[i].teamStartDate,
      teamEndDate: teamHistories[i].teamEndDate || ''
    };
    playerList.push(playerInfo);
  }

  res.json({
    result: 'ok',
    teamInfo,
    playerList
  });
});

router.post('/updatePlayer', async (req, res) => {
  const userId = req.body.loginInfo.userId;
  const data = req.body.data;

  Validator(data.playerInfo, {
    uniNum: {
      type: 'string',
      length: 3
    },
    gamePosition: {
      type: 'string',
      length: 25
    },
    teamStartDate: {
      type: 'string'
    }
  }, req);

  // 権限チェック
  const teamAdminInf = (await GetTeamAdminInfo(data.teamId, req));
  CheckAdmin(teamAdminInf, userId);

  // 所属開始年月、所属終了年月が入力されている場合のみ判定
  if(data.playerInfo.teamEndDate && data.playerInfo.teamStartDate) {
    // 所属終了年月が所属開始年月より過去の場合エラー
    if(data.playerInfo.teamStartDate > data.playerInfo.teamEndDate) {
      throw new Error('teamStartDate is inconsistent!');
    }
  }

  const teamHistory = {
    'teamSportsHisInf.uniNum': data.playerInfo.uniNum,
    'teamSportsHisInf.gamePosition': data.playerInfo.gamePosition,
    teamStartDate: data.playerInfo.teamStartDate,
    teamEndDate: data.playerInfo.teamEndDate || '',
    docModUserID: userId,
    docModTimeStamp: moment().toJSON()
  };

  await dbCommonFunction(
    req,
    'teamHistories.updateOne',
    db.teamHistories.updateOne.bind(db.teamHistories),
    undefined,
    undefined,
    {
      _id: new ObjectId(data.playerInfo.teamHistoryId)
    }, {$set:teamHistory}
  );

  res.json({
    result: 'ok'
  });
});


router.post('/playerList', async (req, res) => {
  const data = req.body.data;

  Validator(data, {
    userUniqueID: {
      type: 'string',
      pattern: /^(?=.*?[a-zA-Z])(?=.*?\d)[a-zA-Z\d]{8,20}$/
    }
  }, req);

  // 検索時のパラメータ設定
  const query: FilterQuery<User> = {};
  query.userUniqueID = data.userUniqueID;
  query.isSearchable = true;

  const user = await dbCommonFunction(
    req,
    'users.findOne',
    db.users.findOne.bind(db.users),
    undefined,
    undefined,
    query
  );

  let playerInfo = null;

  // 選手情報存在判定
  if(user && user.playerInf) {
    // 選手情報格納
    playerInfo = {
      id: user._id,
      playerName: `${user.playerInf.lastName} ${user.playerInf.firstName}`,
      userImage: user.userImage
    };
  }

  res.json({
    result: 'ok',
    playerInfo
  });

});

router.post('/invitePlayer', async (req, res) => {
  const userId = req.body.loginInfo.userId;
  const data = req.body.data;
  Validator(data, {
    userId: {
      type: 'string'
    },
    teamId: {
      type: 'string'
    }
  }, req);

  // 権限チェック
  const teamAdminInf = (await GetTeamAdminInfo(data.teamId, req));
  CheckAdmin(teamAdminInf, userId);

  // 所属済みチェック
  const chkBelong = await dbCommonFunction(
    req,
    'teamHistories.findOne',
    db.teamHistories.findOne.bind(db.teamHistories),
    undefined,
    undefined,
    {
      teamID: data.teamId,
      userID: data.userId,
      $or: [{
        teamEndDate: {
          $exists: false
        }
      },{
        teamEndDate: {
          $gte: moment().toJSON()
        }
      },{
        teamEndDate: ''
      }]
    }
  );

  if(chkBelong) {
    res.json({
      result: 'ng'
    });
    return;
  }

  const entity: InvitationInf = {
    authDstUserID: data.userId,
    authOriUserID: userId,
    authType: 'player',
    relationID: data.teamId,
    expirDate: moment().add(24, 'hours').toJSON(),
    docIsValid: true,
    docCreUserID: userId,
    docCreTimeStamp: moment().toJSON(),
    docModUserID: userId,
    docModTimeStamp: moment().toJSON()
  };

  await dbCommonFunction(
    req,
    'invitationInfs.insertOne',
    db.invitationInfs.insertOne.bind(db.invitationInfs),
    undefined,
    undefined,
    entity
  );
  const query = {
    relationID: data.teamId,
    authType: 'player',
    expirDate: {$gte: moment().toJSON()}
  };
  const invitationInfs = await dbCommonFunction(
    req,
    'invitationInfs.find',
    db.invitationInfs.find.bind(db.invitationInfs),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    query
  );
  const invitedPlayer = invitationInfs.map(inf => inf.authDstUserID);
  res.json({
    result: 'ok',
    invitedPlayer
  });
});

router.post('/getInvitedPlayer', async (req, res) => {
  const data = req.body.data;
  Validator(data, {
    teamId: {
      type: 'string'
    }
  }, req);

  const query = {
    relationID: data.teamId,
    authType: 'player',
    expirDate: {$gte: moment().toJSON()}
  };
  const invitationInfs = await dbCommonFunction(
    req,
    'invitationInfs.find',
    db.invitationInfs.find.bind(db.invitationInfs),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    query
  );
  const invitedPlayer = invitationInfs.map(inf => inf.authDstUserID);
  res.json({
    result: 'ok',
    invitedPlayer
  });
});

/**
 * チーム管理者削除処理
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
    teamId: {
      type: 'string'
    },
  }, req);

  // 権限チェック
  const teamAdminInf = (await GetTeamAdminInfo(data.teamId, req));
  CheckAdmin(teamAdminInf, userId);

  // 管理者が2人以上の場合、更新(削除)処理実行
  if(teamAdminInf.length >= 2) {
    const result = await dbCommonFunction(
      req,
      'teams.updateOne',
      db.teams.updateOne.bind(db.teams),
      undefined,
      undefined,
      {_id: new ObjectId(data.teamId)},
      {$pull: { teamAdminInf: { adminUserID: data.id}}}
    );

    // データ更新(削除)が成功した場合、処理結果'ok'と権限の状態を返却
    if(result.modifiedCount > 0) {
      // 自分自身を所属スタッフから削除した場合、他に管理しているチームが存在するか確認する
      // 権限判定用変数
      let isAdminTeam = true;
      if(userId === data.id) {
        // 管理しているチームを検索
        const team = await dbCommonFunction(
          req,
          'teams.findOne',
          db.teams.findOne.bind(db.teams),
          undefined,
          undefined,
          {
            'teamAdminInf.adminUserID': userId
          },{
            projection: {_id: 1}
          }
        );
        // 他に管理しているチームが存在しない場合は権限変更
        if(!team) {
          isAdminTeam = false;
        }
      }
      res.json({
        result: 'ok',
        isAdminTeam
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

/**
 * 大会参加チーム検索
 */
router.post('/compTeamList', async (req, res) => {
  // フロントから引き継いだデータ
  const data = req.body.data;

  // バリデーションチェック
  Validator(data, {
    teamName: {
      type: 'string',
      length: 50
    },
    prefecture: {
      type: 'string'
    },
  }, req);

  // 検索条件のクエリ設定
  const query: FilterQuery<Team> = {};
  // チーム名の設定
  query.teamName = new RegExp(data.teamName);
  // 都道府県の設定
  query['teamAddInf.teamPrefecture'] = data.prefecture;

  // 検索条件をもとにチーム情報を取得
  const compTeamList = await dbCommonFunction(
    req,
    'teams.aggregate',
    db.teams.aggregate.bind(db.teams),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    [
      {$match: query},
      {$limit: 100},
      {$sort: {teamName: 1}},
      {$project: {
        _id: 0,
        teamId: '$_id',
        teamName: 1,
        teamAddInf: 1,
        teamLogo: 1
      }}
    ]
  );

  // 検索条件に一致するチームの総数を取得
  const teamsCnt = await dbCommonFunction(
    req,
    'teams.countDocuments',
    db.teams.countDocuments.bind(db.teams),
    undefined,
    undefined,
    query
  );

  // 正常時の返却値設定
  res.json({
    result: 'ok',
    compTeamList: compTeamList,
    teamsCnt: teamsCnt
  });
});

export default router;
