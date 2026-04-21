import { Component } from '@angular/core';
import { sports, CNS, prefectures } from '../../../common/defines';
import { CommonService } from 'client/app/common/common.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Organ } from 'defs';
import { ObjectId } from 'mongodb';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-organization-list',
  templateUrl: './organization-list.component.html',
  styleUrls: ['./organization-list.component.scss']
})
export class OrganizationListComponent {

  // 変数
  public sportsList = sports;
  public organList: Organ[] = [];  // 団体表示用のリスト
  public formGroup: UntypedFormGroup;     // 検索条件
  public organCnt: number;

  prefectures = prefectures; // 47都道府県格納用

  searchFlg = false; // 検索ボタン押下判定用

  msg = MSG;

  /**
   * コンストラクタ
   */
  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    this.formGroup = formBuilder.group({
      organName: ['', Validators.maxLength(50)],
      sports: [sports[0].key, Validators.required],
      organPrefecture: ['', Validators.required]
    });

    this.organCnt = -1;
  }

  /**
   * 検索処理
   */
  public async onClickSearch(): Promise<void>{
    // 条件を取得
    const data = this.formGroup.value;

    try {
      // 現行の団体データを条件で取得
      const res = await this.commonService.apiPost('organ/organList', data).toPromise();
      this.organList = res.organList;
      this.organCnt = res.organCnt;

      // 検索ボタン押下済みフラグをONにする
      this.searchFlg = true;

    } catch(e) {
      await this.commonService.errorOnService(CNS.targetTypeOrg, CNS.actionTypeSearch);
    }

  }

  /**
   * 詳細画面遷移
   * @param id
   */
  public onClickDetail(id: ObjectId): void{
    // 団体詳細画面へ遷移
    this.commonService.navigateWithEdit(CNS.pathToOrganDetail, {
      id: id,
      type: CNS.infoTypeOrgan
    });
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
