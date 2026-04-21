import { AppPage } from '../../app.po';
import { browser, by, element, ElementFinder, protractor } from 'protractor';
import { Constants } from '../../common/commonConstants';

export class TeamListPo extends AppPage {

  /** 画面項目名 */
  private form = {
    sports: 'sports',
    teamName: 'teamName',
    teamPrefecture: 'teamPrefecture',
    searchBtn: 'searchBtn',
    optSports: 'optSports',
    optTeamPrefecture: 'optTeamPrefecture'
  }

  /**
   * フォームの入力
   * @param searchVal 検索フォームの入力値が格納されたオブジェクト
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

    await browser.sleep(Constants.SLEEP_TIME);
  }

  /**
   * 都道府県フォームのエラーメッセージ出現処理
   */
  public async appearErrMsg(): Promise<void> {
    // 都道府県セレクトボックスをクリック
    this.btnClickByXpath(this.form.teamPrefecture);

    // 都道府県のプルダウンメニューを閉じる
    this.inputTextByXpath(protractor.Key.ESCAPE, this.form.teamPrefecture);

    await browser.sleep(Constants.SLEEP_TIME);
  }

  /**
   * ボタン活性チェック
   * @param testCase
   */
  public async btnEnableCk(testCase?: string): Promise<ElementFinder> {
    // 競技セレクトボックスをクリック
    this.btnClickByXpath(this.form.sports);

    // 最初の要素を選択
    const sportsList = element.all(by.xpath(this.getXpathLocater(this.form.optSports)));
    sportsList.first().click();

    if(testCase !== 'btnTest2') {
      // 都道府県セレクトボックスをクリック
      this.btnClickByXpath(this.form.teamPrefecture);

      // 最初の要素を選択
      const prefList = element.all(by.xpath(this.getXpathLocater(this.form.optTeamPrefecture)));
      prefList.first().click();
    }

    // ボタン要素を取得し、返却する
    const elem =  element(by.xpath(this.getXpathLocater(this.form.searchBtn)));
    await browser.sleep(Constants.SLEEP_TIME);
    return elem;
  }

  /**
   * 検索を行う
   * @param id
   * @param type
   */
  public async searchTeam(id?: string, type?: string): Promise<void> {
    // 検索ボタンを押下
    this.btnClickByXpath(this.form.searchBtn);

    // idをもとに対象のチームの参照画面へ遷移
    if (type === 'navigate') {
      const product = element.all(by.xpath(this.getXpathLocater(`${id}pc`,'-team')));
      product.click();
    }

    await browser.sleep(Constants.SLEEP_TIME);
  }
}

