import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { GameInfo, CompInfo, Place, TeamInfo, OrganInfo } from 'defs/api';
import { CNS } from 'client/app/common/defines';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-edit-game',
  templateUrl: './edit-game.component.html',
  styleUrls: ['./edit-game.component.scss']
})
export class EditGameComponent implements OnInit {

  formGroup: UntypedFormGroup;

  game: GameInfo;

  competition: CompInfo;

  placeList: Place[];

  teamList: TeamInfo[];

  organList: OrganInfo[];

  msg = MSG;

  /**
   * コンストラクタ
   */
  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    this.formGroup = this.formBuilder.group({
      eventDate: [''],
      gameStartTime: [''],
      gameEndTime: [''],
      gameAttendance: [''],
      gamePlaceName: [''],
      gamePlaceAdd: [''],
      gamePlaceTel: [''],
      gamePlaceWeather: [''],
      gamePlaceTemp: [''],
      gamePlaceHumi: [''],
      gameSystem: [''],
      gameSystemName: [''],
      gameIntro: [''],
      gameName: [''],
      chiefUmpire: [''],
      subUmpire: [''],
      fourthUmpire: [''],
      teamInfo1: [''],
      teamInfo2: ['']
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

    try {
      // 初期表示情報の取得
      const res = await this.commonService.apiPost('game/editGameInit', editInfo).toPromise();
      // 異常なら再度一覧から検索させる
      if (res.result != 'ok') {
        this.commonService.navigateBack();
        return;
      }

      // 取得結果の設定
      this.game = res.game;
      this.competition = res.competition;
      this.placeList = res.place;
      this.teamList = res.team;
      this.organList = res.organ;

      // 画面情報の設定
      this.formGroup.get('eventDate').setValue(this.game.gameInfCom.eventDate);
      this.formGroup.get('gameStartTime').setValue(this.game.gameInfCom.gameStartTime);
      this.formGroup.get('gameEndTime').setValue(this.game.gameInfCom.gameEndTime);
      this.formGroup.get('gameAttendance').setValue(this.game.gameInfCom.gameAttendance);
      this.formGroup.get('gamePlaceName').setValue(this.game.gameInfCom.gamePlaceName);
      this.formGroup.get('gamePlaceAdd').setValue(this.game.gameInfCom.gamePlaceAdd);
      this.formGroup.get('gamePlaceTel').setValue(this.game.gameInfCom.gamePlaceTel);
      this.formGroup.get('gamePlaceWeather').setValue(this.game.gameInfCom.gamePlaceWeather);
      this.formGroup.get('gamePlaceTemp').setValue(this.game.gameInfCom.gamePlaceTemp);
      this.formGroup.get('gamePlaceHumi').setValue(this.game.gameInfCom.gamePlaceHumi);
      this.formGroup.get('gameIntro').setValue(this.game.gameInfCom.gameIntro);
      this.formGroup.get('gameName').setValue(this.game.gameInfCom.gameName);
      this.formGroup.get('chiefUmpire').setValue(this.game.gameInfSports.chiefUmpire);
      this.formGroup.get('subUmpire').setValue(this.game.gameInfSports.subUmpire);
      this.formGroup.get('fourthUmpire').setValue(this.game.gameInfSports.fourthUmpire);
      // 開催地が一つの場合フォームに値を設定する
      if(this.competition.placeID.length == 1) {
        this.formGroup.get('gamePlaceName').setValue(this.competition.placeID[0]);
      }
      // 試合形式の設定
      this.formGroup.get('gameSystem').setValue(this.game.gameInfCom.gameSystemInf.gameSystem);
      // 試合グループ名の設定
      this.formGroup.get('gameSystemName').setValue(this.game.gameInfCom.gameSystemInf.gameSystemName);
      // チーム情報の設定
      this.formGroup.get('teamInfo1').setValue(this.game.teamInfo[0].teamID);
      this.formGroup.get('teamInfo2').setValue(this.game.teamInfo[1].teamID);

    } catch(e) {
      this.commonService.errorOnApi(e);
      this.commonService.navigateBack();
    }

  }

  /**
   * 試合情報変更処理
   */
  public async modGameInfo(): Promise<void> {

    // フォームの情報を設定
    const form = this.formGroup.value;

    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.updateConfirmation.replace('※1','試合情報'));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // 試合情報変更処理
      const res = await this.commonService.apiPost('game/modGameInfo', {
        form: form,
        game: this.game,
        compId: this.competition.compId
      }).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.updateDoneTitle, this.msg.updateDone.replace('※1','試合情報'));

        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();

        this.commonService.navigateWithEdit(CNS.pathToGameDetail, {
          id: this.commonService.getEditInfo().id,
          type: CNS.infoTypeGame
        });
      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.updateErr.replace('※1','試合情報'));
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * 試合情報確定処理
   */
  public async confirmGame(): Promise<void> {

    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.confirmConfirmation.replace('※1','試合情報'));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // 試合情報確定処理
      const res = await this.commonService.apiPost('game/confirmGame', {
        game: this.game,
        compId: this.competition.compId
      }).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.confirmDoneTitle, this.msg.confirmDone.replace('※1','試合情報'));
        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();
        this.commonService.navigateWithEdit(CNS.pathToGameDetail, {
          id: this.commonService.getEditInfo().id,
          type: CNS.infoTypeGame
        });
      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.confirmErr.replace('※1','試合情報'));
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
   * 開催地IDを元に開催地名を取得する
   * @param placeID
   */
  public getPlaceName(placeID: string): string {
    if(!placeID) return '';
    const place = this.placeList.find(place => place.placeID.toString() == placeID);
    return place.placeName;
  }

  /**
   * 開催地IDを元に開催地住所を取得する
   * @param placeName
   */
  public getPlaceAdd(placeName: string): string {
    if(!placeName) return '';
    const place =  this.placeList.find(place => place.placeName.toString() == placeName);
    if(place) {
      this.formGroup.get('gamePlaceAdd').setValue(place.placeAdd);
      return place.placeAdd;
    } else {
      return '';
    }
  }

  /**
   * 開催地IDを元に開催地電話番号を取得する
   * @param placeName
   */
  public getPlaceTel(placeName: string): string {
    if(!placeName) return '';
    const place =  this.placeList.find(place => place.placeName.toString() == placeName);
    if(place) {
      this.formGroup.get('gamePlaceTel').setValue(place.placeTel);
      return place.placeTel;
    } else {
      return '';
    }
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

}
