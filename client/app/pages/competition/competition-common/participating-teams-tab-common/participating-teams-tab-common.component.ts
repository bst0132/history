import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { EntryTeamInfo } from 'defs/api';
import { MSG } from '../../../../common/message-defines';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { CommonService } from '../../../../common/common.service';
import { SelectTeamDialogComponent, DialogGetData } from '../../../../dialog/select-team-dialog/select-team-dialog.component';
import { InputTeamDialogComponent, DialogReqData } from '../../../../dialog/input-team-dialog/input-team-dialog.component';
import { ObjectId } from 'mongodb';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { CNS } from 'client/app/common/defines';
import { EditTeamDialogComponent, DialogEditData } from 'client/app/dialog/edit-team-dialog/edit-team-dialog.component';
import { GameGroups } from 'defs/api/index.d';

interface EntryTeamData extends EntryTeamInfo {
  isRegTeam: boolean;
}

@Component({
  selector: 'app-participating-teams-tab-common',
  templateUrl: './participating-teams-tab-common.component.html',
  styleUrls: ['./participating-teams-tab-common.component.scss']
})
export class ParticipatingTeamsTabCommonComponent implements OnInit {

  // 固定のメッセージ
  msg = MSG;

  // 入力保持用
  formGroup: UntypedFormGroup;

  // 参加チームIDリスト
  teamIdList: ObjectId[] = [];

  // 定数使用用変数
  cns = CNS;

  // 受け取るデータ
  @Input() device: 'pc' | 'sp';
  @Input() editInfo;
  @Input() teamInfo;
  @Input() canEdit: boolean;
  @Input() leagueList: GameGroups[];
  @Input() tournamentList: GameGroups[];

  // 親コンポーネントに対してイベントを発火するためのプロパティ
  @Output() eventCanDeactive = new EventEmitter<boolean>();

  /**
   * 初期状態からページの編集がされたか判定
   */
  public canDeactive(): boolean {
    if (this.formGroup.dirty) {
      this.eventCanDeactive.emit(true);
    }
    return !this.formGroup.dirty;
  }

  constructor(public commonService: CommonService, private dialog: MatDialog, private formBuilder: UntypedFormBuilder) {
    // DB未登録チーム編集用コントローラー設定
    this.formGroup = this.formBuilder.group({
      teamInfo: this.formBuilder.array([])
    });
  }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {
    this.setPartTeam(this.teamInfo.regTeamList, this.teamInfo.inputTeamList, this.teamInfo.teamIdList);
  }

  /**
   * teamInfoのゲッター
   */
  get getTeamInfo(): UntypedFormArray {
    return this.formGroup.get('teamInfo') as UntypedFormArray;
  }

  /**
   * 試合参加チーム取得処理後 データ設定
   */
  public setPartTeam(regTeam: EntryTeamInfo[], inputTeam: EntryTeamInfo[], recordId: ObjectId[]): void {
    // 試合参加チーム(DB登録済み)情報をフォームに設定
    regTeam.map(elm => {
      this.getTeamInfo.push(this.formBuilder.group({
        recordId: [elm.recordId],
        teamName: [elm.teamName],
        isSelected: [elm.isSelected],
        isRegTeam: true
      }));
    });

    // 試合参加チーム(未登録)情報をフォームに設定
    inputTeam.map(elm => {
      this.getTeamInfo.push(this.formBuilder.group({
        recordId: [elm.recordId],
        teamName: [elm.teamName, [Validators.maxLength(50), Validators.required]],
        isSelected: [elm.isSelected],
        isRegTeam: false
      }));
    });

    // 追加済みチームIDの更新
    this.teamIdList = recordId;
  }

  /**
   * 試合参加チーム取得処理
   */
  public async getPartTeam(): Promise<void> {
    // 遷移元から引き継いだ大会IDを取得
    const compId = this.editInfo.id;

    try {
      // 取得処理
      const res = await this.commonService.apiPost('teamGameRecord/getEntryTeam', {compId: compId.toString()}).toPromise();

      // 異常があれば大会一覧画面に戻る
      if (res.result != 'ok') {
        await this.commonService.errorOnApp();
        setTimeout(() => this.dialog.closeAll());
        this.commonService.navigateWithEdit(CNS.pathToCollectionCompetition, {
          id: this.editInfo.id,
          type: 'competition'
        });
        return;
      }

      // フォームのリセット
      this.getTeamInfo.clear();

      // 取得したデータをフォーム・変数に設定する
      this.setPartTeam(res.regTeamList, res.inputTeamList, res.teamIdList);

      // フォームの変更状態をもとに戻す
      this.formGroup.markAsPristine();

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeTeam + CNS.targetTypeInformation, CNS.actionTypeGet);
      setTimeout(() => this.dialog.closeAll());
    }
  }

  /**
   * 試合参加チーム削除処理
   * @param index
   */
  public async onDelTeam(team: EntryTeamData): Promise<void> {
    // 削除確認ダイアログ
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.delConfirmation.replace('※1', team.teamName));
    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // 削除処理
      const res = await this.commonService.apiPost('teamGameRecord/delEntryTeam', {recordId: team.recordId.toString()}).toPromise();

      if (res.result != 'ok') {
        if (res?.message) {
        // 試合に選択されているチームを削除しようとした際の削除失敗ダイアログ
        await this.commonService.openNoticeDialog(this.msg.errTitle, res.message);
        // 削除失敗ダイアログ
        } else {
          await this.commonService.errorOnApp();
        }
      } else {
        // 削除完了ダイアログ
        await this.commonService.openNoticeDialog(this.msg.delDoneTitle, this.msg.delDone.replace('※1', team.teamName));
      }

      // 試合参加チームの表示を更新
      await this.getPartTeam();

    } catch(e) {
      await this.commonService.errorOnService(team.teamName, CNS.actionTypeDel);
    }
  }

  /**
   * チーム名編集
   */
  public async onClickEditTeam(team: EntryTeamData): Promise<void> {
    // ダイアログに渡す情報を設定
    const data: DialogEditData = {
      teamName: team.teamName,
      recordId: team.recordId,
      leagueList: this.leagueList,
      tournamentList: this.tournamentList
    };

    // チーム名編集ダイアログを開く
    const res = await this.dialog.open(EditTeamDialogComponent, {data}).afterClosed().toPromise();

    if (res) {
      // 編集完了ダイアログ
      await this.commonService.openNoticeDialog(this.msg.editDoneTitle, this.msg.editDone.replace('※1', CNS.targetTypeTeamName));

      // 試合参加チームの表示を更新
      await this.getPartTeam();
    }
  }

  /**
   * DB登録済みチーム追加
   */
  public async onClickSelectTeam(): Promise<void> {
    // 試合参加チームの表示を更新
    await this.getPartTeam();

    // 遷移元から引き継いだ大会IDを取得
    const compId = this.editInfo.id;

    // ダイアログに渡す情報を定義
    const data: DialogGetData = {
      compId: compId.toString(),
      idList: this.teamIdList
    };

    // チーム検索・選択追加ダイアログを開く
    const res = await this.dialog.open(SelectTeamDialogComponent, {data}).afterClosed().toPromise();

    // 登録が正常に行われた場合は試合参加チームの表示を更新
    if (res) {
      await this.getPartTeam();
    }
  }

  /**
   * DB未登録チーム追加
   */
  public async onClickInputTeam(): Promise<void> {
    // 遷移元から引き継いだ大会IDを取得
    const compId = this.editInfo.id;

    // ダイアログに渡す情報を定義
    const data: DialogReqData = {
      compId: compId.toString()
    };

    // チーム手入力追加ダイアログを開く
    const res = await this.dialog.open(InputTeamDialogComponent, {data}).afterClosed().toPromise();

    // 登録が正常に行われた場合は試合参加チームの表示を更新
    if (res) {
      await this.getPartTeam();
    }
  }

}
