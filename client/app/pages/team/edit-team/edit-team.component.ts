import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { UntypedFormGroup, Validators, UntypedFormBuilder, UntypedFormArray, ValidatorFn } from '@angular/forms';
import { Team } from 'defs/entity';
import ImageInf from 'defs/entity/imageInf';
import { InviteMemberInfo, ManagePlayerInfo } from 'defs/api';
import { EditPageBase } from '../../EditPageBase';
import { CNS, prefectures } from '../../../common/defines';
import { MSG } from '../../../common/message-defines';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-edit-team',
  templateUrl: './edit-team.component.html',
  styleUrls: ['./edit-team.component.scss']
})
export class EditTeamComponent  extends EditPageBase implements OnInit {

  formGroup: UntypedFormGroup;

  imageInfo: ImageInf;

  tableForm: UntypedFormGroup;

  admins: InviteMemberInfo[];

  players: ManagePlayerInfo[];

  prefectures = prefectures; // 47都道府県格納用

  prefecture = ''; // チーム都道府県格納用
  city = '';       // チーム市区町村格納用

  msg = MSG;

  // 招待中の選手を格納する変数
  invitationPlayer: string[];

  // 招待中のスタッフを格納する変数
  invitationStaff: string[];

  // 所属年月の項目間チェック用バリデーター
  teamDateValidator = (group: UntypedFormGroup): ValidatorFn => {

    let result = null;
    let teamStartDate = '';
    let teamEndDate = '';

    // 所属開始年月の日付形式を変換
    if(group.get('teamStartDate').value) {
      teamStartDate = formatDate(new Date(group.get('teamStartDate').value), 'yyyy/MM/dd', 'en');
    }

    // 所属終了年月の日付形式を変換
    if(group.get('teamEndDate').value) {
      teamEndDate = formatDate(new Date(group.get('teamEndDate').value), 'yyyy/MM/dd', 'en');
    }

    // 所属開始年月、所属終了年月が入力されている場合のみ判定
    if(teamEndDate && teamStartDate) {
      // 所属終了年月が所属開始年月より過去の場合エラー
      if(teamStartDate > teamEndDate) {
        result = {
          'teamEndDate-past': true
        };
      }
    }

    return result;
  };

  constructor(public commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    super(commonService);
    this.formGroup  = this.formBuilder.group({
      teamId: [''],
      teamName: ['', [Validators.required, Validators.maxLength(50)]],
      sports: ['', Validators.required],
      teamIntro: ['', Validators.maxLength(1000)],
      teamEstDate: ['', Validators.required],
      teamAddInf: this.formBuilder.group({
        teamCountry: ['日本', Validators.required],
        teamPrefecture: ['', Validators.required],
        teamCity: ['', [Validators.required, Validators.maxLength(100)]]
      }),
      teamTel: ['', Validators.maxLength(20)]
    });

    this.tableForm = this.formBuilder.group({
      playerList: this.formBuilder.array([])
    });
  }
  canDeactive(): boolean {
    return !this.formGroup.dirty && !this.tableForm.dirty;

  }

  async ngOnInit(): Promise<void> {
    const editInfo = this.commonService.getEditInfo();
    try {
      const res = await this.commonService.apiPost('team/editTeamInit', editInfo).toPromise();
      // 異常なら再度一覧から検索させる
      if (res.result != 'ok') {
        this.commonService.clearHistory();
        await this.commonService.errorOnApp();
        this.commonService.navigateBack();
        return;
      } else {
        const teamInfo = res.teamInfo;
        this.imageInfo = teamInfo.teamLogo || {
          dataUrl: '',
          transform: ''
        };

        // チーム所在地情報を持つデータであれば都道府県と市区町村を設定する
        if(teamInfo.teamAddInf) {
          this.prefecture = teamInfo.teamAddInf.teamPrefecture;
          this.city = teamInfo.teamAddInf.teamCity;
        }
        const value = {
          teamId: teamInfo.teamID,
          teamName: teamInfo.teamName,
          sports: teamInfo.sports,
          teamIntro: teamInfo.teamIntro,
          teamEstDate: teamInfo.teamEstDate,
          teamAddInf : {
            teamPrefecture: this.prefecture,
            teamCity: this.city
          },
          teamTel: teamInfo.teamTel
        };
        this.formGroup.patchValue(value);

        // ngOnInitが再度呼ばれた際のデータ重複防止のため変数の初期化を行う
        this.getPlayerList.length = 0;
        const formArray = this.tableForm.get('playerList') as UntypedFormArray;
        res.players.forEach((info, i) => {
          formArray.push(this.formBuilder.group({
            userId: [info.userId],
            uniNum: [info.uniNum, Validators.maxLength(3)],
            playerName: [info.playerName],
            gamePosition: [info.gamePosition, Validators.maxLength(25)],
            teamStartDate: [info.teamStartDate, Validators.required],
            teamEndDate: [info.teamEndDate],
            teamHistoryId: [info.teamHistoryId]
          }, {
            validator: this.teamDateValidator
          }));

          // 所属開始年月が未入力の場合、所属終了年月を非活性にする
          if(!info.teamStartDate) {
            formArray.controls[i].get('teamEndDate').disable();
          }
        });

        // 招待中の選手の情報を取得する
        this.invitationPlayer = res.invitationPlayer;

        // 招待中のスタッフの情報を取得する
        this.invitationStaff = res.invitationStaff;

        this.admins = res.admins;

        this.players = res.players;
      }
    } catch (e) {
      await this.commonService.errorOnService(CNS.targetTypeTeam + CNS.targetTypeInformation, CNS.actionTypeGet);
      this.commonService.navigateBack();
    }
  }

  async onSubmit(): Promise<void> {
    const data = this.formGroup.value as Team;
    if(this.imageInfo) {
      data.teamLogo = this.imageInfo;
    }
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.editConfirmation.replace('※1', CNS.targetTypeTeam));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      const res = await this.commonService.apiPost('team/editTeam', data).toPromise();

      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.editDoneTitle, this.msg.editDone.replace('※1', CNS.targetTypeTeam));

        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();

        // TODO 画面遷移


      } else {
        await this.commonService.errorOnApp();
      }

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeTeam, CNS.actionTypeEdit);
    }

  }

  async onEditPlayer(player: UntypedFormGroup): Promise<void> {
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.editConfirmation.replace('※1', CNS.targetTypePlayer + CNS.targetTypeInformation));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }
    const data = player.value;

    try{
      const res = await this.commonService.apiPost('team/updatePlayer', {
        teamId: this.commonService.getEditInfo().id,
        playerInfo: data
      }).toPromise();

      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.editDoneTitle, this.msg.editDone.replace('※1', CNS.targetTypePlayer + CNS.targetTypeInformation));

        // フォームの変更状態をもとに戻す
        player.markAsPristine();

      } else {
        await this.commonService.errorOnApp();
      }

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypePlayer + CNS.targetTypeInformation, CNS.actionTypeEdit);
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

  onClickReturnToDetail(): void {
    this.commonService.navigateBack();
  }

  get getPlayerList(): UntypedFormGroup[] {
    const formArray = this.tableForm.get('playerList') as UntypedFormArray;
    return formArray.controls as UntypedFormGroup[];
  }

  invitePlayer(): void {
    this.commonService.navigateWithEdit('team/playerList', {
      id: this.commonService.getEditInfo().id,
      type: this.commonService.getEditInfo().type,
      players: this.players
    });
  }

  toInviteStaff(): void {
    this.commonService.navigateWithEdit('team/userList', {
      id: this.commonService.getEditInfo().id,
      type: this.commonService.getEditInfo().type,
      staffList: this.admins
    });
  }

  /**
   * 管理者情報削除処理
   * @param id 管理者のID
   * @param name 管理者のニックネーム
   */
  public async removeAdminInfo(id: string, name: string): Promise<void> {

    // ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.staffReleaseConfirmation.replace('※1',name));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // 管理者情報削除処理
      const res = await this.commonService.apiPost('team/removeAdminInf', {
        id: id,
        teamId: this.commonService.getEditInfo().id,
      }).toPromise();

      // サーバサイド処理結果判定
      // 更新(削除)に成功した場合
      if(res.result == 'ok') {
        // 自分自身を所属スタッフから削除した場合、他に管理しているチームが無ければ権限を更新する
        if(!res.isAdminTeam) {
          const loginInfo = this.commonService.getLoginInfo();
          loginInfo.isAdminTeam = false;
          // セッション情報の更新
          this.commonService.setLoginInfo(loginInfo);
        }
        await this.commonService.openNoticeDialog(this.msg.staffReleaseDoneTitle, this.msg.staffReleaseDone.replace('※1',name));
        this.ngOnInit();
      // 編集中のチームの管理者が1人の場合
      } else if(res?.message) {
        await this.commonService.openNoticeDialog(this.msg.errTitle, `${res.message}`);
        this.ngOnInit();
      // 更新(削除)に失敗した場合
      } else {
        await this.commonService.errorOnApp();
      }

    } catch(e) {
      await this.commonService.errorOnService(name, CNS.actionTypeCancell);
    }

  }

  /**
   * 所属開始年月の入力有無により、所属終了年月の活性・非活性制御を行う
   * @param player
   */
  public onChangeTeamStartDate(player: UntypedFormGroup): void {

    if(player.get('teamStartDate').value) {
      // 所属開始年月が入力されている場合、所属終了年月を活性にする
      player.get('teamEndDate').enable();
    } else {
      // 所属開始年月が入力されていない場合、所属終了年月を非活性にする
      player.get('teamEndDate').disable();
    }
  }

}
