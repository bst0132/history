import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators, ValidatorFn } from '@angular/forms';
import { CommonService } from '../../../common/common.service';
import { ActivatedRoute } from '@angular/router';
import { MSG } from '../../../common/message-defines';
import { CNS } from 'client/app/common/defines';


@Component({
  selector: 'app-send-mail',
  templateUrl: './send-mail.component.html',
  styleUrls: ['./send-mail.component.scss']
})
export class SendMailComponent implements OnInit {

  msg = MSG;

  // メールアドレス形式チェック用正規表現
  mailRegexp = /^[A-Za-z0-9_.-]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]{1,}\.[A-Za-z0-9_.-]{1,}$/;

  // デバイス判定用変数
  device: 'pc' | 'sp';

  // メール送信完了フラグ
  sentMailFlg: boolean;

  emailValidator = (control: UntypedFormControl): ValidatorFn => {
    let result = null;
    if (control.value && !this.mailRegexp.test(control.value)) {
      result = {
        illegal: true
      };
    }
    return result;
  };

  // メール入力フォーム設定
  email = new UntypedFormControl('', [Validators.required, this.emailValidator, Validators.maxLength(100)]);
  // 遷移時のパス
  path: string;
  constructor(private commonService: CommonService, private router: ActivatedRoute) {
    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';
  }

  ngOnInit(): void {
    const { snapshot } = this.router;
    this.path = snapshot.url[0].path;
    // メール送信完了フラグをfalseに設定
    this.sentMailFlg = false;
  }
  // 登録用メールの送信ボタンが押下された時の処理
  async onSubmit(): Promise<void> {
    try {
      // パスの設定
      const path = (this.path == 'sendMail') ? 'user/sendMail' : 'user/resetPassword';
      // api通信開始と結果の格納
      const res = await this.commonService.apiPost(path, {mail: this.email.value}).toPromise();
      // 返却結果が'ok'の場合、ダイアログメッセージを表示
      if(res.result == 'ok') {
        this.sentMailFlg = true;
      } else if (res?.message) {
        await this.commonService.openNoticeDialog(this.msg.errTitle, res.message);
      } else {
        await this.commonService.errorOnApp();
      }
    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeMail, CNS.actionTypeSend);
    }
  }
}
