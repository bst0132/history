import { AppPage } from '../../app.po';
import { by, element } from 'protractor';
import { generateRandStr } from '../../common/testUtil';
import { Constants } from '../../common/commonConstants';

export class CreOrganPo extends AppPage {

  /** 画面項目名 */
  private form = {
    organName: 'organName',
    sports: 'sports',
    organPrefecture: 'organPrefecture',
    organCity: 'organCity',
    organIntro: 'organIntro',
    button: 'button',
    createOrgan: 'createOrgan'
  }

  /**
   * フォームの入力
   */
  public inputForm(): void {
    // 団体名を入力
    this.inputTextByXpath(`e2e_${generateRandStr()}`, this.form.organName);

    // 競技セレクトボックスをクリック
    this.btnClickByXpath(this.form.sports);

    // 上から二番目の要素を選択
    const sportsList = element.all(by.xpath(this.getXpathLocater('optSports')));
    sportsList.get(1).click();

    // 都道府県セレクトボックスをクリック
    this.btnClickByXpath(this.form.organPrefecture);

    // 最初の要素を選択
    const prefList = element.all(by.xpath(this.getXpathLocater('optOrganPrefecture')));
    prefList.first().click();

    // 市町村区を入力
    this.inputTextByXpath('札幌市', this.form.organCity);

    // 団体紹介を入力
    this.inputTextByXpath('団体の紹介文です。', this.form.organIntro);
  }

  /**
   * 登録を行う
   */
  public createOrgan(): void {
    // 登録ボタンを押下
    this.btnClickByXpath(this.form.button);
    // 確認、完了ダイアログに対し、OKを押下
    element(by.buttonText(Constants.OK)).click();
    element(by.buttonText(Constants.OK)).click();
  }

}

