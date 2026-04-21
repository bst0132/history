import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonService } from '../../common/common.service';
import { CNS } from 'client/app/common/defines';
import { MSG } from '../../common/message-defines';
import ImageInf from 'defs/entity/imageInf';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-common-header',
  templateUrl: './common-header.component.html',
  styleUrls: ['./common-header.component.scss']
})
export class CommonHeaderComponent implements OnInit {
  @Output()
  menuToggle = new EventEmitter<void>();

  @Output()
  closeMenu = new EventEmitter<void>();

  device: 'pc' | 'sp';

  cns = CNS;
  msg = MSG;

  nickname: string;

  // プロフ画像情報
  userImage: ImageInf = {
    dataUrl: '',
    transform: ''
  };
  private sub?: Subscription;

  constructor(public commonService: CommonService) {
    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';
  }

  public async ngOnInit(): Promise<void> {

    try {
      const res = await this.commonService.apiPost('user/getProfile', {
        userId: this.commonService.getLoginInfo().userId
      }).toPromise();

      if(res.result != 'ok') {
        // データがなかったらログイン画面に遷移させる
        await this.commonService.errorOnApp();
        this.commonService.navigateWithoutEdit(CNS.pathToLogin);
      } else {
        this.nickname = res.userInfo.nickname;

        if(res.userInfo.userImage?.dataUrl) {
          this.userImage = res.userInfo.userImage;
        }
      }
    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeScreen, CNS.actionTypePrepare);
      this.commonService.navigateToLogin();
    }
    this.sub = this.commonService.loginInfoChanged$.subscribe(info => {
      this.nickname = info?.nickname ?? this.nickname;
      this.userImage = info?.userImage ?? this.userImage;
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

  /**
   * メニュークリックで画面遷移させる
   * @param path 遷移先のパス
   */
  public onClickNavigate(path: string): void {
    // サイドメニューを閉じる
    this.closeMenu.emit();
    if(path == '') {
      // ログインしていれば、マイページへ遷移する
      if(this.commonService.isLogined) {
        this.commonService.navigateWithoutEdit(CNS.pathToProfileDetail);
      // ログインしていない場合、ログイン画面へ遷移する
      } else {
        this.commonService.navigateWithoutEdit(path);
      }
    } else {
      // 【暫定対応】
      // 個人情報画面からパスワード変更ボタンを廃止し、パスワード変更画面から戻るボタンを廃止した後に有効化
      // this.commonService.navigateWithoutEdit(path);

      // 【暫定対応】
      // 個人情報画面からパスワード変更ボタンを廃止し、パスワード変更画面から戻るボタンを廃止した後に削除
      this.commonService.navigateWithEdit(path);
    }
  }

  /**
   * ログイン情報を削除し、トップページへ遷移させる
   */
  public async onClickLogout(): Promise<void> {
    // サイドメニューを閉じる
    this.closeMenu.emit();
    const result = await this.commonService.openConfirmDialog(this.msg.logoutConfirmationTitle, this.msg.logoutConfirmation);
    if (!result) {
      return;
    }
    this.commonService.clearLoginInfo();'';
    // ログアウト処理中である事をセット
    this.commonService.setProgress('logout');
    await this.commonService.navigateWithoutEdit('');
    this.commonService.setProgress('');
    await this.commonService.openNoticeDialog(this.msg.logoutDoneTitle, this.msg.logoutDone);
  }

  /**
   * パスワード変更画面へ遷移
   */
  public async editPassword(): Promise<void> {
    // サイドメニューを閉じる
    this.closeMenu.emit();
    this.commonService.navigateWithEdit(CNS.pathToEditPassword);
  }

  public onClickMenuIcon(): void {
    this.menuToggle.emit();
    return;
  }
}
