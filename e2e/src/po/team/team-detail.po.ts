import { AppPage } from '../../app.po';
import { browser, by, element, ElementFinder, protractor } from 'protractor';
import { Constants } from '../../common/commonConstants';

export class TeamDetailPo extends AppPage {

  /** 画面項目名 */
  private form = {
    sports: 'sports',
    teamName: 'teamName',
    teamPrefecture: 'teamPrefecture',
    teamEndDate: 'teamEndDate',
    searchBtn: 'searchBtn',
    pageBackBtn: 'pageBackBtn',
    navToEditTeamBtn: 'navToEditTeamBtn'
  }

  /**
   * リストの入力
   * @param searchVal 検索フォーム入力値が格納されたオブジェクト
   */
  public async inputForm(searchVal): Promise<void> {
    // 競技セレクトボックスをクリック
    this.btnClickByXpath(this.form.sports);

    // 競技をを選択
    const sportsList = element(by.cssContainingText(Constants.MAT_OPTION, searchVal.sports));
    sportsList.click();

    // 都道府県セレクトボックスをクリック
    this.btnClickByXpath(this.form.teamPrefecture);

    // 要素を選択
    const prefList = element(by.cssContainingText(Constants.MAT_OPTION, searchVal.teamPrefecture));
    prefList.click();

    // チーム名を入力
    this.inputTextByXpath(searchVal.teamName, this.form.teamName);

    // 検索ボタンの押下
    this.btnClickByXpath(this.form.searchBtn);

    await browser.sleep(Constants.SLEEP_TIME);
  }

  /**
   * チーム参照画面に遷移
   * @param teamName
   */
  public async navToTeamDetail(teamName: string): Promise<void> {
    // 該当チームのリストを選択
    const teamList = element.all(by.xpath(this.getXpathLocater(`${teamName}pc`, '-team')));
    teamList.click();

    await browser.sleep(Constants.SLEEP_TIME);
  }

  /**
   * ボタンの活性チェック
   * @param testCase ボタンテストのケース
   */
  public async btnEnableCk(testCase: string): Promise<ElementFinder> {

    if(testCase !== 'btnTest2') {
      if(testCase === 'btnTset3') {
        // 不正な値の設立日を入力
        this.inputTextByXpath(Constants.ERR_DATE, this.form.teamEndDate);
      } else {
        // 設立日を入力
        this.inputTextByXpath('2021/05/11', this.form.teamEndDate);
      }
    }
    // ボタン要素を取得し、返却する
    const elem =  element(by.xpath(this.getXpathLocater(this.form.searchBtn)));
    await browser.sleep(Constants.SLEEP_TIME);
    return elem;
  }

  /**
   * 過去の所属選手の入力
   * @param date
   * @param type
   */
  public async searchPastPlayer(date: string, type: string): Promise<void> {
    this.inputTextByXpath(date, this.form.teamEndDate);
    // エラーメッセージ検証の際はタブキー押下
    if (type === 'err') {
      this.inputTextByXpath(protractor.Key.TAB, this.form.teamEndDate);
    } else {
      element(by.xpath(this.getXpathLocater(this.form.searchBtn))).click();
    }
    await browser.sleep(Constants.SLEEP_TIME);
  }

  /**
   * 要素の取得処理
   * @param id
   */
  public async getElement(id: string): Promise<ElementFinder> {
    const elem =  element(by.xpath(this.getXpathLocater(id)));

    await browser.sleep(Constants.SLEEP_TIME);
    return elem;
  }

  /**
   * チーム編集画面に遷移
   */
  public async navToEditTeam(): Promise<void> {
    this.btnClickByXpath(this.form.navToEditTeamBtn);

    await browser.sleep(Constants.SLEEP_TIME);
  }

  /**
   * 1つ前のページに戻る
   */
  public async pageBack(): Promise<void> {
    this.btnClickByXpath(this.form.pageBackBtn);

    await browser.sleep(Constants.SLEEP_TIME);
  }
}
