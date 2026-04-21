import { browser, logging } from 'protractor';
import { CNS } from '../../../../client/app/common/defines';
import { TeamListPo } from '../../po/team/team-list.po';
import { MSG } from '../../../../client/app/common/message-defines';

describe('team list test', () => {
  const po = new TeamListPo();

  // チーム検索用の設定値
  const searchVal = {
    sports: 'サッカー',
    teamPrefecture: '北海道',
    teamName: 'dummy_testTeam0001'
  };

  // 遷移のテスト
  it('navigate test', async () => {

    // チーム検索画面に遷移できるか検証
    po.selectMenus('teamList');
    await expect(await browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToTeamList}`);

    // 検索する値をフォームに入力する
    po.inputForm(searchVal);
    po.searchTeam('dummy_testTeam0001', 'navigate');

    // 検索処理後にチーム参照に遷移しているか検証
    await expect(await browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToTeamDetail}`);
  });

  // エラーメッセージのテスト
  it('errMsg test', async () => {
    // チーム検索画面の都道府県のフォームを活性状態にしてエラーメッセージが正しく表示されるか検証
    po.selectMenus('teamList');
    po.appearErrMsg();
    await expect(await po.getXpathMsg('teamPrefectureErrMsg')).toBe(MSG.unselectErr.replace('※1','都道府県'));
  });

  // ボタン活性のテスト
  it('button activity test', async () => {
    // 変数にテストケース判定用の値を設定
    const testCase = [
      'btnTest1', // 必須項目を全て入力
      'btnTest2', // 都道府県のみ未選択
    ];

    // 必須項目の入力有無によるボタン活性の検証テスト
    for(let i = 0; i < testCase.length; i++) {
      if(testCase[i] === 'btnTest1') {
        expect(await (await po.btnEnableCk(testCase[i])).isEnabled()).toBeTruthy();
      } else {
        expect(await (await po.btnEnableCk(testCase[i])).isEnabled()).toBeFalsy();
      }
      // 画面再読み込みを行う
      await browser.refresh();
    }
  });

  // 検索結果によって正しい値が出ているか検証(検索ヒット数0チームの場合)
  it('search test (result zero)', async () => {
    searchVal.teamPrefecture = '青森県';
    searchVal.teamName = '';
    po.inputForm(searchVal);
    po.searchTeam();
    await expect(await po.getXpathMsg('searchResultZero')).toBe('検索結果');
  });

  // 検索結果によって正しい値が出ているか検証(検索ヒット数1チームの場合)
  it('search test (result one)', async () => {
    searchVal.teamPrefecture = '岩手県';
    po.inputForm(searchVal);
    po.searchTeam();
    await expect(await po.getXpathMsg('searchResult')).toBe('検索結果：1件');
  });

  // 検索結果によって正しい値が出ているか検証(検索ヒット数100チームの場合)
  it('search test (result one hundred)', async () => {
    searchVal.teamPrefecture = '宮城県';
    po.inputForm(searchVal);
    po.searchTeam();
    expect(await po.getXpathMsg('searchResult')).toBe('検索結果：100件');
  });

  // 検索結果によって正しい値が出ているか検証(検索ヒット数101チームの場合)
  it('search test (result over one hundred)', async () => {
    searchVal.teamPrefecture = '秋田県';
    po.inputForm(searchVal);
    po.searchTeam();
    await expect(await po.getXpathMsg('searchResultOver')).toBe('検索結果：101件 ※100件以上は表示されません');
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    } as logging.Entry));
  });
});
