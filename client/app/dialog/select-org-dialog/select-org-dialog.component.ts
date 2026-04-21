import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { MSG } from '../../common/message-defines';
import { ObjectId } from 'mongodb';
import { CNS, prefectures } from '../../common/defines';
import ImageInf from 'defs/entity/imageInf';
import { MatStepper } from '@angular/material/stepper';
import { CommonService } from 'client/app/common/common.service';
import { GetCompTeamListRes, SearchCompOrganListRes } from 'defs/api';

export interface OrgDialogData {
  isOrgFlg: string;
  idList: string[];
}

export interface SearchOrgData {
  organId: ObjectId;
  organName: string;
  organAddInf: string;
  organLogo?: ImageInf;
  isChecked: boolean;
}

@Component({
  selector: 'app-select-org-dialog',
  templateUrl: './select-org-dialog.component.html',
  styleUrls: ['./select-org-dialog.component.scss']
})
export class SelectOrgDialogComponent {

  // 入力情報保持用
  formGroup: UntypedFormGroup = null;

  // 固定のメッセージ
  msg = MSG;

  // 47都道府県
  prefectures = prefectures;

  // 団体・チーム格納用
  organLabel: string;

  // 団体・チームフォーム名格納用
  formNameLabel: string;

  // 検索フラグ
  searchFlg = false;

  // エラーパターンフラグ
  errorCaseFlg = '';

  // 団体・チーム数格納用
  organsCnt: number;

  // DB取得データ格納用
  compOrganList: Array<SearchOrgData> = [];

  // 一つ以上選択されているか判定
  haveCheckedBox = false;

  // 重複情報格納用
  regDoneOrg = [];

  // 選択情報格納用
  selectedOrg = [];

  // 登録処理結果
  regResult: 'ok' | 'ng' | 'exception' = 'ok';

  // デバイス判定用変数
  device: 'pc' | 'sp';

  constructor(@Inject(MAT_DIALOG_DATA) public data: OrgDialogData ,public commonService: CommonService,
  private formBuilder: UntypedFormBuilder, private dialogRef: MatDialogRef<SelectOrgDialogComponent>) {
    // マスク部分押下でのクローズを制御
    dialogRef.disableClose = true;

    // isOrgFlgの値によって作成するフォーム判定
    switch (data.isOrgFlg) {
      case '1':
        this.formGroup = this.formBuilder.group({
          organName: ['', [Validators.maxLength(50), Validators.required]],
          prefecture: ['', [Validators.required]]
        });
        this.organLabel = '団体';
        this.formNameLabel = 'organName';
        break;

      case '2':
        this.formGroup = this.formBuilder.group({
          teamName: ['', [Validators.maxLength(50), Validators.required]],
          prefecture: ['', [Validators.required]]
        });
        this.organLabel = 'チーム';
        this.formNameLabel = 'teamName';
        break;

      default:
        this.dialogRef.close();
        break;
      }
    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';
  }

  /**
   * 検索処理
   */
  public async onClickSearch(): Promise<void> {
    // 再検索時のためにリセット
    this.compOrganList = [];

    // 検索条件を取得
    const data = this.formGroup.value;

    try {
      // DBから取得したデータ格納用
      let resOrg: SearchCompOrganListRes;
      let resTeam: GetCompTeamListRes;
      switch (this.data.isOrgFlg) {
        case '1':
          this.errorCaseFlg = 'organ';
          // 団体検索処理
          resOrg = await this.commonService.apiPost('organ/searchCompOrganList', data).toPromise();

          if (resOrg.result === 'ok') {
            // 検索結果をフロント表示に合わせて整理する
            this.compOrganList = resOrg.compOrganList.map(elm => {
              return({
                ...elm,
                organAddInf: elm.organAddInf.organPrefecture + elm.organAddInf.organCity,
                isChecked: false
              });
            });

            // 団体総数格納
            this.organsCnt =resOrg.organsCnt;

            // 検索フラグを立てる
            this.searchFlg = true;

            // 選択フラグをfalseにする
            this.haveCheckedBox = false;

          } else {
            // 検索フラグをfalseにする
            this.searchFlg = false;

            // 選択フラグをfalseにする
            this.haveCheckedBox = false;

            // 取得失敗メッセージ
            await this.commonService.errorOnApp();
          }
          break;

        case '2':
          this.errorCaseFlg = 'team';
          // チーム検索処理
          resTeam = await this.commonService.apiPost('team/compTeamList', data).toPromise();

          // 正常時の処理
          if (resTeam.result === 'ok') {
            // 検索結果をフロント表示に合わせて整理する
            this.compOrganList = resTeam.compTeamList.map(elm => {
              return({
                organId: elm.teamId,
                organName: elm.teamName,
                organLogo: elm.teamLogo,
                organAddInf: elm.teamAddInf.teamPrefecture + elm.teamAddInf.teamCity,
                isChecked: false
              });
            });

            // チーム総数格納
            this.organsCnt = resTeam.teamsCnt;
            // 検索フラグを立てる
            this.searchFlg = true;
            // 選択フラグをfalseにする
            this.haveCheckedBox = false;

          } else {
            // 検索フラグをfalseにする
            this.searchFlg = false;
            // 選択フラグをfalseにする
            this.haveCheckedBox = false;
            // 取得失敗メッセージ
            await this.commonService.errorOnApp();
          }
          break;

        default:
          break;
      }
    } catch(e) {
      // 検索フラグをfalseにする
      this.searchFlg = false;
      // 選択フラグをfalseにする
      this.haveCheckedBox = false;
      // 取得エラーメッセージ
      if (this.errorCaseFlg ==='organ') {
        await this.commonService.errorOnService(CNS.targetTypeOrg, CNS.actionTypeSearch);
      } else if (this.errorCaseFlg ==='team') {
        await this.commonService.errorOnService(CNS.targetTypeTeam, CNS.actionTypeSearch);
      }
    }
  }

  /**
   * チェックボックス選択時処理
   * @param teamInfo
   */
    public onClickBoxOrgan(organInfo: SearchOrgData): void {
      // チェックの値を変える
      organInfo.isChecked = !organInfo.isChecked;

      // 一つ以上選択されているか判定
      this.haveCheckedBox = this.compOrganList.some((org) => org.isChecked === true);
    }

  /**
   * 主催選択完了処理
   * 選択された主催情報をまとめる
   */
  public onClickChkTeam(stepper: MatStepper): void {
    // ページ移動を考慮しリセット
    this.selectedOrg = [];
    this.regDoneOrg = [];

  // 選択された主催情報を抽出
  const checkedOrgan = this.compOrganList.filter(elm => elm.isChecked === true);
  // 追加可能主催情報を抽出
  this.selectedOrg = checkedOrgan.filter(elm =>
    this.data.idList.every(id => elm.organId.toString() != id)
  );
  // 登録済みの主催情報を抽出
  this.regDoneOrg = checkedOrgan.filter(elm =>
    this.data.idList.some(id => elm.organId.toString() == id)
  );

    // 次のページに移動
    stepper.next();
  }

  /**
   * 追加ボタン押下処理
   */
  public onClickAdd(stepper: MatStepper): void {
    stepper.next();
  }

  /**
   * ダイアログ終了処理
   */
  public onClickFin(): void {
    // ダイアログを閉じる
    this.dialogRef.close(this.selectedOrg);
  }
}
