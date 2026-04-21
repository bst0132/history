import { browser, by, element, logging } from 'protractor';
import { CNS } from '../../../../client/app/common/defines';
import { TeamDetailPo } from '../../po/team/team-detail.po';
import { Constants } from '../../common/commonConstants';
import { MSG } from '../../../../client/app/common/message-defines';

describe('team detail test', () => {
  beforeEach(() => {
    // 非同期処理のタイムアウト時間を1分まで延ばす
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
  });
  const po = new TeamDetailPo();

  // チーム検索用の設定値
  const searchVal = {
    sports: 'サッカー',
    teamPrefecture: '北海道',
    teamName: 'dummy_testTeam0001'
  };

  // 遷移のテスト
  it('navigate test', async () => {

    // チーム検索画面に遷移
    po.selectMenus('teamList');
    po.inputForm(searchVal);

    // 検索したいチームのデータを検証用に変数に格納しておく
    const searchElem = element(by.xpath(po.getXpathLocater('dummy_testTeam0001pc','-team')));
    const teamName = await searchElem.element(by.xpath(po.getXpathLocater('teamNameRslt'))).getText();
    const teamAdd = await searchElem.element(by.xpath(po.getXpathLocater('addressRslt'))).getText();

    // チーム参照画面に遷移したか検証
    po.navToTeamDetail('dummy_testTeam0001');
    await expect(await browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToTeamDetail}`);

    // 検索時にリストに表示されていた情報と参照画面に表示されている情報が一致しているか検証
    expect(teamName).toBe(await po.getXpathMsg('teamName'));
    expect(teamAdd).toBe(await po.getXpathMsg('address'));

    // 編集ボタンを押下した際にチーム編集画面に遷移しているかの検証
    po.navToEditTeam();
    await expect(await browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToEditTeam}`);

    // チーム参照→チーム編集に遷移した際に編集画面から参照画面に戻れるか検証
    po.pageBack();
    await expect(await browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToTeamDetail}`);

    // チーム検索→チーム参照に遷移した際に参照画面から検索画面に戻れるか検証
    po.selectMenus('teamList');
    po.inputForm(searchVal);
    po.navToTeamDetail('dummy_testTeam0001');
    po.pageBack();
    await expect(await browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToTeamList}`);
  });

  // 所属選手が0人の場合の所属選手表示欄の画面表示検証
  it('player number test (zero)', async () => {
    // チーム参照画面に遷移
    po.selectMenus('teamList');
    po.inputForm(searchVal);
    po.navToTeamDetail('dummy_testTeam0001');
    await expect(await po.getXpathMsg('playerNum')).toBe('所属選手 (0人)');
  });

  // 所属選手が1人の場合の所属選手表示欄の画面表示検証
  it('player number test (one)', async () => {

    // 検索フォームの入力値を再設定
    searchVal.teamPrefecture = '岩手県';
    searchVal.teamName = 'dummy_testTeam0002';
    // チーム参照画面に遷移
    po.selectMenus('teamList');
    po.inputForm(searchVal);
    po.navToTeamDetail('dummy_testTeam0002');
    await expect(await po.getXpathMsg('playerNum')).toBe('所属選手 (1人)');
  });

  // 所属選手が2人の場合の所属選手表示欄の画面表示検証
  it('player number test (two)', async () => {

    // 検索フォームの入力値を再設定
    searchVal.teamPrefecture = '宮城県';
    searchVal.teamName = 'dummy_testTeam0003';
    // チーム参照画面に遷移
    po.selectMenus('teamList');
    po.inputForm(searchVal);
    po.navToTeamDetail('dummy_testTeam0003');
    await expect(await po.getXpathMsg('playerNum')).toBe('所属選手 (2人)');
  });

  // 過去の所属選手の項目内の検証
  it('past player button activity test', async () => {

    // チーム検索用の設定値
    searchVal.teamPrefecture = '北海道';
    searchVal.teamName = 'dummy_testTeam0001';

    // チーム参照画面に遷移
    po.selectMenus('teamList');
    po.inputForm(searchVal);
    po.navToTeamDetail('dummy_testTeam0001');

    // ボタンの活性チェック
    // 変数にテストケース判定用の値を設定
    const testCase = [
      'btnTest1', // 日付を入力
      'btnTest2', // 日付を未入力
      'btnTset3', // 日付入力フォーマットチェック
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

  // 過去の所属選手日付入力フォームのエラーメッセージ検証
  it('past player errMsg test', async () => {

    // エラーメッセージチェック
    po.searchPastPlayer(Constants.ERR_DATE,'err');
    await expect(await po.getXpathMsg('teamEndDateErrMsg')).toBe(MSG.noenteredErr.replace('※1','所属年月日'));
  });

  // 過去の所属選手が0人の場合の過去の所属選手表示欄の画面表示検証
  it('past player search result test (zero)', async () => {

    // チーム参照画面に遷移
    po.selectMenus('teamList');
    po.inputForm(searchVal);
    po.navToTeamDetail('dummy_testTeam0001');
    // 過去の所属選手検索
    po.searchPastPlayer('2021/05/01','search');
    await expect(await po.getXpathMsg('pastPlayerNum')).toBe('検索結果：0件');
  });

  // 過去の所属選手が1人の場合の過去の所属選手表示欄の画面表示検証
  it('past player search result test (one)', async () => {

    // 検索フォームの入力値を再設定
    searchVal.teamPrefecture = '岩手県';
    searchVal.teamName = 'dummy_testTeam0002';
    // チーム参照画面に遷移
    po.selectMenus('teamList');
    po.inputForm(searchVal);
    po.navToTeamDetail('dummy_testTeam0002');
    // 過去の所属選手検索
    po.searchPastPlayer('2021/04/30','search');
    await expect(await po.getXpathMsg('pastPlayerNum')).toBe('検索結果：1件');
  });

  // 過去の所属選手が2人の場合の過去の所属選手表示欄の画面表示検証
  it('past player search result test (two)', async () => {

    // 検索フォームの入力値を再設定
    searchVal.teamPrefecture = '宮城県';
    searchVal.teamName = 'dummy_testTeam0003';
    // チーム参照画面に遷移
    po.selectMenus('teamList');
    po.inputForm(searchVal);
    po.navToTeamDetail('dummy_testTeam0003');
    // 過去の所属選手検索
    po.searchPastPlayer('2021/04/30','search');
    await expect(await po.getXpathMsg('pastPlayerNum')).toBe('検索結果：2件');
  });

  // 大会参加履歴の項目内の検証
  it('comp history test', async () => {

    // 検索フォームの入力値を再設定
    searchVal.teamPrefecture = '北海道';
    searchVal.teamName = 'dummy_testTeam0001';
    // 大会参加履歴が存在する場合、適切な表示がされているか検証
    po.selectMenus('teamList');
    po.inputForm(searchVal);
    po.navToTeamDetail('dummy_testTeam0001');
    await expect(await po.getXpathMsg('compName')).toBe('dummy_testComp0001');
    await expect(await po.getXpathMsg('heldDate')).toBe('2021/05/01');
    await expect(await po.getXpathMsg('compOrganName')).toBe('dummy_testTeam0001');

    // 大会参加履歴が存在しない場合、適切な表示がされているか検証
    // 検索フォームの入力値を再設定
    searchVal.teamPrefecture = '岩手県';
    searchVal.teamName = 'dummy_testTeam0002';
    po.selectMenus('teamList');
    po.inputForm(searchVal);
    po.navToTeamDetail('dummy_testTeam0002');
    expect(await (await po.getElement('compName')).isPresent()).toBeFalsy();
    expect(await (await po.getElement('heldDate')).isPresent()).toBeFalsy();
    expect(await (await po.getElement('compOrganName')).isPresent()).toBeFalsy();
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
