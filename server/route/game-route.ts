import Router from 'express-promise-router';
import { db } from '../common/db-client';
import Validator from '../common/validator';
import { Game, Competition, Team, GameResult, PlaceHistory, Organ, AdminInf } from 'defs';
import { GameList, NameList, GameDetailteamInf, TeamInfo, GameInfo } from 'defs/api';
import { ObjectId, FilterQuery } from 'mongodb';
import moment = require('moment');
import CheckAdmin from '../common/check-admin';
import { tournamentTeamCnt } from '../../client/app/common/defines';

const router = Router();

// 大会管理者取得
const GetCompAdminInfo = async(_id: ObjectId): Promise<AdminInf[]> => {
  const comp = (await db.competitions.findOne({_id: new ObjectId(_id)}));
  if(comp == null) {
    throw new Error('comp null error !');
  }
  return comp.compAdminInf;
};

// チーム管理者取得
const GetTeamAdminInfo = async(teamInf: TeamInfo[]): Promise<AdminInf[]> => {
  const teamAdmins: AdminInf[] = [];
  for(let i = 0; i < teamInf.length; i ++) {
    teamAdmins.concat((await db.teams.findOne({_id: new ObjectId(teamInf[i].teamID)})).teamAdminInf);
  }
  if(teamAdmins == null) {
    throw new Error('teamAdminInf null error !');
  }
  return teamAdmins;
};

/** 試合内容重複エラーメッセージ */
const dataExistenceError = 'ご入力いただいた内容の※1は既に登録されています。';

/** 選択チーム重複エラーメッセージ */
const duplicationError = '選択したチームに重複があります。';

/** 値が不正な場合のエラーメッセージ */
const valueIllegalError = 'There is illegal value !';

/** トーナメントの参加チーム数が規定の数でない場合のエラーメッセージ */
const teamCntValueError = 'Number of teams is not specified !';

/** 正規表現パターン(数値) */
const patNum = /^([1-9]\d*|0)$/;

/**
 * 試合登録画面：初期処理
 */
router.post('/createGame', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data;

  Validator(data, {
    id: {
      type: 'string'
    },
    type: {
      type: 'string',
      pattern: /^game/
    }
  }, req);

  // 大会情報の取得
  const compInfoList = await db.competitions.aggregate([
    {$match: {_id: new ObjectId(data.id)}},
    {$project:
      {
        _id: 0,
        compId: '$_id',
        compName: 1,
        sports: 1,
        compLogo: 1
      }
    }
  ]).toArray();
  const compInfo = compInfoList[0];

  // 返却値の設定
  if(compInfo) {
    res.json({
      result: 'ok',
      compInfo: compInfo
    });
  } else {
    res.json({
      result: 'ng'
    });
  }

});

/**
 * 試合登録画面：試合内容重複チェック
 */
router.post('/duplicationCheck', async (req, res) => {

  // 画面入力値の受け取り
  const compId = req.body.data.compId;
  const gameSystemInf = req.body.data.gameSystemInf;
  const gameGroupName = req.body.data.gameGroupName;

  // チェック
  Validator(req.body.data, {
    compId: {
      type: 'string'
    },
    gameSystemInf: {
      type: 'string',
      pattern: /singleGame|tournament|league/
    },
    gameGroupName: {
      type: 'string'
    }
  }, req);

  // 試合グループ名を日本語に変換する
  let gameSystemInfName = '';

  if(gameSystemInf === 'singleGame') {
    gameSystemInfName = '単独試合';
  } else if (gameSystemInf === 'tournament') {
    gameSystemInfName = 'トーナメント';
  } else {
    gameSystemInfName = 'リーグ';
  }

  // 重複チェックを行う
  const chkResult = await db.games.countDocuments(
    {
      competitionID: compId,
      'gameInfCom.gameSystemInf.gameSystem': gameSystemInfName,
      'gameInfCom.gameSystemInf.gameSystemName': gameGroupName
    },
    {limit: 1}
  );

  // 検索結果が取得出来た場合、結果NGとして処理を終了する
  if(chkResult > 0) {
    res.json({
      result: 'ng',
      message: dataExistenceError.replace('※1', gameSystemInfName)
    });
    return;
  }

  // 返却値の設定
  res.json({
    result: 'ok',
  });

});

/**
 * トーナメント登録
 * @param req
 * @param res
 */
router.post('/createTournament', async (req, res) => {

  // 画面の情報の受け取り
  const data = req.body.data.data;
  const loginInfo = req.body.loginInfo;
  const compInfo = req.body.data.compInfo;

  // チェック
  Validator(req.body.data, {
    compInfo: {
      compId: {
        type: 'string'
      },
      sports: {
        type: 'string'
      }
    },
    data: {
      gameGroupName: {
        type: 'string'
      },
      groupPartTeamCnt: {
        type: 'number'
      }
    }
  }, req);

  // 権限チェック
  const compAdminInf = await (await GetCompAdminInfo(compInfo.compId));
  CheckAdmin(compAdminInf, loginInfo.userId);

  // 選択チームの重複及び値のチェック
  const teamList: string[] = [];
  // 配列の中にオブジェクトがあるため、二重ループで値を取り出す
  for (let idx = 0; idx < data.teams.length; idx++) {
    for (const key of Object.keys(data.teams[idx])) {
      const teamID = data.teams[idx][key];
      // 空文字の場合はリストに追加し、continue
      if(teamID == '') {
        teamList.push(teamID);
        continue;
      }

      // 不正な値があった場合はここでエラーとする
      if(teamID == undefined || teamID == null) {
        throw new Error(valueIllegalError);
      }

      // 選択チームに重複があれば、結果NGとし、メッセージをフロントへ返す
      if(teamList.includes(teamID)) {
        res.json({
          result: 'ng',
          message: duplicationError
        });
        return;
      } else {
        // チェックOKの値のみリストに追加
        teamList.push(teamID);
      }
    }
  }

  // 試合情報の登録データ
  const game: Game = {
    competitionID: compInfo.compId,
    gameInfCom: {
      gameName: (teamList.length == 4) ? '準決勝' : '1回戦',
      gameSystemInf: {
        gameSystem: 'トーナメント',
        gameSystemName: data.gameGroupName,
        gameTeamCnt: data.groupPartTeamCnt
      },
      gameConfirmFlg: '0'
    },
    gameInfSports: {
      sports: compInfo.sports
    },
    teamInfo: [
      {teamID: ''},
      {teamID: ''}
    ],
    docIsValid: true,
    docCreTimeStamp: moment().toJSON(),
    docCreUserID: loginInfo.userId,
    docModTimeStamp: moment().toJSON(),
    docModUserID: loginInfo.userId
  };

  /** 試合情報の登録(１回戦目) */
  let teamInfoIdx = 0;
  const gameIdList: ObjectId[] = [];
  for (let index = 0; index < teamList.length; index++) {

    const teamID = teamList[index];
    game.teamInfo[teamInfoIdx].teamID = teamID;

    // １試合２チーム分のIDが入るはずなので、ループの偶数回目で登録処理をする
    if(index % 2 == 1) {

      const result = await db.games.insertOne(game);
      gameIdList.push(result.insertedId);

      // 初期化
      teamInfoIdx = 0;
      delete game._id;
      game.docCreTimeStamp = moment().toJSON();
      game.docModTimeStamp = moment().toJSON();
      continue;
    }
    teamInfoIdx++;
  }

  // 試合登録データからチームIDの削除をする
  game.teamInfo.map(team => team.teamID = '');

  /**  2回戦～準決勝までの試合情報登録 */
  let gameRound = 2;
  const preGameIDs: string[] = [];
  while (gameIdList.length > 2) {

    // 前のラウンドの試合数に応じて試合名を切り替える
    if(gameIdList.length == 4) {
      game.gameInfCom.gameName = '準決勝';
    } else {
      game.gameInfCom.gameName = `${gameRound}回戦`;
    }

    const gameIDs: ObjectId[] = [];
    for (let i = 0; i < gameIdList.length; i++) {
      preGameIDs.push(gameIdList[i].toHexString());

      // １試合２チーム分のIDが入るので、ループの偶数回目で登録処理をする
      if(i % 2 == 1) {

        // 前試合IDの設定
        game.gameInfCom.gameSystemInf.preGameID = preGameIDs;

        // 試合情報の登録とObjectIDの取得
        const result = await db.games.insertOne(game);
        gameIDs.push(result.insertedId);

        // 初期化
        delete game._id;
        game.docCreTimeStamp = moment().toJSON();
        game.docModTimeStamp = moment().toJSON();

        // 前試合の更新
        await db.games.updateMany(
          {
            _id: {
              $in: preGameIDs.map(gameID => new ObjectId(gameID))
            }
          },
          {
            $set: {
              'gameInfCom.gameSystemInf.postGameID': result.insertedId.toHexString(),
              docModTimeStamp: moment().toJSON()
            }
          }
        );

        // 前試合IDリストを全削除する
        preGameIDs.splice(0);
      }
    }

    // リスト中身を全削除後、新たなリストを作成
    gameIdList.splice(0);
    gameIdList.push(...gameIDs);

    // ラウンド数のインクリメント
    gameRound++;
  }

  /** 試合情報の登録（決勝戦） */

  // 試合名の設定
  game.gameInfCom.gameName = '決勝戦';

  // 前試合IDの設定
  game.gameInfCom.gameSystemInf.preGameID = gameIdList.map(gameID => gameID.toHexString());

  // 決勝戦の登録
  const finalGameID = (await db.games.insertOne(game)).insertedId;

  // 登録データ初期化
  delete game._id;
  game.docCreTimeStamp = moment().toJSON();
  game.docModTimeStamp = moment().toJSON();

  // 準決勝の後試合を決勝戦のIDで更新
  for (let i = 0; i < gameIdList.length; i++) {
    await db.games.updateOne(
      {_id: gameIdList[i]},
      {$set:
        {
          'gameInfCom.gameSystemInf.postGameID': finalGameID.toHexString(),
          docModTimeStamp: moment().toJSON()
        }
      }
    );
  }

  /** 試合情報の登録（３位決定戦の登録） */
  if(data.thirdPlace) {
    // 試合名の設定
    game.gameInfCom.gameName = '3位決定戦';

    // ３位決定戦の登録
    const thirdPlaceGameID = (await db.games.insertOne(game)).insertedId;

    // 準決勝の更新
    for (let i = 0; i < gameIdList.length; i++) {
      const gameID = gameIdList[i];
      await db.games.updateOne(
        {_id: gameID},
        {
          $set: {
            'gameInfCom.gameSystemInf.thirdPlaceGameID': thirdPlaceGameID.toHexString(),
            docModTimeStamp: moment().toJSON()
          }
        }
      );
    }
  }

  // 返却値の設定
  res.json({
    result: 'ok'
  });

});

/**
 *  各種試合登録：初期処理
 */
router.post('/getCompInfo', async (req, res) => {

  // 遷移元からの情報を受け取る
  const data = req.body.data;

  // 値のチェック
  Validator(data, {
    id: {
      type: 'string'
    },
    type: {
      type: 'string',
      pattern: /^game/
    },
    gameSystemInf: {
      type: 'string'
    },
    gameGroupName: {
      type: 'string'
    },
    groupPartTeamCnt: {
      type: 'number',
      pattern: /^[2-9]$|^[1-9][0-9]+$/
    }
  }, req);

  // トーナメントの場合参加チーム数のチェック
  if(data.gameSystemInf == 'tournament') {
    // トーナメントの参加チーム数が規定の数でない場合エラーとする
    if(!(Object.values(tournamentTeamCnt).includes(data.groupPartTeamCnt))) {
      throw new Error(teamCntValueError);
    }
  }

  // 大会情報の検索
  const compInfoList = await db.competitions.aggregate([
    {$match: {_id: new ObjectId(data.id)}},
    {$project:
      {
        _id: 0,
        compId: '$_id',
        compName: 1,
        sports: 1,
        compLogo: 1,
        teamID: 1
      }
    }
  ]).toArray();
  const compInfo = compInfoList[0];

  // 参加チームIDをstringからObjectIDへ変換し配列に
  const teamIDList = compInfo.teamID.map(teamId => {
    return new ObjectId(teamId);
  });

  // チームの検索
  // 取得項目：ドキュメントID、チーム名
  // 条件：ドキュメントID = 参加チームID(IN句使用)
  const teamList = await db.teams.aggregate([
    {
      $match: {
        _id: {$in: teamIDList}
      }
    },
    {
      $project: {
        _id: 0,
        teamID: '$_id',
        teamName: 1
      }
    }
  ]).toArray();

  // 返却値の設定
  if(compInfo) {
    res.json({
      result: 'ok',
      compInfo: compInfo,
      teamList: teamList
    });
  } else {
    res.json({
      result: 'ng'
    });
  }

});

/**
 * リーグ登録処理
 */
router.post('/createLeague', async (req, res) => {

  const data = req.body.data.data;
  const loginInfo = req.body.loginInfo;
  const compInfo = req.body.data.compInfo;

  // チェック
  Validator(req.body.data, {
    compInfo: {
      compId: {
        type: 'string'
      },
      sports: {
        type: 'string'
      }
    },
    data: {
      gameGroupName: {
        type: 'string'
      },
      groupPartTeamCnt: {
        type: 'number'
      }
    }
  }, req);

  // 権限チェック
  const compAdminInf = await (await GetCompAdminInfo(compInfo.compId));
  CheckAdmin(compAdminInf, loginInfo.userId);

  // 選択チームの重複チェック
  const list = [];
  for (let idx = 0; idx < data.teamList.length; idx++) {
    const teamID: string = data.teamList[idx];
    // 不正な値があった場合はここでエラーとする
    if(teamID == undefined || teamID == null) {
      throw new Error(valueIllegalError);
    }

    const result = list.find((item) => {
      return teamID == item;
    });

    if(result) {
      res.json({
        result: 'ng',
        message: duplicationError
      });
      return;

    } else {
      list.push(teamID);
    }
  }

  // 試合登録処理
  const opponentTeamList = data.teamList.concat();
  opponentTeamList.shift();

  // 参加チーム数分ループ
  for (let idx = 0; idx < data.teamList.length; idx++) {
    // 対戦相手分ループ
    for (let index = 0; index < opponentTeamList.length; index++) {

      // DB登録用の試合オブジェクト
      const game: Game = {
        competitionID: compInfo.compId,
        gameInfCom: {
          gameSystemInf: {
            gameSystem: 'リーグ',
            gameSystemName: data.gameGroupName,
            gameTeamCnt: data.groupPartTeamCnt
          },
          gameConfirmFlg: '0'
        },
        gameInfSports: {
          sports: 'Football'
        },
        teamInfo: [
          {teamID: ''},
          {teamID: ''}
        ],
        docIsValid: true,
        docCreTimeStamp: moment().toJSON(),
        docCreUserID: loginInfo.userId,
        docModTimeStamp: moment().toJSON(),
        docModUserID: loginInfo.userId
      };

      // チームIDを設定
      game.teamInfo[0].teamID = data.teamList[idx];
      game.teamInfo[1].teamID = opponentTeamList[index];
      // 試合登録
      await db.games.insertOne(game);
    }
    // 配列の先頭を削除
    opponentTeamList.shift();
  }

  // 返却値の設定
  res.json({
    result: 'ok'
  });

});


/**
 * 団体データ取得
 * 試合データ取得
 * @param req
 * @param res
 */
router.post('/gameList', async (req, res) => {

  // データ取り出し
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

  // 試合開催日判定
  // 終了日のみ設定されている場合、または、開始日＞終了日の場合
  if( (!data.gameDateFrom && data.gameDateTo)
  ||  (data.gameDateFrom && data.gameDateTo && (data.gameDateFrom > data.gameDateTo))){
    res.json({result: 'ng'});
    return;
      }

  // ＤＢ検索条件設定
  const queryGame: FilterQuery<Game> = {};
  const queryComp: FilterQuery<Competition> = {};
  const queryTeam: FilterQuery<Team> = {};

  // 競技
  if(data.sports) {
    queryComp.sports = data.sports;
    queryGame['gameInfSports.sports'] = data.sports;
      }

  // 開催日
  if(data.gameDateFrom && data.gameDateTo) {
    queryGame['gameInfCom.eventDate'] = { $gte: data.gameDateFrom, $lte: data.gameDateTo };
  } else if(data.gameDateFrom && !data.gameDateTo) {
    queryGame['gameInfCom.eventDate'] = { $gte: data.gameDateFrom };
  }

  // 返却用
  const gameList1st: GameList[] = [];
  const gameList2nd: GameList[] = [];
  const gameList3rd: GameList[] = [];

  // 試合情報取得
  const gameListAll = await db.games.find(queryGame).toArray();

  // 使用項目退避
  gameListAll.forEach(gameListAll => {

    // 配列項目宣言
    const teamIDTemp = [];
    const teamNameTemp = [];
    const gameResultTemp = [];

    // 配列項目の設定
    for(let i=0;i<gameListAll.teamInfo.length;i++){
      teamIDTemp[i] = gameListAll.teamInfo[i].teamID;
      teamNameTemp[i] = '';
      gameResultTemp[i] = '';
    }

    // 必要項目退避
    const gameListTemp: GameList = {
      gameID: gameListAll._id,
      sports: gameListAll.gameInfSports.sports,
      competitionID: gameListAll.competitionID,
      teamID: teamIDTemp,
      teamName: teamNameTemp,
      gameResults: gameResultTemp,
      gameDate: gameListAll.gameInfCom.eventDate,
      compName: '',
      gameInf: ''
    };

    // 試合リスト１に設定
    gameList1st.push(gameListTemp);
  });

  // 大会情報
  let compOne: Competition;

  // 検索項目：大会名入力有無
  if(!data.compName){
    // 未入力の場合
    for(let i=0;i<gameList1st.length;i++){
      // 大会名取得
      compOne = await db.competitions.findOne({
          _id: new ObjectId(gameList1st[i].competitionID)
        });

      // 大会名設定
      gameList1st[i].compName = compOne.compName;

      // 試合リスト２にコピー
      gameList2nd[i] = gameList1st[i];
  }

  }
  else {
    // 入力ありの場合
    queryComp.compName = new RegExp(data.compName);

    // 大会情報取得(あいまい検索)
    const compList = await db.competitions.find(queryComp).toArray();

    // 試合リスト１の件数分ループ
    for(let i=0;i<gameList1st.length;i++){

      // 大会名検索
      const compListTemp = compList.find( ({_id}) => _id.toHexString() == gameList1st[i].competitionID);

      // 検索結果判定
      if(compListTemp){

        // 検索出来た場合
        // 大会名設定
        gameList1st[i].compName = compListTemp.compName;

        // 試合リスト２にコピー
        gameList2nd.push(gameList1st[i]);
      }
    }
  }

  // チーム情報
  // 追加フラグ
  let pushFlg: boolean;
  // チーム情報格納用
  let teamOne: Team;

  // 検索項目：チーム名入力有無
  if(!data.teamName){

    // 試合リスト２の件数分ループ
    for(let i=0;i<gameList2nd.length;i++){

      // 試合リスト２のチーム数の件数分ループ
      for(let j=0;j<gameList2nd[i].teamID.length;j++){

        // チームID設定判定
        if(!gameList2nd[i].teamID[j]){

          // 未設定の場合、チーム名設定に空白を設定
          gameList2nd[i].teamName[j]  = '未定';
        }
        else {

          // 設定済みの場合、チーム情報を取得
          teamOne = await db.teams.findOne({
            _id: new ObjectId(gameList2nd[i].teamID[j])
          });

          // チーム名を設定
          gameList2nd[i].teamName[j] = teamOne.teamName;
        }
      }

      // 試合リスト３にコピー
      gameList3rd[i] = gameList2nd[i];
    }
  }
  else {
    // 入力ありの場合
    queryTeam.teamName = new RegExp(data.teamName);

    // チーム情報取得
    const teamList = await db.teams.find(queryTeam).toArray();

    // 試合リスト２の件数分ループ
    for(let i=0;i<gameList2nd.length;i++){

      // 追加フラグ初期化
      pushFlg = false;

      // 試合リスト２のチームの件数分ループ
      for(let j=0; j<gameList2nd[i].teamID.length;j++){

        // チーム名検索
        const teamListTemp = teamList.find( ({_id}) => _id.toHexString() == gameList2nd[i].teamID[j]);

        // 検索結果判定
        if(teamListTemp){

          // 追加フラグオン
          pushFlg = true;

          // チームのループを抜ける
          break;
        }
      }

      // リスト追加判定
      if(pushFlg){

        // 追加の場合
        // 試合リスト２のチームの件数分ループ
        for(let l=0;l<gameList2nd[i].teamID.length;l++){

          // チーム情報取得
          teamOne = await db.teams.findOne({
            _id: new ObjectId(gameList2nd[i].teamID[l])
          });

          // チーム名設定
          gameList2nd[i].teamName[l] = teamOne.teamName;
        }

        // 試合リスト３にコピー
        gameList3rd.push(gameList2nd[i]);
      }
    }
  }

  // 試合結果／試合情報設定
  let gameResultList: GameResult[];

  // 試合リスト３の件数分ループ
  for(let i=0;i<gameList3rd.length;i++){

    // 試合結果情報取得
    gameResultList = await db.gameResults.find({
      gameID: gameList3rd[i].gameID.toHexString()
    }).toArray();

    // 競技判定
    // サッカーの場合
    if(gameList3rd[i].sports == 'Football'){

      if(gameResultList?.length == 2){

        for(let j = 0; j < gameList3rd[i].teamID.length; j++){

          // 試合リスト３のチームの件数分ループ
          for(let k=0; k < gameResultList.length; k++){

            // 試合リスト３と試合結果のチーム判定
            if(gameList3rd[i].teamID[j] == gameResultList[k].groupID){

              // 最終得点設定
              gameList3rd[i].gameResults[j] = String(gameResultList[k].gameResult?.scoreResult);

              // ループを抜ける
              break;
            }
          }
        }

        // 試合情報設定(得点あり)
        gameList3rd[i].gameInf = `${gameList3rd[i].teamName[0]} － ${gameList3rd[i].teamName[1]}\n${gameList3rd[i].gameResults[0]} － ${gameList3rd[i].gameResults[1]}`;

      } else {

        // 試合情報設定(得点なし)
        gameList3rd[i].gameInf = `${gameList3rd[i].teamName[0]} － ${gameList3rd[i].teamName[1]}`;

      }
    }
  }

    // データ返却
    res.json({
      result: 'ok',
      gameList: gameList3rd
    });
});

/**
 * 試合情報編集画面：初期処理
 */
router.post('/editGameInit', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data;

  // チェック
  Validator(data, {
    id: {
      type: 'string'
    },
    type: {
      type: 'string',
      pattern: /^game/
    }
  }, req);

  // 試合情報の取得
  const games: Game[] = await db.games.aggregate([
    {$match: {_id: new ObjectId(data.id)}},
    {$project:
      {
        _id: 0,
        gameID: '$_id',
        competitionID: 1,
        gameInfCom: 1,
        gameInfSports: 1,
        teamInfo: 1
      }
    }
  ]).toArray();
  const game = games[0];

  // 大会情報の取得
  const competitions: Competition[] = await db.competitions.aggregate([
    {$match: {_id: new ObjectId(game.competitionID)}},
    {$project:
      {
        _id: 0,
        compId: '$_id',
        compName: 1,
        sports: 1,
        compLogo: 1,
        organizerInf: 1,
        teamID: 1,
        placeID: 1
      }
    }
  ]).toArray();
  const competition = competitions[0];

  // 開催地情報の取得
  const place: PlaceHistory[] = await db.placeHistories.aggregate([
    {$match:
      {_id: {$in: competition.placeID.map((p: string) => new ObjectId(p))}}
    },
    {$project:
      {
        _id: 0,
        placeID: '$_id',
        placeName: 1,
        placeAdd: 1,
        placeTel: 1
      }
    }
  ]).toArray();

  // チーム情報の取得
  const team: Team[] = await db.teams.aggregate([
    {$match:
      {
        $or: [{
          _id: {$in: competition.teamID.map(id => new ObjectId(id))}
        },{
          _id: {$in: competition.organizerInf.map(organ => new ObjectId(organ.organizerID))}
        }]
      }
    },
    {$project:
      {
        _id: 0,
        teamID: '$_id',
        teamName: 1
      }
    }
  ]).toArray();

  // 団体情報の取得
  const organ: Organ[] = await db.organizations.aggregate([
    {$match:
      {
        _id: {$in: competition.organizerInf.map(organ => new ObjectId(organ.organizerID))}
      }
    },
    {$project:
      {
        _id: 0,
        organID: '$_id',
        organName: 1
      }
    }
  ]).toArray();

  // 返却値の設定
  res.json({
    result: 'ok',
    game: game,
    competition: competition,
    place: place,
    team: team,
    organ: organ
  });

});

/**
 * 試合情報編集画面：試合情報更新処理
 */
router.post('/modGameInfo', async (req, res) => {

  // 画面入力値の受け取り
  const form = req.body.data.form;
  const game = req.body.data.game;

  // チェック
  Validator(game, {
    gameID: {
      type: 'string'
    }
  }, req);

  // 権限チェック
  const compId = req.body.data.compId;
  const userId = req.body.loginInfo.userId;
  const compAdminInf = await (await GetCompAdminInfo(compId));
  CheckAdmin(compAdminInf, userId);

  // 試合情報の更新
  const result = await db.games.updateOne(
    {_id: new ObjectId(game.gameID)},
    {$set: {
      'gameInfCom.eventDate': form.eventDate,
      'gameInfCom.gameStartTime': form.gameStartTime,
      'gameInfCom.gameEndTime': form.gameEndTime,
      'gameInfCom.gameAttendance': form.gameAttendance,
      'gameInfCom.gamePlaceName': form.gamePlaceName,
      'gameInfCom.gamePlaceAdd': form.gamePlaceAdd,
      'gameInfCom.gamePlaceTel': form.gamePlaceTel,
      'gameInfCom.gamePlaceWeather': form.gamePlaceWeather,
      'gameInfCom.gamePlaceTemp': form.gamePlaceTemp,
      'gameInfCom.gamePlaceHumi': form.gamePlaceHumi,
      'gameInfCom.gameName': form.gameName,
      'gameInfCom.gameIntro': form.gameIntro,
      'gameInfSports.chiefUmpire': form.chiefUmpire,
      'gameInfSports.subUmpire': form.subUmpire,
      'gameInfSports.fourthUmpire': form.fourthUmpire,
      'teamInfo.0.teamID': form.teamInfo1,
      'teamInfo.1.teamID': form.teamInfo2
    }}
  );

  // 更新結果判定と返却値の設定
  if(result.modifiedCount > 0) {
    res.json({result: 'ok'});
  } else {
    res.json({result: 'ng'});
  }

});

/**
 * 試合情報編集画面：試合情報確定
 */
router.post('/confirmGame', async (req, res) => {

  // 画面入力値の受け取り
  const game = req.body.data.game;

  // チェック
  Validator(game, {
      gameID: {
        type: 'string'
      }
  }, req);

  // 権限チェック
  const compId = req.body.data.compId;
  const userId = req.body.loginInfo.userId;
  const compAdminInf = await (await GetCompAdminInfo(compId));
  CheckAdmin(compAdminInf, userId);

  // TODO 相関チェックなど入る可能性あり？

  // 試合情報確定処理
  const result = await db.games.updateOne(
    {_id: new ObjectId(game.gameID)},
    {$set:
      {'gameInfCom.gameConfirmFlg': '1'}
    }
  );

  // 更新結果判定と返却値の設定
  if(result.modifiedCount > 0) {
    res.json({result: 'ok'});
  } else {
    res.json({result: 'ng'});
  }

});

/**
 * 試合メンバー編集画面：初期処理
 */
router.post('/editGameMemberInit', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data;

  // チェック
  Validator(data, {
    gameID: {
      type: 'string'
    },
    type: {
      type: 'string',
      pattern: /^game/
    },
    teamID: {
      type: 'string'
    }
  }, req);

  // 試合情報の取得
  const games: Game[] = await db.games.aggregate([
    {$match: {_id: new ObjectId(data.gameID)}},
    {$project:
      {
        _id: 0,
        gameID: '$_id',
        competitionID: 1,
        gameInfCom: 1,
        teamInfo: 1
      }
    }
  ]).toArray();
  const game = games[0];

  // 大会情報の取得
  const competitions: Competition[] = await db.competitions.aggregate([
    {$match: {_id: new ObjectId(game.competitionID)}},
    {$project:
      {
        _id: 0,
        compId: '$_id',
        compName: 1,
        organizerInf: 1,
        teamID: 1,
      }
    }
  ]).toArray();
  const competition = competitions[0];

  // チーム履歴の取得
  const teamHis = await db.teamHistories.aggregate([
    {$match:
      {
        teamID: data.teamID,
        $or: [
          {
            teamEndDate: {$exists: false}
          },{
            teamEndDate: {$gte: moment().toJSON()}
          },{
            teamEndDate: ''
          }
        ]
      }
    },
    {$project:
      {
        _id: 0,
        userID: 1,
        teamPosition: 1,
        teamSportsHisInf: 1
      }
    }
  ]).toArray();

  // ユーザー情報の取得
  const user = await db.users.aggregate([
    {$match:
      {_id: {
        $in: teamHis.map(his => new ObjectId(his.userID))
      }}
    },
    {$project:
      {
        _id: 0,
        userID: '$_id',
        playerInf: 1
      }
    }
  ]).toArray();

  // チーム情報の取得
  const team: Team[] = await db.teams.aggregate([
    {$match:
      {
        $or: [{
          _id: new ObjectId(data.teamID)
        },{
          _id: {$in: competition.organizerInf.map(organ => new ObjectId(organ.organizerID))}
        }]
      }
    },
    {$project:
      {
        _id: 0,
        teamID: '$_id',
        teamName: 1
      }
    }
  ]).toArray();

  // 団体情報の取得
  const organ: Organ[] = await db.organizations.aggregate([
    {$match:
      {
        _id: {$in: competition.organizerInf.map(organ => new ObjectId(organ.organizerID))}
      }
    },
    {$project:
      {
        _id: 0,
        organID: '$_id',
        organName: 1
      }
    }
  ]).toArray();

  // 返却値の設定
  res.json({
    result: 'ok',
    game: game,
    competition: competition,
    teamHis: teamHis,
    playerInfo: user,
    team: team,
    organ: organ
  });

});

/**
 * 試合メンバー編集画面：更新処理
 */
router.post('/modGameMemberInf', async (req, res) => {

  // 画面入力値の受け取り
  const form = req.body.data.form;
  const gameID = req.body.data.gameID;
  const teamID = req.body.data.teamID;

  // チェック
  Validator(req.body.data, {
    gameID: {
      type: 'string'
    },
    teamID: {
      type: 'string'
    }
  }, req);

  // 権限チェック
  const teamInf = req.body.data.teamInf;
  const compId = req.body.data.compId;
  const userId = req.body.loginInfo.userId;
  const teamAdminInf = await GetTeamAdminInfo(teamInf);
  const compAdminInf = await GetCompAdminInfo(compId);
  const adminInf = teamAdminInf.concat(compAdminInf);
  CheckAdmin(adminInf, userId);

  // 更新データの設定
  const updateData = [];
  for (let i = 0; i < form.playerInfo.length; i++) {
    const data = form.playerInfo[i];
    const entrantInfo: {
      userID: string;
      teamPosition: string;
      uniNum: string;
      gamePosition: string;
      entrantStatus: string;
    } = {
      userID: data.userID,
      teamPosition: data.teamPosition,
      uniNum: data.uniNum,
      gamePosition: data.gamePosition,
      entrantStatus: data.entrantStatus
    };
    updateData.push(entrantInfo);
  }

  // 試合メンバー情報の更新
  const result = await db.games.updateOne(
    {
      _id: new ObjectId(gameID),
      'teamInfo.teamID': teamID,
    },
    {$set:{'teamInfo.$.entrantInfo': updateData}}
  );

  // 更新結果判定と返却値の設定
  if(result.modifiedCount > 0) {
    res.json({result: 'ok'});
  } else {
    res.json({result: 'ng'});
  }

});

/**
 * 試合結果編集画面：初期処理
 */
router.post('/editGameResultInit', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data;

  // チェック
  Validator(data, {
    gameID: {
      type: 'string'
    },
    type: {
      type: 'string',
      pattern: /^game/
    },
    teamID: {
      type: 'string'
    }
  }, req);

  // 試合情報の取得
  const games: Game[] = await db.games.aggregate([
    {$match: {_id: new ObjectId(data.gameID)}},
    {$project:
      {
        _id: 0,
        gameID: '$_id',
        competitionID: 1,
        gameInfCom: 1,
        teamInfo: 1
      }
    }
  ]).toArray();
  const game = games[0];

  // 試合結果情報の取得
  const gameResult = await db.gameResults.find(
    {gameID: data.gameID},
    {projection: {_id: 0}}
  ).toArray();

  // 選択チームの試合結果と相手チームの試合結果得点を取得
  let ownGameResult: Omit<GameResult, '_id'>;
  let oppScoreResult = 0;

  // 試合結果データの取得有無を判定
  if(gameResult.length) {
    // データ取得数が2より大きい場合エラー
    if(gameResult.length > 2) {
      throw new Error('More than two match results obtained！');
    } else {
      for(const gameRs of gameResult ) {
        // 選択チームの試合結果を取得
        if(gameRs.groupID === data.teamID && gameRs.gameResult) {
          ownGameResult = gameRs;
         // 相手チームの試合結果得点を取得
        } else if(gameRs.groupID !== data.teamID && gameRs.gameResult) {
          oppScoreResult = gameRs.gameResult.scoreResult;
        }
      }
    }
  }

  // 大会情報の取得
  const competition = await db.competitions.findOne(
    {_id: new ObjectId(game.competitionID)},
    {projection:
      {
        _id: 0,
        compName: 1,
        organizerInf: 1
      }
    }
  );

  // チーム情報の取得
  const team: Team[] = await db.teams.aggregate([
    {$match:
      {
        $or: [{
          _id: new ObjectId(data.teamID)
        },{
          _id: {$in: competition.organizerInf.map(organ => new ObjectId(organ.organizerID))}
        }]
      }
    },
    {$project:
      {
        _id: 0,
        teamID: '$_id',
        teamName: 1
      }
    }
  ]).toArray();

  // 団体情報の取得
  const organ: Organ[] = await db.organizations.aggregate([
    {$match:
      {
        _id: {$in: competition.organizerInf.map(organ => new ObjectId(organ.organizerID))}
      }
    },
    {$project:
      {
        _id: 0,
        organID: '$_id',
        organName: 1
      }
    }
  ]).toArray();

  // 返却値の設定
  res.json({
    result: 'ok',
    game: game,
    gameResult: ownGameResult,
    oppScoreResult: oppScoreResult,
    competition: competition,
    team: team,
    organ: organ
  });

});

/**
 * 試合結果編集画面：更新処理
 */
router.post('/modGameResult', async (req, res) => {

  // 画面入力値の受け取り
  const form = req.body.data.form;
  const gameID = req.body.data.gameID;
  const teamID = req.body.data.teamID;

  // チェック
  Validator(req.body.data, {
    gameID: {
      type: 'string'
    },
    teamID: {
      type: 'string'
    }
  }, req);

  // 権限チェック
  const teamInf = req.body.data.teamInf;
  const compID = req.body.data.compID;
  const userID = req.body.loginInfo.userId;
  const teamAdminInf = await GetTeamAdminInfo(teamInf);
  const compAdminInf = await GetCompAdminInfo(compID);
  const adminInf = teamAdminInf.concat(compAdminInf);
  CheckAdmin(adminInf, userID);

  // DBの型がnumberのため、formの値は数値に変換
  for (const [key, value] of Object.entries(form)) {
    if(value) {
      // 数値チェックを行う
      if(patNum.test(value.toString())) {
        form[key] = parseInt(value.toString());
      } else {
        res.json({
          result: 'ng',
          message: '半角数字以外は入力出来ません。'
        });
        return;
      }
    } else {
      form[key] = 0;
    }
  }

  // 試合結果情報の取得
  const gameResult = await db.gameResults.findOne({
    gameID: gameID,
    groupID: teamID
  });

  // 試合結果が既に存在する場合は登録、存在しない場合は更新する
  if(!gameResult) {

    // 試合結果情報の登録
    form['teamID'] = teamID;
    const result = await db.gameResults.insertOne(
      {
        gameID: gameID,
        groupFlg: '1',
        groupID: teamID,
        gameResult: form,
        docIsValid: true,
        docCreUserID: req.body.loginInfo.userId,
        docCreTimeStamp: moment().toJSON(),
        docModUserID: req.body.loginInfo.userId,
        docModTimeStamp: moment().toJSON()
      }
    );

    // 更新結果判定と返却値の設定
    if(result.result.ok == 1) {
      res.json({result: 'ok'});
    } else {
      res.json({
        result: 'ng',
        message: '試合結果を更新できませんでした。'
      });
    }

  } else {

    // 試合結果情報の更新
    form['teamID'] = teamID;
    const result = await db.gameResults.updateOne(
      {
        _id: gameResult._id,
        groupID: teamID,
      },
      {
        $set:
        {
          gameResult: form,
          docModUserID: req.body.loginInfo.userId,
          docModTimeStamp: moment().toJSON()
        }
      }
    );
    // 更新結果判定と返却値の設定
    if(result.modifiedCount > 0) {
      res.json({result: 'ok'});
    } else {
      res.json({
        result: 'ng',
        message: '試合結果を更新できませんでした。'
      });
    }
  }
});

/**
 * 試合経過編集画面：初期処理
 */
router.post('/editGameProgressInit', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data;

  // チェック
  Validator(data, {
    gameID: {
      type: 'string'
    },
    type: {
      type: 'string',
      pattern: /^game/
    },
    teamID: {
      type: 'string'
    }
  }, req);

  // 試合情報の取得
  const games: Game[] = await db.games.aggregate([
    {$match: {_id: new ObjectId(data.gameID)}},
    {$project:
      {
        _id: 0,
        gameID: '$_id',
        competitionID: 1,
        gameInfCom: 1,
        teamInfo: 1
      }
    }
  ]).toArray();
  const game = games[0];

  // 試合結果情報の取得
  const gameResult = await db.gameResults.findOne(
    {
      gameID: data.gameID,
      groupID: data.teamID
    },
    {projection: {_id: 0}}
  );

  // 大会情報の取得
  const competition = await db.competitions.findOne(
    {_id: new ObjectId(game.competitionID)},
    {projection:
      {
        _id: 0,
        sports: 1,
        compName: 1,
        organizerInf: 1
      }
    }
  );

  // チーム情報の取得
  const team: Team[] = await db.teams.aggregate([
    {$match:
      {
        $or: [{
          _id: new ObjectId(data.teamID)
        },{
          _id: {$in: competition.organizerInf.map(organ => new ObjectId(organ.organizerID))}
        }]
      }
    },
    {$project:
      {
        _id: 0,
        teamID: '$_id',
        teamName: 1
      }
    }
  ]).toArray();

  // チーム履歴の取得
  const teamHis = await db.teamHistories.find({
    teamID: data.teamID,
    $or: [
      {
        teamEndDate: {$exists: false}
      },{
        teamEndDate: {$gte: moment().toJSON()}
      },{
        teamEndDate: ''
      }
    ]
  }).toArray();

  // 団体情報の取得
  const organ: Organ[] = await db.organizations.aggregate([
    {$match:
      {
        _id: {$in: competition.organizerInf.map(organ => new ObjectId(organ.organizerID))}
      }
    },
    {$project:
      {
        _id: 0,
        organID: '$_id',
        organName: 1
      }
    }
  ]).toArray();

  // 選手情報の取得
  const player = await db.users.aggregate([
    {$match:
      {
        _id: {$in: teamHis.map(tmHis => new ObjectId(tmHis.userID))}
      }
    },
    {$project:
      {
        _id: 0,
        userID: '$_id',
        playerInf: 1
      }
    }
  ]).toArray();

  // 返却値の設定
  res.json({
    result: 'ok',
    game: game,
    gameResult: gameResult,
    competition: competition,
    playerInfo: player,
    team: team,
    organ: organ
  });

});

/**
 * 試合経過編集画面：追加処理
 */
router.post('/addGameProgress', async (req, res) => {

  // 画面入力値の受け取り
  const form = req.body.data.form;
  const game = req.body.data.game;
  form['sports'] = req.body.data.sports;
  form['teamID'] = req.body.data.teamID;
  delete form['playerResults'];

  // チェック
  Validator(req.body.data, {
    game: {
      gameID: {
        type: 'string'
      },
      competitionID: {
        type: 'string'
      }
    },
    teamID: {
      type: 'string'
    },
    sports: {
      type: 'string'
    }
  }, req);

  // 権限チェック
  const teamInf = req.body.data.teamInf;
  const userId = req.body.loginInfo.userId;
  const compId = req.body.data.compID;
  const teamAdminInf = await GetTeamAdminInfo(teamInf);
  const compAdminInf = await GetCompAdminInfo(compId);
  const adminInf = teamAdminInf.concat(compAdminInf);
  CheckAdmin(adminInf, userId);

  // 試合結果情報の取得
  const gameResult = await db.gameResults.findOne(
    {
      gameID: game.gameID,
      groupID: form.teamID
    },
    {
      projection: {
        _id: 1,
        gameResultPlayer: 1
      }
    }
  );

  // 試合結果が既に存在する場合は登録、存在しない場合は更新する
  if(!gameResult) {

    // 試合結果情報の登録
    const result1 = await db.gameResults.insertOne(
      {
        gameID: game.gameID,
        groupFlg: '1',
        groupID: form.teamID,
        gameResultPlayer: [form],
        docIsValid: true,
        docCreUserID: req.body.loginInfo.userId,
        docCreTimeStamp: moment().toJSON(),
        docModUserID: req.body.loginInfo.userId,
        docModTimeStamp: moment().toJSON()
      }
    );

    // 更新結果判定と返却値の設定
    if(!(result1.result.ok == 1)) {
      res.json({
        result: 'ng',
        message: '試合経過情報を追加できませんでした。'
      });
      return;
    }

    // 個人履歴の登録
    const result2 = await db.playerHistories.insertOne({
      userID: form.userID,
      gameID: game.gameID,
      competitionID: game.competitionID,
      records: [form],
      docIsValid: true,
      docCreUserID: req.body.loginInfo.userId,
      docCreTimeStamp: moment().toJSON(),
      docModUserID: req.body.loginInfo.userId,
      docModTimeStamp: moment().toJSON()
    });

    if(result2.result.ok == 1) {
      res.json({result: 'ok'});
    } else {
      res.json({
        result: 'ng',
        message: '試合経過情報を追加できませんでした。'
      });
    }

  } else {

    // 追加データが既に存在するか判定
    let findResult;
    if(gameResult.gameResultPlayer) {
      findResult = gameResult.gameResultPlayer.find(elem => {
        return (elem.userID == form.userID)
          && (elem.resultTime == form.resultTime)
          && (elem.recordType == form.recordType);
      });
    }

    if(!findResult) {

      // 試合経過情報の更新
      const result = await db.gameResults.updateOne(
        {_id: gameResult._id},
        {
          $push:{
            gameResultPlayer: form,
          },
          $set: {
            docModUserID: req.body.loginInfo.userId,
            docModTimeStamp: moment().toJSON()
          }
        }
      );
      // 更新結果判定と返却値の設定
      if(!(result.modifiedCount > 0)) {
        res.json({
          result: 'ng',
          message: '試合経過情報を追加できませんでした。'
        });
        return;
      }

      // 個人履歴の検索
      const playerHis = await db.playerHistories.findOne(
        {
          userID: form.userID,
          competitionID: game.competitionID,
          gameID: game.gameID
        },
        {projection: {_id: 1}}
      );

      // 個人履歴が存在する場合は更新、存在しない場合は登録
      if(playerHis) {
        // 個人履歴の更新
        const result = await db.playerHistories.updateOne(
          {_id: playerHis._id},
          {
            $push:{
              records: form,
            },
            $set: {
              docModUserID: req.body.loginInfo.userId,
              docModTimeStamp: moment().toJSON()
            }
          }
        );
        if(result.modifiedCount > 0) {
          res.json({result: 'ok'});
        } else {
          res.json({
            result: 'ng',
            message: '試合経過情報を追加できませんでした。'
          });
        }

      } else {
        // 個人履歴の登録
        const result = await db.playerHistories.insertOne({
          userID: form.userID,
          gameID: game.gameID,
          competitionID: game.competitionID,
          records: [form],
          docIsValid: true,
          docCreUserID: req.body.loginInfo.userId,
          docCreTimeStamp: moment().toJSON(),
          docModUserID: req.body.loginInfo.userId,
          docModTimeStamp: moment().toJSON()
        });
        if(result.result.ok == 1) {
          res.json({result: 'ok'});
        } else {
          res.json({
            result: 'ng',
            message: '試合経過情報を追加できませんでした。'
          });
        }
      }

    } else {
      res.json({
        result: 'ng',
        message: '既に同じ経過情報が存在するため登録出来ません。'
      });
    }
  }
});

/**
 * 試合経過編集画面：更新処理
 */
router.post('/modGameProgress', async (req, res) => {

  // 画面入力値の受け取り
  const form = req.body.data.form;
  const game = req.body.data.game;

  // チェック
  Validator(req.body.data, {
    game: {
      gameID: {
        type: 'string'
      },
      competitionID: {
        type: 'string'
      }
    },
    teamID: {
      type: 'string'
    }
  }, req);

  // 権限チェック
  const teamInf = req.body.data.teamInf;
  const userId = req.body.loginInfo.userId;
  const compId = req.body.data.compID;
  const teamAdminInf = await GetTeamAdminInfo(teamInf);
  const compAdminInf = await GetCompAdminInfo(compId);
  const adminInf = teamAdminInf.concat(compAdminInf);
  CheckAdmin(adminInf, userId);

  // 重複チェック
  const chkResult = await db.gameResults.countDocuments(
    {
      gameID: game.gameID,
      groupID: req.body.data.teamID,
      'gameResultPlayer.userID': form.userID,
      'gameResultPlayer.recordType': form.recordType,
      'gameResultPlayer.resultTime': form.resultTime,
    },
    {limit: 1}
  );

  if(chkResult > 0) {
    res.json({
      result: 'ng',
      message: '既に同じ経過情報が存在するため登録出来ません。'
    });
    return;
  }

  // 試合経過更新処理
  const result = await db.gameResults.updateOne(
    {
      gameID: game.gameID,
      groupID: req.body.data.teamID,
      'gameResultPlayer.userID': form.userIDBk,
      'gameResultPlayer.recordType': form.recordTypeBk,
      'gameResultPlayer.resultTime': form.resultTimeBk,
    },
    {
      $set: {
        'gameResultPlayer.$.userID': form.userID,
        'gameResultPlayer.$.recordType': form.recordType,
        'gameResultPlayer.$.resultTime': form.resultTime,
      }
    }
  );
  if(!(result.modifiedCount > 0)) {
    res.json({
      result: 'ng',
      message: '試合経過情報を更新できませんでした。'
    });
    return;
  }

  // 個人履歴更新処理
  const result2 = await db.playerHistories.updateOne(
    {
      userID: form.userIDBk,
      gameID: game.gameID,
      competitionID: game.competitionID,
      'records.userID': form.userIDBk,
      'records.recordType': form.recordTypeBk,
      'records.resultTime': form.resultTimeBk,
    },
    {
      $set: {
        'records.$.userID': form.userID,
        'records.$.recordType': form.recordType,
        'records.$.resultTime': form.resultTime,
      }
    }
  );
  if(result2.modifiedCount > 0) {
    res.json({result: 'ok'});
  } else {
    res.json({
      result: 'ng',
      message: '試合経過情報を更新できませんでした。'
    });
  }

});

/**
 * 試合経過編集画面：削除処理
 */
router.post('/removeGameProgress', async (req, res) => {

  // 画面入力値の受け取り
  const form = req.body.data.form;
  const game = req.body.data.game;
  const sports = req.body.data.sports;

  // チェック
  Validator(req.body.data, {
    game: {
      gameID: {
        type: 'string'
      },
      competitionID: {
        type: 'string'
      }
    },
    teamID: {
      type: 'string'
    },
    sports: {
      type: 'string'
    }
  }, req);

  // 権限チェック
  const teamInf = req.body.data.teamInf;
  const userId = req.body.loginInfo.userId;
  const compId = req.body.data.compID;
  const teamAdminInf = await GetTeamAdminInfo(teamInf);
  const compAdminInf = await GetCompAdminInfo(compId);
  const adminInf = teamAdminInf.concat(compAdminInf);
  CheckAdmin(adminInf, userId);

  // 試合経過更新処理
  const result = await db.gameResults.updateOne(
    {
      gameID: game.gameID,
      groupID: req.body.data.teamID
    },
    {
      $pull: {
        gameResultPlayer: {
          userID: form.userIDBk,
          sports: sports,
          recordType: form.recordTypeBk,
          resultTime: form.resultTimeBk
        }
      }
    }
  );
  if(!(result.modifiedCount > 0)) {
    res.json({
      result: 'ng',
      message: '試合経過情報を削除できませんでした。'
    });
    return;
  }

  // 個人履歴更新処理
  const result2 = await db.playerHistories.updateOne(
    {
      userID: form.userIDBk,
      gameID: game.gameID,
      competitionID: game.competitionID,
    },
    {
      $pull: {
        records: {
          userID: form.userIDBk,
          sports: sports,
          recordType: form.recordTypeBk,
          resultTime: form.resultTimeBk
        }
      }
    }
  );
  if(result2.modifiedCount > 0) {
    res.json({result: 'ok'});
  } else {
    res.json({
      result: 'ng',
      message: '試合経過情報を削除できませんでした。'
    });
  }

});

/**
 * 試合参照
 */
router.post('/gameDetail', async (req, res) => {

  // データ取り出し
  const data = req.body.data;

  Validator(data, {
    id: {
      type: 'string'
    },
    type: {
      type: 'string',
      pattern: /^gameInfo/
    }
  }, req);

  // 試合情報取得
  const gameInf = await db.games.findOne({_id: new ObjectId(data.id)});

  // 試合情報返却値設定
  const reGameInf: Pick<Game, 'competitionID' | 'gameInfCom' | 'gameInfSports' | 'teamInfo'> = {
    competitionID: gameInf.competitionID,
    gameInfCom: gameInf.gameInfCom,
    gameInfSports: gameInf.gameInfSports,
    teamInfo: gameInf.teamInfo
  };

  // 試合結果
  // 変数宣言
  const reGameResultInf: Pick<GameResult, 'groupFlg' | 'groupID' | 'gameResult' | 'gameResultPlayer'>[] = [];

  // 試合結果情報取得
  const gameResultInf = await db.gameResults.find({gameID: gameInf._id.toHexString()}).toArray();

  // 抽出件数分ループ
  for(let i=0; i<gameResultInf.length; i++){

    // 試合情報のチーム数分ループ
    for(let j=0; j<reGameInf.teamInfo.length; j++){

      // チームＩＤで比較、一致した場合、試合情報の配列番号を設定
      if(gameResultInf[i].groupID === reGameInf.teamInfo[j].teamID){

        // 試合結果情報返却値設定
        const GameResultInfTemp = {
          groupFlg: gameResultInf[j].groupFlg,
          groupID: gameResultInf[j].groupID,
          gameResult: gameResultInf[j].gameResult,
          gameResultPlayer: gameResultInf[j].gameResultPlayer
        };

          // 試合結果設定
          reGameResultInf.push(GameResultInfTemp);
      }
    }
  }

  // 大会情報
  // 大会情報取得
  const compInf = await db.competitions.findOne({_id: new ObjectId(gameInf.competitionID)});

  // 大会情報設定
  const recompInf: Pick<Competition, 'compName' | 'compLogo' | 'compAdminInf' | 'organizerInf'> = {
    compName: compInf.compName,
    compLogo: compInf.compLogo,
    compAdminInf: compInf.compAdminInf,
    organizerInf: compInf.organizerInf
  };

  // 主催団体名
  const reorganNameList: NameList[] = [];

  // 主催団体情報設定判定
  if(!(compInf.organizerInf === void 0)){

    // 主催団体数分ループ
    for(let i=0; i<compInf.organizerInf.length; i++){

      // 主催団体区分判定
      if(compInf.organizerInf[i].organizerFlg === '1'){

        // 団体の場合
        const organInf = await db.organizations.findOne({_id: new ObjectId(compInf.organizerInf[i].organizerID)});

        // 設定の為の加工
        const organNameTemp: NameList = {
          id: organInf._id,
          name: organInf.organName
        };

        // 団体名設定
        reorganNameList.push(organNameTemp);

      }
      else if(compInf.organizerInf[i].organizerFlg === '2'){

        // テームの場合
        const organInf = await db.teams.findOne({_id: new ObjectId(compInf.organizerInf[i].organizerID)});

        // 設定の為の加工
        const organNameTemp: NameList = {
          id: organInf._id,
          name: organInf.teamName
        };

        // 団体名設定
        reorganNameList.push(organNameTemp);

      }
    }
  }

  // チーム名
  // 変数宣言
  const reteamInf: GameDetailteamInf[] = [];

  // チーム数分ループ
  for(let i=0; i<gameInf.teamInfo.length; i++){

    // チームID 設定判定
    // 【確認】条件足りてる？
    if(!(gameInf.teamInfo[i].teamID === '')){

      // チーム情報取得
      const teamInf = await db.teams.findOne({_id: new ObjectId(gameInf.teamInfo[i].teamID)});

      // 設定の為の加工
      const teamInfTemp = {
        teamID: teamInf._id,
        teamName: teamInf.teamName,
        teamAdminInf: teamInf.teamAdminInf
      };

      // チーム名設定
      reteamInf.push(teamInfTemp);
    }
  }

  // 選手名
  // 変数宣言
  const reuserNameList: NameList[] = [];

  // チーム数分ループ
  for(let i=0; i<gameInf.teamInfo?.length; i++){

    // チームの選手数分ループ
    for(let j=0; j<gameInf.teamInfo[i].entrantInfo?.length; j++){

      // 選手(ユーザー)ID 設定判定
      // 【確認】条件足りてる？
      if(!(gameInf.teamInfo[i].entrantInfo[j].userID === '')){

        // 選手情報取得
        const userInf = await db.users.findOne({_id: new ObjectId(gameInf.teamInfo[i].entrantInfo[j].userID)});

        // 設定の為の加工
        const userNameTemp: NameList = {
          id: userInf._id,
          name: `${userInf.playerInf.lastName} ${userInf.playerInf.firstName}`
        };

        // 選手名設定
        reuserNameList.push(userNameTemp);
      }
    }
  }

  // データ返却
  res.json({
    result: 'ok',
    gameInf: reGameInf,
    gameResultInf: reGameResultInf,
    compInf: recompInf,
    teamInf: reteamInf,
    userNameList: reuserNameList,
    organNameList: reorganNameList
  });
});

/**
 * リーグ/トーナメント参照：データ取得処理
 * @param req
 * @param res
 */
router.post('/getGameGroupInfo', async (req, res) => {

  // 遷移元からの情報取得
  const data = req.body.data;

  // バリデーション
  Validator(data, {
    id: {
      type: 'string'
    },
    type: {
      type: 'string',
      pattern: /^game/
    },
    gameSystem: {
      type: 'string',
      pattern: /リーグ|トーナメント/
    },
    gameSystemName: {
      type: 'string'
    }
  }, req);

  // 試合情報の検索条件を設定する
  const query: FilterQuery<Game> = {competitionID: data.id};
  query['gameInfCom.gameSystemInf.gameSystem'] = data.gameSystem;
  query['gameInfCom.gameSystemInf.gameSystemName'] = data.gameSystemName;

  // リーグのみチームIDの条件付けを行う
  if(data.gameSystem == 'リーグ') {
    query['teamInfo.teamID'] = {$ne: ''};
  }

  // 大会情報の取得
  const partTeam = await db.competitions.findOne(
    {_id: new ObjectId(data.id)},
    {
      projection: {
        _id: 0,
        teamID: 1
      }
    }
  );

  // 試合情報の取得(GameInfo型にキャスト)
  const games: GameInfo[] = await db.games.aggregate([
    {$match: query},
    {
      $project: {
        _id: 0,
        gameID: '$_id',
        'teamInfo.teamID': 1,
        'gameInfCom.gameSystemInf': 1
      }
    }
  ]).sort({docCreTimeStamp: 1}).toArray() as unknown as GameInfo[];

  // 試合情報が取得出来ない場合結果NGで処理終了
  if(games.length == 0) {
    res.json({
      result: 'ng',
      message: '試合情報が取得出来ませんでした。'
    });
    return;
  }

  // 試合結果情報の取得
  const gameResults: GameResult[] = await db.gameResults.find(
    {
      gameID: {$in: games.map(game => game.gameID.toHexString())},
      gameResult: {$exists: true}
    },
    {
      projection: {
        _id: 0,
        gameID: 1,
        groupID: 1,
        gameResult: 1
      }
    }
  ).toArray();

  // 重複するチームIDを除去し、新たなリストへ格納する処理
  const teamIdList: string[] = [];
  for (let i = 0; i < games.length; i++) {
    for (let index = 0; index < games[i].teamInfo.length; index++) {
      // teamIdListに存在しないデータは格納する
      const teamInfo = games[i].teamInfo[index];
      if(!(teamIdList.includes(teamInfo.teamID)) && teamInfo.teamID) {
        teamIdList.push(teamInfo.teamID);
      }
      // 参加チーム数とteamIdListが同じ要素数になった時点でループを抜ける
      if(teamIdList.length == games[0].gameInfCom.gameSystemInf.gameTeamCnt) break;
    }
  }

  // チーム情報の取得
  const teamList: Team[] = await db.teams.aggregate([
    {
      $match: {
        _id: {$in: partTeam.teamID.map(teamID => new ObjectId(teamID))}
      }
    },
    {
      $project: {
        _id: 0,
        teamID: '$_id',
        teamName: 1
      }
    }
  ]).toArray();

  // 返却データの設定
  res.json({
    result: 'ok',
    gameList: games,
    gameResultList: gameResults,
    teamList: teamList,
    teamIdList: teamIdList,
    partTeam: partTeam
  });

});

/**
 * リーグ編集画面：更新処理
 * @param req
 * @param res
 */
router.post('/editLeague', async (req, res) => {

  // チェック
  Validator(req.body, {
    data: {
      form: {
        teamForm: {
          gameID: {type: 'string'},
          team: {type: 'string'},
          score1stHalf: {
            type: 'number',
            pattern: patNum
          },
          score2ndHalf: {
            type: 'number',
            pattern: patNum
          },
          scoreEX1stHalf: {
            type: 'number',
            pattern: patNum
          },
          scoreEX2ndHalf: {
            type: 'number',
            pattern: patNum
          }
        },
        oppTeamForm: {
          gameID: {type: 'string'},
          team: {type: 'string'},
          score1stHalf: {
            type: 'number',
            pattern: patNum
          },
          score2ndHalf: {
            type: 'number',
            pattern: patNum
          },
          scoreEX1stHalf: {
            type: 'number',
            pattern: patNum
          },
          scoreEX2ndHalf: {
            type: 'number',
            pattern: patNum
          }
        }
      },
      compID: {type: 'string'},
    },
    loginInfo: {
      userId: {type: 'string'}
    }
  }, req);

  // 画面入力値の受け取り
  const form = req.body.data.form;

  // 権限チェック
  const compID = req.body.data.compID;
  const compAdminInf = await GetCompAdminInfo(compID);
  CheckAdmin(compAdminInf, req.body.loginInfo.userId);

  // 2チーム分の試合結果を更新・登録
  for (const key of Object.keys(form)) {
    const obj = form[key];

    // 合計点数の算出
    const scoreList: number[] = Object.values(obj).map(v => (typeof v == 'number') ? v : 0);
    const totalScore: number = scoreList.reduce((prev, cur) => prev + cur, 0);

    // 試合結果情報の更新(更新対象が存在しない場合は、自動的にinsertになる)
    await db.gameResults.updateOne(
      {
        gameID: obj.gameID,
        groupID: obj.team
      },
      {
        $set: {
          'gameResult.score1stHalf': obj.score1stHalf,
          'gameResult.score2ndHalf': obj.score2ndHalf,
          'gameResult.scoreEX1stHalf': obj.scoreEX1stHalf,
          'gameResult.scoreEX2ndHalf': obj.scoreEX2ndHalf,
          'gameResult.scoreResult': totalScore,
          docModUserID: req.body.loginInfo.userId,
          docModTimeStamp: moment().toJSON()
        },
        $setOnInsert: {
          groupFlg: '1',
          docIsValid: true,
          docCreUserID: req.body.loginInfo.userId,
          docCreTimeStamp: moment().toJSON()
        }
      },
      {upsert: true}
    );
  }

  // 処理結果の返却
  res.json({
    result: 'ok'
  });
});

/**
 * トーナメント編集画面：更新処理
 * @param req
 * @param res
 */
router.post('/editTournament', async (req, res) => {

  // バリデーション
  Validator(req.body, {
    data: {
      form: {
        formList: [{
          gameID: {type: 'string'},
          team: {type: 'string'},
          score1stHalf: {
            type: 'number',
            pattern: patNum
          },
          score2ndHalf: {
            type: 'number',
            pattern: patNum
          },
          scoreEX1stHalf: {
            type: 'number',
            pattern: patNum
          },
          scoreEX2ndHalf: {
            type: 'number',
            pattern: patNum
          },
          scorePK: {
            type: 'number',
            pattern: patNum
          }
        }]
      },
      compID: {type: 'string'}
    },
    loginInfo: {
      userId: {type: 'string'}
    }
  }, req);

  // 画面入力値の受け取り
  const form = req.body.data.form;

  // 権限チェック
  const compID = req.body.data.compID;
  const compAdminInf = await GetCompAdminInfo(compID);
  CheckAdmin(compAdminInf, req.body.loginInfo.userId);

  // 試合チームの変更があれば、試合情報の更新を行う
  if(form.formList[0].team != form.formList[0].teamBk
      || form.formList[1].team != form.formList[1].teamBk) {
    // 試合情報の更新
    await db.games.updateOne(
      {_id: new ObjectId(form.formList[0].gameID)},
      {
        $set: {
          'teamInfo.0.teamID': form.formList[0].team,
          'teamInfo.1.teamID': form.formList[1].team,
          docModUserID: req.body.loginInfo.userId,
          docModTimeStamp: moment().toJSON()
        }
      }
    );
  }

  // 2チーム分の試合結果を更新・登録
  for (const obj of form.formList) {

    // 合計点数は自動計算としたいので、totalScoreは削除
    if(obj.totalScore) delete obj.totalScore;

    // 合計点数の算出
    const scoreList: number[] = Object.keys(obj).map(key => {
      // キーリストに含まれる項目のみ合算の対象とする
      const keyList: string[] = ['score1stHalf', 'score2ndHalf', 'scoreEX1stHalf', 'scoreEX2ndHalf'];
      if(keyList.includes(key)) {
        return (typeof obj[key] == 'number') ? obj[key] : 0;
      } else {
        return 0;
      }
    });
    const totalScore: number = scoreList.reduce((prev, cur) => prev + cur, 0);

    // 試合結果情報の更新(更新対象が存在しない場合は、自動的にinsertになる)
    await db.gameResults.updateOne(
      {
        gameID: obj.gameID,
        groupID: obj.teamBk
      },
      {
        $set: {
          groupID: obj.team,
          'gameResult.teamID': obj.team,
          'gameResult.score1stHalf': obj.score1stHalf,
          'gameResult.score2ndHalf': obj.score2ndHalf,
          'gameResult.scoreEX1stHalf': obj.scoreEX1stHalf,
          'gameResult.scoreEX2ndHalf': obj.scoreEX2ndHalf,
          'gameResult.scoreResult': totalScore,
          'gameResult.scorePK': obj.scorePK,
          docModUserID: req.body.loginInfo.userId,
          docModTimeStamp: moment().toJSON()
        },
        $setOnInsert: {
          groupFlg: '1',
          docIsValid: true,
          docCreUserID: req.body.loginInfo.userId,
          docCreTimeStamp: moment().toJSON()
        }
      },
      {upsert: true}
    );
  }

  // 返却値の設定
  res.json({result: 'ok'});
});

export default router;
