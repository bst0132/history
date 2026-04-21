import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { GameInfo, TeamInfo, OrganInfo } from 'defs/api';
import { Competition, GameResult } from 'defs';
import { CNS } from 'client/app/common/defines';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-edit-game-result',
  templateUrl: './edit-game-result.component.html',
  styleUrls: ['./edit-game-result.component.scss']
})
export class EditGameResultComponent implements OnInit {

  formGroup: UntypedFormGroup;

  game: GameInfo;

  gameResult: Omit<GameResult, '_id'>;

  private oppScoreResult: number;

  competition: Omit<Competition, '_id'>;

  teamList: TeamInfo[];

  organList: OrganInfo[];

  teamID: string;

  pattern = /^([1-9]\d*|0)$/;

  msg = MSG;

  /**
   * コンストラクタ
   * @param commonService
   * @param formBuilder
   */
  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    this.formGroup = this.formBuilder.group({
      score1stHalf: ['', Validators.pattern(this.pattern)],
      score2ndHalf: ['', Validators.pattern(this.pattern)],
      scoreEX1stHalf: ['', Validators.pattern(this.pattern)],
      scoreEX2ndHalf: ['', Validators.pattern(this.pattern)],
      scoreResult: ['', Validators.pattern(this.pattern)],
      scorePK: ['', Validators.pattern(this.pattern)],
      cntShoot: ['', Validators.pattern(this.pattern)],
      cntDiredtFK: ['', Validators.pattern(this.pattern)],
      cntIndiredtFK: ['', Validators.pattern(this.pattern)],
      cntCornerKick: ['', Validators.pattern(this.pattern)],
      cntOffside: ['', Validators.pattern(this.pattern)]
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
      const res = await this.commonService.apiPost('game/editGameResultInit', {
        gameID: editInfo.id,
        type: editInfo.type,
        teamID: this.teamID
      }).toPromise();

      // 取得情報の設定
      this.game = res.game;
      this.competition = res.competition;
      this.teamList = res.team;
      this.organList = res.organ;
      this.gameResult = res.gameResult;
      this.oppScoreResult = res.oppScoreResult;

    } catch(e) {
      this.commonService.errorOnApi(e);
      this.commonService.navigateBack();
    }

    // 画面情報の設定
    if(this.gameResult) {
      for (const [key, value] of Object.entries(this.gameResult.gameResult)) {
        if(!(key == 'teamID')) {
          this.formGroup.get(key).setValue(value);
        }
      }
    }

    // 選択チームと相手チームの試合合計点が一致しない場合PK入力不可にする
    if(this.gameResult) {
      if(this.gameResult.gameResult.scoreResult != this.oppScoreResult) {
        this.formGroup.get('scorePK').disable();
      }
    }

  }

  /**
   * 試合結果更新処理
   */
  public async modGameResult(): Promise<void> {

    // フォームの情報を設定
    const form = this.formGroup.value;

    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.updateConfirmation.replace('※1','試合結果'));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // 試合情報変更処理
      const res = await this.commonService.apiPost('game/modGameResult', {
        form: form,
        gameID: this.game.gameID,
        teamID: this.teamID,
        compID: this.commonService.getEditInfo().compID,
        teamInf: this.commonService.getEditInfo().teamInf
      }).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.updateDoneTitle, this.msg.updateDone.replace('※1','試合結果'));

        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();

        this.commonService.navigateWithEdit(CNS.pathToGameDetail, {
          id: this.commonService.getEditInfo().id,
          type: CNS.infoTypeGame
        });
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
   * 合計得点を計算する
   */
  public calcScore(): void {
    const form = this.formGroup.value;
    let sum = 0;

    for (const [key, value] of Object.entries(form)) {
      if(key == 'scoreResult') {
        break;
      }

      // 半角数字の場合加算する
      if(this.pattern.test(value.toString())) {
        sum += parseInt(value.toString());
      }
    }

    this.formGroup.get('scoreResult').setValue(sum);
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
   * 試合合計点を元にPK入力制御の設定を行う
   */
  public onChangeScoreResult(): void {
    if(this.formGroup.get('scoreResult').value != this.oppScoreResult) {
      // 選択チームと相手チームの試合合計点が一致しない場合PK入力不可にする
      this.formGroup.get('scorePK').disable();
    } else {
      // 一致した場合PK入力を可能にする
      this.formGroup.get('scorePK').enable();
    }
  }
}
