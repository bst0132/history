import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormBuilder, ValidatorFn } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from '../../common/common.service';
import { PlayerInfo, PlayerSearchResult } from 'defs/api';
import type { ObjectId } from 'mongodb';
import { CNS, sports } from '../../common/defines';
import { MSG } from '../../common/message-defines';

@Component({
  selector: 'app-player-list',
  templateUrl: './player-list.component.html',
  styleUrls: ['./player-list.component.scss']
})
export class PlayerListComponent implements OnInit {

  playerList: PlayerInfo[];

  playerInfo: PlayerSearchResult;

  invitedPlayerList: ObjectId[];

  searchType: 'team' | 'user';

  formGroup: UntypedFormGroup;

  sports = sports;

  msg = MSG;

  /**
   *  選手名、チーム名入力必須チェック
   * @param group
   */
  private InputValidator = (group: UntypedFormGroup): ValidatorFn => {

    let result = null;

    if(!group.get('playerName').value && !group.get('teamName').value) {
      // 選手名とチーム名のどちらも入力されていない場合エラー
      result = {
        'eitherRequired' : true
      };
    }
    return result;
  }

  constructor(private commonService: CommonService,
    private formBuilder: UntypedFormBuilder,
    private activate: ActivatedRoute) {

      activate.paramMap.subscribe(params => {
        this.searchType = params.get('searchType') as 'team' | 'user';
        this.playerList = [];
        this.invitedPlayerList = [];
        this.playerInfo = null;

        // チームからの遷移時
        if (this.searchType == 'team') {
          this.formGroup = formBuilder.group({
            userUniqueID: ['', [Validators.required, Validators.pattern(/^(?=.*?[a-zA-Z])(?=.*?\d)[a-zA-Z\d]{8,20}$/)]]
          });
        } else if (this.searchType =='user') {
          this.formGroup = formBuilder.group({
            sports: [sports[0].key, Validators.required],
            playerName: [''],
            teamName: ['']
          }, {
            validators: this.InputValidator
          });
        }
      });
  }

  async ngOnInit(): Promise<void> {
    if (this.searchType == 'team') {
      try {
        const res = await this.commonService.apiPost('team/getInvitedPlayer', {
          teamId: this.commonService.getEditInfo().id
        }).toPromise();
        this.invitedPlayerList = res.invitedPlayer;
      } catch(e) {
        await this.commonService.errorOnService(CNS.targetTypePlayer + CNS.targetTypeInformation, CNS.actionTypeGet);
        this.commonService.navigateBack();
      }
    }
  }

  async onSearch(): Promise<void> {
    const data = this.formGroup.value;

    // 選手検索の場合
    if(this.searchType == 'user') {
      try {
        const res = await this.commonService.apiPost('user/playerList', data).toPromise();
        this.playerList = res.playerList;
      } catch(e) {
        await this.commonService.errorOnService(CNS.targetTypePlayer, CNS.actionTypeSearch);
      }
    // 選手招待の場合
    } else if(this.searchType == 'team') {
      try {
        const res = await this.commonService.apiPost('team/playerList', data).toPromise();
        this.playerInfo = res.playerInfo;
      } catch(e) {
        await this.commonService.errorOnService(CNS.targetTypePlayer, CNS.actionTypeSearch);
      }
    }
  }

  async invitePlayer(player: PlayerSearchResult): Promise<void> {

    // 確認ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.inviteConfirmation.replace('※1',player.playerName));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    // 選手招待を送る
    try {
      const res = await this.commonService.apiPost('team/invitePlayer', {
        userId: player.id,
        teamId: this.commonService.getEditInfo().id
      }).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.inviteTitle, this.msg.inviteDone.replace('※1',player.playerName));
        // 招待済みユーザーデータの更新
        this.invitedPlayerList = res.invitedPlayer;
      } else {
        await this.commonService.errorOnApp();
      }
    } catch(e) {
      await this.commonService.errorOnService(player.playerName, CNS.actionTypeInvite);
    }
  }

  isInvited(player: PlayerSearchResult): boolean {
    return (this.invitedPlayerList.indexOf(player.id) > -1);
  }

  /**
   * 所属選手判定
   * @return true: 所属 / false: 未所属
   */
  belongToTeam(player: PlayerSearchResult): boolean {
    const chkPlayer = this.commonService.getEditInfo().players.find(players => {
      return players.userId == player.id;
    });
    return chkPlayer? true : false;
  }

  /**
   * 戻るボタン押下時処理
   */
  public onClickBack(): void {
    this.commonService.navigateBack();
  }

}
