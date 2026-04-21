import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MSG } from '../../common/message-defines';
import { CommonService } from 'client/app/common/common.service';
import { ObjectId } from 'mongodb';
import { GameGroups } from 'defs/api/index.d';
import { CNS } from 'client/app/common/defines';

export interface DialogEditData {
  teamName: string,
  recordId: ObjectId
  leagueList: GameGroups[];
  tournamentList: GameGroups[];
}
@Component({
  selector: 'app-edit-team-dialog',
  templateUrl: './edit-team-dialog.component.html',
  styleUrl: './edit-team-dialog.component.scss'
})
export class EditTeamDialogComponent {

  // 入力情報保持用
  formGroup: UntypedFormGroup;

  // 固定のメッセージ
  msg = MSG;

  /**
   * コンストラクタ
   * @param data
   * @param formBuilder
   * @param commonService
   * @param dialogRef
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogEditData, private formBuilder: UntypedFormBuilder,
  public commonService: CommonService, private dialogRef: MatDialogRef<EditTeamDialogComponent>) {
    // マスク部分押下でのクローズを制御
    dialogRef.disableClose = true;

    // コントローラ設定
    this.formGroup = formBuilder.group({
      teamName: [this.data.teamName, [Validators.maxLength(50), Validators.required]]
    });
  }

  /**
   * 初期状態からページの編集がされたか判定
   */
  public canDeactive(): boolean {
    return !this.formGroup.dirty;
  }

  /**
   * 更新処理
   */
  public async onClickUpdate(): Promise<void> {
    // APIに渡すデータを設定
    const data = {
      teamName: this.formGroup.value.teamName,
      recordId: this.data.recordId
    };

    try {
      // 更新処理
      const res = await this.commonService.apiPost('teamGameRecord/updateEntryTeam', data).toPromise();

      // 正常時の処理
      if (res.result === 'ok') {
        const oldName = this.data.teamName;
        const newName = this.formGroup.value.teamName;
        // リーグのチーム名が変更された場合更新
        this.data.leagueList.forEach(group => {
          group.perDate.forEach(date => {
            date.gamesInf.forEach(game => {
              if (game.criteriaName === oldName) {game.criteriaName = newName;}
              if (game.opponentName === oldName) {game.opponentName = newName;}
            });
          });
        });
        // トーナメントのチーム名が変更された場合更新
        this.data.tournamentList.forEach(group => {
          group.perDate.forEach(date => {
            date.gamesInf.forEach(game => {
              if (game.criteriaName === oldName) {game.criteriaName = newName;}
              if (game.opponentName === oldName) {game.opponentName = newName;}
            });
          });
        });
        // フォームを初期化
        this.formGroup.markAsPristine();
        // 更新ありのフラグを返してダイアログを閉じる
        this.dialogRef.close(true);

      } else {
        // 更新失敗メッセージ
        await this.commonService.errorOnApp();
      }

    } catch {
      // 更新エラーメッセージ
      await this.commonService.errorOnService(CNS.targetTypeTeamName, CNS.actionTypeUpdate);
    }
  }
}
