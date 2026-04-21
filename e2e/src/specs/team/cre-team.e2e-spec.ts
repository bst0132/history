import { browser, logging } from 'protractor';
import { CNS } from '../../../../client/app/common/defines';
import { CreTeamPo } from '../../po/team/cre-team.po';
import { MSG } from '../../../../client/app/common/message-defines';

describe('create team test', () => {
  beforeEach(() => {
    // 非同期処理のタイムアウト時間を1分まで延ばす
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
  });
  const po = new CreTeamPo();

  // 遷移のテスト
  it('navigate test', async () => {
    // メニューボタンからチーム登録画面に遷移するか検証
    po.selectMenus('createTeam');
    await expect(await browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToCreateTeam}`);
  });

  // エラーメッセージのテスト
  it('errMsg test', async () => {
    // フォームを活性状態にする
    po.selectMenus('createTeam');
    po.appearErrMsg();

    // エラーメッセージの検証
    await expect(await po.getXpathMsg('sportsErrMsg')).toBe(MSG.unselectErr.replace('※1','競技'));
    await expect(await po.getXpathMsg('teamNameErrMsg')).toBe(MSG.noenteredErr.replace('※1','チーム名'));
    await expect(await po.getXpathMsg('teamEstDateErrMsg')).toBe(MSG.noenteredErr.replace('※1','設立日'));
    await expect(await po.getXpathMsg('teamPrefectureErrMsg')).toBe(MSG.unselectErr.replace('※1','都道府県'));
    await expect(await po.getXpathMsg('teamCityErrMsg')).toBe(MSG.noenteredErr.replace('※1','市区町村'));
  });

  // ボタン活性のテスト
  it('button activity test', async () => {
    // 変数にテストケース判定用の値を設定
    const testCase = [
      'btnTest1', // 必須項目を全て入力
      'btnTest2', // 競技のみ未選択
      'btnTest3', // チーム名のみ未入力
      'btnTest4', // 設立日のみ未入力
      'btnTest5', // 都道府県のみ未選択
      'btnTest6', // 市区町村のみ未入力
      'btnTest7', // 設立日に不正な値を入力
    ];

    // 必須項目の入力有無によるボタン活性の検証テスト
    for(let i = 0; i < testCase.length; i++) {
      if(testCase[i] === 'btnTest1') {
        expect(await (await po.btnEnableCk(testCase[i])).isEnabled()).toBeTruthy();
      } else {
        expect(await (await po.btnEnableCk(testCase[i])).isEnabled()).toBeFalsy();
      }
      await browser.refresh();
    }
  });

  // 登録のテスト
  it('reg test', async () => {

    // フォーム入力値の設定
    const inputVal = {
      sports: 'サッカー',
      teamEstDate: '2021/05/11',
      prefecture: '北海道',
      teamCity: '札幌市',
      teamTel: '123-4567-8901',
      teamIntro: 'チームの紹介文です。'
    };

    // 登録する値をフォームに入力する
    await browser.refresh();
    po.inputForm(inputVal);

    // チーム登録画面に入力されている値を取得
    const regVal = {
      sports: await po.getXpathMsg('sports'),
      teamName: await po.getInputMsg('teamName'),
      teamEstDate: await po.getInputMsg('teamEstDate'),
      teamPrefecture:await po.getXpathMsg('teamPrefecture'),
      teamCity: await po.getInputMsg('teamCity'),
      teamTel: await po.getInputMsg('teamTel'),
      teamIntro: await po.getInputMsg('teamIntro')
    };

    // 登録ボタンを押下する
    po.createTeam();

    // 登録処理後にチーム編集に遷移しているか検証
    await expect(await browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToEditTeam}`);

    // チーム登録画面で入力した値と遷移後のチーム編集画面のフォームの値が等しいか検証
    await expect(await po.getInputMsg('sports')).toBe(regVal.sports);
    await expect(await po.getInputMsg('teamName')).toBe(regVal.teamName);
    await expect(await po.getInputMsg('teamEstDate')).toBe(regVal.teamEstDate);
    await expect(await po.getXpathMsg('teamPrefecture')).toBe(regVal.teamPrefecture);
    await expect(await po.getInputMsg('teamCity')).toBe(regVal.teamCity);
    await expect(await po.getInputMsg('teamTel')).toBe(regVal.teamTel);
    await expect(await po.getInputMsg('teamIntro')).toBe(regVal.teamIntro);
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
