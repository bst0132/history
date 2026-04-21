/* eslint-disable no-unsafe-optional-chaining */
import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormArray, Validators } from '@angular/forms';
import { MSG } from 'client/app/common/message-defines';
import { CommonService } from 'client/app/common/common.service';
import { EditPageBase } from '../../EditPageBase';
import { CNS, gameProgressStatuses } from 'client/app/common/defines';
import { ObjectId } from 'mongodb';
import { ParticipatingTeamListInfo, GetGameGroupsRes } from 'defs/api';
import { TeamGameRecord } from 'defs/entity';
import * as _ from 'lodash';

interface TeamStats {
  /** 順位 */
  rank?: number;
  /** 勝ち点 */
  winningPoints?: number;
  /** 合計勝利数 */
  totalWin?: number;
  /** 合計敗北数 */
  totalLost?: number;
  /** 合計引き分け数 */
  totalDrew?: number;
  /** 合計得点 */
  totalScore?: number;
  /** 合計失点 */
  totalLoss?: number;
}

@Component({
  selector: 'app-create-competition-league',
  templateUrl: './create-competition-league.component.html',
  styleUrls: ['./create-competition-league.component.scss']
})
export class CreateCompetitionLeagueComponent extends EditPageBase implements OnInit {

  // 試合グループ情報のフォームグループ
  formGroup: UntypedFormGroup;

  msg = MSG;

  cns = CNS;

  gameProgressStatuses = gameProgressStatuses;

  gameGroupTitle: string;
  teamCount: number;

  // テーブル内セル押下後の入力フォーム表示制御
  canShow = false;

  // 編集権限
  canEdit;

  viewFlg: 'top' | 'left';

  // 開始時間（時間）格納用
  timeHour = {};

  // 開始時間（分）格納用
  timeMinute = {};

  // 参加チーム数格納用
  teamNumber: number[];

  // FormArrayの配列要素番号管理用
  arrayNumber: number;

  // リーグ表の行と列の要素番号管理用
  leagueArray: number[][] = [];

  rowControl: number;

  columnControl: number;

  // teamGameRecord取得データ格納用
  teamGameRecord: TeamGameRecord[] = [];

  // ソート後teamGameRecord格納用
  sortedTeamGameRecord: TeamGameRecord[] = [];

  // チーム別成績格納用
  teamStats: TeamStats[] =[];

  // 順位の選択肢格納用
  rankOptions: number[] =[];

  // 選択されたチーム名格納用(一旦仮で設定、後々変更する可能性大)
  selectedTeamName: string[] = [];

  // 試合参加チーム選択フラグ格納用
  allTeamsSelectedFlg: boolean = false;

  // デバイス判定用変数
  device: 'pc' | 'sp';

  // 共通コンポーネントに渡すデータ
  leagueData: {
    gameGroupTitle: string,
    teamCount: number,
    rank: number[],
    gameGroupInf: [{
      gameDate: string,
      gamePlace: string,
      startTimeHour: number,
      startTimeMinute: number | string,
      gameId: ObjectId,
      criteriaRecordId,
      criteriaScore: number,
      criteriaTeamId: ObjectId,
      opponentRecordId,
      opponentScore: number,
      opponentTeamId: ObjectId,
      gameProgressStatus: string,
      criteriaTeamName: string,
      opponentTeamName: string
    }],
    selectedTeam: TeamGameRecord[],
    selectedTeamName: string[],
    winningPointInf,
    teamStats: TeamStats[],
    arrayNumber: number,
    leagueArray: number[][]
  };

  // 大会参加チームのデータ
  entryTeamList: ParticipatingTeamListInfo[];

  // 新規登録フラグ(true:新規登録、false:編集)
  newGameFlg = false;

  // ログイン情報を取得
  editInfo = this.commonService.getEditInfo();

  // 試合開始日時フォーム 項目間チェック用バリデーター
  startTimeVali = (group: UntypedFormGroup): void => {

    const hour = group.get('startTimeHour').value;
    const minute = group.get('startTimeMinute').value;

    // 「時」未入力・「分」入力済みの場合、hourMissingエラー設定
    if(hour === null && minute !== null) {
      group.get('startTimeHour').setErrors({hourMissing: true});

    // 「時」入力済み・「分」未入力の場合、minuteMissigエラー設定
    } else if (hour !== null && minute === null) {
      group.get('startTimeMinute').setErrors({minuteMissing: true});
    }
  };

  constructor(private formBuilder: UntypedFormBuilder, public commonService: CommonService,) {
    // 基底クラスのコンストラクタを呼び出す
    super(commonService);

    // デバイス判定
    this.device = this.commonService.getDevice();

    // コントローラの設定(新規登録時はgroupPlaceNumをサーバ側で設定)
    this.formGroup = this.formBuilder.group({
      gameGroupId: [],
      compId: ['', [Validators.required]],
      gameSystem: [CNS.league, [Validators.required]],
      gameGroupTitle: ['', [Validators.required, Validators.maxLength(20)]],
      teamCount: [null, [Validators.required, Validators.pattern(/^([1-9]\d*|0)$/)]],
      groupPlaceNum: [null],
      rank: this.formBuilder.array([]),
      gameStartedFlg: [false],
      gameGroupInf: this.formBuilder.array([]),
      selectedTeam: this.formBuilder.array([])
    });

    // 12チームまでチーム数を設定
    this.teamNumber = [...Array(10)].map((_: undefined, index: number) => index);
  }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {

    // 遷移元から引き継ぎ情報（大会ID、登録種別、試合方式）を受け取り、異常があればログイン画面へ遷移する
    if (!this.editInfo || this.editInfo?.gameSystem !== CNS.league || this.editInfo?.type !== 'competition') {
      this.commonService.navigateToLogin();
      return;
    }

    // リーグ新規登録・編集判定(遷移元から試合IDを引き継いでいれば編集、引き継いでいなければ新規登録)
    this.newGameFlg = this.editInfo.gameId ? false : true;

    // 編集権限の設定
    this.canEdit = this.editInfo.canEdit;

    // 試合開始時間表示内容を設定
    [...Array(24)].map((_: undefined, index: number) => this.timeHour[(index).toString().padStart(2, '0')] = index);
    [...Array(60)].map((_: undefined, index: number) => this.timeMinute[(index).toString().padStart(2, '0')] = index);

    try {
      // 大会参加チーム取得処理
      const res = await this.commonService.apiPost('teamGameRecord/getParticipatingTeamListForAdmin', {compId: this.editInfo.id.toString()}).toPromise();

      // 異常があれば大会要綱画面・スケジュールタブに戻る
      if (res.result != 'ok') {
        await this.commonService.errorOnApp();
        this.navigateCompetitionGuide();
        return;
      } else {
        // 取得した参加チームをentryTeamListに設定
        this.entryTeamList = res.participatingTeamList;
      }
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
      // 異常があれば大会要綱画面・スケジュールタブに戻る
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

    try {
      // teamGameRecordデータ取得処理
      const res = await this.commonService.apiPost('teamGameRecord/getTeamGameRecord', {
        recordIds: this.entryTeamList.map(entry => entry.recordId.toString())
      }).toPromise();
      // データ格納
      this.teamGameRecord = res.teamGameRecordRes;

    } catch (e) {
      await this.commonService.errorOnServiceTransition(CNS.pathToCompetitionGuide, {
        id: this.editInfo.id,
        type: 'competition'
      },
      CNS.targetTypeGame + CNS.targetTypeInformation,
      CNS.actionTypeGet);
      return;
    }

    // フォームに配列以外の値を設定
    this.formGroup.patchValue({
      gameGroupId: this.editInfo.gameId,
      compId: res.gameGroupInfo.compId,
      gameSystem: res.gameGroupInfo.gameSystem,
      gameGroupTitle: res.gameGroupInfo.gameGroupTitle,
      teamCount: res.gameGroupInfo.teamCount,
      groupPlaceNum: res.gameGroupInfo.groupPlaceNum,
      gameStartedFlg: res.gameGroupInfo.gameStartedFlg
    });

    this.gameGroupTitle = res.gameGroupInfo.gameGroupTitle;
    this.teamCount = res.gameGroupInfo.teamCount;

    // フォームグループ・コントローラーを設定
    this.onChangeGetControl(this.formGroup.get('teamCount').value);

    // フォームに各試合情報の配列情報を設定
    this.getgameGroupInf.value.map((baseElm, index) => {
      for (const resElm of res.gameGroupInfo.gameGroupInf) {
        // 試合配置番号が一致する場合のみデータ格納処理を行う
        if (resElm.gameId !== baseElm.gameId) {
          continue;
        }
        // 時間を「時」と「分」に分ける
        const hour = resElm.gameStartTime !== undefined ? Math.floor(resElm.gameStartTime / 100) : null;
        const minute = resElm.gameStartTime !== undefined ? resElm.gameStartTime % 100 : null;

        // 各試合情報を設定する
        this.formGroup.get(['gameGroupInf', index]).patchValue({
          gameDate: resElm?.gameDate,
          gamePlace: resElm?.gamePlace,
          startTimeHour: hour,
          startTimeMinute: minute,
          criteriaRecordId: resElm?.criteriaRecordId ? resElm.criteriaRecordId : null,
          criteriaScore: resElm?.criteriaScore != null ? resElm.criteriaScore : null,
          opponentRecordId: resElm?.opponentRecordId ? resElm.opponentRecordId : null,
          opponentScore: resElm?.opponentScore != null ? resElm.opponentScore : null,
          gameProgressStatus: resElm?.gameProgressStatus
        });
      }
    });

    // リーグ表タイトル欄と各フォームにチーム情報を設定する
    for (let i = 0; i < this.formGroup.get('teamCount').value; i++) {
      let recordId;
      if (i === 0) {
        recordId = this.formGroup.get(['gameGroupInf', i, 'opponentRecordId']).value;
      } else {
        recordId = this.formGroup.get(['gameGroupInf', i - 1, 'criteriaRecordId']).value;
      }

      if (recordId) {
        // リーグ表タイトル欄にチーム情報を設定
        this.formGroup.get(['selectedTeam', i]).setValue(recordId);
        // 各フォームにチーム情報を設定
        this.onChangeSetValue(i, recordId);
      } else {
        this.selectedTeamName[i] ='';
      }
    }

    // チーム選択タブを非活性化
    if(this.getGameStartedFlg === true) {
      for(let i = 0; i < this.formGroup.get('teamCount').value; i++) {
        this.formGroup.get(['selectedTeam', i]).disable();
      }
    }

    // リーグ表タイトル欄のrecordIdの順番に基づいてteamGameRecordを並び替える
    this.sortedTeamGameRecord = this.getSelectedTeam.value.map((recordId) => {
      return this.teamGameRecord.find((record) => record._id === recordId);
    });

    // 各チーム毎の試合成績を集計しteamStatsに格納
    this.teamStats = this.sortedTeamGameRecord.map((record) => {
      const newTeam = {
        rank: 0,
        winningPoints: 0,
        totalWin: 0,
        totalLost: 0,
        totalDrew: 0,
        totalScore: 0,
        totalLoss: 0
      };

      if(record === undefined){
        return newTeam;
      }

      const game = record.gameRecord?.find((game) => game.gameGroupId === this.editInfo.gameId);

      if (game) {
        newTeam.rank = game.rank;
        for (const perGameInf of game.perGameInf) {
          newTeam.totalWin += perGameInf.isWon || 0;
          newTeam.totalLost += perGameInf.isLost || 0;
          newTeam.totalDrew += perGameInf.isDrew || 0;
          newTeam.totalScore += perGameInf.score || 0;
          newTeam.totalLoss += perGameInf.loss || 0;
        }
        // 遷移元から引き継いだ勝ち点情報をもとに勝ち点を計算（もし勝ち点情報が存在しない場合は0を表示させる）
        if (!this.editInfo?.winningPointInf) {
          newTeam.winningPoints = 0;
        } else {
          const { winPoint, losePoint, drawPoint } = this.editInfo?.winningPointInf;
          newTeam.winningPoints = (newTeam.totalWin * winPoint) + (newTeam.totalLost * losePoint) + (newTeam.totalDrew * drawPoint);
        }
      }

      return newTeam;
    });

    // フォームに順位情報を設定
    for (let i = 0; i < this.teamStats.length; i++) {
      this.formGroup.get(['rank', i]).setValue(this.teamStats[i].rank);
    }

    // 共通コンポーネントに渡すデータを整形
    this.leagueData = {
      gameGroupTitle: this.gameGroupTitle,
      teamCount: this.teamCount,
      rank: this.formGroup.controls.rank.value,
      gameGroupInf: this.formGroup.controls.gameGroupInf.value,
      selectedTeam: this.formGroup.controls.selectedTeam.value,
      selectedTeamName: this.selectedTeamName,
      winningPointInf: this.editInfo?.winningPointInf,
      teamStats: this.teamStats,
      arrayNumber: this.arrayNumber,
      leagueArray: this.leagueArray
    };
  }

  /**
   * 初期状態からページの編集がされたか判定
   */
  public canDeactive(): boolean {
    return !this.formGroup.dirty;
  }

  /**
   * チーム数選択時にコントロールを生成する
   * @param count
   */
  public onChangeGetControl(count: number): void {
    this.canShow = false;

    // 試合数分のフォームグループを作成
    this.getgameGroupInf.clear();
    const controlNumber = (Math.pow(count, 2) - count) / 2;
    for (let row = 0; row < controlNumber; row++) {
      this.getgameGroupInf.push(this.formBuilder.group({
        gameDate: [''],
        gamePlace: ['', [Validators.maxLength(50)]],
        startTimeHour: [null],
        startTimeMinute: [null],
        gameId: [row],
        criteriaRecordId:[null],
        criteriaScore: [null, [Validators.min(0), Validators.max(200), Validators.pattern(/^([1-9]\d*|0)$/)]],
        criteriaTeamId: [null],
        criteriaTeamName: [''],
        opponentRecordId: [null],
        opponentScore: [null, [Validators.min(0), Validators.max(200), Validators.pattern(/^([1-9]\d*|0)$/)]],
        opponentTeamId: [null],
        opponentTeamName: [''],
        gameProgressStatus: [CNS.beforeGame]
      }, {
        validator: this.startTimeVali
      }));
    }

    // 選択されたチームのrecordIdを持つコントローラーをチーム数分作成
    this.getSelectedTeam.clear();
    for (let i = 0; i < count; i++) {
      this.getSelectedTeam.push(this.formBuilder.control(null));
    }

    // チーム数に基づいて順位の選択肢を生成
    this.rankOptions = Array.from({ length: count }, (_, i) => i + 1);

    // 順位フォームコントロールをチーム数分作成
    this.getRank.clear();
    for (let i = 0; i < count; i++) {
      this.getRank.push(this.formBuilder.control(null));
    }

    // リーグ表用の配列作成メソッドの呼び出し
    this.makeLeagueArray(count);
  }

  /**
   * 選択されたチーム数に応じた試合IDを保持した二次元配列を作成
   * @param teamCount
   */
  public makeLeagueArray(teamCount: number): void {
    this.leagueArray = [];
    // チーム数に応じて元となる配列を上から順に作成(行作成)
    for (let i = 0; i < teamCount; i++) {
      const columnArray: number[] = [];
      // 行ごとに作成された配列の中に、チーム数に応じて配列を左から順に作成(列作成)
      for (let j = 0; j < teamCount; j++) {
        columnArray.push(this.getControlNumber(i, j, teamCount));
      }
      // 作成された試合IDを保持した二次元配列はleagueArrayで取得し、columnArrayには試合IDが保持される
      this.leagueArray.push(columnArray);
    }
  }

  /**
   * リーグ表下部に表示する入力項目を設定する
   * @param rowIdx
   * @param columnIdx
   * @param teamNumber
   */
  public onClickCell(rowIdx: number, columnIdx: number, teamNumber: number): void {
    this.canShow = true;
    this.arrayNumber = this.getControlNumber(rowIdx, columnIdx, teamNumber);
    if (columnIdx > rowIdx) {
      this.viewFlg = 'top';
    }
    else if (columnIdx < rowIdx) {
      this.viewFlg = 'left';
    }
    else {
      this.canShow = false;
    }
    this.rowControl = rowIdx;
    this.columnControl = columnIdx;
  }

  /**
   * gameGroupInfのgetter
   */
  get getgameGroupInf(): UntypedFormArray {
    return this.formGroup.get('gameGroupInf') as UntypedFormArray;
  }

  /**
   * selectedTeamのgetter
   */
  get getSelectedTeam(): UntypedFormArray {
    return this.formGroup.get('selectedTeam') as UntypedFormArray;
  }

  /**
   * rankのgetter
   */
  get getRank(): UntypedFormArray {
    return this.formGroup.get('rank') as UntypedFormArray;
  }

  // gameStartedFlgのgetter
  get getGameStartedFlg(): boolean {
    return this.formGroup.controls.gameStartedFlg.value as boolean;
  }

  /**
   * 行番号、列番号、参加チーム数からリーグ表内に割り当てた試合配置番号を算出して返す
   * @param rowIdx
   * @param columnIdx
   * @param teamNumber
   * @returns
   */
  public getControlNumber(rowIdx: number, columnIdx: number, teamNumber: number): number {
    if (columnIdx > rowIdx) {
      return columnIdx - 1 - 1 / 2 * rowIdx * (rowIdx + 1) + (teamNumber - 1) * rowIdx;
    }
    else if (columnIdx < rowIdx) {
      return rowIdx - 1 - 1 / 2 * columnIdx * (columnIdx + 1) + (teamNumber - 1) * columnIdx;
    }
    else {
      return;
    }
  }

  /**
   * チーム選択後、リーグ表セル内にチーム情報を設定(本来引数のvalueはObjectId型)
   * @param number
   * @param value
   */
  public onChangeSetValue(number: number, value: ObjectId): void {
    // recordIdが一致するチームの情報を取得
    const teamInfo = this.entryTeamList.find(elm => elm.recordId == value);
    // rowNo部分のツールチップに表示させるチーム名を格納(仮の処理、後々変更する可能性大)
    this.selectedTeamName[number] = teamInfo.teamName;

    // 試合配置番号を取得
    const controlFirstNumber = this.getControlNumber(number, number + 1, this.formGroup.get('teamCount').value);

    // 該当するセルにチーム情報を設定(斜線より右上側の部分)
    for (let i = 0; i < this.formGroup.get('teamCount').value - (number + 1); i++) {
      const controlNumber = controlFirstNumber + i;
      this.formGroup.get(['gameGroupInf', controlNumber]).patchValue({
        opponentRecordId: teamInfo.recordId,
        opponentTeamId: teamInfo?.teamId,
        opponentTeamName: teamInfo.teamName
      });
    }
    // 該当するセルにチーム情報を設定(斜線より左下側の部分)
    if (number > 0) {
      for (let i = 0; i < number; i++) {
        const setNumber = this.getControlNumber(number, i, this.formGroup.get('teamCount').value);
        this.formGroup.get(['gameGroupInf', setNumber]).patchValue({
          criteriaRecordId: teamInfo.recordId,
          criteriaTeamId: teamInfo?.teamId,
          criteriaTeamName: teamInfo.teamName
        });
      }
    }

    // 試合参加チーム選択フラグ格納
    this.allTeamsSelectedFlg = this.selectedTeamsCheck();
  }

  /**
   * 得点入力欄の制限
   */
  public onScoreCheck(score: KeyboardEvent): void {
    this.commonService.onNumberCheck(score);
  }

  /**
   * 時刻フォームのtouchedフラグ設定
   * @param i
   */
  public setTimeTouchedFlg(i: number): void {

    // hourMissingエラーが発生している場合、startTimeHourにtouchedフラグをたてる
    if (this.getgameGroupInf.at(i).get('startTimeHour').hasError('hourMissing')) {
      this.getgameGroupInf.at(i).get('startTimeHour').markAsTouched();

    // minuteMissingエラーが発生している場合、startTimeMinuteにtouchedフラグをたてる
    } else if (this.getgameGroupInf.at(i).get('startTimeMinute').hasError('minuteMissing')) {
      this.getgameGroupInf.at(i).get('startTimeMinute').markAsTouched();
    }
  }

  /**
   * 選択チームの重複確認
   */
  public async hasDupTeam(): Promise<boolean> {
    const selectedTeams = this.getSelectedTeam.value.filter(elm => elm != null);
    const setTeams = new Set(selectedTeams);
    if (setTeams.size !== selectedTeams.length) {
      // 選択チームの重複注意ダイアログ
      await this.commonService.openNoticeDialog(this.msg.errTitle, '選択したチームに重複があります。');
      return true;
    } else {
      return false;
    }
  }

  /**
   * 選択チーム数と試合チーム数が一致しているか確認する
   */
  public selectedTeamsCheck(): boolean {
    const selectedTeams = this.getSelectedTeam.value.filter(elm => elm != null);
    const teamCount = this.formGroup.get('teamCount').value;

    return selectedTeams.length === teamCount;
  }

  /**
   * サーバ処理に渡すgameGroupsデータの整理
   * 登録・更新共通
   * @returns
   */
  public gameGroupsArrange(): object {
    // データ整形を行うためにフォームの値をコピー
    const formValue = _.cloneDeep(this.formGroup.value);

    for (const games of formValue.gameGroupInf) {
      // 「時」と「分」を一つの数値にまとめる
      games.gameStartTime = (games.startTimeHour == null || games.startTimeMinute == null) ? null : games.startTimeHour * 100 + games.startTimeMinute;

      // サーバ側のバリデーションに合わせてIDをstring型に変換
      if (games.criteriaRecordId) {
        games.criteriaRecordId = games.criteriaRecordId.toString();
      }
      if (games.criteriaTeamId) {
        games.criteriaTeamId = games.criteriaTeamId.toString();
      }
      if (games.opponentRecordId) {
        games.opponentRecordId = games.opponentRecordId.toString();
      }
      if (games.opponentTeamId) {
        games.opponentTeamId = games.opponentTeamId.toString();
      }

      // 不要なプロパティを削除
      delete games.startTimeHour;
      delete games.startTimeMinute;
      delete games.criteriaTeamName;
      delete games.opponentTeamName;
    }

    // 不要なプロパティを削除
    delete formValue.selectedTeam;

    return formValue;
  }

  // リーグ開始処理

  public async onClickGameStart(): Promise<void>{
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.startGame.replace('※1', CNS.targetTypeLeague));
    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }
    // チーム選択タブを非活性化
    for(let i = 0; i < this.formGroup.get('teamCount').value; i++) {
      this.formGroup.get(['selectedTeam', i]).disable();
    }
    // 試合開始フラグをtrue（試合開始済み）に変更
    this.formGroup.controls.gameStartedFlg.setValue(true);

    // 編集済み状態に変更
    this.formGroup.markAsDirty();

    // 確認ダイアログ表示
    await this.commonService.openNoticeDialog(this.msg.startDoneTitle, this.msg.startDone.replace('※1', CNS.targetTypeLeague));
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
    // rankのインデックス番号管理用
    let rankIndex = 0;
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

      // criteriaScoreとopponentScore両方が入力されている、かつ試合形式が「試合終了」であれば勝負引を設定
      if (group.criteriaScore !== null && group.opponentScore !== null && group.gameProgressStatus === CNS.afterGame) {
        criteriaInfo.isWon = group.criteriaScore > group.opponentScore ? 1 : 0;
        criteriaInfo.isLost = group.criteriaScore < group.opponentScore ? 1 : 0;
        criteriaInfo.isDrew = group.criteriaScore === group.opponentScore ? 1 : 0;
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

      // criteriaScoreとopponentScore両方が入力されている、かつ試合形式が「試合終了」であれば勝負引を設定
      if (group.opponentScore !== null && group.criteriaScore !== null && group.gameProgressStatus === CNS.afterGame) {
        opponentInfo.isWon = group.opponentScore > group.criteriaScore ? 1 : 0;
        opponentInfo.isLost = group.opponentScore < group.criteriaScore ? 1 : 0;
        opponentInfo.isDrew = group.opponentScore === group.criteriaScore ? 1 : 0;
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
            rank: gameGroupsData.rank[rankIndex],
            perGameInf: [perGameInfDetail]
          };
          gameRecord.push(newRecord);

          rankIndex ++;
        } else {
          // チームのgameRecordが作成済であれば該当チームのgameRecord内perGameInf配列にデータを追加
          gameRecord[gameRecordIndex].perGameInf.push(perGameInfDetail);
        }
      }
    });

    return gameRecord;
  }

  /**
   * 登録処理
   */
  public async onClickReg(): Promise<void> {
    // 登録確認ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.regConfirmation.replace('※1', CNS.targetTypeGame + CNS.targetTypeInformation));
    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    // 選択チームの重複確認
    const hasDupTeam = await this.hasDupTeam();
    if (hasDupTeam) {
      return;
    }

    // データ登録処理に渡す値を整形(gameGroups用)
    const gameGroupsData = this.gameGroupsArrange();

    // 登録時に不要なプロパティを削除
    delete gameGroupsData['gameGroupId'];

    // データ登録処理に渡す値を整形(teamGameRecords用)
    const teamGameRecordsData = this.teamGameRecordsArrange(gameGroupsData);

    // 登録時に不要なプロパティを削除
    delete gameGroupsData['rank'];

    const data = {
      gameGroups: gameGroupsData,
      teamGameRecords: teamGameRecordsData
    };

    // データ登録処理
    try {
      const res = await this.commonService.apiPost('gameInf/createGameGroups', data).toPromise();
      if (res.result == 'ok'){
        await this.commonService.openNoticeDialog(this.msg.confirmationTitle, this.msg.regDone.replace('※1', CNS.targetTypeGame + CNS.targetTypeInformation));
        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();
        // 大会要綱画面・スケジュールタブに戻る
        this.navigateCompetitionGuide();
      } else if (res?.message){
        // 試合内容の重複、または、大会に参加しないチームを試合で選択していた場合のエラーダイアログ
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.regErr.replace('※1', CNS.targetTypeGame + CNS.targetTypeInformation) + '\n' + res.message);
        // 登録エラーダイアログ
      } else {
        await this.commonService.errorOnApp();
      }

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeGame + CNS.targetTypeInformation, CNS.actionTypeReg);
    }
  }

  /**
   * 試合削除処理
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
   * 更新処理
   */
  public async onClickUpdate(): Promise<void> {
    // 更新確認ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.updateConfirmation.replace('※1', CNS.targetTypeGame + CNS.targetTypeInformation));
    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    // 選択チームの重複確認
    const hasDupTeam = await this.hasDupTeam();
    if (hasDupTeam) {
      return;
    }

    // データ更新処理に渡す値を整形(gameGroups用)
    const gameGroupsData = this.gameGroupsArrange();

    // データ登録処理に渡す値を整形(teamGameRecords用)
    const teamGameRecordsData = this.teamGameRecordsArrange(gameGroupsData);

    // 更新時に不要なプロパティを削除
    delete gameGroupsData['rank'];

    const data = {
      gameGroups: gameGroupsData,
      teamGameRecords: teamGameRecordsData
    };

    // データ更新処理
    try {
      const res = await this.commonService.apiPost('gameInf/updateGameGroups', data).toPromise();
      if (res.result == 'ok'){
        await this.commonService.openNoticeDialog(this.msg.confirmationTitle, this.msg.updateDone.replace('※1', CNS.targetTypeGame + CNS.targetTypeInformation));
        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();
        // 大会要綱画面・スケジュールタブに戻る
        this.navigateCompetitionGuide();
      } else if (res?.message){
        // 試合内容の重複、または、大会に参加しないチームを試合で選択していた場合のエラーダイアログ
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.regErr.replace('※1', CNS.targetTypeGame + CNS.targetTypeInformation) + '\n' + res.message);
        // 登録エラーダイアログ
      } else {
        await this.commonService.errorOnApp();
      }

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeGame + CNS.targetTypeInformation, CNS.actionTypeUpdate);
    }
  }

  /**
   * 戻るボタン
   */
  public onClickBack(): void {

    // 大会要綱画面・スケジュールタブに戻る
    this.navigateCompetitionGuide();
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
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
