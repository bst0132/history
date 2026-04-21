import { Component } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { CNS } from '../../../common/defines';

@Component({
  selector: 'app-site-map',
  templateUrl: './site-map.component.html',
  styleUrls: ['./site-map.component.scss']
})
export class SiteMapComponent {

  cns = CNS;

  constructor(public commonService: CommonService) { }

  /**
   * 画面遷移処理
   * 引数のパスが示す画面に遷移
   * @param path
   */
  public onClickNavigate(path: string): void {
    if(path) {
      this.commonService.navigateWithoutEdit(path);
    }
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }

  /**
   * 大会登録・編集画面遷移(新規登録)
   */
  public onClickCreateComp(): void {
    // 渡すidはないためnullを設定
    this.commonService.navigateWithEdit(CNS.pathToCreateAndEditComp, {
      id: null,
      newCompFlg: true,
      leagueMatch: false,
      tournamentMatch: false
    });
  }
}
