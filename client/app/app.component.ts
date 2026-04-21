import { Component, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { CommonService } from './common/common.service';
import { MSG } from '../app/common/message-defines';
import { CNS } from './common/defines';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ITforSports';
  device: 'pc' | 'sp';

  cns = CNS;
  msg = MSG;

  @ViewChild('sidemenu')
  sidenav: MatSidenav;

  constructor(public commonService: CommonService) {
    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';
  }

  /**
   * メニュークリックで画面遷移させる
   * @param path 遷移先のパス
   */
  onClickNavigate(path: string): void {
    this.sidenav.close();
    this.commonService.navigateWithoutEdit(path);
  }

  /**
   * 大会登録・編集画面遷移(新規登録)
   */
  public onClickCreateComp(): void {
    this.sidenav.close();
    // 渡すidはないためnullを設定
    this.commonService.navigateWithEdit(CNS.pathToCreateAndEditComp, {
      id: null,
      newCompFlg: true,
      leagueMatch: false,
      tournamentMatch: false
    });
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }

  /**
   * EnterキーのKeydown時に入力を受け付けない処理
   */
  public onKeydown(value: KeyboardEvent): void {
    this.commonService.onKeydown(value);
  }
}
