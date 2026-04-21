import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { Competition } from 'defs/entity';
import { CNS } from '../../../common/defines';
import { LeagueTournamentInfo } from 'defs/api';

@Component({
  selector: 'app-competition-detail',
  templateUrl: './competition-detail.component.html',
  styleUrls: ['./competition-detail.component.scss']
})
export class CompetitionDetailComponent implements OnInit {

  compInfo: Competition;

  /** リーグの情報 */
  leagueList: LeagueTournamentInfo[];

  /** トーナメントの情報 */
  tournamentList: LeagueTournamentInfo[];

  /**
   * コンストラクタ
   * @param commonService
   */
  constructor(private commonService: CommonService) {}

  /**
   * 大会参照画面の初期処理
   */
  public async ngOnInit(): Promise<void> {
    // 遷移元から情報を受け取る
    const editInfo = this.commonService.getEditInfo();
    if(!editInfo || (editInfo.type != 'competition' && editInfo.type != CNS.infoTypeGame)) {
      this.commonService.navigateBack();
      return;
    }

    try {
      // 大会情報の検索処理
      const res = await this.commonService.apiPost('competition/competitionDetail', editInfo).toPromise();
      // 異常なら再度一覧から検索させる
      if (res.result != 'ok') {
        this.commonService.navigateBack();
        return;
      }

      // 取得情報の設定
      this.compInfo = res.compInfo;
      // リーグ・トーナメント情報を分けて変数に格納
      this.leagueList = res.gameGroupList.filter(list => {
        return list.gameSystem === 'リーグ';
      });
      this.tournamentList = res.gameGroupList.filter(list => {
        return list.gameSystem === 'トーナメント';
      });

    } catch(e) {
      this.commonService.errorOnApi(e);
      this.commonService.navigateBack();
    }

  }

  /**
   * 戻るボタン押下時の処理
   */
  public pageBack(): void {
    // 大会検索画面に遷移
    this.commonService.navigateBack();
  }

  /**
   * 大会情報管理に遷移
   */
  public manageCompetition(): void {
    // 大会情報管理に遷移
    this.commonService.navigateWithEdit(CNS.pathToManageCompetition, {
      id: this.compInfo._id,
      type: 'competition'
    });
  }

  /**
   * リーグ・トーナメント編集画面への遷移処理
   * @param row
   */
  public navigateGameGroupDetail(row: LeagueTournamentInfo): void {

    // 遷移する画面のパス
    let path = '';

    // 試合形式によって遷移する画面のパスを切り替える
    // MEMO 単独試合をどうするか未定のためswitchで制御、単独試合をなしとするならif文に変える
    switch(row.gameSystem) {
      case 'リーグ':
        path = CNS.pathToLeagueDetail;
        break;

      case 'トーナメント':
        path = CNS.pathToTournamentDetail;
        break;

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
   * 参照中の大会の管理者かどうか判定
   */
  get isEditableComp(): boolean {
    const userId = this.commonService.getLoginInfo().userId;

    // データ取得前に処理が呼ばれ、compInfoが未定義によるエラーが出るため
    if(!this.compInfo){
      return false;
    }

    const adminComp = this.compInfo.compAdminInf.find( admin => {
      return admin.adminUserID == userId;
    });
    return adminComp ? true : false;
  }

}
