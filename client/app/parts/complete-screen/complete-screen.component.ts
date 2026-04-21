import { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { CommonService } from 'client/app/common/common.service';

@Component({
  selector: 'app-complete-screen',
  templateUrl: './complete-screen.component.html',
  styleUrls: ['./complete-screen.component.scss']
})
export class CompleteScreenComponent implements OnInit {

  // メール送信完了か登録完了かで表示する内容を分ける
  @Input()
  mode: 'mail' | 'done';

  // 画面の種類によって表示内容を分ける
  @Input()
  url: 'createUser' | 'resetPassword';

  // ステッパーのインデックス格納用
  index: string;

  // デバイス判定用変数
  device: 'pc' | 'sp';

  constructor(public commonService: CommonService) {
    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';
  }

  public ngOnInit(): void {
    // メール送信完了か、登録完了かで表示する画面を決定する
    if(this.mode === 'mail') {
      // メール送信完了画面の場合、左から2番目ステッパーが活性状態となるように設定する（2番目のmat-stepの内容を表示する）
      this.index = '1';
    } else {
      // 登録完了画面の場合、左から4番目ステッパーが活性状態となるように設定する（4番目のmat-stepの内容を表示する）
      this.index = '3';
    }
  }
    /**
   * メニュークリックで画面遷移させる
   * @param path 遷移先のパス
   */
    public onClickNavigate(path: string): void {
      this.commonService.navigateWithoutEdit(path);
    }

}
