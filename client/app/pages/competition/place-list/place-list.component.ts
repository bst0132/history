import { Component } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { CommonService } from '../../../common/common.service';
import { ObjectId } from 'mongodb';
import { PlaceInfo } from 'defs/api';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-place-list',
  templateUrl: './place-list.component.html',
  styleUrls: ['./place-list.component.scss']
})
export class PlaceListComponent {

  formGroup: UntypedFormGroup;

  placeList: PlaceInfo[];

  placeIdList: ObjectId[];

  msg = MSG;

  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    this.formGroup = this.formBuilder.group({
      placeName: [''],
      placeAdd: [''],
      placeTel: ['']
    });
  }

  /**
   * 検索処理
   */
  public async onSearch(): Promise<void> {
    // 画面情報の設定
    const data = this.formGroup.value;

    try {
      // 検索処理
      const res = await this.commonService.apiPost('competition/searchPlace', {
        data: data,
        compId: this.commonService.getEditInfo().id
      }).toPromise();

      // 取得情報の設定
      this.placeList = res.placeList;
      this.placeIdList = res.placeIdList;

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * 開催地追加
   * @param place
   */
  public async addPlace(place: PlaceInfo): Promise<void> {

    // 確認ダイアログ表示
    const dialog = await this.commonService.openConfirmDialog(this.msg.confirmationTitle, this.msg.addConfirmation.replace('※1',place.placeName));

    // キャンセルなら処理中断
    if(!dialog) {
      return;
    }

    try {
      // 開催地に追加する
      const res = await this.commonService.apiPost('competition/addPlace', {
        data: place,
        compId: this.commonService.getEditInfo().id
      }).toPromise();

      // サーバサイド処理結果判定
      if(res.result == 'ok') {
        await this.commonService.openNoticeDialog(this.msg.addDoneTitle, this.msg.addDone.replace('※1',place.placeName));
        // 開催地に追加したIDを追加済みIDリストに加える
        this.placeIdList.push(place._idList[0]);

      } else {
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.addErr.replace('※1',place.placeName));
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * 追加済みであるか判定を行う
   * @param place
   */
  public isAdd(place: PlaceInfo): boolean {
    for (let i = 0; i < place._idList.length; i++) {
      const isAdd = this.placeIdList.includes(place._idList[i]);
      if(isAdd) {
        return isAdd;
      }
    }
    return false;
  }

  /**
   * 大会情報管理に戻る
   */
  public returnManageCompetition(): void {
    this.commonService.navigateBack();
  }

}
