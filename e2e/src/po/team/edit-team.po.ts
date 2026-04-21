import { AppPage } from '../../app.po';
import { browser, by, element, ElementFinder, protractor } from 'protractor';
import { Constants } from '../../common/commonConstants';

export class EditTeamPo extends AppPage {

  /** 画面項目名 */
  private form = {
    sports: 'sports',
    teamName: 'teamName',
    teamPrefecture: 'teamPrefecture',
    teamEndDate: 'teamEndDate',
    updateBtn: 'updateBtn',
    searchBtn: 'searchBtn',
    pageBackBtn: 'pageBackBtn',
    playerInfupdateBtn: 'playerInfupdateBtn',
    deleteStaffBtn: 'deleteStaffBtn',
    navInvitePlayerBtn: 'navInvitePlayerBtn',
    navInviteStaffBtn: 'navInviteStaffBtn',
    navToEditTeamBtn: 'navToEditTeamBtn',
    teamEstDate: 'teamEstDate',
    teamCity: 'teamCity',
    uniNum: 'uniNum',
    gamePosition: 'gamePosition',
    teamStartDate: 'teamStartDate',
    optSports: 'optSports'
  }

  /**
  * チーム参照画面に遷移
  * @param searchVal 検索フォーム入力値が格納されたオブジェクト
  */
  public async navToTeamDetail(searchVal): Promise<void> {
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
    browser.sleep(Constants.SLEEP_TIME);
    this.btnClickByXpath(this.form.searchBtn);

    // 該当チームのリストを選択
    const teamList = element.all(by.xpath(this.getXpathLocater(`${searchVal.teamName}pc`, '-team')));
    teamList.click();

    await browser.sleep(Constants.SLEEP_TIME);
  }

  /**
  * フォームの入力
  * @param regVal フォームの入力値が格納されたオブジェクト
  */
  public async inputForm(regVal): Promise<void> {

    if(regVal.type === 'createTeam') {
      // 競技セレクトボックスをクリック
      this.btnClickByXpath(this.form.sports);

      // 競技をを選択
      const sports = element.all(by.xpath(this.getXpathLocater(this.form.optSports)));
      sports.first().click();
    }

    // チーム名を入力
    if (regVal.type !== 'creteTeam') {
      this.inputTextByXpath(Constants.CTRL_A, this.form.teamName);
      this.inputTextByXpath(protractor.Key.BACK_SPACE, this.form.teamName);
    }
    this.inputTextByXpath(regVal.teamName, this.form.teamName);

    // 設立日を入力
    if (regVal.type !== 'creteTeam') {
      this.inputTextByXpath(Constants.CTRL_A, this.form.teamEstDate);
      this.inputTextByXpath(protractor.Key.BACK_SPACE, this.form.teamEstDate);
    }
    this.inputTextByXpath(regVal.estDate, this.form.teamEstDate);

    // 都道府県セレクトボックスをクリック
    this.btnClickByXpath(this.form.teamPrefecture);

    // 要素を選択
    const teamPrefecture = element(by.cssContainingText(Constants.MAT_OPTION, regVal.teamPrefecture));
    teamPrefecture.click();

    // 市町村区を入力
    if (regVal.type !== 'creteTeam') {
      this.inputTextByXpath(Constants.CTRL_A, this.form.teamCity);
      this.inputTextByXpath(protractor.Key.BACK_SPACE, this.form.teamCity);
    }
    this.inputTextByXpath(regVal.teamcity, this.form.teamCity);

    await browser.sleep(Constants.SLEEP_TIME);
  }

  /**
   * 登録を行う
   * @param id
   */
  public createTeam (id: string): void {
    // 登録ボタンを押下
    this.btnClickByXpath(id);
    // 確認、完了ダイアログに対し、OKを押下
    element(by.buttonText(Constants.OK)).click();
    element(by.buttonText(Constants.OK)).click();
  }

  /**
   * フォーム入力値削除処理
   */
  public async deleteForm(): Promise<void> {

    // チーム名のフォームを削除する
    element(by.xpath(this.getXpathLocater(this.form.teamName))).sendKeys(Constants.CTRL_A);
    element(by.xpath(this.getXpathLocater(this.form.teamName))).sendKeys(protractor.Key.BACK_SPACE);

    // 設立日のフォームをクリックし、次のフォームに移動する
    element(by.xpath(this.getXpathLocater(this.form.teamEstDate))).sendKeys(Constants.CTRL_A);
    element(by.xpath(this.getXpathLocater(this.form.teamEstDate))).sendKeys(protractor.Key.BACK_SPACE);

    // 市区町村のフォームをクリックし、次のフォームに移動する
    element(by.xpath(this.getXpathLocater(this.form.teamCity))).sendKeys(Constants.CTRL_A);
    element(by.xpath(this.getXpathLocater(this.form.teamCity))).sendKeys(protractor.Key.BACK_SPACE);
    element(by.xpath(this.getXpathLocater(this.form.teamCity))).sendKeys(protractor.Key.TAB);

    await browser.sleep(Constants.SLEEP_TIME);
  }

  /**
   * チーム情報更新時のボタンの活性チェック
   * @param testCase ボタンテストのケース
   */
  public async btnEnableCk(testCase: string): Promise<ElementFinder> {

    // 必須項目をすべて入力（任意の項目を操作）する場合
    if (testCase === 'btnTest2') {
      this.inputTextByXpath('changed', this.form.teamName);

    // チーム名のみ未入力の場合
    } else if (testCase === 'btnTest3') {
      element(by.xpath(this.getXpathLocater(this.form.teamName))).sendKeys(Constants.CTRL_A);
      element(by.xpath(this.getXpathLocater(this.form.teamName))).sendKeys(protractor.Key.BACK_SPACE);

    // 設立日のみ未入力の場合
    } else if (testCase === 'btnTest4') {
      this.inputTextByXpath('dummy_testTeam0001', this.form.teamName);
      element(by.xpath(this.getXpathLocater(this.form.teamEstDate))).sendKeys(Constants.CTRL_A);
      element(by.xpath(this.getXpathLocater(this.form.teamEstDate))).sendKeys(protractor.Key.BACK_SPACE);

    // 市区町村のみ未入力の場合
    } else if (testCase === 'btnTest5') {
      this.inputTextByXpath('2021/05/01', this.form.teamEstDate);
      element(by.xpath(this.getXpathLocater(this.form.teamCity))).sendKeys(Constants.CTRL_A);
      element(by.xpath(this.getXpathLocater(this.form.teamCity))).sendKeys(protractor.Key.BACK_SPACE);

    // 設立日に不正な値を入力する
    } else {
      this.inputTextByXpath('札幌市', this.form.teamCity);
      element(by.xpath(this.getXpathLocater(this.form.teamEstDate))).sendKeys(Constants.CTRL_A);
      element(by.xpath(this.getXpathLocater(this.form.teamEstDate))).sendKeys(protractor.Key.BACK_SPACE);
      this.inputTextByXpath(Constants.ERR_DATE, this.form.teamEstDate);
    }

    // ボタン要素を取得して返却
    const elem =  element(by.xpath(this.getXpathLocater(this.form.updateBtn)));
    await browser.sleep(Constants.SLEEP_TIME);
    return elem;
  }

  /**
   * 選手情報更新時のボタンの活性チェック
   * @param testCase ボタンテストのケース
   */
  public async playerChgBtnEnableCk(testCase: string): Promise<ElementFinder> {

    // 必須項目をすべて入力（任意の項目を操作）する場合
    if (testCase === 'btnTest2') {
      this.inputTextByXpath('changed', this.form.uniNum);

    // 背番号のみ未入力の場合
    } else if (testCase === 'btnTest3') {
      element(by.xpath(this.getXpathLocater(this.form.uniNum))).sendKeys(Constants.CTRL_A);
      element(by.xpath(this.getXpathLocater(this.form.uniNum))).sendKeys(protractor.Key.BACK_SPACE);

    // ポジションのみ未入力の場合
    } else if (testCase === 'btnTest4') {
      this.inputTextByXpath('1', this.form.uniNum);
      element(by.xpath(this.getXpathLocater(this.form.gamePosition))).sendKeys(Constants.CTRL_A);
      element(by.xpath(this.getXpathLocater(this.form.gamePosition))).sendKeys(protractor.Key.BACK_SPACE);

    // 所属開始年月のみ未入力の場合
    } else if (testCase === 'btnTest5') {
      this.inputTextByXpath('GK', this.form.gamePosition);
      element(by.xpath(this.getXpathLocater(this.form.teamStartDate))).sendKeys(Constants.CTRL_A);
      element(by.xpath(this.getXpathLocater(this.form.teamStartDate))).sendKeys(protractor.Key.BACK_SPACE);

    // 所属開始年月に不正な値を入力する
    } else if (testCase === 'btnTest6') {
      this.inputTextByXpath(Constants.ERR_DATE, this.form.teamStartDate);

    // 必須項目を入力の上、所属終了年月に不正な値を入力する
    } else if (testCase === 'btnTest7') {
      this.inputTextByXpath('2021/05/01', this.form.teamStartDate);
      this.inputTextByXpath(Constants.ERR_DATE, this.form.teamEndDate);

    // 必須項目を入力の上、所属終了年月に不正な値を入力する
    } else {
      element(by.xpath(this.getXpathLocater(this.form.teamEndDate))).sendKeys(Constants.CTRL_A);
      element(by.xpath(this.getXpathLocater(this.form.teamEndDate))).sendKeys(protractor.Key.BACK_SPACE);
      this.inputTextByXpath('2021/04/01', this.form.teamEndDate);
    }

    // ボタン要素を取得して返却
    const elem =  element(by.xpath(this.getXpathLocater(this.form.playerInfupdateBtn)));
    await browser.sleep(Constants.SLEEP_TIME);
    return elem;
  }

  /**
   * エラーメッセージ出現処理
   * 【概要】フォームを活性化させエラーメッセージを出現させる
   */
  public async appearErrMsg(): Promise<void> {

    // 背番号のフォームをクリックし、次のフォームに移動する
    element(by.xpath(this.getXpathLocater(this.form.uniNum))).sendKeys(Constants.CTRL_A);
    element(by.xpath(this.getXpathLocater(this.form.uniNum))).sendKeys(protractor.Key.BACK_SPACE);
    this.inputTextByXpath(protractor.Key.TAB, this.form.uniNum);

    // ポジションのフォームをクリックし、次のフォームに移動する
    element(by.xpath(this.getXpathLocater(this.form.gamePosition))).sendKeys(protractor.Key.BACK_SPACE);
    this.inputTextByXpath(protractor.Key.TAB, this.form.gamePosition);

    // 所属年月日のフォームをクリックし、次のフォームに移動する
    element(by.xpath(this.getXpathLocater(this.form.teamStartDate))).sendKeys(protractor.Key.BACK_SPACE);
    this.inputTextByXpath(protractor.Key.TAB, this.form.teamStartDate);

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
   * 削除ボタン押下
   */
  public async clickDeleteBtn(): Promise<void> {
    const elem = element.all(by.xpath(this.getXpathLocater(this.form.deleteStaffBtn)));
    elem.get(1).click();
    element(by.buttonText(Constants.OK)).click();
    element(by.buttonText(Constants.OK)).click();
    await browser.sleep(Constants.SLEEP_TIME);
  }

  /**
   * チーム所属選手招待画面に遷移
   */
  public async navToInvitePlayer(): Promise<void> {
    const elem = element(by.cssContainingText('.mat-tab-label', '所属選手'));
    elem.click();
    this.btnClickByXpath(this.form.navInvitePlayerBtn);

    await browser.sleep(Constants.SLEEP_TIME);
  }

  /**
   * チームスタッフ招待画面に遷移
   */
  public async navToInviteStaff(): Promise<void> {
    const elem = element(by.cssContainingText('.mat-tab-label', '所属スタッフ'));
    elem.click();
    this.btnClickByXpath(this.form.navInviteStaffBtn);

    await browser.sleep(Constants.SLEEP_TIME);
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
