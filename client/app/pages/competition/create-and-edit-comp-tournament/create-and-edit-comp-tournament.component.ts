import { Component, ViewChild } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormArray, Validators } from '@angular/forms';
import { CommonService } from 'client/app/common/common.service';
import { InputMatchDialogComponent } from '../../../dialog/input-match-dialog/input-match-dialog.component';
import { InputMatchTeamDialogComponent } from '../../../dialog/input-match-team-dialog/input-match-team-dialog.component';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MSG } from '../../../common/message-defines';
import { CompDetailInf, TeamInfo, GetGameGroupsRes, ParticipatingTeamListInfo } from 'defs/api';
import { CNS } from '../../../common/defines';
import { GameGroups } from 'defs/entity';
import { CompetitionCommonTournamentComponent } from '../../competition/competition-common/competition-common-tournament/competition-common-tournament.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-create-and-edit-comp-tournament',
  templateUrl: './create-and-edit-comp-tournament.component.html',
  styleUrls: ['./create-and-edit-comp-tournament.component.scss']
})
export class CreateAndEditCompTournamentComponent {
  formGroup: UntypedFormGroup;
  compInfo: CompDetailInf;
  teamList: TeamInfo[];
  secondMatchCount = 0;
  msg = MSG;
  cns = CNS;
  editInfo = this.commonService.getEditInfo();
  // 新規登録フラグ(true:新規登録、false:編集)
  newGameFlg = false;

  // 編集権限フラグ
  canEdit;

  // 試合参加チーム選択フラグ格納用
  allTeamsSelectedFlg: boolean = false;

  /** 試合Id判別用リスト */
  gameCombinationList = {
    combo4: [{gameId: 2, criteria: 0, opponent: 1}],
    combo8: [{gameId: 4, criteria: 0, opponent: 1}, {gameId: 5, criteria: 2, opponent: 3}, {gameId: 6, criteria: 4, opponent: 5}],
    combo16:[{gameId: 8, criteria: 0, opponent: 1}, {gameId: 9, criteria: 2, opponent: 3}, {gameId: 10, criteria: 4, opponent: 5}, {gameId: 11, criteria: 6, opponent: 7}, {gameId: 12, criteria: 8, opponent: 9}, {gameId: 13, criteria: 10, opponent: 11}, {gameId: 14, criteria: 12, opponent: 13}],
    combo32:[{gameId: 16, criteria: 0, opponent: 1}, {gameId: 17, criteria: 2, opponent: 3}, {gameId: 18, criteria: 4, opponent: 5}, {gameId: 19, criteria: 6, opponent: 7}, {gameId: 20, criteria: 8, opponent: 9}, {gameId: 21, criteria: 10, opponent: 11}, {gameId: 22, criteria: 12, opponent: 13}, {gameId: 23, criteria: 14, opponent: 15}, {gameId: 24, criteria: 16, opponent: 17}, {gameId: 25, criteria: 18, opponent: 19}, {gameId: 26, criteria: 20, opponent: 21}, {gameId: 27, criteria: 22, opponent: 23}, {gameId: 28, criteria: 24, opponent: 25}, {gameId: 29, criteria: 26, opponent: 27}, {gameId: 30, criteria: 28, opponent: 29}],
    combo64:[{gameId: 32, criteria: 0, opponent: 1}, {gameId: 33, criteria: 2, opponent: 3}, {gameId: 34, criteria: 4, opponent: 5}, {gameId: 35, criteria: 6, opponent: 7}, {gameId: 36, criteria: 8, opponent: 9}, {gameId: 37, criteria: 10, opponent: 11}, {gameId: 38, criteria: 12, opponent: 13}, {gameId: 39, criteria: 14, opponent: 15}, {gameId: 40, criteria: 16, opponent: 17}, {gameId: 41, criteria: 18, opponent: 19}, {gameId: 42, criteria: 20, opponent: 21}, {gameId: 43, criteria: 22, opponent: 23}, {gameId: 44, criteria: 24, opponent: 25}, {gameId: 45, criteria: 26, opponent: 27}, {gameId: 46, criteria: 28, opponent: 29}, {gameId: 47, criteria: 30, opponent: 31}, {gameId: 48, criteria: 32, opponent: 33}, {gameId: 49, criteria: 34, opponent: 35}, {gameId: 50, criteria: 36, opponent: 37}, {gameId: 51, criteria: 38, opponent: 39}, {gameId: 52, criteria: 40, opponent: 41}, {gameId: 53, criteria: 42, opponent: 43}, {gameId: 54, criteria: 44, opponent: 45}, {gameId: 55, criteria: 46, opponent: 47}, {gameId: 56, criteria: 48, opponent: 49}, {gameId: 57, criteria: 50, opponent: 51}, {gameId: 58, criteria: 52, opponent: 53}, {gameId: 59, criteria: 54, opponent: 55}, {gameId: 60, criteria: 56, opponent: 57}, {gameId: 61, criteria: 58, opponent: 59}, {gameId: 62, criteria: 60, opponent: 61}]
  };

  /** 試合参加チーム情報 */
  teamInfo: ParticipatingTeamListInfo[] = [];

  /** 試合ID判別用配列 */
  scaleList: {
    gameId: number;
    criteria: number;
    opponent: number;
  }[] = [];

  @ViewChild(CompetitionCommonTournamentComponent)
  protected competitionCommonTournamentComponent: CompetitionCommonTournamentComponent;

  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder, private dialog: MatDialog) {
    // コントローラの設定(新規登録時はgroupPlaceNumをサーバ側で設定)
    this.formGroup = formBuilder.group({
      gameGroupId: [],
      compId: ['', [Validators.required]],
      gameSystem: [CNS.tournament, [Validators.required]],
      gameGroupTitle: ['', [Validators.required, Validators.maxLength(20)]],
      teamCount: [null, [Validators.required]],
      groupPlaceNum: [null],
      competitionNumber: [''],
      gameStartedFlg: [false],
      gameGroupInf: new UntypedFormArray([])
    });
  }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {

    // 遷移元から引き継ぎ情報（大会ID、登録種別、試合方式）を受け取り、異常があればログイン画面へ遷移する
    if (!this.editInfo || this.editInfo?.gameSystem !== CNS.tournament || this.editInfo?.type !== 'competition') {
      this.commonService.navigateToLogin();
      return;
    }

    // 大会ID存在判定(遷移元から試合IDを引き継いでいれば編集、引き継いでいなければ新規登録)
    this.newGameFlg = this.editInfo.gameId ? false : true;

    // 編集権限フラグ設定
    this.canEdit = this.editInfo.canEdit;

    try {
      // 大会参加チーム取得処理
      const res = await this.commonService.apiPost('teamGameRecord/getParticipatingTeamListForAdmin', {compId: this.editInfo.id.toString()}).toPromise();

      // 異常があれば大会要綱画面・スケジュールタブに戻る
      if (res.result != 'ok') {
        await this.commonService.errorOnApp();
        this.navigateCompetitionGuide();
        return;
      }

      // 取得したデータをフォーム・変数に設定する（teamId,recordId,teamNameの設定）
      this.setPartTeam(res.participatingTeamList);

    } catch (e) {
      await this.commonService.errorOnServiceTransition(CNS.pathToCompetitionGuide, {
        id: this.editInfo.id,
        type: 'competition'
      },
      CNS.targetTypeGameTeam,
      CNS.actionTypeGet);
      return;
    }

    // 新規登録の場合は大会IDのみフォームに設定し、後続の処理を行わない
    if (this.newGameFlg) {
      this.formGroup.get('compId').setValue(this.editInfo.id);
      return;
    }

    // gameGroupsのDB情報取得用
    let res: GetGameGroupsRes;

    try {
      // 編集する試合情報の取得処理
      res = await this.commonService.apiPost('gameInf/getGameGroupInfoForAdmin', {gameId: this.editInfo.gameId.toString()}).toPromise();
      // 異常があれば大会要綱画面に戻る
      if (res.result != 'ok') {
        await this.commonService.errorOnApp();
        this.navigateCompetitionGuide();
        return;
      }
    } catch (e) {
      await this.commonService.errorOnServiceTransition(CNS.pathToCompetitionGuide, {
        id: this.editInfo.id,
        type: 'competition'
      },
      CNS.targetTypeGame + CNS.targetTypeInformation,
      CNS.actionTypeGet);
      return;
    }

    // フォームにgameGroupInf配列以外の値を設定
    this.formGroup.patchValue({
      gameGroupId: this.editInfo.gameId,
      compId: res.gameGroupInfo.compId,
      gameSystem: res.gameGroupInfo.gameSystem,
      gameGroupTitle: res.gameGroupInfo.gameGroupTitle,
      teamCount: res.gameGroupInfo.teamCount,
      groupPlaceNum: res.gameGroupInfo.groupPlaceNum,
      gameStartedFlg: res.gameGroupInfo.gameStartedFlg
    });

    // トーナメント情報・フォームグループ・コントローラーを設定
    this.competitionCommonTournamentComponent.tournamentDetail();

    // フォームに各試合情報の配列情報を設定
    this.getgameGroupInf.value.map((baseElm, index) => {
      for (const resElm of res.gameGroupInfo.gameGroupInf) {
        // 試合配置番号が一致する場合のみデータ格納処理を行う
        if (resElm.gameId !== baseElm.gameId) {
          continue;
        }
        // recordIdを使ってteamInfoからチーム情報を取得する
        const criteriaTeam = this.teamInfo.find((teamInfo) => teamInfo.recordId === resElm?.criteriaRecordId);
        const opponentTeam = this.teamInfo.find((teamInfo) => teamInfo.recordId === resElm?.opponentRecordId);
        // チーム情報からチーム名を取得
        const criteriaTeamName = criteriaTeam?.teamName;
        const opponentTeamName = opponentTeam?.teamName;
        // 各試合情報を設定する
        this.formGroup.get(['gameGroupInf', index]).patchValue({
          gameDate: resElm?.gameDate,
          gamePlace: resElm?.gamePlace,
          gameStartTime: resElm?.gameStartTime !== undefined ? resElm?.gameStartTime : null,
          gameProgressStatus: resElm?.gameProgressStatus,
          criteriaRecordId: resElm?.criteriaRecordId ? resElm.criteriaRecordId : null,
          criteriaTeamId: resElm?.criteriaTeamId ? resElm.criteriaTeamId : null,
          criteriaScore: resElm?.criteriaScore != null ? resElm.criteriaScore : null,
          criteriaTeamName: criteriaTeamName,
          criteriaNoEntry: resElm?.criteriaNoEntry,
          criteriaWinFlg: resElm?.criteriaWinFlg,
          opponentRecordId: resElm?.opponentRecordId ? resElm.opponentRecordId : null,
          opponentTeamId: resElm?.opponentTeamId ? resElm.opponentTeamId : null,
          opponentScore: resElm?.opponentScore != null ? resElm.opponentScore : null,
          opponentTeamName: opponentTeamName,
          opponentNoEntry: resElm?.opponentNoEntry,
          freeText: resElm?.freeText
        });
      }
    });

    // 試合参加チーム選択フラグ格納
    this.allTeamsSelectedFlg = this.selectedTeamsCheck();

  }

  /**
   * gameGroupInfのgetter
   */
  get getgameGroupInf(): UntypedFormArray {
    return this.formGroup.get('gameGroupInf') as UntypedFormArray;
  }

  /**
   * 試合参加チーム取得処理後 データ設定
   */
  public setPartTeam(partTeams: ParticipatingTeamListInfo[]): void {
    // 試合参加チーム情報をフォームに設定
    partTeams.map(elm => {
      this.teamInfo.push({
        recordId: elm.recordId,
        teamName: elm.teamName,
        teamId: elm.teamId
      });
    });
  }

  /**
   *  試合情報取得処理
   */
  public async onClickInputMatch(i: number): Promise<void> {
    // gameGroupInfへのアクセス用
    const control = this.getgameGroupInf.at(i);

    // 試合情報設定ダイアログ表示時の処理
    const res = await this.dialog.open(InputMatchDialogComponent, {
      data: {
        gameId: i,
        gameDate: control.value.gameDate,
        gamePlace: control.value.gamePlace,
        gameProgressStatus: control.value.gameProgressStatus,
        gameStartTime: control.value.gameStartTime,
        criteriaScore: control.value.criteriaScore,
        opponentScore: control.value.opponentScore,
        criteriaWinFlg: control.value.criteriaWinFlg,
        freeText: control.value.freeText,
        gameStartedFlg: this.getGameStartedFlg
      }
    });

    // 試合情報設定ダイアログ表示後の処理
    res.afterClosed().subscribe((response) => {
      if (response) {
        // 変更がある場合フォームに変更済フラグを立てる
        this.formGroup.markAsDirty();
        control.patchValue({
          gameId: response.gameId,
          gameDate: response.gameDate,
          gamePlace: response.gamePlace,
          gameProgressStatus: response.gameProgressStatus,
          gameStartTime: response.gameStartTime,
          criteriaScore: response.criteriaScore,
          opponentScore: response.opponentScore,
          criteriaWinFlg: response.criteriaWinFlg,
          freeText: response.freeText
        });
      }
    });
  }

  /**
   *  チーム名取得処理
   */
  public async onClickInputMatchTeam(inputData: {i: number; criteriaFlg: boolean}): Promise<void> {

    const control = this.getgameGroupInf.at(inputData.i);
    const teams = [];

    // 参加チームの配列作成
    for (let i = 0; i < this.teamInfo.length; i++) {
      teams.push({joinTeamName: this.teamInfo[i].teamName, recordId: this.teamInfo[i].recordId, teamId: this.teamInfo[i].teamId});
    }

    // チーム設定ダイアログ表示時の処理
    const res = await this.dialog.open(InputMatchTeamDialogComponent, {
      data: {
        teamName: inputData.criteriaFlg? control.value.criteriaTeamName : control.value.opponentTeamName,
        teamId: inputData.criteriaFlg? control.value.criteriaTeamId : control.value.opponentTeamId,
        recordId: inputData.criteriaFlg? control.value.criteriaRecordId : control.value.opponentRecordId,
        noEntry: inputData.criteriaFlg? control.value.criteriaNoEntry : control.value.opponentNoEntry,
        teams: teams
      }
    });

    // チーム設定ダイアログ表示後の処理
    res.afterClosed().subscribe((response) => {
      if (response) {
        // 変更がある場合フォームに変更済フラグを立てる
        this.formGroup.markAsDirty();
        if (inputData.criteriaFlg) {
          control.patchValue({
            criteriaTeamName: response.teamName,
            criteriaTeamId: response.teamId,
            criteriaRecordId: response.recordId,
            criteriaNoEntry: response.noEntry,
            gameProgressStatus: CNS.beforeGame
          });
        } else {
          control.patchValue({
            opponentTeamName: response.teamName,
            opponentTeamId: response.teamId,
            opponentRecordId: response.recordId,
            opponentNoEntry: response.noEntry,
            gameProgressStatus: CNS.beforeGame
          });
        }

        // 試合参加チーム選択フラグ格納
        this.allTeamsSelectedFlg = this.selectedTeamsCheck();
      }

      // 不参加チームを選択していた場合には試合情報を初期化
      if (control.value.criteriaNoEntry || control.value.opponentNoEntry){
        control.patchValue({
          gameDate: '',
          gamePlace: '',
          gameStartTime: null,
          gameProgressStatus: CNS.afterGame
        });
      }

      // 2回戦目以降の各試合の不参加チームを設定
      /**
       * 1回戦目には不参加チームを設定しているので、それを元に2回戦目以降に設定
       * 初期値はsecondMatchCountに設定し、繰り返し処理を2回戦目から始める
       */
      for (let matchIndex = this.secondMatchCount; matchIndex < this.getgameGroupInf.length; matchIndex++) {
        // scaleList内の各試合をチェック
        for (let j = 0; j < this.scaleList.length; j++) {
          if(matchIndex == this.scaleList[j].gameId) {
            // 試合IDが古く両チームとも不参加の場合
            if (this.formGroup.value.gameGroupInf[this.scaleList[j].criteria].criteriaNoEntry && this.formGroup.value.gameGroupInf[this.scaleList[j].criteria].opponentNoEntry) {
              this.getgameGroupInf.at(matchIndex).patchValue({
                criteriaNoEntry: true,
                gameDate: '',
                gamePlace: '',
                gameStartTime: null,
                gameProgressStatus: CNS.afterGame
              });
            } else {
              this.getgameGroupInf.at(matchIndex).patchValue({
                criteriaNoEntry: false
              });
            }
            // 試合IDが新しく両チームとも不参加の場合
            if (this.formGroup.value.gameGroupInf[this.scaleList[j].opponent].criteriaNoEntry && this.formGroup.value.gameGroupInf[this.scaleList[j].opponent].opponentNoEntry) {
              this.getgameGroupInf.at(matchIndex).patchValue({
                opponentNoEntry: true,
                gameDate: '',
                gamePlace: '',
                gameStartTime: null,
                gameProgressStatus: CNS.afterGame
              });
            } else {
              this.getgameGroupInf.at(matchIndex).patchValue({
                opponentNoEntry: false
              });
            }
          }
        }
      }

      // 不参加チームの選択によって勝利チームフラグを設定する
      for (let i = 0; i < this.getgameGroupInf.length; i++) {
        if (this.getgameGroupInf.at(i).value.criteriaNoEntry && !this.getgameGroupInf.at(i).value.opponentNoEntry) {
          this.getgameGroupInf.at(i).patchValue({
            criteriaWinFlg: false
          });
        } else if (!this.getgameGroupInf.at(i).value.criteriaNoEntry && this.getgameGroupInf.at(i).value.opponentNoEntry) {
          this.getgameGroupInf.at(i).patchValue({
            criteriaWinFlg: true
          });
        } else {
          this.getgameGroupInf.at(i).patchValue({
            criteriaWinFlg: null
          });
        }
      }
    });
  }

  /**
   * 初期状態からページの編集がされたか判定
   */
  public canDeactive(): boolean {
    return !this.formGroup.dirty;
  }

  /**
   *  戻るボタン押下時処理/大会要綱画面・スケジュール遷移処理
   */
  public async onClickBack(): Promise<void> {
    this.navigateCompetitionGuide();
  }

  // gameStartedFlgのgetter
  get getGameStartedFlg(): boolean {
    return this.formGroup.controls.gameStartedFlg.value as boolean;
  }

  public async onClickGameStart(): Promise<void>{
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.startGame.replace('※1', CNS.targetTypeTournament));
    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }
    // 試合開始フラグをtrue（試合開始済み）に変更
    this.formGroup.controls.gameStartedFlg.setValue(true);

    // 編集済み状態に変更
    this.formGroup.markAsDirty();

    // 確認ダイアログ表示
    await this.commonService.openNoticeDialog(this.msg.startDoneTitle, this.msg.startDone.replace('※1', CNS.targetTypeTournament));
  }

  /**
   *  トーナメント情報設定処理
   */
  public tournamentDetail(secondMatchCount: number): void {
    const count = Number(this.formGroup.value.teamCount);

    // 試合情報入力ボタン用index調整
    this.secondMatchCount = secondMatchCount;

    // gameGroupInf初期化
    this.getgameGroupInf.clear();

    // 試合情報保持配列
    for (let j = 1, i = 0; j < count; j++, i++) {
      this.getgameGroupInf.push(this.formBuilder.group({
        gameId: [i],
        gameDate: [''],
        gamePlace: ['', [Validators.maxLength(50)]],
        gameStartTime: [null],
        gameProgressStatus: [CNS.beforeGame],
        criteriaScore: [null, [Validators.min(0), Validators.max(200), Validators.pattern(/^([1-9]\d*|0)$/)]],
        criteriaRecordId: [null],
        criteriaTeamId: [null],
        criteriaTeamName: [''],
        criteriaNoEntry: false,
        criteriaWinFlg: null,
        opponentScore: [null, [Validators.min(0), Validators.max(200), Validators.pattern(/^([1-9]\d*|0)$/)]],
        opponentRecordId: [null],
        opponentTeamId: [null],
        opponentTeamName: [''],
        opponentNoEntry: false,
        freeText: ['', [Validators.maxLength(50)]]
      }));
    }

    // 大会規模に応じてscaleListを設定
    switch (count) {
      case 4:
        this.scaleList = this.gameCombinationList.combo4;
        break;
      case 8:
        this.scaleList = this.gameCombinationList.combo8;
        break;
      case 16:
        this.scaleList = this.gameCombinationList.combo16;
        break;
      case 32:
        this.scaleList = this.gameCombinationList.combo32;
        break;
      case 64:
        this.scaleList = this.gameCombinationList.combo64;
        break;
    }
  }

  /**
   * 選択チームの重複確認
   */
  public async hasDupTeam(): Promise<boolean> {
    // 大会規模
    const teamCount = this.formGroup.value.teamCount;
    // 選択されているチーム(不参加チームのnullも含む)のrecordId格納用
    const allSelectedTeams = [];
    // first-roundのgameGroupInfの数分(大会規模/2)のcriteriaRecordIdとopponentRecordIdをselectedTeams変数へ
    for (let i = 0; i < teamCount/2; i++) {
      allSelectedTeams.push(this.formGroup.value.gameGroupInf[i].criteriaRecordId, this.formGroup.value.gameGroupInf[i].opponentRecordId);
    }
    // 不参加チームのnullを除去
    const selectedTeams = allSelectedTeams.filter(elm => elm != null);
    // 重複しているrecordIdを除去
    const setTeams = new Set(selectedTeams);
    // 除去後のrecordIdの数と元のrecordIdの数を比較
    if (setTeams.size !== selectedTeams.length) {
      // 選択チームの重複注意ダイアログ
      await this.commonService.openNoticeDialog(this.msg.errTitle, '選択したチームに重複があります。');
      return true;
    } else {
      return false;
    }
  }

  /**
   * 選択チーム数＋不参加チーム数と試合チーム数が一致しているか確認する
   */
  public selectedTeamsCheck(): boolean {
    const teamCount = this.formGroup.get('teamCount').value;
    let selectedTeamCount = 0;

    for (let i = 0; i < teamCount/2; i++) {
      if (this.getgameGroupInf.at(i).value.criteriaRecordId !== null || this.getgameGroupInf.at(i).value.criteriaNoEntry) {
        selectedTeamCount++;
      }
      if (this.getgameGroupInf.at(i).value.opponentRecordId !== null || this.getgameGroupInf.at(i).value.opponentNoEntry) {
        selectedTeamCount++;
      }
    }

    return selectedTeamCount === teamCount;
  }

  /**
 * トーナメント情報登録処理
 */
  public async onClickReg(): Promise<void> {
    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.regConfirmation.replace('※1', CNS.targetTypeGame + CNS.targetTypeInformation));

    // キャンセルなら処理中断
    if (!dialog) {
      return;
    }

    // 選択チームの重複確認
    const hasDupTeam = await this.hasDupTeam();
    if (hasDupTeam) {
      return;
    }

    // サーバサイドに送るデータを整形し設定
    const gameGroupsData = this.formatGameData();
    const teamGameRecordsData = this.teamGameRecordsArrange(gameGroupsData);

    const data = {
      gameGroups: gameGroupsData,
      teamGameRecords: teamGameRecordsData
    };

    try {
      // トーナメント情報登録処理
      const res = await this.commonService.apiPost('gameInf/createGameGroups', data).toPromise();

      // サーバサイド処理結果判定
      if (res.result == 'ok') {
        // ダイアログ表示
        await this.commonService.openNoticeDialog(this.msg.regTitle, this.msg.regDone.replace('※1', CNS.targetTypeGame + CNS.targetTypeInformation));

        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();

        // 大会要綱画面に遷移する
        this.navigateCompetitionGuide();

      } else if (res?.message){
        // 試合内容の重複、または、大会に参加しないチームを試合で選択していた場合のエラーダイアログ
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.regErr.replace('※1', CNS.targetTypeGame + CNS.targetTypeInformation) + '\n' + res.message);
        // 登録エラーダイアログ
      } else {
        await this.commonService.errorOnApp();
      }

    } catch (e) {
      await this.commonService.errorOnService(CNS.targetTypeGame + CNS.targetTypeInformation, CNS.actionTypeReg);
    }

  }

  /**
   * トーナメント削除処理
   */
  public async onClickDeleteGame(): Promise<void> {
    const gameGroupTitle = this.formGroup.value.gameGroupTitle;
    // 削除確認ダイアログ
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.delConfirmation.replace('※1', gameGroupTitle));
    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    // サーバサイドに送るデータを設定
    const data = {
      compId: this.editInfo.id,
      gameGroupId: this.editInfo.gameId,
      gameSystem: this.editInfo.gameSystem
    };

    try {
      // 削除処理
      const res = await this.commonService.apiPost('gameInf/delGameGroups', data).toPromise();
      if (res.result == 'ok') {
        // 削除完了ダイアログ
        await this.commonService.openNoticeDialog(this.msg.delDoneTitle, this.msg.delDone.replace('※1', gameGroupTitle));

        // 試合情報削除処理中であることをセット（編集中の画面遷移確認ダイアログ非表示）
        this.commonService.setProgress('deleteGame');

        // 大会要綱画面・スケジュールタブに戻る
        await this.navigateCompetitionGuide();

        // 処理の進捗状態リセット
        this.commonService.setProgress('');
      } else {
        // 削除失敗ダイアログ
        await this.commonService.errorOnApp();
      }
    } catch(e) {
      await this.commonService.errorOnService(gameGroupTitle, CNS.actionTypeDel);
    }
  }

  /**
  * トーナメント情報更新処理
  */
  public async onClickUpdate(): Promise<void> {
    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.updateConfirmation.replace('※1', CNS.targetTypeGame + CNS.targetTypeInformation));

    // キャンセルなら処理中断
    if (!dialog) {
      return;
    }

    // 選択チームの重複確認
    const hasDupTeam = await this.hasDupTeam();
    if (hasDupTeam) {
      return;
    }

    // サーバサイドに送るデータを整形し設定
    const gameGroupsData = this.formatGameData();
    const teamGameRecordsData = this.teamGameRecordsArrange(gameGroupsData);

    const data = {
      gameGroups: gameGroupsData,
      teamGameRecords: teamGameRecordsData
    };

    try {
      // トーナメント情報更新処理
      const res = await this.commonService.apiPost('gameInf/updateGameGroups', data).toPromise();

      // サーバサイド処理結果判定
      if (res.result == 'ok') {
        // ダイアログ表示
        await this.commonService.openNoticeDialog(this.msg.updateDoneTitle, this.msg.updateDone.replace('※1', CNS.targetTypeGame + CNS.targetTypeInformation));

        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();

        // 大会要綱画面に遷移する
        this.navigateCompetitionGuide();

      } else if (res?.message){
        // 試合内容の重複、または、大会に参加しないチームを試合で選択していた場合のエラーダイアログ
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.regErr.replace('※1', CNS.targetTypeGame + CNS.targetTypeInformation) + '\n' + res.message);
        // 登録エラーダイアログ
      } else {
        await this.commonService.errorOnApp();
      }

    } catch (e) {
      await this.commonService.errorOnService(CNS.targetTypeGame + CNS.targetTypeInformation, CNS.actionTypeUpdate);
    }
  }

  /**
   * 大会要綱画面・スケジュールタブへの遷移処理
   */
  public navigateCompetitionGuide(): void {
    this.commonService.navigateWithEdit(CNS.pathToCompetitionGuide, {
      id: this.editInfo.id,
      type: 'competition',
      tab: 'schedule'
    });
  }

  /**
   * 未設定情報の設定、トーナメント情報の整形
   */
  public formatGameData(): object {

    // データ整形を行うためにフォームの値をコピー
    const formValue = _.cloneDeep(this.formGroup.value);

    // 2回戦目以降の各試合のチーム情報設定
    /*
      1回戦目の試合情報は設定完了している為、2回戦目（試合ID＝大会規模/2以降）から設定が始まるように初期値iを設定
      最大ループ回数は大会規模に応じた試合回数
    */
    for (let i = this.secondMatchCount; i < formValue.gameGroupInf.length; i++) {
      // 2回戦目以降のチーム設定をリセット
      formValue.gameGroupInf[i].criteriaRecordId = null;
      formValue.gameGroupInf[i].criteriaTeamId = null;
      formValue.gameGroupInf[i].opponentRecordId = null;
      formValue.gameGroupInf[i].opponentTeamId = null;
      //  scaleListに設定されたデータのgameIdとi(2回戦目以降のgameId)が一致するものを探し、それに設定されているcriteriaとopponentのgameIdを使っていく
      // (scaleListには未設定の試合を判別するための試合ID、対象の試合情報を設定するための事前試合を判別する試合IDが設定されている)
      const settingData = this.scaleList.find((scaleList) => scaleList.gameId === i);
      // settingDataがなければ後のfor文内の処理は行わない
      if (settingData === undefined) {
        continue;
      }
      // 基準チーム勝利フラグの値によって次の試合情報に勝ち上がったチームを設定する(上側/criteria側)
      switch (formValue.gameGroupInf[settingData.criteria].criteriaWinFlg) {
        case true:
          formValue.gameGroupInf[i].criteriaRecordId = formValue.gameGroupInf[settingData.criteria].criteriaRecordId;
          formValue.gameGroupInf[i].criteriaTeamId = formValue.gameGroupInf[settingData.criteria].criteriaTeamId;
          break;

        case false:
          formValue.gameGroupInf[i].criteriaRecordId = formValue.gameGroupInf[settingData.criteria].opponentRecordId;
          formValue.gameGroupInf[i].criteriaTeamId = formValue.gameGroupInf[settingData.criteria].opponentTeamId;
          break;

        default:
          break;
      }
      // 基準チーム勝利フラグの値によって次の試合情報に勝ち上がったチームを設定する(下側/opponent側)
      switch (formValue.gameGroupInf[settingData.opponent].criteriaWinFlg) {
        case true:
          formValue.gameGroupInf[i].opponentRecordId = formValue.gameGroupInf[settingData.opponent].criteriaRecordId;
          formValue.gameGroupInf[i].opponentTeamId = formValue.gameGroupInf[settingData.opponent].criteriaTeamId;
          break;

        case false:
          formValue.gameGroupInf[i].opponentRecordId = formValue.gameGroupInf[settingData.opponent].opponentRecordId;
          formValue.gameGroupInf[i].opponentTeamId = formValue.gameGroupInf[settingData.opponent].opponentTeamId;
          break;

        default:
          break;
      }
    }

    // gameGroupInf配列内整形
    for (let i = 0; i < formValue.gameGroupInf.length; i++) {
      // データ登録時に不要なプロパティを削除
      delete formValue.gameGroupInf[i].criteriaTeamName;
      delete formValue.gameGroupInf[i].opponentTeamName;
    }

    // 参加チーム数はデータ登録時に不要な為削除（※チェック追加時に削除）
    delete formValue.competitionNumber;

    // 新規登録の場合gameGroupsのオブジェクトIDは不要な為削除
    if (this.newGameFlg) {
      delete formValue.gameGroupId;
    }

    return formValue as GameGroups;
  }

  /**
   * サーバ処理に渡すteamGameRecordsデータの整理
   * 登録・更新共通
   * @returns
   */
  public teamGameRecordsArrange(gameGroupsData): object {
    // gameRecordデータ格納用
    const gameRecord = [];
    // 試合グループID格納用
    let id = '';
    // 試合グループIDがあれば格納用に代入(登録時はない)
    if (gameGroupsData.gameGroupId) {
      id = gameGroupsData.gameGroupId;
    }
    // gameGroupInfの情報を使ってperGameInfの形を作成(この段階ではチームのRecordIdも含む・後工程で再度整形)
    // flatMapでcriteriaInfoとopponentInfoそれぞれ個々のオブジェクトとしてperGameInf配列内に格納していく
    const perGameInf = gameGroupsData.gameGroupInf.flatMap((group) => {

      // gameId毎にcriteria側とopponent側それぞれを作成
      // criteria側基準
      const criteriaInfo = {
        criteriaRecordId: group.criteriaRecordId,
        gameId: group.gameId,
        isWon: 0,
        isLost: 0,
        isDrew: 0,
        score: group.criteriaScore !== null ? group.criteriaScore : 0,
        loss: group.opponentScore !== null ? group.opponentScore : 0
      };

      // criteriaWinFlgが設定されている場合、勝負を設定
      if (group.criteriaWinFlg !== null) {
        criteriaInfo.isWon = group.criteriaWinFlg ? 1 : 0;
        criteriaInfo.isLost = !group.criteriaWinFlg ? 1 : 0;
      }

      // opponent側基準
      const opponentInfo = {
        opponentRecordId: group.opponentRecordId,
        gameId: group.gameId,
        isWon: 0,
        isLost: 0,
        isDrew: 0,
        score: group.opponentScore !== null ? group.opponentScore : 0,
        loss: group.criteriaScore !== null ? group.criteriaScore : 0
      };

      // criteriaWinFlgが設定されている場合、勝負を設定
      if (group.criteriaWinFlg !== null) {
        opponentInfo.isWon = !group.criteriaWinFlg ? 1 : 0;
        opponentInfo.isLost = group.criteriaWinFlg ? 1 : 0;
      }

      return [opponentInfo, criteriaInfo];
    });

    // perGameInfの内容をgameRecordにセットし作成していく
    perGameInf.forEach((item) => {
      // チームが未選択ならgameRecordは作成されない
      if (item.criteriaRecordId || item.opponentRecordId) {
        // perGameInfの中身を最終整形
        const perGameInfDetail = {
          gameId: item.gameId,
          isWon: item.isWon,
          isLost: item.isLost,
          isDrew: item.isDrew,
          score: item.score,
          loss: item.loss
        };
        // チーム毎にgameRecordを作成
        const gameRecordIndex = gameRecord.findIndex((record) =>
        record.recordId === item.criteriaRecordId || record.recordId === item.opponentRecordId
        );
        // まだチームのgameRecordが作成されていなければ新たに作成
        if (gameRecordIndex === -1) {
          const newRecord = {
            recordId: item.criteriaRecordId || item.opponentRecordId,
            gameGroupId: id,
            perGameInf: [perGameInfDetail]
          };
          gameRecord.push(newRecord);
        } else {
          // チームのgameRecordが作成済であれば該当チームのgameRecord内perGameInf配列にデータを追加
          gameRecord[gameRecordIndex].perGameInf.push(perGameInfDetail);
        }
      }
    });

    return gameRecord;
  }

}
