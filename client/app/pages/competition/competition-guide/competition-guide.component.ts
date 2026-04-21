import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { CompDetailInf, GameGroups } from 'defs/api/index.d';
import { MSG } from '../../../common/message-defines';
import { CNS } from 'client/app/common/defines';
import { ObjectId } from 'mongodb';
import { EditPageBase } from '../../EditPageBase';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { CopyCompetitionDialogComponent } from 'client/app/dialog/copy-competition-dialog/copy-competition-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-compentition-guide',
  templateUrl: './competition-guide.component.html',
  styleUrls: ['./competition-guide.component.scss']
})
export class CompetitionGuideComponent extends EditPageBase implements OnInit {

  // 大会要綱タブ表示情報
  compInfo: CompDetailInf;

  // リーグ表示情報
  leagueList: GameGroups[];

  // トーナメント表示情報
  tournamentList: GameGroups[];

  // 編集権限フラグ
  canEdit = false;

  // 固定のメッセージ
  msg = MSG;

  // 定数使用用変数
  cns = CNS;

  // EditInfo内容格納用
  editInfo = this.commonService.getEditInfo();

  // ログイン情報格納用
  loginInfo = this.commonService.getLoginInfo();

  // デバイス判定用変数
  device: 'pc' | 'sp';

  // タブの配列番号用
  selectedTab = 0;

  // フォーム編集中判定フラグ
  dirtyFlag = false;

  // 共通コンポーネントに渡す参加チーム情報格納用
  teamInfo;

  /**
   * コンストラクタ
   * @param commonService
   */
  constructor(public commonService: CommonService, private dialog: MatDialog, public router: Router) {
    super(commonService);

    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';
  }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {

    // 遷移元から引き継ぎ情報（大会ID、新規登録フラグ）を受け取り、遷移元から情報を受け取れない場合はログイン画面に戻る
    if (!this.editInfo || (this.editInfo?.type != 'competition' && typeof this.editInfo?.newCompFlg != 'boolean')) {
      this.commonService.navigateToLogin();
      return;
    }

    // 当画面遷移後のタブ判定
    switch(this.editInfo?.tab) {
      case 'schedule':
        this.selectedTab = 2;
        break;

      default:
        break;
    }

    try {
      // 当画面全体の取得処理
      const res = await this.commonService.apiPost('competitionInf/getCompDetailForAdmin', this.editInfo).toPromise();
      // 異常があれば大会一覧画面に戻る
      if (res.result != 'ok') {
        await this.commonService.errorOnApp();
        this.commonService.navigateWithEdit(CNS.pathToCollectionCompetition, {
          id: this.editInfo.id,
          type: 'competition'
        });
        return;
      }

      // 大会要綱タブ関連の取得情報を設定
      this.compInfo = res.compBaseInf;

      // ユーザーが管理しているチーム／団体が含まれている場合はユーザの編集権限があるとみなす
      this.canEdit = this.commonService.managementId.some((manageId) => {
        res.compBaseInf.editorList.includes(manageId.toString());
      });
      // ユーザーが大会システム管理者の場合もユーザの編集権限があるとみなす
      const userId = this.commonService.getLoginInfo().userId;
      if (res.compBaseInf.compAdminInf.adminUserID == userId) {
        this.canEdit = true;
      }

      // リーグ／トーナメントで分けて取得情報を設定(該当なしの場合は空配列が返る)
      this.leagueList = res.gameGroups.filter(data =>
        data.gameSystem === CNS.league
      );
      this.tournamentList = res.gameGroups.filter(data =>
        data.gameSystem === CNS.tournament
      );

      // 取得したデータをフォーム・変数に設定する
      this.teamInfo = {
        regTeamList: res.regTeamList,
        inputTeamList: res.inputTeamList,
        teamIdList: res.teamIdList
      };

    } catch (e) {
      await this.commonService.errorOnServiceTransition(CNS.pathToCollectionCompetition, {
        id: this.editInfo.id,
        type: 'competition'
      },
      CNS.targetTypeComp + CNS.targetTypeInformation,
      CNS.actionTypeGet);
    }
  }

  /**
   * canDeactive()で使うフォーム編集中判定フラグの真偽を変更
   */
  public dirtyFlagChange(flag: boolean): void {
    this.dirtyFlag = flag;
  }

  /**
   * 初期状態からページの編集がされたか判定
   */
  public canDeactive(): boolean {
    return !this.dirtyFlag;
  }

  /**
   * 編集画面に遷移
   */
  public changeToEdit(): void {
    // 大会IDと新規登録フラグ(false)を引き継ぐ
    // leagueMatch,tournamentMatch：試合が登録されている場合はtrue, 登録されていない場合はfalseを渡す
    this.commonService.navigateWithEdit(CNS.pathToCreateAndEditComp, {
      id: this.editInfo.id,
      newCompFlg: false,
      leagueMatch: this.leagueList.length > 0,
      tournamentMatch: this.tournamentList.length > 0
    });
  }

  /**
   * 戻るボタン
   */
  public onClickBack(): void {
    // 大会一覧画面に戻る
    this.commonService.navigateWithEdit(CNS.pathToCollectionCompetition, {
      id: this.editInfo.id,
      type: 'competition'
    });
  }

  /**
   * リーグ／トーナメント登録・更新
   * @param gameSystem
   * @param gameId
   */
  public onClickRegAndEditGame(data: { gameSystem: string; gameId?: ObjectId }): void {
    // リーグかトーナメントかで遷移先のパスを決定
    let path = '';
    if (data.gameSystem === CNS.tournament) {
      path = CNS.pathToCreateAndEditCompTournament;
    } else if (data.gameSystem === CNS.league) {
      path = CNS.pathToCreateCompetitionLeague;
    }

    // 各登録/編集画面へ遷移
    this.commonService.navigateWithEdit(path, {
      id: this.editInfo.id,
      gameSystem: data.gameSystem,
      type: 'competition',
      gameId: data.gameId,
      winningPointInf: this.compInfo?.compSystemInf?.winningPointInf,
      canEdit: this.canEdit
    });
  }

  /**
   * 大会複製オプションダイアログを開く処理
   */
  public async onClickCopyCompDialogOpen(): Promise<void> {
    // 試合情報があればtrue、なければfalse
    const existGame: boolean = this.leagueList.length > 0 || this.tournamentList.length > 0;

    // ダイアログに渡すデータ
    const data = {
      compId: this.editInfo.id,
      existGame: existGame
    };

    // ダイアログを開き、必要なデータを渡す
    const res = this.dialog.open(CopyCompetitionDialogComponent, {data});

    res.afterClosed().subscribe((responseId) => {
      // 閉じる時に大会IDを返していれば、大会IDと画面種別を渡して複製後の大会要綱画面に遷移する
      if (responseId) {
        // 今いるURLと遷移先のURLが同じだとnavigateがうまく反応しないため、一度別のURLに遷移してから複製後の大会要綱画面に遷移
        this.router.navigate([CNS.pathToCollectionCompetition]).then(() => {
          this.commonService.navigateWithEdit(CNS.pathToCompetitionGuide, {
            id: responseId,
            type: 'competition'
          });
        });
      }
    });
  }

}
