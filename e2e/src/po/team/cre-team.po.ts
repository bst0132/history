import { AppPage } from '../../app.po';
import { browser, by, element, ElementFinder, protractor } from 'protractor';
import {  } from 'protractor/built/selenium-webdriver/webdriver.js';
import { generateRandStr } from '../../common/testUtil';
import { Constants } from '../../common/commonConstants';

export class CreTeamPo extends AppPage {

  /** 画面項目名 */
  private form = {
    teamName: 'teamName',
    sports: 'sports',
    teamEstDate: 'teamEstDate',
    teamPrefecture: 'teamPrefecture',
    teamCity: 'teamCity',
    teamTel: 'teamTel',
    teamIntro: 'teamIntro',
    regBtn: 'regBtn',
    optSports: 'optSports',
    optTeamPrefecture: 'optTeamPrefecture',
    createTeam: 'createTeam',
  }

  /**
   * エラーメッセージ出現処理
   * 【概要】フォームを活性化させエラーメッセージを出現させる
   */
  public async appearErrMsg(): Promise<void> {
    // 競技セレクトボックスをクリック
    this.deselectByXpath(this.form.sports);

    // チーム名のフォームをクリックし、次のフォームに移動する
    this.inputTextByXpath(protractor.Key.TAB, this.form.teamName);

    // 設立日のフォームをクリックし、次のフォームに移動する
    this.inputTextByXpath(protractor.Key.TAB, this.form.teamEstDate);

    // 都道府県のセレクトボックスをクリック
    this.deselectByXpath(this.form.teamPrefecture);

    // 市区町村のフォームをクリックし、次のフォームに移動する
    this.inputTextByXpath(protractor.Key.TAB, this.form.teamCity);

    await browser.sleep(Constants.SLEEP_TIME);
  }

  /**
   * フォームの入力
   * @param inputVal フォーム入力値が格納されたオブジェクト
   */
  public async inputForm(inputVal): Promise<void> {
    // 競技セレクトボックスをクリック
    this.btnClickByXpath(this.form.sports);

    // 競技をを選択
    const sportsList = element(by.cssContainingText(Constants.MAT_OPTION, inputVal.sports));
    sportsList.click();

    // チーム名を入力
    this.inputTextByXpath(`e2e_${generateRandStr()}`, this.form.teamName);

    // 設立日を入力
    this.inputTextByXpath(inputVal.teamEstDate, this.form.teamEstDate);

    // 都道府県セレクトボックスをクリック
    this.btnClickByXpath(this.form.teamPrefecture);

    // 要素を選択
    const prefList = element(by.cssContainingText(Constants.MAT_OPTION, inputVal.prefecture));
    prefList.click();

    // 市町村区を入力
    this.inputTextByXpath(inputVal.teamCity, this.form.teamCity);

    // 電話番号を入力
    this.inputTextByXpath(inputVal.teamTel, this.form.teamTel);

    // チーム紹介を入力
    this.inputTextByXpath(inputVal.teamIntro, this.form.teamIntro);

    await browser.sleep(Constants.SLEEP_TIME);
  }

  /**
   * ボタンの活性チェック
   * @param testCase ボタンテストのケース
   */
  public async btnEnableCk(testCase: string): Promise<ElementFinder> {

    if(testCase !== 'btnTest2') {
      // 競技セレクトボックスをクリック
      this.btnClickByXpath(this.form.sports);

      // 最初の要素を選択
      const sportsList = element.all(by.xpath(this.getXpathLocater(this.form.optSports)));
      sportsList.first().click();
    }

    if(testCase !== 'btnTest3') {
      // チーム名を入力
      this.inputTextByXpath(`e2e_${generateRandStr()}`, this.form.teamName);
    }

    if(testCase !== 'btnTest4') {
      if(testCase === 'btnTest7') {
        // 不正な値の設立日を入力
        this.inputTextByXpath(Constants.ERR_DATE, this.form.teamEstDate);
      } else {
        // 設立日を入力
        this.inputTextByXpath('2021/05/11', this.form.teamEstDate);
      }
    }

    if(testCase !== 'btnTest5') {
      // 都道府県セレクトボックスをクリック
      this.btnClickByXpath(this.form.teamPrefecture);

      // 最初の要素を選択
      const prefList = element.all(by.xpath(this.getXpathLocater(this.form.optTeamPrefecture)));
      prefList.first().click();
    }

    if(testCase !== 'btnTest6') {
      // 市町村区を入力
      this.inputTextByXpath('札幌市', this.form.teamCity);
    }

    // ボタン要素の取得
    const elem =  element(by.xpath(this.getXpathLocater(this.form.regBtn)));
    await browser.sleep(Constants.SLEEP_TIME);
    return elem;
  }

  /**
   * 登録を行う
   */
  public async createTeam(): Promise<void> {
    // 登録ボタンを押下
    this.btnClickByXpath(this.form.regBtn);
    // 確認、完了ダイアログに対し、OKを押下
    element(by.buttonText(Constants.OK)).click();
    element(by.buttonText(Constants.OK)).click();

    await browser.sleep(Constants.SLEEP_TIME);
  }

}

