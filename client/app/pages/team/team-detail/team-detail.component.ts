import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { UntypedFormGroup, Validators, UntypedFormBuilder } from '@angular/forms';
import { ManagePlayerInfo, CompetitionInf } from 'defs/api';
import { OrganInfo, TeamInfo, TeamInfoDetail } from 'defs/api';
import { ObjectId } from 'mongodb';
import { MSG } from '../../../common/message-defines';
import { CNS } from 'client/app/common/defines';

@Component({
  selector: 'app-team-detail',
  templateUrl: './team-detail.component.html',
  styleUrls: ['./team-detail.component.scss']
})
export class TeamDetailComponent implements OnInit {

  formGroup: UntypedFormGroup;

  teamInfo: TeamInfoDetail;

  players: ManagePlayerInfo[];

  futurePlayers: ManagePlayerInfo[];

  pastPlayers: ManagePlayerInfo[];

  // 主催団体情報を代入する配列の変数
  organList: OrganInfo[];

  // 主催チーム情報を代入する配列の変数
  teamList: TeamInfo[];

  // 参加大会情報と主催大会情報を代入する配列の変数
  partCompHisList: CompetitionInf[];

  // 主催した大会IDを代入する配列の変数
  organizeCompIds: ObjectId[];

  // 検索条件に一致した過去の所属選手格納用の変数
  pastPlayersList = [];

  // 検索結果表示用フラグ
  isDispFlg = false;

  // 主催団体名を格納する変数
  organizerNameList = [];

  msg = MSG;

  // プルダウンの年を格納する変数
  years: number[] = [];

  // デバイス判定用変数
  device: 'pc' | 'sp';

  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    this.formGroup = this.formBuilder.group({
      year: ['', Validators.required]
    });
    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';
  }

  async ngOnInit(): Promise<void> {
    const editInfo = this.commonService.getEditInfo();
    if(!editInfo || editInfo.type != 'team') {
      await this.commonService.errorOnEdit();
      return;
    }

    // 現在までの西暦を取得
    const currentYear = new Date().getFullYear();
    const startYear = 1990;
    this.years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i);

    try {
      const res = await this.commonService.apiPost('team/teamDetail', editInfo).toPromise();
      // 異常なら再度一覧から検索させる
      if (res.result != 'ok') {
        await this.commonService.errorOnApp();
        this.commonService.navigateBack();
        return;
      }
      this.teamInfo = res.teamInfo;
      this.players = res.players;
      this.futurePlayers = res.futurePlayers;
      this.pastPlayers = res.pastPlayers;
      // 参加大会情報と主催大会情報を配列として取得
      this.partCompHisList = res.partCompHisList;
      // 主催大会の大会IDのみを配列として取得
      this.organizeCompIds = res.organizeComp.map(oc => oc.compId);
      // 主催大会の団体IDと主催団体名を配列として取得
      this.organList = res.organList;
      // 主催大会のチームIDと主催団体名を配列として取得
      this.teamList = res.teamList;

      // データを受け取ったときに主催団体名情報をリストとして作成
      this.createOrganizerNameList();

    }catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeTeam + CNS.targetTypeInformation, CNS.actionTypeGet);
      this.commonService.navigateBack();
    }
  }

  /**
   * 参照中のチームの管理者かどうか判定
   */
  get isEditableTeam(): boolean {
    const userId = this.commonService.getLoginInfo().userId;

    // データ取得前に処理が呼ばれ、teamInfoが未定義によるエラーが出るため
    if(!this.teamInfo){
      return false;
    }

    const adminTeam = this.teamInfo.teamAdminInf.find( admin => {
      return admin.adminUserID == userId;
    });
    return adminTeam ? true : false;
  }

  editTeam(): void {
    this.commonService.navigateWithEdit('editTeam', this.commonService.getEditInfo());
  }

  returnToList(): void {
    this.commonService.navigateBack();
  }

  /**
   * 過去の所属選手の検索処理
   */
  public async onSearch(): Promise<void> {

    // 過去の所属選手検索結果の格納用変数を初期化
    this.pastPlayersList = [];

    // フォームに入力した年を取得
    const year = this.formGroup.get('year').value;

    // 入力した年が過去の所属選手の所属開始年～所属終了年に一致するデータを取得
    this.pastPlayersList = this.pastPlayers.filter(players => {
      const startYear = this.commonService.getYear(players.teamStartDate);
      const endYear = this.commonService.getYear(players.teamEndDate);
      return startYear <= year && year <= endYear;
    });

    // 検索結果のメッセージを表示する
    this.isDispFlg = true;
  }

  /**
   *  主催団体名取得処理
   */
  private createOrganizerNameList(): void {
    const organizer = [];
    // teamListの要素をチーム名のみ取得
    this.teamList?.forEach(team => {
      organizer[team.teamID.toString()] = team.teamName;
    });
    // organListの要素を団体名のみ取得
    this.organList?.forEach(organ => {
      organizer[organ.organID.toString()] = organ.organName;
    });
    // 取得したチーム・団体名をリストに格納
    this.organizerNameList = organizer;
  }
}
