import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { UntypedFormGroup, Validators, UntypedFormBuilder, UntypedFormArray } from '@angular/forms';
import { User } from 'defs/entity';
import { CNS, pcBackImages, spBackImages } from 'client/app/common/defines';
import ImageInf from 'defs/entity/imageInf';
import { EditPageBase } from '../../EditPageBase';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss']
})

export class EditProfileComponent extends EditPageBase implements OnInit {

  userInfo: Omit<User, '_id' | 'password' | 'mailAdd' | 'parentId'>;

  // 入力情報保持用
  formGroup: UntypedFormGroup = null;

  // TODO 試行錯誤していたら分割してしまったのでどこかで統一したい
  // 選手情報保持用
  playerInf: UntypedFormGroup = null;

  // プロフ画像情報
  userImage: ImageInf = {
    dataUrl: '',
    transform: ''
  };

  // メッセージ格納用変数
  msg = MSG;

  // 画像格納用変数
  images: string[];
  image: string;

  // 編集用フラグ
  editFlg: boolean;

  // デバイス判定用変数
  device: 'pc' | 'sp';

  constructor(public commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    // 基底クラスのコンストラクタを呼び出す
    super(commonService);

    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';

    // 表示する背景画像の情報を取得する
    const loginInfo = this.commonService.getLoginInfo();
    // セッションに情報が存在していれば保持している画像パスを設定する
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
      // セッション情報に画像パスの情報を設定する
      loginInfo.backImage = this.image;
      this.commonService.setLoginInfo(loginInfo);
    }

    this.formGroup = this.formBuilder.group({
      userUniqueID: ['', [Validators.required, Validators.pattern(/^(?=.*?[a-zA-Z])(?=.*?\d)[a-zA-Z\d]{8,20}$/)]],
      nickname: ['', [Validators.required, Validators.maxLength(30)]],
      isSearchable: [''],
      sportsInf: this.formBuilder.array([])
    });

    this.playerInf = this.formBuilder.group({
      lastName: ['', [Validators.required, Validators.maxLength(30)]],
      firstName: ['', [Validators.required, Validators.maxLength(30)]],
      lastNameKana: ['', [Validators.required, Validators.pattern(/^([ァ-ヴー])+$/), Validators.maxLength(60)]],
      firstNameKana: ['', [Validators.required, Validators.pattern(/^([ァ-ヴー])+$/), Validators.maxLength(60)]],
      birthDate: ['', [Validators.required]],
      birthPlace: ['', Validators.maxLength(100)],
      heightNum: ['', [Validators.pattern(/^\d+(\.\d)?$/), Validators.maxLength(5)]],
      heightUnit: [''],
      weightNum: ['', [Validators.pattern(/^\d+(\.\d)?$/), Validators.maxLength(5)]],
      weightUnit: [''],
      bloodType: [''],
      nationallity: ['', [Validators.required, Validators.maxLength(60)]]
    });
  }

  /**
   * 初期状態からページの編集がされたか判定する
   * 基底クラスの抽象メソッドの実装
   */
  public canDeactive(): boolean {
    return !this.formGroup.dirty && !this.playerInf.dirty;
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
        this.formGroup.get('nickname').setValue(res.userInfo.nickname);
        this.formGroup.get('userUniqueID').setValue(res.userInfo.userUniqueID);
        this.formGroup.get('isSearchable').setValue(res.userInfo.isSearchable);
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

          this.playerInf.setValue({
            lastName: playerInf.lastName,
            firstName: playerInf.firstName,
            lastNameKana: playerInf.lastNameKana,
            firstNameKana: playerInf.firstNameKana,
            birthDate: playerInf.birthDate,
            birthPlace: playerInf.birthPlace,
            heightNum: playerInf.heightNum,
            heightUnit: playerInf.heightUnit,
            weightNum: playerInf.weightNum,
            weightUnit: playerInf.weightUnit,
            bloodType: playerInf.bloodType,
            nationallity: playerInf.nationallity
          });
        }

        const sportsInf = res.userInfo.sportsInf;

        if(sportsInf) {
          const sportsForm = this.formGroup.get('sportsInf') as UntypedFormArray;
          sportsInf.forEach( sport => {
            switch(sport.sport) {
              case 'Football':
                sportsForm.push(this.formBuilder.group({
                  sport: [sport.sport, Validators.required],
                  position: [sport.position, Validators.required],
                  dominantFoot: [sport.dominantFoot, Validators.required]
                }));
                break;
              default:
                break;
            }
          });
        }
        // 選手情報が登録されていない場合、フォームを非表示にする
        if(!this.userInfo.playerInf) {
          this.playerInf.disable();
          this.editFlg = false;
        }
      }
    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeUser + CNS.targetTypeInformation, CNS.actionTypeGet);
      this.commonService.navigateBack();
    }
  }

  get getSports(): UntypedFormArray {
    return this.formGroup.get('sportsInf') as UntypedFormArray;
  }

  // 競技が増えたら追加していない種類のスポーツを見てなかったらfalseを返す
  get canAddSports(): boolean {
    const sportsForm = this.formGroup.get('sportsInf') as UntypedFormArray;
    return (sportsForm.length == 0);
  }

  /**
   * スポーツ情報追加処理
   *
   */
  public onAddSports(): void {
    // TODO 本来なら動的に変化させたいがそこまでコストを割けないので競技が増えるまでは固定
    const sportsForm = this.formGroup.get('sportsInf') as UntypedFormArray;
    sportsForm.push(this.formBuilder.group({
      sport: ['', Validators.required,],
      position: ['', [Validators.required, Validators.maxLength(25)]],
      dominantFoot: ['', [Validators.required, Validators.maxLength(5)]]
    }));
  }

  /**
   * スポーツ情報削除処理
   *
   */
  public onDelSports(index: number): void {
    const sportsForm = this.formGroup.get('sportsInf') as UntypedFormArray;
    sportsForm.removeAt(index);
  }

  /**
   * 編集フラグ変更処理
   *
   */
  public editFlgChange(): void {
    if(!this.editFlg) {
      this.playerInf.enable();
      this.editFlg = true;
    } else {
      this.playerInf.disable();
      this.editFlg = false;
    }
  }

  /**
   * プロフィール登録処理
   *
   */
  public async onSubmit(): Promise<void> {

    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.editConfirmation.replace('※1', CNS.targetTypeProfile));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }
    const data = this.formGroup.value;
    if(this.playerInf.enabled) {
      data.playerInf = this.playerInf.value;
    }
    data.userImage = this.userImage;

    try {
      const res = await this.commonService.apiPost('user/updateProfile', data).toPromise();
      if (res.result == 'ok'){
        // 選手情報が無い状態で新しく選手情報を登録した場合、権限の更新を行う
        if(!this.commonService.isPlayer && res.isPlayer) {
          const loginInfo = this.commonService.getLoginInfo();
          loginInfo.isPlayer = true;
          // セッション情報の更新
          this.commonService.setLoginInfo(loginInfo);
        }
        // プロフィール更新された場合ヘッダーに即時反映
        const loginInfo = this.commonService.getLoginInfo();
        if (loginInfo) {
          const nicknameChange = loginInfo.nickname !== data.nickname;
          const imageChange = JSON.stringify(loginInfo.userImage) !== JSON.stringify(data.userImage);
          if (nicknameChange || imageChange) {
            loginInfo.nickname = data.nickname;
            loginInfo.userImage = data.userImage;
            this.commonService.setLoginInfo(loginInfo);
          }
        }
        await this.commonService.openNoticeDialog(this.msg.confirmationTitle, this.msg.editDone.replace('※1', CNS.targetTypeProfile));
        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();
        this.playerInf.markAsPristine();
        // 個人情報参照画面に戻る
        this.commonService.navigateBack();
      } else if (res?.message) {
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.editErr.replace('※1', CNS.targetTypeProfile) + '\n' + res.message);
      } else {
        await this.commonService.errorOnApp();
      }

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeProfile, CNS.actionTypeEdit);
    }
  }

  // 前のページに戻る
  public onClickReturnToDetail(): void {
    this.commonService.navigateBack();
  }

  /**
 * 画像選択コンポーネントで変更があったらよばれる
 * @param imageInfo 変更後のimageInfo
 */
  public onChangeDataUrl(imageInfo: ImageInf): void {
    this.userImage = imageInfo;
    // フォームに変更済フラグを立てる
    this.formGroup.markAsDirty();
  }

    /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
