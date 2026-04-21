import { AppPage } from './app.po';
import { browser, logging } from 'protractor';
import { CNS } from '../../client/app/common/defines';
import { connect } from '../../server/common/db-client';

describe('workspace-project App', () => {
  let page: AppPage;

  beforeEach(async () => {
    page = new AppPage();
    // DBの接続設定
    await connect();
  });

  // ログイン画面のテスト
  it('login test', () => {
    // localhost:4201にアクセス
    page.navigateTo();
    // ログイン画面に遷移していることをテスト
    expect(browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToLogin}`);
    // ログイン
    page.login();
    // ログイン後にプロフィール画面に遷移しているか確認
    expect(browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToProfile}`);
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    } as logging.Entry));
  });
});
