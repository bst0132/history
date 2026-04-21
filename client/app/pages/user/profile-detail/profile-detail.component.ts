import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { UntypedFormBuilder } from '@angular/forms';
import { User } from 'defs/entity';
import { CNS, pcBackImages, spBackImages } from 'client/app/common/defines';
import ImageInf from 'defs/entity/imageInf';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-profile',
  templateUrl: './profile-detail.component.html',
  styleUrls: ['./profile-detail.component.scss']
})

export class ProfileDetailComponent implements OnInit {

  userInfo: Omit<User, '_id' | 'password' | 'mailAdd' | 'parentId'>;

  // プロフ画像情報
  userImage: ImageInf = {
    dataUrl: '',
    transform: ''
  };

  msg = MSG;

  // 画像格納用変数
  images: string[];
  image: string;

  // デバイス判定用変数
  device: 'pc' | 'sp';

  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {

    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';

    // 表示する背景画像の情報を取得する
    const loginInfo = this.commonService.getLoginInfo();
    if(loginInfo.backImage) {
      this.image = loginInfo.backImage;
    } else {
      // セッションに画像パスが存在しない場合は画像パスをランダムで設定する
      if(this.device == 'pc') {
        this.images = pcBackImages ;
      } else {
        this.images = spBackImages ;
      }
      // 表示画像をランダムで選択し、変数にパスを設定する
      const i = Math.floor(Math.random() * this.images.length);
      this.image = `url(${this.images[i]})`;
      // セッション情報の更新
      loginInfo.backImage = this.image;
      this.commonService.setLoginInfo(loginInfo);
    }

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
        this.userInfo = res.userInfo;
        if(res.userInfo.userImage?.dataUrl) {
          this.userImage = res.userInfo.userImage;
        }
        const playerInf = res.userInfo.playerInf;
        if (playerInf) {
          // 身長の単位が設定されていない場合のデフォルト設定
          if(!playerInf.heightUnit) {
            playerInf.heightUnit = 'cm';
          }
          // 体重の単位が設定されていない場合のデフォルト設定
          if(!playerInf.weightUnit) {
            playerInf.weightUnit = 'kg';
          }
        }
      }
    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypePlayer + CNS.targetTypeInformation, CNS.actionTypeGet);
      this.commonService.navigateBack();
    }
  }

  /**
   * パスワード変更ボタン押下時の処理
   */
  public editProfile(): void {
    // パスワード変更画面に遷移
    this.commonService.navigateWithEdit(CNS.pathToEditProfile);
  }
}
