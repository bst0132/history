import { browser, by, element, protractor } from 'protractor';
import { Constants } from './common/commonConstants';

export class AppPage {

  /** 画面項目名 */
  private loginForm = {
    mailadd: 'mailadd',
    password: 'password'
  }

  /**
   * 初回のページ遷移
   */
  public navigateTo(): Promise<unknown> {
    return browser.get(browser.baseUrl) as Promise<unknown>;
  }

  /**
   * テキストボックスに入力を行う
   * @param str
   * @param id
   */
  public inputTextById(str: string, id: string): void {
    const elem = element(by.id(id));
    elem.sendKeys(str);

    browser.sleep(Constants.SLEEP_TIME);
  }

  /**
   * ボタンをクリックする
   * @param id
   */
  public btnClickById(id: string): void {
    const elem = element(by.id(id));
    elem.click();

    browser.sleep(Constants.SLEEP_TIME);
  }

  /**
   * テキストボックスに入力を行う
   * @param str
   * @param id
   */
  public inputTextByXpath(str: string, id: string): void {
    const elem = element(by.xpath(this.getXpathLocater(id)));
    elem.sendKeys(str);

    browser.sleep(Constants.SLEEP_TIME);
  }

  /**
   * ボタンをクリックする
   * @param id
   */
  public btnClickByXpath(id: string): void {
    const elem = element(by.xpath(this.getXpathLocater(id)));
    elem.click();

    browser.sleep(Constants.SLEEP_TIME);
  }

  /**
   * セレクトボックスのアクティブ状態を解除する
   * @param id
   */
  public deselectByXpath(id: string): void {
    const elem = element(by.xpath(this.getXpathLocater(id)));
    elem.click().then(() => {
      elem.sendKeys(protractor.Key.ESCAPE);
    });

    browser.sleep(Constants.SLEEP_TIME);
  }

  /**
   * ログインを行う
   */
  public login(): void {

    // ログインモーダルを表示
    this.btnClickById('login');

    // メールアドレス、パスワード入力
    // 実行する環境に応じて変更
    this.inputTextById(Constants.LOGIN_MAIL, this.loginForm.mailadd);
    this.inputTextById(Constants.LOGIN_PASS, this.loginForm.password);

    // ログイン押下
    this.btnClickById('login-button');

    browser.sleep(Constants.SLEEP_TIME);
  }

  /**
   * idを元にxpathを返却する
   * @param id
   * @param type // data-test属性以外の属性
   */
  public getXpathLocater(id: string, type?: string): string {
    if (type) {
      return `//*[@data-test${type}="${id}"]`;
    } else {
      return `//*[@data-test="${id}"]`;
    }
  }

  /**
   * メッセージ取得処理
   * @param id
   */
  public async getXpathMsg(id: string): Promise<string> {
    return element(by.xpath((this.getXpathLocater(id)))).getText();
  }

  /**
   * メッセージ取得処理(input要素などの空要素用)
   * @param id
   */
  public async getInputMsg(id: string): Promise<string> {
    return element(by.xpath((this.getXpathLocater(id)))).getAttribute('value');
  }

  /**
   * ヘッダーのメニューボタンから遷移する
   * @param path
   */
  public selectMenus(path: string): void {
    // メニューボタンを押下
    element(by.xpath('//*[(@data-test="menu")]')).click();
    // pathをもとに画面遷移する
    element(by.xpath(this.getXpathLocater(path))).click();

    browser.sleep(Constants.SLEEP_TIME);
  }
}
