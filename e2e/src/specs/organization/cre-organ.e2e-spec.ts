import { browser, logging } from 'protractor';
import { CNS } from '../../../../client/app/common/defines';
import { CreOrganPo } from '../../po/organization/cre-organ.po';

describe('create organ test', () => {
  const po = new CreOrganPo();
  // 遷移のテスト
  it('navigate test', () => {
    po.selectMenus('createOrgan');
    expect(browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToCreateOrganization}`);
  });

  // 登録のテスト
  it('reg test', () => {
    // 登録する値をフォームに入力する
    po.inputForm();
    // 登録ボタンを押下する
    po.createOrgan();
    // 登録処理後に団体参照に遷移しているかテスト
    expect(browser.getCurrentUrl()).toBe(`${browser.baseUrl}${CNS.pathToManageOrgan}`);
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    } as logging.Entry));
  });
});
