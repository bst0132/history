import { Component, OnInit } from '@angular/core';
import { CommonService } from 'client/app/common/common.service';
import { CNS, compSystems } from 'client/app/common/defines';
import { Organ, User} from 'defs';
import { CompetitionInf } from 'defs/api';

@Component({
  selector: 'app-organ-detail',
  templateUrl: './organ-detail.component.html',
  styleUrls: ['./organ-detail.component.scss']
})
export class OrganDetailComponent implements OnInit {

  // 変数
  public organInfo: Organ;

  public staffList: Omit<User, '_id' | 'password' | 'mailAdd' | 'parentId'>[];

  public compList: CompetitionInf[];

  // 大会方式の一覧を格納する変数
  compSystemList = [];

  // デバイス判定用変数
  device: 'pc' | 'sp';

  constructor(private commonService: CommonService) {
    // 初期値生成
    this.organInfo = {
      sports: '',
      organAdminInf: []
    } as Organ;

    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';
  }

  /**
   * 初期処理
   */
  public async ngOnInit(): Promise<void> {
    // 照会対象の情報を取得する
    const editInfo = this.commonService.getEditInfo();

    // 照会対象情報が正当でない場合、団体一覧画面に遷移させる: TODO 画面遷移先をCNSに持って行く

    // 情報が設定されていない場合は正当でないこととする
    if(editInfo == void 0){
      this.commonService.navigateBack();
      return;
    }

    // 照会情報が団体情報でない場合は正当でないこととする
    if(editInfo.type !== CNS.infoTypeOrgan){
      this.commonService.navigateBack();
      return;
    }

    try {
      // 正当な場合はデータを取得して設定する
      const res = await this.commonService.apiPost('organ/getOrganFromId', {
        _id: editInfo.id
      }).toPromise();

      // データが正常に取得できた場合はデータを設定
      if(res.result === 'ok'){
        this.organInfo = res.organInfo;
        this.staffList = res.staffList;
        this.compList = res.compList;
      } else {
        await this.commonService.errorOnApp();
        this.commonService.navigateBack();
      }

      // 大会方式を一覧で取得
      this.createCompSystemList();

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeOrg + CNS.targetTypeInformation, CNS.actionTypeGet);
      this.commonService.navigateBack();
    }

  }

  /**
   * 大会方式取得処理
   */
  private createCompSystemList(): void {
    const compSysteminf = [];
    compSystems.forEach(system => {
      let compSystem = system.value;
      if (this.device === 'sp' && system.key === CNS.leagueTournament) {
        compSystem = compSystem.slice(0, 4) + '\n' + compSystem.slice(4);
      }
      compSysteminf[system.key] = compSystem;
    });
    this.compSystemList = compSysteminf;
  }

  /**
   * 一覧画面へ戻る処理
   */
  public returnToList(): void{
    // 一覧画面へ遷移する
      this.commonService.navigateBack();
  }

  /**
   * 編集ボタン押下時処理
   */
  public editOrganInf(): void{
    // 団体情報管理画面へ遷移
    this.commonService.navigateWithEdit(CNS.pathToManageOrgan, {
      id: this.organInfo._id,
      type: CNS.infoTypeOrgan
    });
  }

  /**
   * 参照中の団体の管理者かどうか判定
   */
  get isOrganAdmin(): boolean {
    const userId = this.commonService.getLoginInfo().userId;
    const adminInf = this.organInfo.organAdminInf.find( admin => {
      return admin.adminUserID == userId;
    });
    return adminInf ? true : false;
  }

  get getOrganAddress(): string {
    return this.organInfo.organAddInf ? `${this.organInfo.organAddInf.organPrefecture}${this.organInfo.organAddInf.organCity}` : '';
  }
}


