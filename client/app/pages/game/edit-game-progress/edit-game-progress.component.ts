import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormArray } from '@angular/forms';
import { GameInfo, OrganInfo, GamePlayerInfo, TeamInfo } from 'defs/api';
import { Competition, GameResult } from 'defs';
import { ObjectId } from 'mongodb';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-edit-game-progress',
  templateUrl: './edit-game-progress.component.html',
  styleUrls: ['./edit-game-progress.component.scss']
})
export class EditGameProgressComponent implements OnInit {

  formGroup: UntypedFormGroup;

  game: GameInfo;

  gameResult: Omit<GameResult, '_id'>;

  competition: Omit<Competition, '_id'>;

  teamList: TeamInfo[];

  organList: OrganInfo[];

  playerList: GamePlayerInfo[];

  teamID: string;

  msg = MSG;

  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    this.formGroup = this.formBuilder.group({
      playerResults: this.formBuilder.array([]),
      resultTime: [''],
      resultType: [''],
      player: ['']
    });
  }

  canDeactive(): boolean {
    return !this.formGroup.dirty;
  }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {

    // 引き継ぎ情報の取得
    const editInfo = this.commonService.getEditInfo();
    this.teamID = editInfo.teamID;

    try {
      // 初期表示情報の取得
      const res = await this.commonService.apiPost('game/editGameProgressInit', {
        gameID: editInfo.id,
        type: editInfo.type,
        teamID: this.teamID
      }).toPromise();

      // 取得情報の設定
      this.game = res.game;
      this.gameResult = res.gameResult;
      this.competition = res.competition;
      this.teamList = res.team;
      this.organList = res.organ;
      this.playerList = res.playerInfo;

    } catch(e) {
      this.commonService.errorOnApi(e);
      this.commonService.navigateBack();
    }

    // フォーム初期化
    this.formGroup = this.formBuilder.group({
      playerResults: this.formBuilder.array([]),
      resultTime: [''],
      recordType: [''],
      userID: ['']
    });

    // 選手成績分のフォームグループを生成
    const formArray = this.formGroup.get('playerResults') as UntypedFormArray;
    if(this.gameResult.gameResultPlayer) {
      this.gameResult.gameResultPlayer.forEach(playerRslt => {

        formArray.push(this.formBuilder.group({
          resultTime: [playerRslt.resultTime],
          recordType: [playerRslt.recordType],
          userID: [playerRslt.userID],
          resultTimeBk: [playerRslt.resultTime],
          recordTypeBk: [playerRslt.recordType],
          userIDBk: [playerRslt.userID]
        }));
      });
    }

  }

  /**
   * 試合経過情報追加処理
   */
  public async addGameProgress(): Promise<void> {

    // フォームの情報を設定
    const form = this.formGroup.value;

    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.addConfirmation.replace('※1','試合経過情報'));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // 成績情報追加処理
      const res = await this.commonService.apiPost('game/addGameProgress', {
        form: form,
        game: this.game,
        teamID: this.teamID,
        sports: this.competition.sports,
        compID: this.commonService.getEditInfo().compID,
        teamInf: this.commonService.getEditInfo().teamInf
      }).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.addDoneTitle, this.msg.addDone.replace('※1','試合経過情報'));

        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();

        this.ngOnInit();
      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, res.message);
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * 試合経過更新処理
   */
  public async modGameProgress(index: number): Promise<void> {

    // フォームの情報を設定
    const form = this.formGroup.get('playerResults').value[index];

    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.changeConfirmation.replace('※1','試合経過情報'));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // 試合経過情報更新処理
      const res = await this.commonService.apiPost('game/modGameProgress', {
        form: form,
        game: this.game,
        teamID: this.teamID,
        sports: this.competition.sports,
        compID: this.commonService.getEditInfo().compID,
        teamInf: this.commonService.getEditInfo().teamInf
      }).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.changeDoneTitle, this.msg.changeDone.replace('※1','試合経過情報'));

        // フォームの変更状態をもとに戻す
        this.getPlayerResults.controls[index].markAsPristine();

        this.ngOnInit();
      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, res.message);
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * 試合経過削除処理
   */
  public async removeGameProgress(index: number): Promise<void> {

    // フォームの情報を設定
    const form = this.formGroup.get('playerResults').value[index];

    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.delConfirmation.replace('※1','試合経過情報'));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // 試合経過情報削除処理
      const res = await this.commonService.apiPost('game/removeGameProgress', {
        form: form,
        game: this.game,
        teamID: this.teamID,
        sports: this.competition.sports,
        compID: this.commonService.getEditInfo().compID,
        teamInf: this.commonService.getEditInfo().teamInf
      }).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.delDoneTitle, this.msg.delDone.replace('※1','試合経過情報'));

        // フォームの変更状態をもとに戻す
        this.getPlayerResults.controls[index].markAsPristine();

        this.ngOnInit();
      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, res.message);
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * 戻るボタン押下時の処理
   */
  public pageBack(): void {
    this.commonService.navigateBack();
  }

  /**
   * チームIDを元にチーム名を取得する
   * @param teamID
   */
  public getTeamName(teamID: string): string {
    if(!teamID) return '';
    return this.teamList.find(team => team.teamID.toString() == teamID).teamName;
  }

  /**
   * 団体IDを元に団体名を取得する
   * @param organID
   */
  public getOrganName(organID: string): string {
    if(!organID) return '';
    const organizerInf = this.organList.find(organ => organ.organID.toString() == organID);
    if(organizerInf) {
      // 主催団体が団体の場合、団体名を取得
      return organizerInf.organName;
    } else {
      // 主催団体がチームの場合、チーム名を取得
      return this.teamList.find(team => team.teamID.toString() == organID).teamName;
    }
  }

  /**
   * 選手名を取得する
   */
  public getPlayerName(userID: ObjectId): string {
    if(!userID) return '';
    const playerInf = this.playerList.find(player => {
      return player.userID == userID;
    }).playerInf;
    if(playerInf) {
      return `${playerInf.lastName} ${playerInf.firstName}`;
    } else {
      return '';
    }
  }

  /**
   * PlayerResultのgetter
   */
  get getPlayerResults(): UntypedFormArray {
    return this.formGroup.get('playerResults') as UntypedFormArray;
  }

}
