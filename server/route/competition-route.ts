import Router from 'express-promise-router';
import { db } from '../common/db-client';
import Validator from '../common/validator';
import { Competition, Game, Organ, Team, InvitationInf, User, PlaceHistory, AdminInf } from 'defs/entity';
import { ObjectId, FilterQuery, UpdateQuery } from 'mongodb';
import moment = require('moment');
import { InviteOrganInfo, OrganizerInfo, InviteMemberInfo, InviteTeamInfo, PlaceInfo, CompOrganInfo, CompAdminInfo, InviteOrganizerTeamInfo, LeagueTournamentInfo } from 'defs/api';
import CheckAdmin from '../common/check-admin';
import { CNS } from '../../client/app/common/defines';
import * as Crypto from '../common/cryptor';

const router = Router();

  // 大会情報の取得
  const GetCompAdminInfo = async(_id: ObjectId): Promise<AdminInf[]> => {
    const comp = await db.competitions.findOne({_id: new ObjectId(_id)});
    return comp.compAdminInf;
  };

/**
 * 大会登録処理
 */
router.post('/createCompetition', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data;
  const loginInfo = req.body.loginInfo;
  const adminList = [];

  // 大会管理者として設定するためのデータ更新
  data.organ.organAdminInf.forEach(admin => {
    adminList.push({
      adminUserID: admin.adminUserID,
      adminFlg: '1',
      adminIsValid: admin.adminIsValid,
      lastUpdDate: new Date().toISOString()
    });
  });

// 主催団体メンバー全員を大会管理者として設定
  data.compAdminInf = adminList;

  // 入力値のチェック
  Validator(data, {
    compName: {
      type: 'string'
    },
    sports: {
      type: 'string'
    },
    heldDate: {
      type: 'string'
    },
    compAdminInf:[{
      adminUserID: {
        type: 'string'
      },
      /** 運営区分(1：管理者、2：スタッフ) */
      adminFlg: {
        type: 'string',
        pattern: /1/
      },
      adminIsValid: {
        type: 'boolean'
      },
      lastUpdDate: {
        type: 'string'
      }
    }],
    organ: {
      organizerID: {
        type: 'string'
      },
      organizerFlg: {
        type: 'string'
      }
    }
  }, req);

  // 重複チェックを行う
  const chkResult = await db.competitions.countDocuments(
    {
      compName: data.compName,
      heldDate: data.heldDate,
      'organizerInf.organizerID': data.organ.organizerID
    },
    {limit: 1}
  );

  // 検索結果が取得出来た場合、結果NGとして処理を終了する
  if(chkResult > 0) {
    res.json({
      result: 'ng'
    });
    return;
  }

  // 主催団体情報の設定
  data.organizerInf = [{
    organizerID: data.organ.organizerID,
    organizerFlg: data.organ.organizerFlg
  }];
  // organは登録値として不要なので削除
  delete data.organ;

  // 参加チームを空白で登録
  data.teamID = [];

  // 開催地を空白で登録
  data.placeID = [];

  // 共通項目の設定
  data.docIsValid = true;
  data.docCreUserID = loginInfo.userId;
  data.docCreTimeStamp = new Date().toISOString();
  data.docModUserID = loginInfo.userId;
  data.docModTimeStamp = new Date().toISOString();

  // DB登録処理
  db.competitions.insertOne(data, (_err, result) => {

    // 登録したObjectIdの取得
    const compID = result.insertedId;

    // 返却値設定
    res.json({
      result: 'ok',
      compID: compID
    });

  });

});

/**
 * 大会登録：初期処理
 */
router.post('/createCompetitonInit', async (req, res) => {

  // ログイン情報
  const loginInfo = req.body.loginInfo;

  // チェック
  Validator(loginInfo, {
    userId: {
      type: 'string'
    }
  }, req);

  // ユーザー情報の取得
  const user = await db.users.findOne({_id: new ObjectId(loginInfo.userId)});

  // 団体の検索
  const organ = await db.organizations.aggregate([
    {$match: {
      'organAdminInf.adminUserID': user._id.toHexString()
    }},
    {$project: {
      _id: 0,
      organID: '$_id',
      organName: 1,
      sports: 1,
      organAdminInf: 1
    }}
  ]).toArray();

  // チームの検索
  const team = await db.teams.aggregate([
    {$match: {
      'teamAdminInf.adminUserID': user._id.toHexString()
    }},
    {$project: {
      _id: 0,
      teamID: '$_id',
      teamName: 1,
      sports: 1,
      teamAdminInf: 1
    }}
  ]).toArray();

  res.json({
    result: 'ok',
    organList: organ,
    teamList: team
  });
});

/**
 * 大会検索処理
 */
router.post('/competitionList', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data;

  // 入力値のチェック
  Validator(data, {
    sports: {
      type: 'string'
    },
    compName: {
      type: 'string'
    }
  }, req);

  // 大会開催日(to)のみ指定している場合エラー
  if(!data.heldDateFrom && data.heldDateTo) {
    throw new Error('heldDate(to) only entered!');
  }

  // 大会開催日(from)、(to)両方入力されている時のみチェックする
  if(data.heldDateFrom && data.heldDateTo) {
    // 大会開催日の整合性チェック
    if(data.heldDateFrom > data.heldDateTo) {
      throw new Error('heldDate is inconsistent!');
    }
  }

  // 返却データの定義
  const resData = {
    result: 'ng',
    compList: [],
    teamList: [],
    organList: [],
    count: 0
  };

  // 検索パラメータの設定
  const query: FilterQuery<Competition> = {};

  // 競技の設定
  query.sports = data.sports;

  // 大会名の設定
  if(data.compName) {
    query.compName = new RegExp(data.compName);
  }

  // 大会開催日の設定
  if(data.heldDateFrom && data.heldDateTo) {
    query.heldDate = { $gte: data.heldDateFrom, $lte: data.heldDateTo };
  } else if(data.heldDateFrom && !data.heldDateTo) {
    query.heldDate = { $gte: data.heldDateFrom };
  }

  // 主催団体名の設定
  if(data.organName) {
    const organ = await db.organizations.find({organName: new RegExp(data.organName)}).toArray();
    const team = await db.teams.find({teamName: new RegExp(data.organName)}).toArray();
    const organID = organ.map(o => o._id.toHexString());
    const teamID = team.map(t => t._id.toHexString());
    const organizerID = organID.concat(teamID);
    if(organizerID.length >= 1) {
      query['organizerInf.organizerID'] = {$in: organizerID};
    }
  }

  // 大会の検索
  const compList = await db.competitions.aggregate([
    {$match: query},
    {$project:
      {
        _id: 0,
        compID: '$_id',
        compName: 1,
        heldDate: 1,
        compLogo: 1,
        organizerInf: 1,
      }
    }
  ]).toArray();
  resData.compList = compList;

  /** 検索した大会から団体IDとチームIDを抽出する処理 */
  // 団体IDのリスト
  const organIdList: string[] = [];
  // チームIDのリスト
  const teamIdList: string[] = [];
  compList.forEach(comp => {
    // 主催団体のみ抽出
    const organizerInfs = comp.organizerInf.map(org => org);
    for (let i = 0; i < organizerInfs.length; i++) {
      const organizerInf = organizerInfs[i];

      // 主催団体区分が1であれば、団体IDのリストに格納
      if(organizerInf.organizerFlg == '1') {
        // 重複する値を格納したくないので、配列に値が存在するか判定
        if(!organIdList.includes(organizerInf.organizerID)) {
          organIdList.push(organizerInf.organizerID);
        }

      // 主催団体区分が2であれば、チームIDのリストに格納
      } else if(organizerInf.organizerFlg == '2') {
        // 重複する値を格納したくないので、配列に値が存在するか判定
        if(!teamIdList.includes(organizerInf.organizerID)) {
          teamIdList.push(organizerInf.organizerID);
        }
      }
    }
  });

  // 団体情報の取得
  if(organIdList.length >= 1) {
    resData.organList = await db.organizations.aggregate([
      {
        $match: {
          _id: {$in: organIdList.map(orgID => new ObjectId(orgID))}
        }
      },
      {$project: {
        _id: 0,
        organID: '$_id',
        organName: 1
      }}
    ]).toArray();
  }

  // チーム情報の取得
  if(teamIdList.length >= 1) {
    resData.teamList = await db.teams.aggregate([
      {
        $match: {
          _id: {$in: teamIdList.map(teamID => new ObjectId(teamID))}
        }
      },
      {$project: {
        _id: 0,
        teamID: '$_id',
        teamName: 1
      }}
    ]).toArray();
  }

  // 件数の絞り込みと取得件数の取得
  resData.count = compList.length;
  resData.compList.slice(0, 100);

  // 処理結果の設定
  resData.result = 'ok';

  // 返却値の設定
  res.json(resData);

});

/**
 * 大会情報取得処理
 */
router.post('/competitionDetail', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data;

  Validator(data, {
    id: {
      type: 'string'
    },
    type: {
      type: 'string',
      pattern: /^competition|^game/
    }
  }, req);

  // 試合参照からの遷移の場合、試合IDから大会IDを検索し設定する
  if(/^game/.test(data.type)) {
    const game = await db.games.findOne({_id: new ObjectId(data.id)});
    if(game) data.id = game.competitionID;
  }

  // 大会情報の取得
  const compInfo = await db.competitions.findOne({_id: new ObjectId(data.id)});

  // 大会IDを文字列に変換
  const compId = compInfo._id.toHexString();

  // リーグ/トーナメント情報に対応する型を定義
  type gameGroup = {
    gameGroup: {
      gameSystem: string;
      groupName: string;
    };
    groupPartTeamCnt: number;
  }

  // リーグ/トーナメント情報の取得
  const gameList = await db.games.aggregate([
    {$match: {competitionID: compId}},
    {
      $group: {
        _id: {
          gameSystem: '$gameInfCom.gameSystemInf.gameSystem',
          groupName: '$gameInfCom.gameSystemInf.gameSystemName'
        },
        groupPartTeamCnt: {$first: '$gameInfCom.gameSystemInf.gameTeamCnt'}
      }
    },
    {
      $project: {
        _id: 0,
        gameGroup: '$_id',
        groupPartTeamCnt: 1
      }
    }
  ]).toArray() as unknown as gameGroup[];

  // リーグ／トーナメント数分ループ
  const leagueTournamentList: LeagueTournamentInfo[] = [];
  for (const game of gameList) {
    // リーグ/トーナメント情報の設定
    const leagueTournamentInfo: LeagueTournamentInfo = {
      gameSystem: game.gameGroup.gameSystem,
      groupName: game.gameGroup.groupName,
      groupPartTeamCnt: game.groupPartTeamCnt
    };
    leagueTournamentList.push(leagueTournamentInfo);
  }

  // 返却情報の設定
  res.json({
    result: 'ok',
    compInfo: compInfo,
    gameGroupList: leagueTournamentList
  });

});

/**
 * 大会情報管理：初期処理
 */
router.post('/manageCompetition', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data;

  Validator(data, {
    id: {
      type: 'string'
    },
    type: {
      type: 'string',
      pattern: /^competition|^game/
    }
  }, req);

  // 大会情報の取得
  const compInfo = await db.competitions.findOne({_id: new ObjectId(data.id)});

  // 大会IDを文字列に変換
  const compId = compInfo._id.toHexString();

  // 試合情報の取得
  const query: FilterQuery<Game> = {
    competitionID: compId
  };
  const gameInfoAll = await db.games.find(query).toArray();

  // 試合IDをstringからObjectIDへ変換し配列に
  const gameIDList = gameInfoAll.map(game => {
    return game._id.toHexString();
  });

  // 試合結果情報の取得
  const gameResultList = await db.gameResults.find({gameID: {$in: gameIDList}}).toArray();

  // チーム情報の取得
  const teamList: Team[] = [];
  // 参加チームの数分ループ
  for(let i = 0; i < (compInfo.teamID).length; i++) {
    // 参加チームをチーム一覧から検索
    const teamInfo = await db.teams.findOne(
      {_id: new ObjectId(compInfo.teamID[i])},
      {projection: {
        _id: 1,
        teamName: 1,
        'teamAddInf.teamPrefecture': 1,
        teamLogo: 1
      }}
    );
    // 一致するチームが存在しない場合次のidの検索に移る
    if(!teamInfo) {
      continue;
    }
    // チームリストに追加
    teamList.push(teamInfo);
  }

  // 団体情報の取得
  const organList: CompOrganInfo[] = [];
  // 主催団体の数分ループ
  for(let i = 0; i < (compInfo.organizerInf).length; i++) {
    let compOrganInfo: CompOrganInfo = null;
    // 主催団体を団体一覧から検索
    const organInfo = await db.organizations.findOne(
      {_id: new ObjectId(compInfo.organizerInf[i].organizerID)},
      {projection: {
        _id: 1,
        organName: 1,
        organLogo: 1
      }}
    );
    // 団体が存在した場合、情報を整理
    if(organInfo) {
      compOrganInfo = {
        id: organInfo._id.toHexString(),
        organName: organInfo.organName,
        organLogo: organInfo.organLogo
      };
    // 団体が存在しない場合、チーム一覧から検索
    } else {
      const teamInfo = await db.teams.findOne(
        {_id: new ObjectId(compInfo.organizerInf[i].organizerID)},
        {projection: {
          _id: 1,
          teamName: 1,
          teamLogo: 1
        }}
      );
      // チームが存在した場合、情報を整理
      if(teamInfo) {
        compOrganInfo = {
          id: teamInfo._id.toHexString(),
          organName: teamInfo.teamName,
          organLogo: teamInfo.teamLogo
        };
      // 一致するチームも団体も存在しない場合次のidの検索に移る
      } else {
        continue;
      }
    }
    // 主催団体リストに追加
    organList.push(compOrganInfo);
  }

  // ユーザー情報の取得
  const userList = await db.users.find(
    {_id: {
      $in: compInfo.compAdminInf.map(adminInf => new ObjectId(adminInf.adminUserID))
    }}
  ).toArray();

  // 管理者情報の取得(大会参加メンバー)
  const memberList: CompAdminInfo[] = [];
  const orgIdList = compInfo.organizerInf.map(orgInf => new ObjectId(orgInf.organizerID));
  for (let index = 0; index < userList.length; index++) {
    const user = userList[index];
    const orgNames: string[] = [];
    const organ = await db.organizations.find(
      {
        _id: {
          $in: orgIdList
        },
        'organAdminInf.adminUserID': user._id.toHexString(),
      }
    ).toArray();
    const team = await db.teams.find(
      {
        _id: {
          $in: orgIdList
        },
        'teamAdminInf.adminUserID': user._id.toHexString()
      }
    ).toArray();
    if(organ.length != 0) {
      organ.forEach(org => {
        orgNames.push(org.organName);
      });
    }
    if(team.length != 0) {
      team.forEach(tm => {
        orgNames.push(tm.teamName);
      });
    }

    // 画面表示情報の設定
    memberList.push({
      id: user._id.toHexString(),
      adminFlg: compInfo.compAdminInf.find(adminInf => {
        return adminInf.adminUserID == user._id.toHexString();
      }).adminFlg,
      organizerNames: orgNames,
      userImage: user.userImage,
      name: user.nickname
    });
  }

  // 開催場所履歴の取得
  const placeHisList = await db.placeHistories.find({}, {projection: {_id: 1, placeName: 1}}).toArray();

  const placeList: PlaceInfo[] = [];
  compInfo.placeID.forEach(place => {
    const placeInfo: PlaceInfo = {
      id: place,
      placeName: placeHisList.find(p => {
        return place == p._id.toHexString();
      }).placeName
    };
    placeList.push(placeInfo);
  });

  // リーグ/トーナメント情報に対応する型を定義
  type gameGroup = {
    gameGroup: {
      gameSystem: string;
      groupName: string;
    };
    groupPartTeamCnt: number;
    gameConfirmFlg: string;
  }

  // リーグ/トーナメント情報の取得
  const gameList = await db.games.aggregate([
    {$match: {competitionID: compInfo._id.toHexString()}},
    {$group:
      {
        _id: {
          gameSystem: '$gameInfCom.gameSystemInf.gameSystem',
          groupName: '$gameInfCom.gameSystemInf.gameSystemName'
        },
        groupPartTeamCnt: {$first: '$gameInfCom.gameSystemInf.gameTeamCnt'},
        gameConfirmFlg: {$max: '$gameInfCom.gameConfirmFlg'}
      }
    },
    {
      $project: {
        _id: 0,
        gameGroup: '$_id',
        groupPartTeamCnt: 1,
        gameConfirmFlg: 1
      }
    }
  ]).toArray() as unknown as gameGroup[];

  // リーグ／トーナメント数分ループ
  const leagueTournamentList: LeagueTournamentInfo[] = [];
  for (const game of gameList) {

    // 重複するチームIDを取り除きグループ毎のチームを取得
    const teamIdList: string[] = await db.games.distinct('teamInfo.teamID',
      {
        competitionID: compId,
        'gameInfCom.gameSystemInf.gameSystem': game.gameGroup.gameSystem,
        'gameInfCom.gameSystemInf.gameSystemName': game.gameGroup.groupName
      }
    );

    // リーグ/トーナメント情報の設定
    const leagueTournamentInfo: LeagueTournamentInfo = {
      gameSystem: game.gameGroup.gameSystem,
      groupName: game.gameGroup.groupName,
      groupPartTeamCnt: game.groupPartTeamCnt,
      gameConfirmFlg: game.gameConfirmFlg,
      teamIdList: teamIdList
    };
    leagueTournamentList.push(leagueTournamentInfo);
  }

  // 返却値の設定
  if(compInfo) {
    res.json({
      result: 'ok',
      compInfo: compInfo,
      teamList: teamList,
      organList: organList,
      gameList: leagueTournamentList,
      memberList: memberList,
      placeList: placeList,
      gameInfoListAll: gameInfoAll,
      gameResultList: gameResultList
    });
  } else {
    res.json({
      result: 'ng'
    });
  }

});

/**
 * 大会情報変更処理
 */
router.post('/modCompetition', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data;
  const loginInfo = req.body.loginInfo;

  // 入力値のチェック
  Validator(data, {
    heldDate: {
      type: 'string'
    },
  }, req);

  // 権限チェック
  const compAdminInf = await GetCompAdminInfo(data._id);
  CheckAdmin(compAdminInf, loginInfo.userId);

  // 重複チェック用に主催団体IDリスト作成
  const organizerIDList = data.organizerInf.map(item => item.organizerID);

  // 重複チェックを行う
  const chkResult = await db.competitions.countDocuments(
    {
      _id: {$ne:new ObjectId(data._id)},
      compName: data.compName,
      heldDate: data.heldDate,
      'organizerInf.organizerID': {$in:organizerIDList}
    },
    {limit: 1}
  );

  // 検索結果が取得出来た場合、結果NGとして処理を終了する
  if(chkResult > 0) {
    res.json({
      result: 'ng',
      message: '大会名、大会開催日、主催団体が同一の大会が既に存在します。'
    });
    return;
  }

  // 共通項目の設定
  data.docIsValid = true;
  data.docModUserID = loginInfo.userId;
  data.docModTimeStamp = moment().toJSON();

  // DB更新処理
  const compId = data._id;
  delete data._id;
  await db.competitions.updateOne({_id: new ObjectId(compId)}, {$set: data});

  // 返却値設定
  res.json({
    result: 'ok',
  });

});

/**
 * 参加団体検索
 */
router.post('/searchOrgan', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data.data;
  const compId = req.body.data.compId;

  // 入力値のチェック
  Validator(data, {
    sports: {
      type: 'string'
    },
    organName: {
      type: 'string'
    }
  }, req);

  // 検索パラメータの設定
  const organQuery: FilterQuery<Organ> = {};
  organQuery.sports = data.sports;
  organQuery.organName = new RegExp(data.organName);

  // 団体検索
  const organList = await db.organizations.find(
    organQuery,
    {projection:
      {
        _id: 1,
        organName: 1,
        organAddInf: 1,
        organLogo: 1
      }
    }
  ).toArray();

  // 検索パラメータの設定
  const teamQuery: FilterQuery<Team> = {};
  teamQuery.sports = data.sports;
  teamQuery.teamName = new RegExp(data.organName);

  // チーム検索
  const teamList = await db.teams.find(
    teamQuery,
    {projection:
      {
        _id: 1,
        teamName: 1,
        teamAddInf: 1,
        teamLogo: 1
      }
    }
  ).toArray();

  // 取得する団体情報の設定
  const organInfoList = [];
  organList.forEach(organ => {
    const organInfo: InviteOrganInfo = {
      id: organ._id,
      type: CNS.authTypeOrganizerOrgan,
      organName: organ.organName,
      organAddInf: organ.organAddInf,
      organLogo: organ.organLogo
    };
    organInfoList.push(organInfo);
  });

  // 取得するチーム情報の設定
  const teamInfoList = [];
  teamList.forEach(team => {
    const teamInfo: InviteOrganizerTeamInfo = {
      id: team._id,
      type: CNS.authTypeOrganizerTeam,
      teamName: team.teamName,
      teamAddInf: team.teamAddInf,
      teamLogo: team.teamLogo
    };
    teamInfoList.push(teamInfo);
  });

  // 大会を検索し招待済みの主催団体IDのリストを作る
  const competition = await db.competitions.findOne({_id: new ObjectId(compId)});
  const organIdList = competition.organizerInf.map(comp => new ObjectId(comp.organizerID));

  // 招待情報を検索し、招待済みのリストに加える
  const invitationInfs = await db.invitationInfs.find(
    {
      relationID: compId,
      authType: {
        $in: [`${CNS.authTypeOrganizerOrgan}Competition`, `${CNS.authTypeOrganizerTeam}Competition`]
      }
    }
  ).toArray();
  const invitationIdList = invitationInfs.map(inf => new ObjectId(inf.authDstUserID));
  const invitedList = organIdList.concat(invitationIdList);

  // 返却値の設定
  res.json({
    result: 'ok',
    organInfoList: organInfoList,
    teamInfoList: teamInfoList,
    invitedList: invitedList
  });

});

/**
 * 大会参加団体招待
 */
router.post('/invite', async (req, res) => {

  // 画面情報の受け取り
  const userId = req.body.loginInfo.userId;
  const data = req.body.data;

  // チェック
  Validator(data, {
    authDstUserID: {
      type: 'string'
    },
    compId: {
      type: 'string'
    },
    type: {
      type: 'string',
      pattern: /organizerTeam|organizerOrgan|team|member/
    }
  }, req);
  const authType = `${data.type}Competition`;

  // 権限チェック
  const compAdminInf = await GetCompAdminInfo(data.compId);
  CheckAdmin(compAdminInf, userId);

  // 登録データ作成
  const entity: InvitationInf = {
    authDstUserID: data.authDstUserID,
    authOriUserID: userId,
    authType,
    relationID: data.compId,
    expirDate: moment().add(24, 'hours').toJSON(),
    docIsValid: true,
    docCreUserID: userId,
    docCreTimeStamp: moment().toJSON(),
    docModUserID: userId,
    docModTimeStamp: moment().toJSON()
  };

  // 登録処理
  db.invitationInfs.insertOne(entity, (_err, rslt) => {
    if(rslt.result.ok == 1) {
      res.json({
        result: 'ok',
        invitedId: entity.authDstUserID
      });
    } else {
      res.json({
        result: 'ng'
      });
    }
  });

});

/**
 * 主催団体取得
 */
router.post('/getOrganizer', async (req, res) => {

  // 遷移元情報の設定
  const data = req.body.data;

  // チェック
  Validator(data, {
    compId: {
      type: 'string'
    }
  }, req);

  // 大会を検索し主催者団体のIDリストを作成
  const competition = await db.competitions.findOne({_id: new ObjectId(data.compId)});
  const organizerIdList = competition.organizerInf.map(organ => new ObjectId(organ.organizerID));

  // 団体を検索
  const organList = await db.organizations.find({
    _id: {$in: organizerIdList}
  }).toArray();

  // チームを検索
  const teamList = await db.teams.find({
    _id: {$in: organizerIdList}
  }).toArray();

  // 主催者団体名をリストに格納
  const organizerList = [];
  organList.forEach(organ => {
    const organizer: OrganizerInfo = {
      _id: organ._id,
      organName: organ.organName,
      organFlg: '1'
    };
    organizerList.push(organizer);
  });
  teamList.forEach(team => {
    const organizer: OrganizerInfo = {
      _id: team._id,
      organName: team.teamName,
      organFlg: '2'
    };
    organizerList.push(organizer);
  });

  // 返却値の設定
  res.json({
    result: 'ok',
    organizerList: organizerList
  });

});

/**
 * 参加メンバー検索
 */
router.post('/searchMember', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data.data;
  const compId = req.body.data.compId;

  // 入力値のチェック
  Validator(data, {
    sports: {
      type: 'string'
    },
  }, req);

  // 大会検索
  const competition = await db.competitions.findOne({_id: new ObjectId(compId)});

  let findRslt = {};
  let organList = [];
  let teamList = [];
  // 画面項目：主催者団体が選択されている場合、一意検索、それ以外は通常検索
  if(data.organInfo) {
    // 団体区分に応じて検索するコレクションを切り替える
    if(data.organInfo.organFlg == '1') {
      // 団体検索
      findRslt = await db.organizations.findOne({_id: new ObjectId(data.organInfo._id)});
    } else if(data.organInfo.organFlg == '2') {
      // チーム検索
      findRslt = await db.teams.findOne({_id: new ObjectId(data.organInfo._id)});
    }

  } else {
    organList = await db.organizations.find({_id:
      {$in: competition.organizerInf.map(organInf => new ObjectId(organInf.organizerID))}
    }).toArray();
    teamList = await db.teams.find({_id:
      {$in: competition.organizerInf.map(organInf => new ObjectId(organInf.organizerID))}
    }).toArray();
  }

  // 検索パラメータの設定
  const query: FilterQuery<User> = {};
  // 競技はあてはまるものを持っている選手
  query['sportsInf.sport'] = data.sports;

  // ユーザーのID検索有効区分が許可になっているユーザーのみ検索
  query.isSearchable = true;

  // 画面項目：主催者団体の選択有無に応じて、条件の設定を変える
  if(data.organInfo) {

    // チーム・団体のどちらかで管理者に含まれるユーザーを条件とする
    if(data.organInfo.organFlg == '1') {
      const organ = findRslt as Organ;
      query._id = {$in: organ.organAdminInf.map(adminInf => new ObjectId(adminInf.adminUserID))};
    } else if (data.organInfo.organFlg == '2') {
      const team = findRslt as Team;
      query._id = {$in: team.teamAdminInf.map(adminInf => new ObjectId(adminInf.adminUserID))};
    }

    // チーム・団体で管理者に含まれるユーザーを条件とする
  } else {
    const userIdList = [];

    const organ = organList as Organ[];
    const orgAdInfs = organ.map(o => o.organAdminInf);
    orgAdInfs.forEach(orgAdInf => {
      orgAdInf.forEach(adminInf => {
        userIdList.push(new ObjectId(adminInf.adminUserID));
      });
    });

    const team = teamList as Team[];
    const teamAdInfs = team.map(t => t.teamAdminInf);
    teamAdInfs.forEach(teamAdInf => {
      teamAdInf.forEach(adminInf => {
        userIdList.push(new ObjectId(adminInf.adminUserID));
      });
    });
    query._id = {$in: userIdList};
  }

  // id：曖昧検索
  if(data.userId) {
    query.userUniqueID = new RegExp(data.userId);
  }

  // ニックネームでのあいまい検索
  if(data.name) {
    query.nickname = new RegExp(data.name);
  }

  // ユーザー情報の検索
  const userList = await db.users.find(query).toArray();

  // ユーザーから主催団体名に変換するためにチーム・団体を検索
  const team = await db.teams.find({}).toArray();
  const organ = await db.organizations.find({}).toArray();

  // ユーザーIDを元に主催団体名・運営区分を抽出
  const organizerNameLists = [];
  userList.forEach(user => {


    // 主催者団体の抽出
    const organizerNameList = [];
    const orgResult = organ.filter(o => {
      return o.organAdminInf.map(adminInf => adminInf.adminUserID).indexOf(user._id.toHexString()) > -1;
    });
    const teamResult = team.filter(t => {
      return t.teamAdminInf.map(adminInf => adminInf.adminUserID).indexOf(user._id.toHexString()) > -1;
    });

    if(orgResult.length != 0) {
      orgResult.forEach(org => {
        organizerNameList.push(org.organName);
      });
    }
    if(teamResult.length != 0) {
      teamResult.forEach(team => {
        organizerNameList.push(team.teamName);
      });
    }
    organizerNameLists.push(organizerNameList);
  });

  // 取得情報の設定
  const memberList = [];
  userList.forEach( (user, idx) => {
    const memberInfo: InviteMemberInfo = {
      _id: user._id,
      adminFlg:'',
      userId: user.userUniqueID,
      organizerNames: organizerNameLists[idx],
      name: user.nickname
    };
    memberList.push(memberInfo);
  });

  // 招待情報を検索し、招待済みのリストに加える
  const invitationInfs = await db.invitationInfs.find(
    {
      relationID: compId,
      authType: `${CNS.authTypeMember}Competition`
    }
  ).toArray();
  const invitedList = invitationInfs.map(inf => new ObjectId(inf.authDstUserID));

  // 既にメンバーのIDリストを作成
  const partMemberList = competition.compAdminInf.map(comp =>comp.adminUserID);

   // 大会管理者として設定されていない主催団体メンバーを設定するリストの宣言
  const displayMemberList = [];

  // 指定された団体の全メンバーのうち、まだ大会管理者として設定されていないメンバーをdisplayMemberListに設定する
  memberList.forEach(member => {
    if(!partMemberList.includes(member._id.toHexString())){
      displayMemberList.push({
        _id: member._id,
        adminflg: member.adminFlg,
        userId: member.userId,
        organizerNames: member.organizerNames,
        name: member.name
      });
    }
  });

  // 返却値の設定
  res.json({
    result: 'ok',
    inviteMemberInfoList: displayMemberList,
    invitedList: invitedList
  });

});

/**
 * 大会参加チーム検索
 */
router.post('/searchTeam', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data.data;
  const compId = req.body.data.compId;

  // 入力値のチェック
  Validator(data, {
    sports: {
      type: 'string'
    },
    teamPrefecture: {
      type: 'string'
    }
  }, req);

  // 大会を検索し参加チームのIDリストを作る
  const competition = await db.competitions.findOne({_id: new ObjectId(compId)});
  const teamIdList = competition.teamID.map(team => new ObjectId(team));

  // 検索パラメータの設定
  const teamInfoList: InviteTeamInfo[] = [];
  const teamQuery: FilterQuery<Team> = {};
  teamQuery.sports = data.sports;
  teamQuery['teamAddInf.teamPrefecture'] = data.teamPrefecture;
  if(data.teamName) {
    teamQuery.teamName = new RegExp(data.teamName);
  }

  // チェックが付いている場合、主催団体情報をもとに今まで招待したことのあるチームを検索し、チームIDを検索パラメータに設定
  if(data.searchType == '1') {
    const partTeamHisList = await db.partTeamHistories.distinct('teamID', {
      organizerInf: {
        $in: competition.organizerInf
      }
    });

    // チームIDを検索パラメータに設定
    const teamId = partTeamHisList.map(id => new ObjectId(id));
    teamQuery._id = {$in: teamId};
  }

  // チームを検索
  const teamList = await db.teams.find(teamQuery, {
    projection: {
      _id: 1,
      teamName: 1,
      teamAddInf: 1
    }
  }).toArray();

  // 検索結果を設定
  teamList.forEach(team => {
    const inviteTeamInfo: InviteTeamInfo = {
      _id: team._id,
      teamName: team.teamName,
      teamAddress: `${team.teamAddInf.teamPrefecture}${team.teamAddInf.teamCity}`
    };
    teamInfoList.push(inviteTeamInfo);
  });

  // 招待情報を検索し、招待済みのリストに加える
  const invitationInfs = await db.invitationInfs.find(
    {
      relationID: compId,
      authType: `${CNS.authTypeTeam}Competition`
    }
  ).toArray();
  const invitationIdList= invitationInfs.map(inf => new ObjectId(inf.authDstUserID));
  const invitedList = teamIdList.concat(invitationIdList);

  // 返却値の設定
  res.json({
    result: 'ok',
    teamInfoList: teamInfoList,
    invitedList: invitedList
  });

});

/**
 * 開催地登録処理
 */
router.post('/createPlace', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data.data;
  const compId = req.body.data.compId;
  const loginInfo = req.body.loginInfo;

  // 入力値のチェック
  Validator(data, {
    placeName: {
      type: 'string'
    }
  }, req);

  // 権限チェック
  const compAdminInf = await GetCompAdminInfo(compId);
  CheckAdmin(compAdminInf, loginInfo.userId);

  // 大会検索
  const competition = await db.competitions.findOne({_id: new ObjectId(compId)});

  // 大会情報が取得出来ている場合登録処理を行う
  if(competition) {

    // 登録データを格納する配列
    const insetDataList: PlaceHistory[] = [];

    // 大会の主催者団体の数だけループし、登録データを作成
    competition.organizerInf.forEach(organInf => {

      // 登録データの作成
      const insertData: PlaceHistory = {
        organizerInf: {
          organizerFlg: organInf.organizerFlg,
          organizerID: organInf.organizerID
        },
        placeName: data.placeName,
        placeAdd: data.placeAdd,
        placeTel: data.placeTel,
        docIsValid: true,
        docCreUserID: loginInfo.userId,
        docCreTimeStamp: moment().toJSON(),
        docModUserID: loginInfo.userId,
        docModTimeStamp: moment().toJSON()
      };

      // 登録データをリストに追加
      insetDataList.push(insertData);

    });

    // 開催地登録
    db.placeHistories.insertMany(insetDataList, (err, rslt) => {
      if(!err) {
        const insertedIdList = rslt.insertedIds;

        // 大会情報に開催地IDを追加する
        db.competitions.updateOne(
          {_id: new ObjectId(compId)},
          {$push: {placeID: insertedIdList[0].toHexString()}}
        );

        res.json({
          result: 'ok'
        });

      } else {
        res.json({
          result: 'ng'
        });
      }

    });

  } else {
    // 大会が取得出来ていない場合処理を終了する
    res.json({
      result: 'ng'
    });
    return;
  }

});

/**
 * 開催地履歴検索：検索
 */
router.post('/searchPlace', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data.data;
  const compId = req.body.data.compId;

  // 入力値のチェック
  Validator(req.body.data, {
    compId: {
      type: 'string'
    }
  }, req);

  // 大会を検索
  const competition = await db.competitions.findOne({_id: new ObjectId(compId)});

  // 検索パラメータの設定
  const query: FilterQuery<PlaceHistory> = {};

  // 主催団体情報
  query.organizerInf = {$in: competition.organizerInf};

  // 開催場所名：曖昧検索
  if(data.placeName) {
    query.placeName = new RegExp(data.placeName);
  }

  // 住所：曖昧検索
  if(data.placeAdd) {
    query.placeAdd = new RegExp(data.placeAdd);
  }

  // 電話番号：曖昧検索
  if(data.placeTel) {
    query.placeTel = new RegExp(data.placeTel);
  }

  // 開催地履歴を検索
  const placeHistoryList = await db.placeHistories.find(query).toArray();

  // 開催場所名、住所、電話番号が重複する値を削除し、それぞれのIDのみを保持
  const placeList: PlaceInfo[] = [];
  let str: string;
  let idList = new Array<ObjectId>();
  placeHistoryList.forEach( (placeHis, idx) => {
    if(idx == 0) {
      str = `${placeHis.placeName}${placeHis.placeAdd}${placeHis.placeTel}`;
      idList.push(placeHis._id);
      if(placeHistoryList.length == 1) {
        placeList.push({
          _idList: idList,
          placeName: placeHis.placeName,
          placeAdd: placeHis.placeAdd,
          placeTel: placeHis.placeTel,
        });
      }
      return;
    }

    if(str == `${placeHis.placeName}${placeHis.placeAdd}${placeHis.placeTel}`) {
      idList.push(placeHis._id);
    } else {
      placeList.push({
        _idList: idList,
        placeName: placeHistoryList[idx - 1].placeName,
        placeAdd: placeHistoryList[idx - 1].placeAdd,
        placeTel: placeHistoryList[idx - 1].placeTel
      });
      idList = new Array<ObjectId>();
      idList.push(placeHis._id);
      str = `${placeHis.placeName}${placeHis.placeAdd}${placeHis.placeTel}`;
    }

    if(placeHistoryList.length == ++idx) {
      placeList.push({
        _idList: idList,
        placeName: placeHistoryList[idx - 1].placeName,
        placeAdd: placeHistoryList[idx - 1].placeAdd,
        placeTel: placeHistoryList[idx - 1].placeTel
      });
    }
  });

  // 返却値の設定
  res.json({
    result: 'ok',
    placeList: placeList,
    placeIdList: competition.placeID.map(p => new ObjectId(p))
  });

});

/**
 * 開催地履歴検索：追加
 */
router.post('/addPlace', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data.data;
  const compId = req.body.data.compId;

  // 入力値のチェック
  Validator(req.body.data, {
    compId: {
      type: 'string'
    }
  }, req);

  // 権限チェック
  const loginInfo = req.body.loginInfo;
  const compAdminInf = await GetCompAdminInfo(compId);
  CheckAdmin(compAdminInf, loginInfo.userId);

  // 大会情報に開催地IDを追加する
  db.competitions.updateOne(
    {_id: new ObjectId(compId)},
    {$push: {placeID: data._idList[0]}},
    (_err, rslt) => {
      if(rslt.modifiedCount > 0) {
        res.json({
          result: 'ok'
        });
      } else {
        res.json({
          result: 'ng'
        });
      }
    }
  );

});

/**
 * 大会情報管理：大会情報削除処理
 */
router.post('/removeCompInfo', async (req, res) => {

   // 画面情報の受け取り
  const data = req.body.data;
  // ログイン中のユーザー情報を取得
  const userId = req.body.loginInfo.userId;

  // チェック
  Validator(data, {
    id: {
      type: 'string'
    },
    compId: {
      type: 'string'
    },
    type: {
      type: 'string'
    }
  }, req);

  // 権限チェック
  const compAdminInf = await GetCompAdminInfo(data.compId);
  CheckAdmin(compAdminInf, userId);

  // 種別により更新内容(削除する項目)を分ける
  const updateQuery: UpdateQuery<Competition> = {};
  switch(data.type) {
    case 'organ':
      updateQuery.$pull = {organizerInf: {organizerID: data.id}};
      break;
    case 'member':
      updateQuery.$pull = {compAdminInf: {adminUserID: data.id}};
      break;
    case 'team':
      updateQuery.$pull = {teamID: data.id};
      break;
    case 'place':
      updateQuery.$pull = {placeID: data.id};
      break;
  }

  // 大会情報更新(削除)処理
  const result = await db.competitions.updateOne(
    {_id: new ObjectId(data.compId)},
    updateQuery
  );

  if(result.modifiedCount > 0) {
    // 権限判定用変数
    let isAdminComp = true;

    // 自分自身を大会管理者から削除した場合、他に管理している大会が存在するか確認する
    if(userId === data.id && data.type === 'member') {
      // 管理している大会を検索
      const comp = await db.competitions.findOne(
        {'compAdminInf.adminUserID': userId},
        {projection: {
          _id: 1
        }}
      );

      // 他に管理している大会が存在しない場合は権限変更
      if(!comp) {
        isAdminComp = false;
      }
    }

    res.json({
      result: 'ok',
      isAdminComp
    });

  } else {
    res.json({
      result: 'ng'
    });
  }

});

/**
 * 大会情報管理：試合削除
 */
router.post('/removeGame', async (req, res) => {

  // 画面情報の受け取り
  const data = req.body.data;

  // チェック
  Validator(data, {
    game: {
      gameSystem: {
        type: 'string'
      },
      groupName: {
        type: 'string'
      }
    },
    compId: {type: 'string'}
  }, req);

  // 権限チェック
  const loginInfo = req.body.loginInfo;
  const compAdminInf = await GetCompAdminInfo(data.compId);
  CheckAdmin(compAdminInf, loginInfo.userId);

  // 試合削除処理
  db.games.deleteMany({
    competitionID: data.compId,
    'gameInfCom.gameSystemInf.gameSystem': data.game.gameSystem,
    'gameInfCom.gameSystemInf.gameSystemName': data.game.groupName
  }, (err, rslt) => {
    if(!err && rslt.result.ok == 1) {
      res.json({
        result: 'ok'
      });
    } else {
      res.json({
        result: 'ng'
      });
    }
  });

});

export default router;
