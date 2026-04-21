import { Component } from '@angular/core';
import { CommonService } from '../../common/common.service';

@Component({
  selector: 'app-common-footer',
  templateUrl: './common-footer.component.html',
  styleUrls: ['./common-footer.component.scss']
})
export class CommonFooterComponent {

  constructor(public commonService: CommonService) { }

  /**
   * メニュークリックで画面遷移させる
   * @param path 遷移先のパス
   */
  onClickNavigate(path: string): void {
    this.commonService.navigateWithoutEdit(path);
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
