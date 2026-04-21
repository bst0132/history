import { browser, by, element, logging } from 'protractor';
import { CNS } from '../../../../client/app/common/defines';
import { EditTeamPo } from '../../po/team/edit-team.po';
import { Constants } from '../../common/commonConstants';
import { MSG } from '../../../../client/app/common/message-defines';
import { db } from '../../../../server/common/db-client';
import * as moment from 'moment';

describe('edit team test', async () => {
  beforeEach(() => {
    // 非同期処理のタイムアウト時間を1分まで延ばす
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
  });
  const po = new EditTeamPo();

  // チーム検索用の入力値を設定
  const searchVal = {
    sports: 'サッカー',
    teamPrefecture: '北海道',
    teamName: 'dummy_testTeam0001'
  };

  // 遷移のテスト
  it('navigate test', async () => {

    // チーム登録用の登録値を設定
    const regVal = {
      teamName: 'dummy_testTeam0000',
      estDate: '2021/05/01',
      teamPrefecture: '北海道',
      teamcity: '札幌市',
      type: 'createTeam'
    };

    // メニューボタンからチーム編集画面まで遷移
    po.selectMenus('teamList');
    po.navToTeamDetail(searchVal);
    po.navToEditTeam();
    await expect(await browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToEditTeam}`);

    // チーム編集→チーム選手招待画面に遷移可能か検証
    po.navToInvitePlayer();
    await expect(await browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToPlayerList.replace(':searchType','team')}`);

    // 戻るボタンを押してチーム編集画面に戻ったか検証
    po.pageBack();
    await expect(await browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToEditTeam}`);

    // チーム編集→チームスタッフ招待画面に遷移可能か検証
    po.navToInviteStaff();
    await expect(await browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToUserList.replace(':searchType','team')}`);

    // 戻るボタンを押してチーム編集画面に戻ったか検証
    po.pageBack();
    await expect(await browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToEditTeam}`);

    // チーム編集画面→チーム参照画面に遷移可能か検証
    po.pageBack();
    await expect(await browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToTeamDetail}`);

    // チーム登録→チーム編集と遷移した際に戻るボタンを押下すると個人情報画面に戻るか検証
    po.selectMenus('createTeam');
    await browser.refresh();
    po.inputForm(regVal);
    po.createTeam('regBtn');
    po.pageBack();
    await expect(await browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToProfile}`);
  });

  // エラーメッセージのテスト
  it('errMsg test', async () => {

    po.selectMenus('teamList');
    po.navToTeamDetail(searchVal);
    po.navToEditTeam();
    // フォームを削除する
    po.deleteForm();
    // エラーメッセージの検証
    await expect(await po.getXpathMsg('teamNameErrMsg')).toBe(MSG.noenteredErr.replace('※1','チーム名'));
    await expect(await po.getXpathMsg('teamEstDateErrMsg')).toBe(MSG.noenteredErr.replace('※1','設立日'));
    await expect(await po.getXpathMsg('teamCityErrMsg')).toBe(MSG.noenteredErr.replace('※1','市区町村'));
  });

  // ボタン活性のテスト
  it('button activity test', async () => {
    // 変数にテストケース判定用の値を設定
    const testCase = [
      'btnTest1', // 必須項目をすべて入力(操作なし)
      'btnTest2', // 必須項目をすべて入力(任意の項目を操作)
      'btnTest3', // チーム名のみ未入力
      'btnTest4', // 設立日のみ未入力
      'btnTest5', // 市区町村のみ未入力
      'btnTest6', // 設立日に不正な値を入力し、ボタンが非活性状態であるか検証
    ];

    // 編集画面に遷移
    po.selectMenus('teamList');
    element(by.buttonText(Constants.OK)).click();
    po.navToTeamDetail(searchVal);
    po.navToEditTeam();

    // 必須項目の入力有無によるボタン活性の検証テスト
    for(let i = 0; i < testCase.length; i++) {
      if(testCase[i] === 'btnTest1') {
        // フォームの操作が無い状態でボタンの活性状態を検証
        const elem =  element(by.xpath(po.getXpathLocater('updateBtn')));
        await expect(await elem.isEnabled()).toBeFalsy();
      } else if (testCase[i] ==='btnTest2') {
        expect(await (await po.btnEnableCk(testCase[i])).isEnabled()).toBeTruthy();
      } else {
        expect(await (await po.btnEnableCk(testCase[i])).isEnabled()).toBeFalsy();
      }
    }
  });

  // 登録のテスト
  it('reg test', async () => {
    // 編集画面に遷移（遷移テストでdummy_testTeam0000が作成してある前提）
    // ※changed_teamNameはテストを行うごとに削除しておく

    // チーム検索用の入力値を設定
    searchVal.teamName = 'dummy_testTeam0000';

    // 変更後の登録値を設定
    const updateVal = {
      teamName: 'changed_teamName',
      estDate: '2021/06/01',
      teamPrefecture: '沖縄県',
      teamcity: '那覇市',
    };

    po.selectMenus('teamList');
    element(by.buttonText(Constants.OK)).click();
    po.navToTeamDetail(searchVal);
    po.navToEditTeam();

    // 登録する値をフォームに入力する
    po.inputForm(updateVal);

    // 登録値を変数に設定する
    const regVal = {
      teamName: await po.getInputMsg('teamName'),
      teamEstDate: await po.getInputMsg('teamEstDate'),
      teamPrefecture:await po.getXpathMsg('teamPrefecture'),
      teamCity: await po.getInputMsg('teamCity'),
    };

    // 変更ボタンを押下する
    po.createTeam('updateBtn');

    //  登録処理後にチーム参照画面に戻る
    po.pageBack();

    // 登録処理後の値が遷移後のチーム参照画面のフォームの値と等しいか検証
    await expect(await po.getXpathMsg('teamName')).toBe(regVal.teamName);
    await expect(await po.getXpathMsg('teamEstDate')).toBe(regVal.teamEstDate);
    await expect(await po.getXpathMsg('address')).toBe(`${regVal.teamPrefecture}${regVal.teamCity}`);
  });

  // 選手情報の編集フォームエラーメッセージのテスト
  it('edit playerInf errMsg test', async () => {

    // チーム検索用の入力値を設定
    searchVal.teamPrefecture = '岩手県';
    searchVal.teamName = 'dummy_testTeam0002';

    // チーム編集画面の所属選手のタブに移動しエラーメッセージを出現させる
    po.selectMenus('teamList');
    po.navToTeamDetail(searchVal);
    po.navToEditTeam();
    await element(by.cssContainingText('.mat-tab-label', '所属選手')).click();
    await element(by.css('mat-expansion-panel')).click();
    po.appearErrMsg();

    // エラーメッセージの検証
    await expect(await po.getXpathMsg('uniNumErrMsg')).toBe(MSG.noenteredErr.replace('※1','背番号'));
    await expect(await po.getXpathMsg('gamePositionErrMsg')).toBe(MSG.noenteredErr.replace('※1','ポジション'));
    await expect(await po.getXpathMsg('teamStartDateErrMsg')).toBe(MSG.noenteredErr.replace('※1','所属開始年月'));

  });

  // 選手情報の編集フォームボタン活性のテスト
  it('edit playerInf button activity test', async () => {
    // 変数にテストケース判定用の値を設定
    const testCase = [
      'btnTest1', // 必須項目を入力（操作なし）
      'btnTest2', // 必須項目を入力（任意の必須項目を操作）
      'btnTest3', // 背番号のみ未入力
      'btnTest4', // ポジションのみ未入力
      'btnTest5', // 所属開始年月のみ未入力
      'btnTest6', // 所属開始年月に不正な値を入力
      'btnTest7', // 必須項目を入力の上、所属終了年月に不正な値を入力
      'btnTest8', // 必須項目を入力の上、所属終了年月が所属開始日よりも早い日付に設定
    ];

    // チーム編集画面の所属選手タブに移動し、選手のアコーディオンメニューを開く
    po.selectMenus('teamList');
    element(by.buttonText(Constants.OK)).click();
    po.navToTeamDetail(searchVal);
    po.navToEditTeam();
    await element(by.cssContainingText('.mat-tab-label', '所属選手')).click();
    await element(by.css('mat-expansion-panel')).click();

    // 必須項目の入力有無によるボタン活性の検証テスト
    for(let i = 0; i < testCase.length; i++) {
      if(testCase[i] === 'btnTest1') {
        // フォームの操作が無い状態でボタンの活性状態を検証
        const elem =  element(by.xpath(po.getXpathLocater('playerInfupdateBtn')));
        await expect(await elem.isEnabled()).toBeFalsy();
      } else if (testCase[i] ==='btnTest2') {
        expect(await (await po.playerChgBtnEnableCk(testCase[i])).isEnabled()).toBeTruthy();
      } else {
        expect(await (await po.playerChgBtnEnableCk(testCase[i])).isEnabled()).toBeFalsy();
      }
    }
  });

  // 削除ボタンの存在テスト(スタッフが1人の場合)
  it('teamadmin delete button existence test (one staff)', async () => {
    // チーム編集画面の所属スタッフタブに移動
    po.selectMenus('teamList');
    element(by.buttonText(Constants.OK)).click();
    po.navToTeamDetail(searchVal);
    po.navToEditTeam();
    element(by.cssContainingText('.mat-tab-label', '所属スタッフ')).click();

    // 所属スタッフが1人の場合削除ボタンが存在しないことを検証
    expect(await (await po.getElement('deleteStaffBtn')).isPresent()).toBeFalsy();
  });

  // 削除ボタンの存在テスト（スタッフが2人の場合）
  it('team admin delete button existence test (two staff)', async () => {
    // チーム検索用の入力値を設定
    searchVal.teamPrefecture = '北海道';
    searchVal.teamName = 'dummy_testTeam0001';
    // チーム編集画面の所属スタッフタブに移動
    po.selectMenus('teamList');
    po.navToTeamDetail(searchVal);
    po.navToEditTeam();
    element(by.cssContainingText('.mat-tab-label', '所属スタッフ')).click();

    // 所属スタッフが2人の場合削除ボタンが存在するか検証
    const elems = element.all(by.xpath(po.getXpathLocater('deleteStaffBtn')));
    await expect(await elems.count()).toBe(2);
  });

  // 削除ボタン動作確認テスト
  it('delete staff test', async () => {
    // 削除前のリストの数を取得
    const beforeDelLists = await (element.all(by.xpath(po.getXpathLocater('staffName')))).count();
    await po.clickDeleteBtn();
    const afterDelLists = await (element.all(by.xpath(po.getXpathLocater('staffName')))).count();
    await expect(afterDelLists).toBe(beforeDelLists - 1);

    // 削除したデータをもとの状態に戻す
    db.teams.updateOne({
      teamName:'dummy_testTeam0001'
    },{
      $push:{
        teamAdminInf:{
          adminUserID:'60af3b6f57e7e56fde2a6b62',
          adminFlg:'2',
          adminIsValid:true,
          lastUpdDate: moment().toJSON()
      }
    }});
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    // 非同期処理のタイムアウト時間をデフォルトに戻す
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    } as logging.Entry));
  });
});
