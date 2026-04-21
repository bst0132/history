import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { Competition, Team, Game, GameResult } from 'defs/entity';
import { CNS } from '../../../common/defines';
import { UntypedFormGroup, UntypedFormBuilder, Validators} from '@angular/forms';
import { PlaceInfo, CompOrganInfo, CompAdminInfo, LeagueTournamentInfo } from 'defs/api';
import ImageInf from 'defs/entity/imageInf';
import { MSG } from '../../../common/message-defines';


@Component({
  selector: 'app-manage-competition',
  templateUrl: './manage-competition.component.html',
  styleUrls: ['./manage-competition.component.scss']
})
export class ManageCompetitionComponent implements OnInit {

  formGroup: UntypedFormGroup;

  compInfo: Competition;

  memberList: CompAdminInfo[];

  teamList: Team[];

  organList: CompOrganInfo[];

  gameList: LeagueTournamentInfo[];

  placeList: PlaceInfo[];

  gameInfoListAll: Game[];

  gameInfoList = [];

  gameResultList: Omit<GameResult, '_id'>[];

  /** 試合情報検索のフォーム */
  searchForm: UntypedFormGroup;

  // 試合一覧 検索結果表示用フラグ
  isDispFlg = false;

  imageInfo: ImageInf = {
    dataUrl: '',
    transform: ''
  };

  msg = MSG;

  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    this.formGroup = this.formBuilder.group({
      compName: ['', Validators.required],
      heldDate: ['', Validators.required],
      compLogo: [''],
      compIntro: ['']
    });
    // 試合情報検索フォーム初期化
    this.searchForm = this.formBuilder.group({
      searchGameSystem: ['', Validators.required]
    });
  }

  canDeactive(): boolean {
    return !this.formGroup.dirty;
  }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {

    const editInfo = this.commonService.getEditInfo();
    if(!editInfo || (editInfo.type != 'competition' && !(/^game/.test(editInfo.type)))) {
      this.commonService.navigateBack();
      return;
    }

    try {
      const res = await this.commonService.apiPost('competition/manageCompetition', editInfo).toPromise();
      // 異常なら再度一覧から検索させる
      if (res.result != 'ok') {
        this.commonService.navigateBack();
        return;
      }

      // 各種表示情報の設定
      this.compInfo = res.compInfo;
      this.teamList = res.teamList;
      this.organList = res.organList;
      this.memberList = res.memberList;
      this.gameList = res.gameList;
      this.placeList = res.placeList;
      this.gameInfoListAll = res.gameInfoListAll;
      this.gameResultList = res.gameResultList;
      this.imageInfo = res.compInfo.compLogo;

      const value = {
        compName: this.compInfo.compName,
        heldDate: this.compInfo.heldDate,
        compLogo: this.compInfo.compLogo,
        compIntro: this.compInfo.compIntro
      };
      this.formGroup.setValue(value);

    } catch(e) {
      this.commonService.errorOnApi(e);
      this.commonService.navigateBack();
    }

  }

  /**
   * 画像選択コンポーネントで変更があったらよばれる
   * @param imageInfo 変更後のimageInfo
   */
  onChangeDataUrl(imageInfo: ImageInf): void {
    this.imageInfo = imageInfo;
    // フォームに変更済フラグを立てる
    this.formGroup.markAsDirty();
  }

  /**
   * 大会情報変更処理
   */
  public async onSubmit(): Promise<void> {
    // サーバサイドに送るデータをフォームから設定
    const data = this.formGroup.value as Competition;
    data._id = this.compInfo._id;
    if(this.imageInfo) {
      data.compLogo = this.imageInfo;
    }

    // メインの主催団体の設定
    data.organizerInf = this.compInfo.organizerInf;

    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.changeConfirmation.replace('※1','大会情報'));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // 大会情報変更処理
      const res = await this.commonService.apiPost('competition/modCompetition', data).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.changeDoneTitle, this.msg.changeDone.replace('※1','大会情報'));

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
   * 試合登録画面に遷移する
   */
  public createGame(): void {
    this.commonService.navigateWithEdit(CNS.pathToCreateGame, {
      id: this.compInfo._id,
      type: 'game'
    });
  }

  /**
   * 大会情報管理の関連ページへ遷移
   * @param path
   */
  public navigateNextPage(path: string): void {
    this.commonService.navigateWithEdit(path, {
      id: this.compInfo._id,
      sports: this.compInfo.sports,
      type: 'competition'
    });
  }

  /**
   * 大会情報削除処理
   * @param id
   * @param name
   * @param type
   */
  public async removeCompInfo(id: string, name: string, type: string): Promise<void> {

    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.delConfirmation.replace('※1',name));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // 大会情報削除処理
      const res = await this.commonService.apiPost('competition/removeCompInfo', {
        id: id,
        compId: this.commonService.getEditInfo().id,
        type: type
      }).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        // 自分自身を大会管理者から削除した場合、他に管理している大会が無ければ権限を更新する
        if(!res.isAdminComp) {
          this.commonService.getLoginInfo().isAdminComp = false;
        }

        await this.commonService.openNoticeDialog(this.msg.delDoneTitle, this.msg.delDone.replace('※1',name));
        this.ngOnInit();
      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.delErr.replace('※1',name));
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * 試合情報削除処理
   * @param game
   */
  public async removeGame(game: LeagueTournamentInfo): Promise<void> {

    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(
      this.msg.confirmationTitle, this.msg.delConfirmation.replace('※1',game.groupName));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // 試合情報削除処理
      const res = await this.commonService.apiPost('competition/removeGame', {
        game: game,
        compId: this.commonService.getEditInfo().id
      }).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(
          this.msg.delDoneTitle, this.msg.delDone.replace('※1',game.groupName));
        this.ngOnInit();
      } else {
        await this.commonService.openNoticeDialog(
          this.msg.errTitle, this.msg.delErr.replace('※1',game.groupName));
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * チームIDからチーム名を検索し返却する処理
   * @param teamID
   */
  public getTeamName(teamID: string): string {
    // 入力されたチームIDに紐づくチームオブジェクトを設定
    const findResult = this.teamList.find((team) => {
      return team._id.toString() === teamID;
    });

    // 検索結果がある場合、チーム名を返却し、無い場合は空文字を返却
    if(findResult) {
      return findResult.teamName;
    } else {
      return '';
    }
  }

  /**
   * 試合結果を取得する処理
   * @param row
   */
  public getGameResult(row: Game): string {
    const result = this.gameResultList.filter(gameRslt => {
      return gameRslt.gameID == row._id.toString();
    });
    if(result.length == 0) {
      return '結果待ち';
    }
    const point: string[] = [];
    result.forEach((rs, i) => {
      point.push(rs.gameResult.scoreResult.toString());
      if(i == 0) {
        point.push(' - ');
      }
    });
    return point.join('');
  }

  /**
   * 試合参照に遷移
   */
  public navigateGameDetail(row): void {
    // 試合参照に遷移
    this.commonService.navigateWithEdit(CNS.pathToGameDetail, {
      id: row._id,
      type: CNS.infoTypeGame
    });
  }

  /**
   * 試合一覧の検索処理
   */
  public async onSearch(): Promise<void> {

    // 試合一覧の格納用変数を初期化
    this.gameInfoList = [];

    // フォームの入力値取得
    const sGameSystem = this.searchForm.get('searchGameSystem').value;

    if(sGameSystem == '' ) {
      this.gameInfoList = this.gameInfoListAll;
    } else {
      // 入力値に一致するデータを取得
      this.gameInfoList = this.gameInfoListAll.filter(gameinf => {
        return sGameSystem == gameinf.gameInfCom.gameSystemInf.gameSystem;
      });
    }

    // 検索結果のメッセージを表示する
    this.isDispFlg = true;
  }

  /**
   * 戻るボタン押下時の処理
   */
  public returnToBeforePage(): void {
    // 大会参照画面に遷移
    this.commonService.navigateBack();
  }

  /**
   * リーグ・トーナメント編集画面への遷移処理
   * @param row
   */
  public navigateGameGroupEdit(row: LeagueTournamentInfo): void {

    // 遷移する画面のパス
    let path = '';

    // 試合形式によって遷移する画面のパスを切り替える
    // MEMO 単独試合をどうするか未定のためswitchで制御、単独試合をなしとするならif文に変える
    switch(row.gameSystem) {
      case 'リーグ':
        path = CNS.pathToEditLeague;
        break;

      // case 'トーナメント':
      //   path = CNS.pathToEditTournament;
      //   break;

      default:
        return;
    }

    // 画面遷移する
    this.commonService.navigateWithEdit(path, {
      id: this.compInfo._id,
      type: CNS.infoTypeGame,
      gameSystem: row.gameSystem,
      gameSystemName: row.groupName
    });
  }

  /**
   * チームセレクトボックスが全て空文字か判定を行う
   * @param teamList
   */
  public isEmptyTeamList(teamList: string[]): boolean {
    return teamList.every(team => !team);
  }

}
