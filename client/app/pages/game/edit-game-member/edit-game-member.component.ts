import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormArray } from '@angular/forms';
import { GameInfo, CompInfo, GamePlayerInfo, TeamInfo, OrganInfo } from 'defs/api';
import { TeamHistory } from 'defs';
import { CNS } from 'client/app/common/defines';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-edit-game-member',
  templateUrl: './edit-game-member.component.html',
  styleUrls: ['./edit-game-member.component.scss']
})
export class EditGameMemberComponent implements OnInit {

  formGroup: UntypedFormGroup;

  game: GameInfo;

  competition: CompInfo;

  playerInfo: GamePlayerInfo[];

  teamHisList: Pick<TeamHistory, 'userID' | 'teamPosition' | 'teamSportsHisInf'>[];

  teamList: TeamInfo[];

  organList: OrganInfo[];

  teamID: string;

  msg = MSG;

  /**
   * コンストラクタ
   * @param commonService
   * @param formBuilder
   */
  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    this.formGroup = this.formBuilder.group({
      playerInfo: this.formBuilder.array([])
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
      const res = await this.commonService.apiPost('game/editGameMemberInit', {
        gameID: editInfo.id,
        type: editInfo.type,
        teamID: this.teamID
      }).toPromise();

      // 取得情報の設定
      this.game = res.game;
      this.competition = res.competition;
      this.playerInfo = res.playerInfo;
      this.teamHisList = res.teamHis;
      this.teamList = res.team;
      this.organList = res.organ;

      // フォーム初期化
      this.formGroup = this.formBuilder.group({
        playerInfo: this.formBuilder.array([])
      });

      // 選手分のフォームグループを生成
      const formArray = this.formGroup.get('playerInfo') as UntypedFormArray;
      res.playerInfo.forEach(player => {

        const team = this.game.teamInfo.find(team => {
          return team.teamID == this.teamID;
        });
        const teamHis = this.teamHisList.find(teamHis => {
          return teamHis.userID == player.userID.toString();
        });
        if(!team.entrantInfo) {
          formArray.push(this.formBuilder.group({
            userID: [player.userID],
            teamPosition: [teamHis.teamPosition],
            playerName: [`${player.playerInf.lastName} ${player.playerInf.firstName}`],
            uniNum: [teamHis.teamSportsHisInf.uniNum],
            gamePosition: [teamHis.teamSportsHisInf.gamePosition],
            entrantStatus: ['']
          }));
          return;
        }
        const entInfo = team.entrantInfo.find(entInfo => {
          return entInfo.userID == player.userID.toString();
        });

        formArray.push(this.formBuilder.group({
          userID: [player.userID],
          teamPosition: [teamHis.teamPosition],
          playerName: [`${player.playerInf.lastName} ${player.playerInf.firstName}`],
          uniNum: [entInfo.uniNum],
          gamePosition: [entInfo.gamePosition],
          entrantStatus: [entInfo.entrantStatus]
        }));
      });

    } catch(e) {
      this.commonService.errorOnApi(e);
      this.commonService.navigateBack();
    }

  }

  /**
   * 試合情報変更処理
   */
  public async modGameMemberInf(): Promise<void> {

    // フォームの情報を設定
    const form = this.formGroup.value;

    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.updateConfirmation.replace('※1','試合メンバー情報'));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // 試合情報変更処理
      const res = await this.commonService.apiPost('game/modGameMemberInf', {
        form: form,
        gameID: this.game.gameID,
        teamID: this.teamID,
        teamInf: this.teamList,
        compId: this.competition.compId
      }).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.updateDoneTitle, this.msg.updateDone.replace('※1','試合メンバー情報'));

        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();

        this.commonService.navigateWithEdit(CNS.pathToGameDetail, {
          id: this.commonService.getEditInfo().id,
          type: CNS.infoTypeGame
        });
      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.updateErr.replace('※1','試合メンバー情報'));
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
   * 監督を抽出する処理
   */
  public getManager(): string {
    const teamHis = this.teamHisList.find(teamHis => {
      return teamHis.teamPosition == '監督';
    });
    if(!teamHis) {
      return '';
    }
    if(teamHis.userID) {
      const user = this.playerInfo.find(player => {
        return player.userID.toString() == teamHis.userID;
      });
      if(user) {
        return `${user.playerInf.lastName} ${user.playerInf.firstName}`;
      } else {
        return '';
      }
    } else {
      return '';
    }
  }

  /**
   * menberのgetter
   */
  get getPlayer(): UntypedFormArray {
    return this.formGroup.get('playerInfo') as UntypedFormArray;
  }

}
