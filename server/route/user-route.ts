import Router from 'express-promise-router';
import { config } from 'node-config-ts';
import * as Crypto from '../common/cryptor';
import { db, dbCommonFunction, startSession } from '../common/db-client';
import Validator, { ValidateSetting } from '../common/validator';
import { User, TeamHistory, PartTeamHistory, MailAddHistory } from 'defs/entity';
import { LoginInfo, PlayerInfo, TeamHistoryInfo } from 'defs/api';
import { ObjectId, FilterQuery, Cursor } from 'mongodb';
import * as moment from 'moment';
import { sports, transactionOptions, CNS } from '../../client/app/common/defines';
import sendMail from '../common/sendMailBySes';
import { MailConst } from '../common/constants';
import { generateRandStr } from '../../e2e/src/common/testUtil';
import * as express from 'express';

const router = Router();

/**
 * ログイン時必要情報取得メソッド
 */
const GetLoginInfo = async(userId: string, req: express.Request): Promise<Omit<LoginInfo, 'nickname' | 'userId' | 'isPlayer'>> => {
  // 管理しているチームを検索
  const team = await dbCommonFunction(
    req,
    'teams.aggregate',
    db.teams.aggregate.bind(db.teams),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    [
      {$match: {'teamAdminInf.adminUserID': userId}},
      {$project: {
        _id: 1
      }}
    ]
  );
  // 管理している団体を検索
  const organ = await dbCommonFunction(
    req,
    'organizations.aggregate',
    db.organizations.aggregate.bind(db.organizations),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    [
      {$match: {'organAdminInf.adminUserID': userId}},
      {$project: {
        _id: 1
      }}
    ]
  );
  // 管理している大会IDを取得(新大会関連画面の作成完了後はcompetitionInfsコレクションが接続対象となる)
  const comp = await dbCommonFunction(
    req,
    'competitions.findOne',
    db.competitions.findOne.bind(db.competitions),
    undefined,
    undefined,
    {'compAdminInf.adminUserID': userId},
    {projection: {
      _id: 1
    }}
  );

  // 管理しているチーム・団体IDをまとめる
  const manageId: ObjectId[] = [];
  team.map(t => manageId.push(t._id));
  organ.map(o => manageId.push(o._id));

  // 情報を整理して返却
  const loginInf: Omit<LoginInfo, 'nickname' | 'userId' | 'isPlayer'> = {
    isAdminTeam: (team?.length) ? true : false,
    isAdminOrgan: (organ?.length) ? true : false,
    isAdminComp: (comp != null) ? true : false,
    management: manageId
  };
  return loginInf;
};

/**
 * ログイン処理
 */
router.post('/login', async (req, res) => {
  const data = req.body.data;
  Validator(data, {
    mailAdd: {
      type: 'string',
      pattern: /^[A-Za-z0-9_.-]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]{1,}\.[A-Za-z0-9_.-]{1,}$/,
      length: 100
    },
    password: {
      type: 'string',
      pattern: /^(?=.*?[a-z])(?=.*?\d)[ -~]{8,20}$/i,
    }
  }, req);

  // 入力されたメール、パスワードに該当するユーザーを取得する
  const user = await dbCommonFunction(
    req,
    'users.findOne',
    db.users.findOne.bind(db.users),
    undefined,
    undefined,
    {
      mailAdd: Crypto.getEncryptedString(data.mailAdd),
      password: Crypto.getEncryptedString(data.password)
    },
    {projection: {
      _id: 1,
      nickname: 1,
      playerInf: 1
    }}
  );
  if(!user) {
    res.json({result: 'ng'});
  } else {
    // ログイン時必要情報取得
    const loginInf = await GetLoginInfo(user._id.toHexString(), req);

    res.json({
      result: 'ok',
      loginInfo: {
        nickname: user.nickname,
        userId: user._id,
        isPlayer: user.playerInf ? true : false,
        isAdminTeam: loginInf.isAdminTeam,
        isAdminOrgan: loginInf.isAdminOrgan,
        isAdminComp: loginInf.isAdminComp,
        management: loginInf.management
      }
    });
  }
});

/**
 * ログイン時必要情報更新処理
 */
router.post('/reloadLoginInf', async (req, res) => {
  const userId = req.body.loginInfo.userId;

  // ユーザーのニックネームを取得
  const user = await dbCommonFunction(
    req,
    'users.findOne',
    db.users.findOne.bind(db.users),
    undefined,
    undefined,
    {_id: new ObjectId(userId)},
    {projection: {
      nickname: 1,
      playerInf: 1
    }}
  );

  // ユーザー情報が無い場合はngを返してサーバ処理終了
  if(!user) {
    res.json({result: 'ng'});
    return;
  }

  // ログイン時必要情報取得
  const loginInf = await GetLoginInfo(userId, req);

  res.json({
    result: 'ok',
    loginInfo: {
      nickname: user.nickname,
      userId: '',
      isPlayer: user.playerInf ? true : false,
      isAdminTeam: loginInf.isAdminTeam,
      isAdminOrgan: loginInf.isAdminOrgan,
      isAdminComp: loginInf.isAdminComp,
      management: loginInf.management
    }
  });
});

// 登録用メール送信
router.post('/sendMail', async (req, res) => {
  const data = req.body.data;

  Validator(data, {
    mail: {
      type: 'string',
      pattern: /^[A-Za-z0-9_.-]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]{1,}\.[A-Za-z0-9_.-]{1,}$/,
      length: 100
    }
  }, req);

  // TODO チェッカー作りたい
  if (data.mail) {
    const token = Crypto.getEncryptedString(data.mail);

    // 送信されたメールアドレスの存在チェック
    const chkResult = await dbCommonFunction(
      req,
      'users.countDocuments',
      db.users.countDocuments.bind(db.users),
      undefined,
      undefined,
      {mailAdd: token},
      {limit: 1}
    );

    // 登録済ならエラー
    if(chkResult > 0) {
      res.json({
        result: 'ng',
        message: 'このメールアドレスは既に使用されています。'
      });
      return;
    }

    const protocol = config.https ? 'https' : 'http';
    const redirectUrl = `${protocol}://${config.clientHost}/createUser?token=${token}`;

    // AWS SESからメール送信を行う
    await sendMail(data.mail, MailConst.SUB_CREATE_USER, MailConst.TEXT_CREATE_USER.replace('※1', redirectUrl));

    // 処理結果の返却
    res.json({result: 'ok'});

  } else {
    // TODO 不正な値の時のハンドリング
    res.json({result: 'ng'});
  }
});

router.post('/resetPassword', async (req, res) => {
  const data = req.body.data;

  Validator(data, {
    mail: {
      type: 'string',
      pattern: /^[A-Za-z0-9_.-]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]{1,}\.[A-Za-z0-9_.-]{1,}$/,
      length: 100
    }
  }, req);

  const token = Crypto.getEncryptedString(data.mail);
  const protocol = config.https ? 'https' : 'http';
  const redirectUrl = `${protocol}://${config.clientHost}/changePassword?token=${token}`;

  // AWS SESからメール送信を行う
  await sendMail(data.mail, MailConst.SUB_PASSWORD_RESET, MailConst.TEXT_PASSWORD_RESET.replace('※1', redirectUrl));

  // 処理結果の返却
  res.json({result: 'ok'});
});

/**
 * 認証コード送信
*/
router.post('/sendAuthCode', async (req, res) => {
  const data = req.body;
  // 必須項目について
  Validator(data, {
    data: {
      email: {
        type: 'string',
        pattern: /^[A-Za-z0-9_.-]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]{1,}\.[A-Za-z0-9_.-]{1,}$/,
        length: 100
      },
      confirmEmail: {
        type: 'string',
        pattern: /^[A-Za-z0-9_.-]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]{1,}\.[A-Za-z0-9_.-]{1,}$/,
        length: 100
      }
    },
    loginInfo: {
      userId: {
        type: 'string'
      }
    }
  }, req);

  // 入力メールアドレス一致確認
  if(data.data.email != data.data.confirmEmail) {
    throw new Error('entered mailaddresses are not same!');
  }

  // 変更用メールアドレス暗号化
  const token = Crypto.getEncryptedString(data.data.email);

  // 既存メールアドレスを取得する
  const user = await dbCommonFunction(
    req,
    'users.findOne',
    db.users.findOne.bind(db.users),
    undefined,
    undefined,
    {
      _id: new ObjectId(data.loginInfo.userId)
    }, {
      projection: {
        mailAdd: 1
      }
    }
  );

  // 既存メールアドレス取得判定
  if (!user) {
    throw new Error('required items are empty!');
  }

  // 変更前後のメールアドレスが同一（変更なし）の場合は処理終了
  if (user.mailAdd == token) {
    res.json({
      result: 'ng',
      message: '変更前のメールアドレスと同一です。'
    });
    return;
  }

  // 変更用メールアドレスの存在チェック
  const chkResult = await dbCommonFunction(
    req,
    'users.countDocuments',
    db.users.countDocuments.bind(db.users),
    undefined,
    undefined,
    { mailAdd: token },
    { limit: 1 }
  );

  // 登録済ならエラー
  if (chkResult > 0) {
    res.json({
      result: 'ng',
      message: 'このメールアドレスは既に使用されています。'
    });
    return;
  }

  // 認証コード生成
  const authCode = generateRandStr(6);

  // メールアドレス変更履歴登録データ作成
  const insertData: MailAddHistory = {
    userID: data.loginInfo.userId,
    oldMailAdd: user.mailAdd,
    newMailAdd: token,
    authCode: authCode,
    expirationDate: moment().add(CNS.expirationMinutes, 'minutes').toJSON(),
    changedFlg: false,
    docIsValid: true,
    docCreUserID: 'system',
    docCreTimeStamp: moment().toJSON(),
    docModUserID: 'system',
    docModTimeStamp: moment().toJSON()
  };

  // メールアドレス変更履歴登録
  await dbCommonFunction(
    req,
    'mailAddHistories.insertOne',
    db.mailAddHistories.insertOne.bind(db.mailAddHistories),
    undefined,
    undefined,
    insertData
  );

  // AWS SESから認証コードのメール送信を行う
  await sendMail(data.data.email, MailConst.SUB_SEND_AUTH_CODE, MailConst.TEXT_SEND_AUTH_CODE.replace('※1', authCode).replace('※2', CNS.expirationMinutes.toString()));

  res.json({result: 'ok'});
});

/**
 * 認証コード確認
 */
router.post('/checkAuthCode', async (req, res) => {
  const data = req.body;
  // 必須項目について
  Validator(data, {
    data:{
      authCode: {
        type: 'string',
        pattern: /^[A-Za-z0-9]{6}$/
      }
    },
    loginInfo: {
      userId: {
        type: 'string'
      }
    }
  }, req);

  // メールアドレス変更履歴取得
  const addHistoryInf = await dbCommonFunction(
    req,
    'mailAddHistories.findOne',
    db.mailAddHistories.findOne.bind(db.mailAddHistories),
    undefined,
    undefined,
    {
      userID: data.loginInfo.userId,
      authCode: data.data.authCode
    }, {
      projection: {
        _id: 1,
        oldMailAdd: 1,
        newMailAdd: 1,
        expirationDate: 1
      }
    }
  );

  // 変更履歴取得判定
  if(!addHistoryInf) {
    res.json({
      result: 'ng',
      message: '認証コードが間違っています。',
      expiredFlg: false
    });
    return;
  }

  // 現在日時
  const now = moment().toJSON();

  // 有効期限判定
  if (addHistoryInf.expirationDate < now) {
    res.json({
      result: 'ng',
      message: '認証コードの有効期限が切れています。\nはじめからやり直してください。',
      expiredFlg: true
    });
    return;
  }

  // 変更前後メールアドレス復号化
  const oldMailAdd = Crypto.getDecryptedString(addHistoryInf.oldMailAdd);
  const newMailAdd = Crypto.getDecryptedString(addHistoryInf.newMailAdd);

  res.json({
    result: 'ok',
    oldEmailAdd: oldMailAdd,
    newEmailAdd: newMailAdd,
    addHistoryInfId: addHistoryInf._id
  });
});

/**
 * メールアドレス変更
 */
router.post('/editEmail', async (req, res) => {
  const data = req.body;

  // 必須項目について
  Validator(data, {
    data: {
      addHistoryInfId: {
        type: 'string'
      }
    }
  }, req);

  // セッション開始
  const session = await startSession();

  try {
    // トランザクション開始
    session.startTransaction(transactionOptions);

    // メールアドレス変更履歴取得
    const addHistoryInf = await dbCommonFunction(
      req,
      'mailAddHistories.findOne',
      db.mailAddHistories.findOne.bind(db.mailAddHistories),
      undefined,
      { session },
      {
        _id: new ObjectId(data.data.addHistoryInfId)
      }, {
        projection: {
          userID:1,
          newMailAdd: 1
        }
      }
    );

    // 変更履歴取得判定
    if(!addHistoryInf) {
      throw new Error('invalid authID is served!');
    }

    // 変更用メールアドレスの存在チェック
    const chkResult = await dbCommonFunction(
      req,
      'users.countDocuments',
      db.users.countDocuments.bind(db.users),
      undefined,
      { session },
      { mailAdd: addHistoryInf.newMailAdd },
      { limit: 1 }
    );

    // 登録済ならエラー
    if (chkResult > 0) {
      res.json({
        result: 'ng',
        message: 'このメールアドレスは既に使用されています。\nはじめからやり直してください。'
      });
      return;
    }

    // メールアドレス更新データ準備
    const updMailData = {
      mailAdd: addHistoryInf.newMailAdd,
      docModUserID: addHistoryInf.userID,
      docModTimeStamp: moment().toJSON()
    };

    // メールアドレス更新処理
    const updMailResult = await dbCommonFunction(
      req,
      'users.updateOne',
      db.users.updateOne.bind(db.users),
      undefined,
      { session },
      {
        _id: new ObjectId(addHistoryInf.userID)
      }, {
        $set: updMailData
      }
    );

    // メールアドレス更新結果判定
    if(updMailResult.modifiedCount !== 1) {
      // ロールバック
      await session.abortTransaction();
      res.json({
        result: 'ng',
        message: 'メールアドレスを更新できませんでした。\nはじめからやり直してください。'
      });
      return;
    }

    // 変更履歴更新データ準備
    const updHistoryData = {
      changedFlg: true,
      docModUserID: addHistoryInf.userID,
      docModTimeStamp: moment().toJSON()
    };

    // 変更履歴更新処理
    const updHistoryResult = await dbCommonFunction (
      req,
      'mailAddHistories.updateOne',
      db.mailAddHistories.updateOne.bind(db.mailAddHistories),
      undefined,
      { session },
      {_id: new ObjectId(data.data.addHistoryInfId)},
      {$set: updHistoryData}
    );

    // 返却値の設定
    // トランザクション処理の破棄/確定
    if (updHistoryResult.modifiedCount !== 1) {
      // ロールバック
      await session.abortTransaction();

      res.json({
        result: 'ng',
        message: '処理に失敗しました。\nはじめからやり直してください。'
      });

    } else {
      // コミット
      await session.commitTransaction();

      res.json({ result: 'ok' });
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

// パスワード変更
router.post('/editPassword', async (req, res) => {
  const data = req.body;
  // 必須項目について
  Validator(data, {
    data: {
      password: {
        type: 'string',
        pattern: /^(?=.*?[a-z])(?=.*?\d)[ -~]{8,20}$/i,
      },
    },
    loginInfo: {
      userId: {
        type: 'string'
      }
    }
  }, req);

  const updateData: Pick<User, 'password'> = {
    password: Crypto.getEncryptedString(data.data.password)
  };

  await dbCommonFunction(
    req,
    'users.updateOne',
    db.users.updateOne.bind(db.users),
    undefined,
    undefined,
    {_id: new ObjectId(data.loginInfo.userId)}, {$set: updateData}
  );
  res.json({result: 'ok'});
});

// パスワードリセット
router.post('/changePassword', async (req, res) => {
  const data = req.body.data;
  // 必須項目について
  Validator(data, {
    token: {
      type: 'string'
    },
    password: {
      type: 'string',
      pattern: /^(?=.*?[a-z])(?=.*?\d)[ -~]{8,20}$/i,
    }
  }, req);

  const updateData: Pick<User, 'password'> = {
    password: Crypto.getEncryptedString(data.password)
  };

  await dbCommonFunction(
    req,
    'users.updateOne',
    db.users.updateOne.bind(db.users),
    undefined,
    undefined,
    {mailAdd: data.token}, {$set: updateData}
  );
  res.json({result: 'ok'});
});

// ユーザー登録
router.post('/createUser', async (req, res) => {
  const data = req.body.data;
  const email = Crypto.getDecryptedString(data.token);

  // 必須項目について
  Validator(data, {
    userUniqueID: {
      type: 'string',
      pattern: /^(?=.*?[a-zA-Z])(?=.*?\d)[a-zA-Z\d]{8,20}$/,
    },
    nickname: {
      type: 'string',
      length: 30
    },
    token: {
      type: 'string'
    },
    password: {
      type: 'string',
      pattern: /^(?=.*?[a-z])(?=.*?\d)[ -~]{8,20}$/i,
    },
    createUserCode: {
      type: 'string'
    }
  }, req);

  // デモ用コード一致確認
  if (data.createUserCode != 'ItForSports1234') {
    res.json({
      result: 'ng',
      registeredFlg: false,
      message: 'デモ用共通コードが一致しません。'
    });
    return;
  }

  // メールアドレスの存在チェック
  const emailChkResult = await dbCommonFunction(
    req,
    'users.countDocuments',
    db.users.countDocuments.bind(db.users),
    undefined,
    undefined,
    { mailAdd: data.token },
    { limit: 1 }
  );

  // 登録済ならエラー
  if (emailChkResult > 0) {
    res.json({
      result: 'ng',
      registeredFlg: true,
      message: `メールアドレス「${email}」は既に登録済です。\nログイン画面へ進んでください。`
    });
    return;
  }

  // ユーザーIDの存在チェック
  const chkResult = await dbCommonFunction(
    req,
    'users.countDocuments',
    db.users.countDocuments.bind(db.users),
    undefined,
    undefined,
    { userUniqueID: data.userUniqueID },
    { limit: 1 }
  );

  // 登録済ならエラー
  if (chkResult > 0) {
    res.json({
      result: 'ng',
      registeredFlg: false,
      message: 'このIDは既に使用されています。'
    });
    return;
  }

  const insertData: User = {
    userUniqueID: data.userUniqueID,
    mailAdd: data.token,
    nickname: data.nickname,
    password: Crypto.getEncryptedString(data.password),
    isSearchable: true,
    docIsValid: true,
    docCreUserID: 'system',
    docCreTimeStamp: moment().toJSON(),
    docModUserID: 'system',
    docModTimeStamp: moment().toJSON()
  };

  await dbCommonFunction(
    req,
    'users.insertOne',
    db.users.insertOne.bind(db.users),
    undefined,
    undefined,
    insertData
  );

  const protocol = config.https ? 'https' : 'http';
  const redirectUrl = `${protocol}://${config.clientHost}/login`;

  // AWS SESからメール送信を行う
  await sendMail(email, MailConst.SUB_CREATE_USER_COMP, MailConst.TEXT_CREATE_USER_COMP.replace('※1', redirectUrl));

  // 処理結果の返却
  res.json({result: 'ok'});
});

// ユーザー情報取得
router.post('/getProfile', async (req, res) => {
  const userId = req.body.data.userId;
  const result = await dbCommonFunction(
    req,
    'users.findOne',
    db.users.findOne.bind(db.users),
    undefined,
    undefined,
    {
      _id: new ObjectId(userId)
    }
  );

  if(!result) {
    res.json({
      result: 'ng'
    });
  } else {
    const userInfo: Pick<User, 'nickname' | 'userUniqueID' | 'playerInf' | 'sportsInf' | 'userImage' | 'isSearchable'> = {
      nickname: result.nickname,
      userUniqueID: result.userUniqueID,
      playerInf: result.playerInf,
      sportsInf: result.sportsInf,
      userImage: result.userImage,
      isSearchable: result.isSearchable
    };

    res.json({
      result: 'ok',
      userInfo
    });
  }
});

// ユーザー情報更新
router.post('/updateProfile', async (req, res) => {
  const data = req.body.data as Omit<User, '_id' | 'password' | 'mailAdd' | 'parentId'>;
  const userId = req.body.loginInfo.userId;

  Validator(data, {
    nickname: {
      type: 'string',
      length: 30
    },
    userUniqueID: {
      type: 'string',
      pattern: /^(?=.*?[a-zA-Z])(?=.*?\d)[a-zA-Z\d]{8,20}$/
    },
    isSearchable: {
      type: 'boolean'
    }
  }, req);

  // ユーザーIDの重複チェック
  const chkResult = await dbCommonFunction(
    req,
    'users.countDocuments',
    db.users.countDocuments.bind(db.users),
    undefined,
    undefined,
    {
      userUniqueID: data.userUniqueID,
      _id: {
        $ne: new ObjectId(userId)
      }
    },
    {limit: 1}
  );

  // 登録済ならエラー
  if(chkResult > 0) {
    res.json({
      result: 'ng',
      message: 'このIDは既に使用されています。'
    });
    return;
  }

  if (data.sportsInf) {
    for(let i = 0; i < data.sportsInf.length; i++) {
      const sportInf = data.sportsInf[i];
      Validator(sportInf,{
        sport: {
          type: 'string',
          pattern: /Football/
        }
      }, req);
      switch(sportInf.sport) {
        case 'Football':
          Validator(sportInf, {
            position: {
              type: 'string',
              length: 25
            },
            dominantFoot: {
              type: 'string',
              length: 5
            }
          }, req);
          break;
        default:

      }
    }
  }
  if(data.playerInf) {
    const playerInf = data.playerInf;
    const patKana = /^([ァ-ヴー])+$/; // 全角カナ正規表現

    Validator(playerInf, {
      lastName: {
        type: 'string',
        length: 30
      },
      firstName: {
        type: 'string',
        length: 30
      },
      /** 姓(カナ) */
      lastNameKana: {
        type: 'string',
        pattern: patKana,
        length: 60
      },
      /** 名(カナ) */
      firstNameKana: {
        type: 'string',
        pattern: patKana,
        length: 60
      },
      /** 生年月日 */
      birthDate: {
        type: 'string',
        pattern: /^\d{4}-[0-1]\d-[0-3]\d/,
      },
      /** 国籍 */
      nationallity: {
        type: 'string',
        length: 60
      }
    }, req);

    // 省略可能項目のチェック
    const valiSet = new Object() as ValidateSetting;
    const patNum = /^\d+(\.\d)?$/; // 半角数字正規表現

    // 入力されている項目のtypeとpatternをvaliSetに設定
    /** 出身地 */
    if(playerInf.birthPlace) {
      valiSet['birthPlace'] = {
        type: 'string'
      };
    }
    /** 身長(数値) */
    if(playerInf.heightNum) {
      valiSet['heightNum'] = {
        type: 'string',
        pattern: patNum
      };
    }
    /** 身長(単位) */
    if(playerInf.heightUnit) {
      valiSet['heightUnit'] = {
        type: 'string',
        pattern: /cm/
      };
    }
    /** 体重(数値) */
    if(playerInf.weightNum) {
      valiSet['weightNum'] = {
        type: 'string',
        pattern: patNum
      };
    }
    /** 体重(単位) */
    if(playerInf.weightUnit) {
      valiSet['weightUnit'] = {
        type: 'string',
        pattern: /kg/
      };
    }
    /** 血液型 */
    if(playerInf.bloodType) {
      valiSet['bloodType'] = {
        type: 'string',
        pattern: /A|B|O|AB|不明/
      };
    }

    // valiSetに含まれる項目をチェック
    if(Object.keys(valiSet).length > 0) {
      Validator(playerInf, valiSet, req);
    }
  }
  data.docModUserID = userId;
  data.docModTimeStamp = moment().toJSON();

  await dbCommonFunction(
    req,
    'users.updateOne',
    db.users.updateOne.bind(db.users),
    undefined,
    undefined,
    {_id: new ObjectId(userId)}, { $set: data}
  );

  // 選手情報の存在チェック
  const userInf = await dbCommonFunction(
    req,
    'users.findOne',
    db.users.findOne.bind(db.users),
    undefined,
    undefined,
    {
      _id: new ObjectId(userId)
    },{
      projection: {
        _id: 0,
        playerInf: 1
      }
    }
  );

  // 選手情報の存在判定用変数
  let isPlayer = false;

  // 選手情報が登録されていれば選手情報ありの情報設定
  if(userInf.playerInf) {
    isPlayer = true;
  }

  res.json({
    result: 'ok',
    isPlayer
  });
});

router.post('/userList', async (req, res) => {
  const data = req.body.data;

  Validator(data, {
    userUniqueID: {
      type: 'string',
      pattern: /^(?=.*?[a-zA-Z])(?=.*?\d)[a-zA-Z\d]{8,20}$/
    }
  }, req);

  // 検索時パラメータの設定
  const query = {
    userUniqueID: data.userUniqueID,
    isSearchable: true
  };

  const user = await dbCommonFunction(
    req,
    'users.findOne',
    db.users.findOne.bind(db.users),
    undefined,
    undefined,
    query
  );

  res.json({
    result: 'ok',
    user
  });
});

interface Invite {
  inviteId: ObjectId;
  inviteOriName: string;
  inviteDestName?: string;
  inviteType: string;
}
const getInviteList = async (userId: string, req: express.Request, session?): Promise<Invite[]> => {

  const adminTeam = await dbCommonFunction(
    req,
    'teams.find',
    db.teams.find.bind(db.teams),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    { session },
    {
      'teamAdminInf.adminUserID': userId
    }
  );
  const adminOrgan = await dbCommonFunction(
    req,
    'organizations.find',
    db.organizations.find.bind(db.organizations),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    { session },
    {
      'organAdminInf.adminUserID': userId
    }
  );
  const adminTeamId = adminTeam.map(team => team._id.toHexString());
  const adminOrganId = adminOrgan.map(organ => organ._id.toHexString());
  // idの配列をマージして条件にする
  const invitationInfs = await dbCommonFunction(
    req,
    'invitationInfs.find',
    db.invitationInfs.find.bind(db.invitationInfs),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    { session },
    {authDstUserID: {
      $in:[userId, ...adminTeamId, ...adminOrganId]
      }
    }
  );

  const inviteList = [];
  for(let i = 0; i < invitationInfs.length; i++) {
    let inviteOriName: string;
    let inviteDestName: string;
    switch(invitationInfs[i].authType) {
      case 'player':
      case 'teamStaff': {
        const team = await dbCommonFunction(
          req,
          'teams.findOne',
          db.teams.findOne.bind(db.teams),
          undefined,
          { session },
          {_id: new ObjectId(invitationInfs[i].relationID)}
        );
        inviteOriName = team.teamName;
        break;
      }
      case 'organStaff': {
        const organ = await dbCommonFunction(
          req,
          'organizations.findOne',
          db.organizations.findOne.bind(db.organizations),
          undefined,
          { session },
          {_id: new ObjectId(invitationInfs[i].relationID)}
        );
        inviteOriName = organ.organName;
        break;
      }
      case 'teamCompetition':
      case 'organizerTeamCompetition': {
        const comp = await dbCommonFunction(
          req,
          'competitions.findOne',
          db.competitions.findOne.bind(db.competitions),
          undefined,
          undefined,
          {_id: new ObjectId(invitationInfs[i].relationID)}
        );
        const team = await dbCommonFunction(
          req,
          'teams.findOne',
          db.teams.findOne.bind(db.teams),
          undefined,
          undefined,
          {_id: new ObjectId(invitationInfs[i].authDstUserID)}
        );
        inviteOriName = comp.compName;
        inviteDestName = team.teamName;
        break;
      }
      case 'organizerOrganCompetition': {
        const comp = await dbCommonFunction(
          req,
          'competitions.findOne',
          db.competitions.findOne.bind(db.competitions),
          undefined,
          undefined,
          {_id: new ObjectId(invitationInfs[i].relationID)}
        );
        const organ = await dbCommonFunction(
          req,
          'organizations.findOne',
          db.organizations.findOne.bind(db.organizations),
          undefined,
          undefined,
          {_id: new ObjectId(invitationInfs[i].authDstUserID)}
        );
        inviteOriName = comp.compName;
        inviteDestName = organ.organName;
        break;
      }
      case 'memberCompetition': {
        const comp = await dbCommonFunction(
          req,
          'competitions.findOne',
          db.competitions.findOne.bind(db.competitions),
          undefined,
          undefined,
          {_id: new ObjectId(invitationInfs[i].relationID)}
        );
        inviteOriName = comp.compName;
        break;
      }
      default:
        break;
    }
    const invite: Invite = {
      inviteId: invitationInfs[i]._id,
      inviteOriName,
      inviteDestName,
      inviteType: invitationInfs[i].authType
    };
    inviteList.push(invite);
  }
  return inviteList;
};

router.post('/inviteList', async (req, res) => {
  const loginInfo = req.body.loginInfo;
  const userId = loginInfo.userId;

  const inviteList = await getInviteList(userId, req);

  res.json({
    result: 'ok',
    inviteList
  });
});

router.post('/responseInvite', async (req, res) => {
  const loginInfo = req.body.loginInfo;
  const userId = loginInfo.userId;
  const data = req.body.data;
  Validator(data, {
    inviteId: {
      type: 'string'
    },
    action: {
      type: 'string',
      pattern: /accept|decline/
    }
  }, req);

  // セッション開始
  const session = await startSession();

  try {
    // トランザクション開始
    session.startTransaction(transactionOptions);

    const invite = await dbCommonFunction(
      req,
      'invitationInfs.findOne',
      db.invitationInfs.findOne.bind(db.invitationInfs),
      undefined,
      { session },
      {_id: new ObjectId(data.inviteId)}
    );

    // 承諾処理 結果格納用
    let acceptResult: boolean = true;

    if(data.action == 'accept') {
      switch(invite.authType) {
        case 'teamStaff': {
          const team = await dbCommonFunction(
            req,
            'teams.findOne',
            db.teams.findOne.bind(db.teams),
            undefined,
            { session },
            {_id: new ObjectId(invite.relationID)}
          );
          team.teamAdminInf.push({
            adminUserID: userId,
            adminFlg: '2',
            adminIsValid: true,
            lastUpdDate: moment().toJSON()
          });
          const updateRes = await dbCommonFunction(
            req,
            'teams.updateOne',
            db.teams.updateOne.bind(db.teams),
            undefined,
            { session },
            {_id: team._id}, {$set: {
              teamAdminInf: team.teamAdminInf,
              docModUserID: userId,
              docModTimeStamp: moment().toJSON()
            }}
          );

          acceptResult = updateRes.modifiedCount === 1;

          break;
        }
        case 'player': {
          const today = new Date();
          const noTimeToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const teamHistory: TeamHistory = {
            teamID: invite.relationID,
            userID: userId,
            teamPosition: '',
            teamSportsHisInf: {
                sports: 'Football'
            },
            teamStartDate: noTimeToday.toISOString(),
            docIsValid: true,
            docCreUserID: userId,
            docCreTimeStamp: moment().toJSON(),
            docModUserID: userId,
            docModTimeStamp: moment().toJSON()
          };
          const insertRes = await dbCommonFunction(
            req,
            'teamHistories.insertOne',
            db.teamHistories.insertOne.bind(db.teamHistories),
            undefined,
            { session },
            teamHistory
          );

          acceptResult = insertRes.insertedCount === 1;

          break;
        }
        case 'organStaff': {
          const organ = await dbCommonFunction(
            req,
            'organizations.findOne',
            db.organizations.findOne.bind(db.organizations),
            undefined,
            { session },
            {_id: new ObjectId(invite.relationID)}
          );
          organ.organAdminInf.push({
            adminUserID: userId,
            adminFlg: '2',
            adminIsValid: true,
            lastUpdDate: moment().toJSON()
          });
          const updateRes = await dbCommonFunction(
            req,
            'organizations.updateOne',
            db.organizations.updateOne.bind(db.organizations),
            undefined,
            { session },
            {_id: organ._id}, {$set: {
              organAdminInf: organ.organAdminInf,
              docModUserID: userId,
              docModTimeStamp: moment().toJSON()
            }}
          );

          acceptResult = updateRes.modifiedCount === 1;

          break;
        }
        case 'teamCompetition': {
          // 大会の情報取得
          const comp = await dbCommonFunction(
            req,
            'competitions.findOne',
            db.competitions.findOne.bind(db.competitions),
            undefined,
            undefined,
            {_id: new ObjectId(invite.relationID)}
          );

          // 大会コレクションの参加チームIDに招待を承認したチームのチームIDを追加する
          comp.teamID.push(invite.authDstUserID);
          await dbCommonFunction(
            req,
            'competitions.updateOne',
            db.competitions.updateOne.bind(db.competitions),
            undefined,
            undefined,
            {_id: comp._id}, {$set: {
              teamID: comp.teamID,
              docModUserID: userId,
              docModTimeStamp: moment().toJSON()
            }}
          );

          // 参加チーム履歴コレクションにデータ登録
          // 登録データ格納用変数
          const partTeamHistory = [];

          // 参加チーム履歴コレクションから招待を承認したチームのチームIDと大会主催団体の主催団体情報を持つデータを取得
          const historyData = await dbCommonFunction(
            req,
            'partTeamHistories.find',
            db.partTeamHistories.find.bind(db.partTeamHistories),
            async (cursor: Cursor) => {
              return await cursor.toArray();
            },
            undefined,
            {
              organizerInf: {$in: comp.organizerInf},
              teamID: invite.authDstUserID
            },{
              projection: {
                _id: 0,
                organizerInf: 1,
              }
            }
          );

          // 大会主催団体のうち、招待を承認したチームを今まで招待したことがある団体が含まれる場合
          if(historyData.length > 0) {
            comp.organizerInf.forEach(orgInf => {
              // 参加チーム履歴コレクションに登録されているデータに大会主催団体のデータが含まれているか判定する
              if(!historyData.some(hisData => hisData.organizerInf.organizerFlg == orgInf.organizerFlg
                                            && hisData.organizerInf.organizerID == orgInf.organizerID)) {
                // データが含まれていなければ参加チーム履歴コレクションに登録するデータを定数partTeamHistoryにセットする
                const partTeamHis: PartTeamHistory = {
                  organizerInf: orgInf,
                  teamID: invite.authDstUserID,
                  docIsValid: true,
                  docCreUserID: userId,
                  docCreTimeStamp: moment().toJSON(),
                  docModUserID: userId,
                  docModTimeStamp: moment().toJSON()
                };
                partTeamHistory.push(partTeamHis);
              }
            });
          // 大会主催団体のうち、全ての団体が招待を承認したチームを今まで招待したことが無い場合
          } else {
            // 大会主催団体の件数分参加チーム履歴コレクションに登録するデータを定数partTeamHistoryにセットする
            comp.organizerInf.forEach(orgInf => {
              const partTeamHis: PartTeamHistory = {
                organizerInf: orgInf,
                teamID: invite.authDstUserID,
                docIsValid: true,
                docCreUserID: userId,
                docCreTimeStamp: moment().toJSON(),
                docModUserID: userId,
                docModTimeStamp: moment().toJSON()
              };
              partTeamHistory.push(partTeamHis);
            });
          }
          // 登録するデータが存在する場合、データ登録処理を行う
          if(partTeamHistory.length > 0) {
            await dbCommonFunction(
              req,
              'partTeamHistories.insertMany',
              db.partTeamHistories.insertMany.bind(db.partTeamHistories),
              undefined,
              undefined,
              partTeamHistory
            );
          }
          break;
        }
        case 'organizerTeamCompetition':
        case 'organizerOrganCompetition': {
          const comp = await dbCommonFunction(
            req,
            'competitions.findOne',
            db.competitions.findOne.bind(db.competitions),
            undefined,
            undefined,
            {_id: new ObjectId(invite.relationID)}
          );
          comp.organizerInf.push({
            organizerFlg: (invite.authType == 'organizerTeamCompetition') ? '2' : '1',
            organizerID: invite.authDstUserID
          });
          await dbCommonFunction(
            req,
            'competitions.updateOne',
            db.competitions.updateOne.bind(db.competitions),
            undefined,
            undefined,
            {_id: comp._id}, {$set: {
              organizerInf: comp.organizerInf,
              docModUserID: userId,
              docModTimeStamp: moment().toJSON()
            }}
          );
          break;
        }
        case 'memberCompetition': {
          const comp = await dbCommonFunction(
            req,
            'competitions.findOne',
            db.competitions.findOne.bind(db.competitions),
            undefined,
            undefined,
            {_id: new ObjectId(invite.relationID)}
          );
          comp.compAdminInf.push({
            adminUserID: userId,
            adminFlg: '2',
            adminIsValid: true,
            lastUpdDate: moment().toJSON()
          });
          await dbCommonFunction(
            req,
            'competitions.updateOne',
            db.competitions.updateOne.bind(db.competitions),
            undefined,
            undefined,
            {_id: comp._id}, {$set: {
              compAdminInf: comp.compAdminInf,
              docModUserID: userId,
              docModTimeStamp: moment().toJSON()
            }}
          );
          break;
        }
        default: {
          break;
        }
      }
    }

    const deleteRes = await dbCommonFunction(
      req,
      'invitationInfs.deleteOne',
      db.invitationInfs.deleteOne.bind(db.invitationInfs),
      undefined,
      { session },
      {_id: invite._id}
    );

    const inviteList = await getInviteList(userId, req, session) ;

    // 返却値の設定
    // トランザクション処理の破棄/確定
    if (acceptResult !== true || deleteRes.deletedCount !== 1) {
      // ロールバック
      await session.abortTransaction();

      res.json({
        result: 'ng'
      });

    } else {
      // コミット
      await session.commitTransaction();

      res.json({
        result: 'ok',
        inviteList
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

// 選手一覧
router.post('/playerList', async (req, res) => {
  const data = req.body.data;

  // 入力値のチェック
  Validator(data, {
    sports: {
      type: 'string'
    }
  }, req);

  // チーム名と選手名がどちらも入力されていない場合エラー
  if(!data.playerName && !data.teamName) {
    throw new Error('required items are empty!');
  }

  // 検索用クエリ作成
  const query: FilterQuery<User> = {};

  // 競技はあてはまるものを持っている選手
  query['sportsInf.sport'] = data.sports;

  // 選手名のあいまい検索
  if(data.playerName) {

    // 検索条件格納用変数
    const nameQueryList = [];
    // 入力された選手名をスペースで区切り、単語の配列にする
    const searchWords = data.playerName.split(/\s+/);

    // 単語の数分ループ
    for(let i = 0; i < searchWords.length; i++) {
      // 選手名の検索条件を作成
      nameQueryList.push({'fullName': new RegExp(searchWords[i])});
    }

    // 作成した選手名の検索条件をクエリに設定
    query.$and = nameQueryList;
  }

  // チーム名条件設定
  if(data.teamName) {
    // チーム名であいまい検索
    const teamQuery = {
      teamName: new RegExp(data.teamName)
    };
    const teamList = await dbCommonFunction(
      req,
      'teams.find',
      db.teams.find.bind(db.teams),
      async (cursor: Cursor) => {
        return await cursor.toArray();
      },
      undefined,
      teamQuery
    );

    // チーム名のあいまい検索にかかった中の現役選手一覧を取得
    // 検索条件設定
    const teamHistQuery: FilterQuery<TeamHistory> = {
      teamID: {
        $in: teamList.map(team => team._id.toHexString())
      },
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

    // 現役選手所属情報取得
    const teamHistories = await dbCommonFunction(
      req,
      'teamHistories.find',
      db.teamHistories.find.bind(db.teamHistories),
      async (cursor: Cursor) => {
        return await cursor.toArray();
      },
      undefined,
      teamHistQuery
    );

    // チームに所属する現役選手のID一覧をクエリに設定
    query['_id'] = {$in: teamHistories.map(t => new ObjectId(t.userID))};
  }

  // 選手情報をDBから取得
  const users = await dbCommonFunction(
    req,
    'users.aggregate',
    db.users.aggregate.bind(db.users),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    [
      {
        $project: {
          _id: 1,
          playerInf: 1,
          sportsInf: 1,
          userImage: 1,
          fullName: {$concat: ['$playerInf.lastName', '$playerInf.firstName']}, // 選手名検索のために姓名を結合した項目を作成
        }
      }, {
        $match: query
      }
    ]
  );

  const playerList: PlayerInfo[] = users.filter(user => user.playerInf).map(user => {
    const playerInf = user.playerInf;
    return ({
      userId: user._id,
      playerName: `${playerInf.lastName} ${playerInf.firstName}`,
      userImage: user.userImage,
      heightNum: playerInf.heightNum,
      heightUnit: playerInf.heightUnit,
      weightNum: playerInf.weightNum,
      weightUnit: playerInf.weightUnit
    });
  });

  res.json({
    result: 'ok',
    playerList
  });

});

/**
 * チーム履歴取得処理
 */
router.post('/teamHistoryList', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data;

  // チェック
  Validator(data, {
    userId: {
      type: 'string'
    }
  }, req);

  // チーム履歴情報の取得
  const teamHisList = await dbCommonFunction(
    req,
    'teamHistories.find',
    db.teamHistories.find.bind(db.teamHistories),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    {userID: data.userId}
  );

  // チームIDをstringからObjectIDへ変換し配列に
  const teamIdList = teamHisList.map(teamHis => {
    return new ObjectId(teamHis.teamID);
  });

  // チーム情報の取得
  const teamList = await dbCommonFunction(
    req,
    'teams.find',
    db.teams.find.bind(db.teams),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    {_id: {$in: teamIdList}},
    {projection: {_id: 1, teamName: 1}}
  );

  // 画面項目の設定
  // チーム名はIDからチーム名に変換し設定
  const teamHisInfoList: TeamHistoryInfo[] = [];

  teamHisList.forEach(teamHistory => {

    const teamHisInfo: TeamHistoryInfo = {
      teamID: teamHistory.teamID,
      sports: sports.find((sports) => {
        return sports.key === teamHistory.teamSportsHisInf.sports;
      }).value,
      teamName: teamList.find((team) => {
        return team._id.toHexString() === teamHistory.teamID;
      }).teamName,
      teamStartDate: teamHistory.teamStartDate,
      teamEndDate: teamHistory.teamEndDate
    };

    teamHisInfoList.push(teamHisInfo);
  });

  // 返却値の設定
  res.json({
    result: 'ok',
    teamHistoryList: teamHisInfoList,
  });

});

/**
 * 管理チーム・団体取得処理
 */
router.post('/manageTmOrgList', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data;

  // チェック
  Validator(data, {
    userId: {
      type: 'string'
    }
  }, req);

  // 管理チーム情報の取得
  const teamList = await dbCommonFunction(
    req,
    'teams.aggregate',
    db.teams.aggregate.bind(db.teams),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    [
      {$match: {'teamAdminInf.adminUserID': data.userId}},
      {$project:
        {
          _id: 0,
          teamID: '$_id',
          teamName: 1,
          'teamAddInf.teamPrefecture': 1,
          teamLogo: 1
        }
      }
    ]
  );

  // 管理団体の検索
  const organList = await dbCommonFunction(
    req,
    'organizations.aggregate',
    db.organizations.aggregate.bind(db.organizations),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    [
      {$match: {'organAdminInf.adminUserID': data.userId}},
      {$project:
        {
          _id: 0,
          organID: '$_id',
          organName: 1,
          organAddInf: 1,
          organLogo: 1
        }
      }
    ]
  );

  // 返却値の設定
  res.json({
    result: 'ok',
    teamList: teamList,
    organList: organList
  });

});

/**
 * 管理大会取得処理
 */
router.post('/manageCompList', async (req, res) => {

  // チェック
  Validator(req.body.loginInfo, {
    userId: {
      type: 'string'
    }
  }, req);

  // ログイン情報取得
  const userID = req.body.loginInfo.userId;

  // 返却データの定義
  const resData = {
    result: 'ng',
    compList: [],
    teamList: [],
    organList: []
  };

  // 管理大会情報取得
  const compList = await dbCommonFunction(
    req,
    'competitions.aggregate',
    db.competitions.aggregate.bind(db.competitions),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    [
      {$match: {'compAdminInf.adminUserID': userID}},
      {$project:
        {
          _id: 0,
          compID: '$_id',
          compName: 1,
          heldDate: 1,
          compLogo: 1,
          organizerInf: 1
        }
      }
    ]
  );

  // 返却データとして設定
  resData.compList = compList;

  // 団体ID・チームID格納用変数宣言
  const organIdList: string[] = [];
  const teamIdList: string[] = [];

  // 検索した大会から団体IDとチームIDを抽出する
  compList.forEach(comp => {
    for (const organizerInf of comp.organizerInf) {
      // 主催団体区分が1であれば、団体IDリストに格納
      if(organizerInf.organizerFlg == '1') {
        // 重複する値を格納したくないので、配列に値が存在するか判定
        if(!organIdList.includes(organizerInf.organizerID)) {
          organIdList.push(organizerInf.organizerID);
        }

      // 主催団体区分が2であれば、チームIDリストに格納
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
    resData.organList = await dbCommonFunction(
      req,
      'organizations.aggregate',
      db.organizations.aggregate.bind(db.organizations),
      async (cursor: Cursor) => {
        return await cursor.toArray();
      },
      undefined,
      [
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
      ]
    );
  }

  // チーム情報の取得
  if(teamIdList.length >= 1) {
    resData.teamList = await dbCommonFunction(
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
            _id: {$in: teamIdList.map(teamID => new ObjectId(teamID))}
          }
        },
        {$project: {
          _id: 0,
          teamID: '$_id',
          teamName: 1
        }}
      ]
    );
  }

  // 処理結果の設定
  resData.result = 'ok';

  // 返却値の設定
  res.json(resData);

});

/**
 * 個人成績取得処理
 */
router.post('/playerResult', async (req, res) => {

  // 画面入力値の受け取り
  const data = req.body.data;

  // チェック
  Validator(data, {
    userId: {
      type: 'string'
    }
  }, req);

  // ユーザー情報の取得
  const user = await dbCommonFunction(
    req,
    'users.findOne',
    db.users.findOne.bind(db.users),
    undefined,
    undefined,
    {_id: new ObjectId(data.userId)},
    {projection: {
      _id: 0,
      nickname: 1,
      playerInf: 1
    }}
  );

  // 個人履歴の取得
  const playerResults = await dbCommonFunction(
    req,
    'playerHistories.find',
    db.playerHistories.find.bind(db.playerHistories),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    {userID: data.userId},
    {projection: {
      _id: 0,
      userID: 1,
      competitionID: 1,
      gameID: 1,
      records: 1
    }}
  );

  // 大会情報の取得
  const compInfo = await dbCommonFunction(
    req,
    'competitions.aggregate',
    db.competitions.aggregate.bind(db.competitions),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    [
      {
        $match: {
        _id: {$in: playerResults.map(p => new ObjectId(p.competitionID))}
        }
      },
      {
        $project: {
          _id: 0,
          compId: '$_id',
          compName: 1,
          sports: 1
        }
      }
    ]
  );

  // 試合情報の取得
  const gameInfo = await dbCommonFunction(
    req,
    'games.aggregate',
    db.games.aggregate.bind(db.games),
    async (cursor: Cursor) => {
      return await cursor.toArray();
    },
    undefined,
    [
      {
        $match: {
        _id: {$in: playerResults.map(p => new ObjectId(p.gameID))}
        }
      },
      {
        $project: {
          _id: 0,
          gameID: '$_id',
          gameInfCom: 1
        }
      }
    ]
  );

  // 返却値の設定
  res.json({
    result: 'ok',
    compInfo: compInfo,
    gameInfo: gameInfo,
    playerResults: playerResults,
    user: user
  });

});

// 所属開始日更新
router.post('/updateTeamStartDate', async (req, res) => {
  const data = req.body.data;
  data.userID = req.body.loginInfo.userId;

  Validator(data, {
    joinDay: {
      type: 'string',
      pattern: /^\d{4}-[0-1]\d-[0-3]\d/
    },
    teamID: {
      type: 'string'
    },
    userID: {
      type: 'string'
    }
  }, req);

  const result = await dbCommonFunction(
    req,
    'teamHistories.updateOne',
    db.teamHistories.updateOne.bind(db.teamHistories),
    undefined,
    undefined,
    {
      teamID: data.teamID,
      userID: data.userID,
      $or: [
        {
          teamEndDate: { $exists: false }
        }, {
          teamEndDate: { $gte: data.joinDay }
        }, {
          teamEndDate: ''
        }
      ]
    }, {
      $set: { teamStartDate: data.joinDay }
    }
  );
  // 更新成功の場合（空振りは除外）
  if (result.result.ok === 1 && result.modifiedCount === 1) {
    res.json({
      result: 'ok'
    });
  // 更新失敗の場合（空振りを含む）
  } else {
    throw new Error('i tried to update in the future day from the end date !');
  }
});

export default router;
