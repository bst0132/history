import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { MSG } from '../../../common/message-defines';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormArray, ValidatorFn } from '@angular/forms';
import { EditPageBase } from '../../EditPageBase';
import ImageInf from 'defs/entity/imageInf';
import { CompetitionInf } from 'defs/entity';
import { CNS, compSystems } from 'client/app/common/defines';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { SelectOrgDialogComponent, OrgDialogData } from 'client/app/dialog/select-org-dialog/select-org-dialog.component';
import { SelectManageOrgTmDialogComponent, ManageOrgDialogData } from 'client/app/dialog/select-manage-org-tm-dialog/select-manage-org-tm-dialog.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-create-and-edit-comp',
  templateUrl: './create-and-edit-comp.component.html',
  styleUrls: ['./create-and-edit-comp.component.scss']
})
export class CreateAndEditCompComponent extends EditPageBase implements OnInit {

  // 新規登録モードフラグ(新規登録:true、編集:false)
  newCompFlg: boolean;

  // 入力情報保持用
  formGroup: UntypedFormGroup = null;

  // 画像表示
  imageInfo: ImageInf = {
    dataUrl: '',
    transform: ''
  };

  // 主催ID格納用
  orgFlag: string;

  // 固定のメッセージ
  msg = MSG;

  // 定数使用用変数
  cns = CNS;

  // 試合方式一覧配列使用用変数, 元の配列をコピーして格納
  compSystems = _.cloneDeep(compSystems);

  // 正規表現パターン(半角数字) //
  private patternNum = /^([1-9]\d*|0)$/;

  // デバイス判定用変数
  device: 'pc' | 'sp';

  // 大会方式制御メッセージ格納用
  controlMessage = '';

  // 大会開催期間のバリデーター
  public compDateVali = (formGroup: UntypedFormGroup): ValidatorFn => {
    let result = null;

    // 開会・閉会年月日の値を取得
    const openingDate = formGroup.get('openingDate').value;
    const closingDate = formGroup.get('closingDate').value;

    // 開会年月日が閉会年月日より未来の場合はエラー
    if (openingDate && closingDate && openingDate > closingDate) {
      result = {
        'wrongPeriod': true
      };
    }

    return result;
  };

  /**
   * コンストラクタ
   * @param commonService
   */
  constructor(public commonService: CommonService, private formBuilder: UntypedFormBuilder, private dialog: MatDialog) {
    super(commonService);

    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';

    // 一時的に主催は手入力のみの対応とし、プロパティはorganizerではなくotherOrgsのみを使用
    this.formGroup = this.formBuilder.group({
      compId: [''],
      compName: ['', [Validators.required, Validators.maxLength(50)]],
      openingDate: ['', Validators.required],
      closingDate: ['', Validators.required],
      openingTime: ['', Validators.maxLength(10)],
      closingTime: ['', Validators.maxLength(10)],
      compPlace: this.formBuilder.array([]),
      organizer: this.formBuilder.array([]),
      otherOrgs: this.formBuilder.array([]),
      supervisor: this.formBuilder.array([]),
      cosponsor: this.formBuilder.array([]),
      purpose: ['', Validators.maxLength(100)],
      entryQual: ['', Validators.maxLength(100)],
      gameRules: this.formBuilder.array([]),
      compSystemInf: this.formBuilder.group({
        compSystem: ['', Validators.maxLength(1)],
        winningPointInf: this.formBuilder.group({
          winPoint: [3, [Validators.required, Validators.min(0), Validators.max(100), Validators.pattern(this.patternNum)]],
          losePoint: [0, [Validators.required, Validators.min(0), Validators.max(100), Validators.pattern(this.patternNum)]],
          drawPoint: [1, [Validators.required, Validators.min(0), Validators.max(100), Validators.pattern(this.patternNum)]]
        })
      }),
      awards: ['', Validators.maxLength(100)],
      notes: this.formBuilder.array([]),
      entryFee: ['', Validators.maxLength(100)],
      remarks: ['', Validators.maxLength(200)],
      contact: this.formBuilder.group({
        name: ['', Validators.maxLength(20)],
        phoneNumber: ['', Validators.maxLength(20)]
      })
    }, {
      validator: this.compDateVali
    });
  }

  /**
   * 大会方式変更時の処理
   *
   */
  public onCompSystemChange(value: string): void {
    if (value === CNS.tournament) {
      this.formGroup.get('compSystemInf.winningPointInf').disable();
    } else {
      this.formGroup.get('compSystemInf.winningPointInf').enable();
    }
  }

  /**
   * 勝ち点入力欄の制限
   */
  public onPointCheck(score: KeyboardEvent): void {
    this.commonService.onNumberCheck(score);
  }

  /**
   * 初期状態からページの編集がされたか判定
   */
  public canDeactive(): boolean {
    return !this.formGroup.dirty;
  }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {
    const editInfo = this.commonService.getEditInfo();
    if (editInfo && editInfo?.newCompFlg === true) {
      // 新規登録の場合はngOnInitの処理（フォーム設定処理）を行わない
      this.newCompFlg = editInfo?.newCompFlg;

      // compSystemsにラジオボタン制御用プロパティ追加
      for (const compSystem of this.compSystems) {
        compSystem['controlFlg'] = false;
      }
      return;
    } else if (editInfo && editInfo?.newCompFlg === false) {
      // 登録済み大会の編集
      this.newCompFlg = editInfo?.newCompFlg;
    } else {
      // 遷移元から情報を受け取れていない場合(エラー)
      this.commonService.navigateBack();
      return;
    }

    try {
      // 登録済みの大会情報取得処理
      const res = await this.commonService.apiPost('competitionInf/getCompBaseInfo', editInfo).toPromise();
      // 異常があれば前の画面に戻る
      if (res.result != 'ok') {
        await this.commonService.errorOnApp();
        this.commonService.navigateBack();
        return;
      }

      // 大会要綱の配列以外の情報をフォームに設定
      const compInfo = res.compBaseInfo;
      this.formGroup.patchValue({
        compId: editInfo.id,
        compName: compInfo.compName,
        openingDate: new Date(compInfo.openingDate),
        closingDate: new Date(compInfo.closingDate),
        openingTime: compInfo?.openingTime,
        closingTime: compInfo?.closingTime,
        purpose: compInfo?.purpose,
        entryQual: compInfo?.entryQual,
        compSystemInf: {
          compSystem: compInfo?.compSystemInf?.compSystem,
          winningPointInf: {
            winPoint: compInfo?.compSystemInf?.winningPointInf?.winPoint,
            losePoint: compInfo?.compSystemInf?.winningPointInf?.losePoint,
            drawPoint: compInfo?.compSystemInf?.winningPointInf?.drawPoint
          }
        },
        awards: compInfo?.awards,
        entryFee: compInfo?.entryFee,
        remarks: compInfo?.remarks,
        contact: {
          name: compInfo?.contact?.name,
          phoneNumber: compInfo?.contact?.phoneNumber
        }
      });

      // compSystemsにラジオボタン制御用プロパティ追加
      for (const compSystem of this.compSystems) {
        compSystem['controlFlg'] = this.setControlFlg(compSystem.key, editInfo.leagueMatch, editInfo.tournamentMatch);
      }

      // compSystemsからリーグ、トーナメントの制御フラグをそれぞれ取得
      const league = this.compSystems.find( comp => comp.key === CNS.league);
      const leagueFlg = league ? league['controlFlg'] : false;

      const tournament = this.compSystems.find( comp => comp.key === CNS.tournament);
      const tournamentFlg = tournament ? tournament['controlFlg'] : false;

      // 大会方式制御メッセージ格納
      if (leagueFlg || tournamentFlg) {
        this.controlMessage = this.setControlMessage(leagueFlg, tournamentFlg);
      }

      // 大会方式がトーナメントの場合、勝ち点のフォームを無効化
      if (compInfo?.compSystemInf?.compSystem === CNS.tournament) {
        this.formGroup.get('compSystemInf.winningPointInf').disable();
      }

      // 配列で持つ値をそれぞれフォームに設定
      compInfo?.compPlace.map(elm => {
        this.getCompPlaces.push(this.formBuilder.control(elm, [Validators.maxLength(20), Validators.required]));
      });
      compInfo?.organizer.map((elm) => {
        const control = this.formBuilder.group({
          orgId: [elm.orgId],
          orgFlag: [elm.orgFlag],
          orgEditFlag: [elm.orgEditFlag],
          orgName: [elm.orgName],
        });
        this.getOrganizers.push(control);
      });
      compInfo?.otherOrgs.map(elm => {
        this.getOtherOrgs.push(this.formBuilder.control(elm, [Validators.maxLength(50), Validators.required]));
      });
      compInfo?.supervisor.map(elm => {
        this.getSupervisors.push(this.formBuilder.control(elm, [Validators.maxLength(50), Validators.required]));
      });
      compInfo?.cosponsor.map(elm => {
        this.getCosponsors.push(this.formBuilder.control(elm, [Validators.maxLength(50), Validators.required]));
      });
      compInfo?.gameRules.map(elm => {
        this.getRules.push(this.formBuilder.control(elm, [Validators.maxLength(100), Validators.required]));
      });
      compInfo?.notes.map(elm => {
        this.getNotes.push(this.formBuilder.control(elm, [Validators.maxLength(100), Validators.required]));
      });

      // 画像情報があれば設定
      if (compInfo?.compLogo?.dataUrl) {
        this.imageInfo = compInfo?.compLogo;
      }

    } catch (e) {
      await this.commonService.errorOnService(CNS.targetTypeComp + CNS.targetTypeInformation, CNS.actionTypeGet);
      this.commonService.navigateBack();
    }
  }

  /**
   * 大会方式のラジオボタン 制御フラグ設定
   * @param compSystem
   * @param leagueMatch
   * @param tournamentMatch
   * @returns false: ラジオボタン活性、true: ラジオボタン非活性
   */
  public setControlFlg(compSystem: string, leagueMatch: boolean, tournamentMatch: boolean): boolean {

    // リーグ・トーナメント共に試合が登録されていない場合、またはラジオボタン「リーグ・トーナメント」の場合
    if ((!leagueMatch && !tournamentMatch) || compSystem === CNS.leagueTournament) {
      return false;
    }

    // リーグ・トーナメント共に試合が登録されている場合
    if (leagueMatch && tournamentMatch) {
      return true;
    }

    // リーグの試合が登録されている場合
    if (leagueMatch) {
      return compSystem === CNS.tournament;
    }

    // トーナメントの試合が登録されている場合
    if (tournamentMatch) {
      return compSystem === CNS.league;
    }

    // どの分岐にも入らなかった場合
    return false;
  }

  /**
   * 大会方式制御メッセージ格納
   * @param leagueFlg
   * @param tournamentFlg
   * @returns
   */
  public setControlMessage(leagueFlg: boolean, tournamentFlg: boolean): string {

    // ラジオボタン「リーグのみ」「トーナメントのみ」が共に非活性の場合
    if (leagueFlg && tournamentFlg) {
      return this.msg.compSystemControl.replace('※1', CNS.targetTypeLeague + '・' + CNS.targetTypeTournament).replace('※2', '「' + CNS.targetTypeLeague + 'のみ」「' + CNS.targetTypeTournament + 'のみ」');
    }

    // 「リーグのみ」が非活性の場合
    if (leagueFlg) {
      return this.msg.compSystemControl.replace('※1', CNS.targetTypeTournament).replace('※2', '「' + CNS.targetTypeLeague + 'のみ」');
    }

    // 「トーナメントのみ」が非活性の場合
    if (tournamentFlg) {
      return this.msg.compSystemControl.replace('※1', CNS.targetTypeLeague).replace('※2', '「' + CNS.targetTypeTournament + 'のみ」');
    }

    // どの分岐にも入らなかった場合
    return '';
  }

  /**
   * 開催地のゲッター
   */
  get getCompPlaces(): UntypedFormArray {
    return this.formGroup.get('compPlace') as UntypedFormArray;
  }

  /**
   * 主催のゲッター
   */
  get getOrganizers(): UntypedFormArray {
    return this.formGroup.get('organizer') as UntypedFormArray;
  }

  /**
   * その他主催のゲッター
   */
  get getOtherOrgs(): UntypedFormArray {
    return this.formGroup.get('otherOrgs') as UntypedFormArray;
  }

  /**
   * 主管のゲッター
   */
  get getSupervisors(): UntypedFormArray {
    return this.formGroup.get('supervisor') as UntypedFormArray;
  }

  /**
   * 協賛のゲッター
   */
  get getCosponsors(): UntypedFormArray {
    return this.formGroup.get('cosponsor') as UntypedFormArray;
  }

  /**
   * 競技規則のゲッター
   */
  get getRules(): UntypedFormArray {
    return this.formGroup.get('gameRules') as UntypedFormArray;
  }

  /**
   * 注意事項のゲッター
   */
  get getNotes(): UntypedFormArray {
    return this.formGroup.get('notes') as UntypedFormArray;
  }

  /**
   * 閉会年月日フォームのtouchedフラグ設定
   */
  public setClosingTouchedFlag(): void {
    // 編集時、かつ閉会年月日のtouchedフラグがfalseの場合、touchedフラグを立てる
    // （開会年月日に閉会年月日より未来の日付を選択してエラーが発生した場合、touchedフラグがfalseの状態だとフォームが赤く変化しないため）
    if (!this.newCompFlg && !this.formGroup.get('closingDate').touched) {
      this.formGroup.get('closingDate').markAsTouched();
    }
  }

  /**
   * 開催地追加
   */
  public onAddPlace(): void {
    this.getCompPlaces.push(this.formBuilder.control('', [Validators.maxLength(20), Validators.required]));
  }

  /**
   * 開催地削除
   */
  public onDelPlace(index: number): void {
    this.getCompPlaces.removeAt(index);
    this.getCompPlaces.markAsDirty();
  }

  /**
   * 管理団体/チーム追加
   */
  public async onAddManageOrgs(): Promise<void> {

    // ダイアログに渡す情報を定義
    const data: ManageOrgDialogData = {
      idList: this.formGroup.value.organizer.map((org) => org.orgId)
    };

    const res = this.dialog.open(SelectManageOrgTmDialogComponent, {data});

    res.afterClosed().subscribe((res) => {
      if (res) {
        // 変更があればフォームに変更済みフラグを立て、ダイアログから受け取ったデータを格納
        this.formGroup.markAsDirty();
        this.getOrganizers.push(this.formBuilder.group({
          orgId: res.organId,
          orgName: res.organName,
          orgEditFlag: true,
          orgFlag: res.isOrgFlg
        }));
      }
    });
  }

  // 登録済み主催追加（isOrgFlgは団体かチームかを判別するためのフラグ true:団体 false:チーム）
  public async onAddOrgs(isOrgFlg: string): Promise<void> {

    // ダイアログに渡す情報を定義
    const data: OrgDialogData = {
      isOrgFlg,
      idList: this.formGroup.value.organizer.map((org) => org.orgId)
    };

    const res = await this.dialog.open(SelectOrgDialogComponent, {data});

    res.afterClosed().subscribe((res) => {
      if (res) {
        // 変更があればフォームに変更済みフラグを立て、ダイアログから受け取ったデータを格納
        this.formGroup.markAsDirty();
        res.forEach(res => {
          const newOrganizerGroup = this.formBuilder.group({
            orgId: res.organId,
            orgName: res.organName,
            orgEditFlag: true,
            orgFlag: isOrgFlg
          });
          this.getOrganizers.push(newOrganizerGroup);
        });
      }
    });
  }

  /**
   * 主催削除
   */
  public onDelOrgs(index: number): void {
    this.getOrganizers.removeAt(index);
    this.formGroup.markAsDirty();
  }

  /**
   * その他主催追加
   */
  public onAddOtherOrgs(): void {
    this.getOtherOrgs.push(this.formBuilder.control('', [Validators.maxLength(50), Validators.required]));
  }

  /**
   * その他主催削除
   */
  public onDelOtherOrgs(index: number): void {
    this.getOtherOrgs.removeAt(index);
    this.getOtherOrgs.markAsDirty();
  }

  /**
   * 主管追加
   */
  public onAddSupervisor(): void {
    this.getSupervisors.push(this.formBuilder.control('', [Validators.maxLength(50), Validators.required]));
  }

  /**
   * 主管削除
   */
  public onDelSupervisor(index: number): void {
    this.getSupervisors.removeAt(index);
    this.getSupervisors.markAsDirty();
  }

  /**
   * 協賛追加
   */
  public onAddCosponsor(): void {
    this.getCosponsors.push(this.formBuilder.control('', [Validators.maxLength(50), Validators.required]));
  }

  /**
   * 協賛削除
   */
  public onDelCosponsor(index: number): void {
    this.getCosponsors.removeAt(index);
    this.getCosponsors.markAsDirty();
  }

  /**
   * 競技規則追加
   */
  public onAddRules(): void {
    this.getRules.push(this.formBuilder.control('', [Validators.maxLength(100), Validators.required]));
  }

  /**
   * 競技規則削除
   */
  public onDelRules(index: number): void {
    this.getRules.removeAt(index);
    this.getRules.markAsDirty();
  }

  /**
   * 注意事項追加
   */
  public onAddNotes(): void {
    this.getNotes.push(this.formBuilder.control('', [Validators.maxLength(100), Validators.required]));
  }

  /**
   * 注意事項削除
   */
  public onDelNotes(index: number): void {
    this.getNotes.removeAt(index);
    this.getNotes.markAsDirty();
  }

  /**
   * 編集権限切り替え
   * @param index
   */
  onEditFlagChange(index: number): void {
    this.getOrganizers.at(index).get('orgEditFlag').setValue(!this.getOrganizers.at(index).get('orgEditFlag').value);
    this.formGroup.markAsDirty();
  }

  /**
   * 画像変更
   * @param imageInfo
   */
  onChangeImage(imageInfo: ImageInf): void {
    this.imageInfo = imageInfo;
    this.formGroup.markAsDirty();
  }

  /**
   * 登録処理
   */
  public async onClickReg(): Promise<void> {
    // 登録確認ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.regConfirmation.replace('※1', CNS.targetTypeComp));
    // キャンセルなら処理中断
    if (!dialog) {
      return;
    }

    // 現時点で不要なコントローラーを削除
    this.formGroup.removeControl('compId');

    // orgNameは不要なため削除
    for (let i = 0; i < this.getOrganizers.length; i++) {
      const organizer = this.getOrganizers.at(i) as UntypedFormGroup;
      if (organizer.get('orgName')) {
        organizer.removeControl('orgName');
      }
    }


    // 登録内容をフォームから設定
    const data = this.formGroup.value as CompetitionInf;
    if (this.imageInfo) {
      data.compLogo = this.imageInfo;
    }

    try {
      // 大会情報登録処理
      const res = await this.commonService.apiPost('competitionInf/regCompInfo', data).toPromise();

      // 処理が正常に行われた場合
      if (res.result == 'ok') {
        // 登録完了ダイアログ
        await this.commonService.openNoticeDialog(this.msg.regTitle, this.msg.regDone.replace('※1', CNS.targetTypeComp));

        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();

        // ログイン時必要情報を更新する
        const answer = await this.commonService.apiPost('user/reloadLoginInf', {}).toPromise();
        if (answer.result != 'ok') {
          // 異常があればログイン情報を削除してログインページに遷移
          await this.commonService.errorOnApp();
          this.commonService.navigateToLogin();
          return;
        }
        this.commonService.setLoginInfo(JSON.parse(JSON.stringify(answer.loginInfo)), false);

        // 大会IDと画面種別を渡して大会要綱画面に遷移する
        this.commonService.navigateWithEdit(CNS.pathToCompetitionGuide, {
          id: res.compId,
          type: 'competition'
        });

      } else if (res?.message){
        // 同じ大会名・日時の場合の登録エラーダイアログ
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.regErr.replace('※1', CNS.targetTypeComp) + '\n' + res.message);
        // 登録エラーダイアログ
      } else {
        await this.commonService.errorOnApp();
      }

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeComp, CNS.actionTypeReg);
    }
  }

  /**
   * 更新処理
   */
  public async onClickUpdate(): Promise<void> {
    // 更新確認ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.updateConfirmation.replace('※1', CNS.targetTypeComp));
    // キャンセルなら処理中断
    if (!dialog) {
      return;
    }

    // orgNameは不要なため削除
    for (let i = 0; i < this.getOrganizers.length; i++) {
      const organizer = this.getOrganizers.at(i) as UntypedFormGroup;
      if (organizer.get('orgName')) {
        organizer.removeControl('orgName');
      }
    }

    // 更新内容をフォームから設定
    const data = this.formGroup.value;
    if (this.imageInfo) {
      data.compLogo = this.imageInfo;
    }

    try {
      // 大会情報更新処理
      const res = await this.commonService.apiPost('competitionInf/modCompInfo', data).toPromise();

      // 処理が正常に行われた場合
      if (res.result == 'ok') {
        // 更新完了ダイアログ
        await this.commonService.openNoticeDialog(this.msg.updateDoneTitle, this.msg.updateDone.replace('※1', CNS.targetTypeComp));

        // フォームの変更状態をもとに戻す
        this.formGroup.markAsPristine();

        // ログイン時必要情報を更新する
        const answer = await this.commonService.apiPost('user/reloadLoginInf', {}).toPromise();
        if (answer.result != 'ok') {
          // 異常があればログイン情報を削除してログインページに遷移
          await this.commonService.errorOnApp();
          this.commonService.navigateToLogin();
          return;
        }
        this.commonService.setLoginInfo(JSON.parse(JSON.stringify(answer.loginInfo)), false);

        // 大会要綱画面に戻る
        this.commonService.navigateBack();

      } else if (res?.message){
        // 同じ大会名・日時の場合の更新エラーダイアログ
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.regErr.replace('※1', CNS.targetTypeComp) + '\n' + res.message);
        // 更新エラーダイアログ
      } else {
        await this.commonService.errorOnApp();
      }

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeComp, CNS.actionTypeUpdate);
    }
  }

  /**
   * 戻るボタン
   */
  public onClickBack(): void {
    this.commonService.navigateBack();
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
