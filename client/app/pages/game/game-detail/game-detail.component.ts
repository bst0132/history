import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { CNS } from 'client/app/common/defines';
import { GameDetailRes, GRPlayerResultList } from 'defs/api';
import { AdminInf } from 'defs/index';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-game-detail',
  templateUrl: './game-detail.component.html',
  styleUrls: ['./game-detail.component.scss']
})
export class GameDetailComponent implements OnInit {

  gameDetail: GameDetailRes;     // 試合表示用のオブジェクト
  playerResultList: GRPlayerResultList[] = [];
  startPlayerList1: string[] = [];
  subPlayerList1: string[] = [];
  startPlayerList2: string[] = [];
  subPlayerList2: string[] = [];
  gameResultList1: string[] = [];
  gameResultList2: string[] = [];
  gameResultListC: string[] = [];

  teamSpecificInf: string[] = [];

  baseTeamList:
    { teamID: string;
      sikibetnum: number;}[] = [];

  panelOpenState = false;

  msg = MSG;

  constructor(private commonService: CommonService) { }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {

    // 前ページからの情報取得
    const editInfo = this.commonService.getEditInfo();

    // 備忘録
    // ・遷移元(一覧、試合作成、トーナメント、リーグ？)での判別が必要
    // ・呼び出し元に戻るだけ？

    // 情報が設定されていない場合、呼び出し元に戻る
    if(editInfo == void 0){
      this.commonService.router.navigate([CNS.pathToGameList]);
      return;
    }

    // 値が想定外の場合、呼び出し元に戻る
    if(editInfo.type !== CNS.infoTypeGame){
      this.commonService.router.navigate([CNS.pathToGameList]);
      return;
    }

    try {
      // 試合情報取得
      const res = await this.commonService.apiPost('game/gameDetail', editInfo).toPromise();

      // サーバ処理エラー判定
      if(res.result == 'ok') {

        // 検索結果を受け取る
        this.gameDetail = res;

      } else {
        // エラーメッセージの表示
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.searchErr);
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

    // 試合参加選手リスト設定
    const teamInf = this.gameDetail.gameInf.teamInfo;

    // チーム情報数分ループ
    for( let i = 0; i < teamInf?.length; i++) {

      // チーム情報設定
      // teamSpecificInfを使用するかを後で検討
      this.teamSpecificInf.push(teamInf[i].teamID);

//      this.baseTeamList[i].teamID = teamInf[i].teamID;

      // 選手数分ループ
      for( let j = 0; j < teamInf[i].entrantInfo?.length; j++) {

        if(teamInf[i].entrantInfo[j].entrantStatus === 'スタメン') {
            if(i==0){
              this.startPlayerList1.push(this.getUserName(teamInf[i].entrantInfo[j].userID));
            } else {
              this.startPlayerList2.push(this.getUserName(teamInf[i].entrantInfo[j].userID));
            }
        } else if(teamInf[i].entrantInfo[j].entrantStatus === '控え'){
          if(i==0){
            this.subPlayerList1.push(this.getUserName(teamInf[i].entrantInfo[j].userID));
          } else {
            this.subPlayerList2.push(this.getUserName(teamInf[i].entrantInfo[j].userID));
          }
        }
      }
    }

    // 試合経過リスト設定
    const gameResultInf = this.gameDetail.gameResultInf;

    // 試合結果レコード数分ループ
    for( let i = 0; i < gameResultInf.length; i++) {

      for( let j = 0; j < gameResultInf[i].gameResultPlayer?.length; j++){

        if( i == 0){
          const playerResultListTemp: GRPlayerResultList = {
            resultTime: gameResultInf[i].gameResultPlayer[j].resultTime,
            team1UserID: gameResultInf[i].gameResultPlayer[j].userID,
            team1RecordType: gameResultInf[i].gameResultPlayer[j].recordType,
            team2UserID: '',
            team2RecordType: ''
          };

          // 試合経過リストに設定
          this.playerResultList.push(playerResultListTemp);
        } else {
          const playerResultListTemp: GRPlayerResultList = {
            resultTime: gameResultInf[i].gameResultPlayer[j].resultTime,
            team1UserID: '',
            team1RecordType: '',
            team2UserID: gameResultInf[i].gameResultPlayer[j].userID,
            team2RecordType: gameResultInf[i].gameResultPlayer[j].recordType
          };

          // 試合経過リストに設定
          this.playerResultList.push(playerResultListTemp);
        }
      }
    }

    const gameResult1 = gameResultInf[0].gameResult;
    const gameResult2 = gameResultInf[1].gameResult;

    if(gameResult1.scoreResult && gameResult1.score1stHalf && gameResult1.score2ndHalf
      && gameResult2.scoreResult && gameResult2.score1stHalf && gameResult2.score2ndHalf){
        this.gameResultListC.push('結果','前半','後半');

        this.gameResultList1.push(gameResult1?.scoreResult?.toString());
        this.gameResultList1.push(gameResult1?.score1stHalf?.toString());
        this.gameResultList1.push(gameResult1?.score2ndHalf?.toString());

        this.gameResultList2.push(gameResult2?.scoreResult?.toString());
        this.gameResultList2.push(gameResult2?.score1stHalf?.toString());
        this.gameResultList2.push(gameResult2?.score2ndHalf?.toString());

        if(gameResult1.scoreResult && gameResult1.score1stHalf && gameResult1.score2ndHalf
          && gameResult2.scoreResult && gameResult2.score1stHalf && gameResult2.score2ndHalf){

            this.gameResultListC.push('延長戦','前半','後半');

            this.gameResultList1.push('');
            this.gameResultList1.push(gameResult1?.scoreEX1stHalf?.toString());
            this.gameResultList1.push(gameResult1?.scoreEX2ndHalf?.toString());

            this.gameResultList2.push('');
            this.gameResultList2.push(gameResult2?.scoreEX1stHalf?.toString());
            this.gameResultList2.push(gameResult2?.scoreEX2ndHalf?.toString());

        }

        if(gameResult1.scorePK && gameResult2.scorePK){

          this.gameResultListC.push('ＰＫ');

          this.gameResultList1.push(gameResult1?.scorePK?.toString());

          this.gameResultList2.push(gameResult2?.scorePK?.toString());
        }

        this.gameResultListC.push('', 'シュート数','直接フリーキック','間接フリーキック','コーナーキック','オフサイド');

        this.gameResultList1.push('');
        this.gameResultList1.push(gameResult1?.cntShoot?.toString());
        this.gameResultList1.push(gameResult1?.cntDiredtFK?.toString());
        this.gameResultList1.push(gameResult1?.cntIndiredtFK?.toString());
        this.gameResultList1.push(gameResult1?.cntCornerKick?.toString());
        this.gameResultList1.push(gameResult1?.cntOffside?.toString());

        this.gameResultList2.push('');
        this.gameResultList2.push(gameResult2?.cntShoot?.toString());
        this.gameResultList2.push(gameResult2?.cntDiredtFK?.toString());
        this.gameResultList2.push(gameResult2?.cntIndiredtFK?.toString());
        this.gameResultList2.push(gameResult2?.cntCornerKick?.toString());
        this.gameResultList2.push(gameResult2?.cntOffside?.toString());
        }

  }


  /**
   * チームIDからチーム名を検索し返却する処理
   * @param teamID
   */
  public getTeamName(teamID: string): string {
    // 入力されたチームIDに紐づくチームオブジェクトを設定
    const findResult = this.gameDetail.teamInf.find((team) => {
      return team.teamID.toString() === teamID;
    });

    // 検索結果がある場合、チーム名を返却し、無い場合は空文字を返却
    if(findResult) {
      return findResult.teamName;
    } else {
      return '未定';
    }

  }

  /**
   * ユーザーIDからユーザー名を検索し返却する処理
   * @param teamID
   */
  public getUserName(userID: string): string {
    // 入力されたチームIDに紐づくチームオブジェクトを設定
    const findResult = this.gameDetail.userNameList.find((user) => {
      return user.id.toString() === userID;
    });

    // 検索結果がある場合、ユーザー名を返却し、無い場合は空文字を返却
    if(findResult) {
      return findResult.name;
    } else {
      return '';
    }

  }

  /**
   * 試合編集に遷移
   */
  public onClickEditGame(): void {

    // 前ページからの情報取得
    // 【要修正】セッション情報からの取得に変更
    const editInfo = this.commonService.getEditInfo();

    // 試合編集画面へ遷移
    this.commonService.navigateWithEdit(CNS.pathToEditGame, {
      id: editInfo.id,
      type: CNS.infoTypeGame
    });

  }

  /**
   * 試合選手登録に遷移
   */
  public onClickEditGamePlayer(teamID: string): void {

    // 前ページからの情報取得
    // 【要修正】セッション情報からの取得に変更
    const editInfo = this.commonService.getEditInfo();

    // 選手登録画面へ遷移
    this.commonService.navigateWithEdit(CNS.pathToEditGameMember, {
      id: editInfo.id,
      teamID: teamID,
      type: CNS.infoTypeGame
    });

  }

  /**
   * 試合結果登録に遷移
   */
  public onClickEditGameResult(teamID: string): void {

    // 前ページからの情報取得
    // 【要修正】セッション情報からの取得に変更
    const editInfo = this.commonService.getEditInfo();

    // 試合結果登録画面へ遷移
    this.commonService.navigateWithEdit(CNS.pathToEditGameResult, {
      id: editInfo.id,
      teamID: teamID,
      type: CNS.infoTypeGame,
      teamInf: this.gameDetail.teamInf,
      compID: this.gameDetail.gameInf.competitionID
    });

  }

  /**
   * 試合経過登録に遷移
   */
  public onClickEditGameProgress(teamID: string): void {

    // 前ページからの情報取得
    // 【要修正】セッション情報からの取得に変更
    const editInfo = this.commonService.getEditInfo();

    // 試合経過登録画面へ遷移
    this.commonService.navigateWithEdit(CNS.pathToEditGameProgress, {
      id: editInfo.id,
      teamID: teamID,
      type: CNS.infoTypeGame,
      teamInf: this.gameDetail.teamInf,
      compID: this.gameDetail.gameInf.competitionID
    });

  }

  /**
   * 参照中の大会の管理者かどうか判定
   */
  get isEditableGameComp(): boolean {
    const userId = this.commonService.getLoginInfo().userId;

    // データ取得前に処理が呼ばれ、gameDetailが未定義によるエラーが出るため
    if(!this.gameDetail){
      return false;
    }

    const adminComp = this.gameDetail.compInf.compAdminInf.find(admin => {
      return admin.adminUserID == userId;
    });
    return adminComp ? true : false;
  }

  /**
   * 参照中の試合の参加チームの管理者かどうか判定
   */
  get isEditableGameTeam(): boolean {
    const userId = this.commonService.getLoginInfo().userId;
    const adminList: AdminInf[] = [];

    // データ取得前に処理が呼ばれ、gameDetailが未定義によるエラーが出るため
    if(!this.gameDetail){
      return false;
    }

    for(let i = 0; i < this.gameDetail.teamInf.length; i++){
      adminList.concat(this.gameDetail.teamInf[i].teamAdminInf);
    }

    const adminTeam = adminList.find(admin => {
      return admin.adminUserID == userId;
    });

    return adminTeam ? true : false;
  }

  // TODO 戻るボタンが無いが、付けるかどうか要検討

}

