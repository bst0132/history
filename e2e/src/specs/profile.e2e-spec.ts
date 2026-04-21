import { AppPage } from '../app.po';
import { browser, logging } from 'protractor';
import { CNS } from '../../../client/app/common/defines';

export class ProfileTest {
  appPage = new AppPage();
  profileTest = (): void => {
    describe('profile test', () => {

      it('navigate test', () => {
        // マイページに遷移していることをテスト
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
  }
}

