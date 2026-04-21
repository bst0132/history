import { Component, ViewChild } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormArray, Validators } from '@angular/forms';
import { CommonService } from 'client/app/common/common.service';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MSG } from '../../../common/message-defines';
import { CompDetailInf, TeamInfo, GetGameGroupsRes, ParticipatingTeamListInfo } from 'defs/api';
import { CNS } from '../../../common/defines';
import { CompetitionCommonTournamentComponent } from '../../competition/competition-common/competition-common-tournament/competition-common-tournament.component';
import { ActivatedRoute, Params, Router } from '@angular/router';

@Component({
  selector: 'app-reference-competition-tournament',
  templateUrl: './reference-competition-tournament.component.html',
  styleUrls: ['./reference-competition-tournament.component.scss']
})
export class ReferenceCompetitionTournamentComponent {
  formGroup: UntypedFormGroup;

  compInfo: CompDetailInf;

  teamList: TeamInfo[];

  secondMatchCount = 0;

  msg = MSG;

  cns = CNS;

  // 編集権限フラグ
  canEdit = false;

  /** 試合参加チーム情報 */
  teamInfo: ParticipatingTeamListInfo[] = [];

  /** 試合情報 */
  gameInfo: GetGameGroupsRes;

  encryptedCompId: string;

  encryptedDate: string;

  encryptedGameId: string;

  @ViewChild(CompetitionCommonTournamentComponent)
  protected competitionCommonTournamentComponent: CompetitionCommonTournamentComponent;

  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder, private dialog: MatDialog, private route: ActivatedRoute, public router: Router) {
    // コントローラの設定(新規登録時はgroupPlaceNumをサーバ側で設定)
    this.formGroup = formBuilder.group({
      gameGroupId: [],
      compId: ['', [Validators.required]],
      gameSystem: [CNS.tournament, [Validators.required]],
      gameGroupTitle: ['', [Validators.required, Validators.maxLength(20)]],
      teamCount: [null, [Validators.required]],
      groupPlaceNum: [null],
      gameStartedFlg: [false],
      gameGroupInf: new UntypedFormArray([])
    });
  }

  // 初期処理
  public async ngOnInit(): Promise<void> {
    this.route.queryParams.subscribe((params: Params) => {
      this.encryptedCompId = params.param1;
      this.encryptedDate = params.param2;
      this.encryptedGameId = params.param3;
    });

    // 遷移元から引き継ぎ情報（大会ID、有効期限、試合ID）を受け取り、異常があればログイン画面へ遷移する
    if (this.encryptedCompId === '' || this.encryptedDate === '' || this.encryptedGameId === '') {
      this.commonService.navigateToLoginFromRef();
      return;
    }

    try {

      // 大会参加チーム取得処理
      const res = await this.commonService.apiPost('teamGameRecord/getParticipatingTeamListForGuest', {compId: this.encryptedCompId.toString()}).toPromise();

      // 異常があれば大会要綱画面(参照用)・スケジュールタブに戻る
      if (res.result != 'ok') {
        await this.commonService.errorOnApp();
        this.navigateReferenceCompetitionGuide();
        return;
      }

      // 取得したデータをフォーム・変数に設定する（teamId,recordId,teamNameの設定）
      this.setPartTeam(res.participatingTeamList);

    } catch (e) {
      await this.commonService.errorOnService(CNS.targetTypeGameTeam, CNS.actionTypeGet);
      this.navigateReferenceCompetitionGuide();
      return;
    }

    // gameGroupsのDB情報取得用
    let res: GetGameGroupsRes;

    try {
      // 試合情報の取得処理
      res = await this.commonService.apiPost('gameInf/getGameGroupInfoForGuest', {gameId: this.encryptedGameId.toString()}).toPromise();
      // 異常があれば大会要綱画面に戻る
      if (res.result != 'ok') {
        await this.commonService.errorOnApp();
        this.navigateReferenceCompetitionGuide();
        return;
      }
    } catch (e) {
      await this.commonService.errorOnService(CNS.targetTypeGame + CNS.targetTypeInformation, CNS.actionTypeGet);
      this.navigateReferenceCompetitionGuide();
      return;
    }

    // フォームにgameGroupInf配列以外の値を設定
    this.formGroup.patchValue({
      gameGroupId: res.gameGroupInfo._id,
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
          criteriaScore: resElm?.criteriaScore != null ? resElm.criteriaScore : null,
          criteriaTeamName: criteriaTeamName,
          criteriaNoEntry: resElm?.criteriaNoEntry,
          criteriaWinFlg: resElm?.criteriaWinFlg,
          opponentRecordId: resElm?.opponentRecordId ? resElm.opponentRecordId : null,
          opponentScore: resElm?.opponentScore != null ? resElm.opponentScore : null,
          opponentTeamName: opponentTeamName,
          opponentNoEntry: resElm?.opponentNoEntry,
          freeText: resElm?.freeText
        });
      }
    });
  }

  /**
   * gameGroupInfのgetter
   */
  get getgameGroupInf(): UntypedFormArray {
    return this.formGroup.get('gameGroupInf') as UntypedFormArray;
  }

  /**
   * 大会要綱画面(参照用)・スケジュールタブへの遷移処理
   */
  public navigateReferenceCompetitionGuide(): void {
    const queryParams = {params1: this.encryptedCompId, params2: this.encryptedDate, tab: 'schedule'};

    this.commonService.navigateForRef(CNS.pathToReferenceCompetitionGuide, queryParams);
  }

  /**
   *  戻るボタン押下時処理/大会要綱画面(参照用)・スケジュール遷移処理
   */
  public async onClickBack(): Promise<void> {
    this.navigateReferenceCompetitionGuide();
  }

  /**
   *  トーナメント情報設定処理
   */
  public tournamentDetail(secondMatchCount: number): void {
    const count = Number(this.formGroup.value.teamCount);

    // // 試合情報入力ボタン用index調整
    this.secondMatchCount = secondMatchCount;

    // // gameGroupInf初期化
    this.getgameGroupInf.clear();

    // // 試合情報保持配列
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

}
