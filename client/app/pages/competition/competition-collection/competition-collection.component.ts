import { Component } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { MSG } from '../../../common/message-defines';
import { CommonService } from '../../../common/common.service';
import { CNS } from 'client/app/common/defines';
import { ObjectId } from 'mongodb';

@Component({
  selector: 'app-competition-collection',
  templateUrl: './competition-collection.component.html',
  styleUrls: ['./competition-collection.component.scss']
})
export class CompetitionCollectionComponent {
  condition = true;
  formGroup: UntypedFormGroup;
  testDayCheck = false;
  msg = MSG;
  collectionList = [];
  searchCondition = true;
  device: 'pc' | 'sp';

  constructor(private formBuilder: UntypedFormBuilder, public commonService: CommonService) {
    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';

    // 開催日 初期値設定：前月の1日、0時
    const openingSetDate = new Date();
    openingSetDate.setMonth(openingSetDate.getMonth() - 1);
    openingSetDate.setDate(1);
    openingSetDate.setHours(0, 0, 0, 0);

    // 終了日 初期値設定：2か月後の最終日、0時
    const closingSetDate = new Date();
    closingSetDate.setMonth(closingSetDate.getMonth() + 3);
    closingSetDate.setDate(0);
    closingSetDate.setHours(0, 0, 0, 0);

    this.formGroup = this.formBuilder.group(
      {
        openingDate: [openingSetDate],
        closingDate: [closingSetDate]
      }
    );
  }

  public async ngOnInit(): Promise<void> {
    // 初期画面として検索条件を前月から再来月までの4ヵ月間に設定し大会検索を行う
    await this.onSearch();
  }

  // 絞り込み条件を表示、非表示させる処理
  public conditionFlag(): void {
    this.condition = !this.condition;
  }

  // 日付条件で検索する処理
  public async onSearch(): Promise<void> {
    // フォームの値を設定
    const data = this.formGroup.value;

    this.searchCondition = !this.searchCondition;

    // 検索結果の初期化
    this.collectionList = [];

    try {
      const res = await this.commonService.apiPost('competitionInf/getCompCollectionInfs', data).toPromise();

      // 取得情報格納
      this.collectionList = res.compCollectionList;

      // 主催・参加判定用ユーザーID
      const userId = this.commonService.getLoginInfo().userId;

      // 主催・参加判定処理
      this.collectionList.forEach((collection, index) => {
        if (collection.compAdminInf.adminUserID === userId) {
          this.collectionList[index]['compDecisionFlg'] = true;
        } else {
          this.collectionList[index]['compDecisionFlg'] = false;
        }
      });

    } catch (e) {
      await this.commonService.errorOnService(CNS.targetTypeComp + CNS.targetTypeInformation, CNS.actionTypeGet);
    } finally {
      this.searchCondition = !this.searchCondition;
    }
    return;
  }

  /**
   * 大会要綱画面遷移
   */
  public onClickCompGuide(compId: ObjectId): void {
    this.commonService.navigateWithEdit(CNS.pathToCompetitionGuide, {
      id: compId,
      type: 'competition'
    });
  }

  /**
   * 大会登録・編集画面遷移(新規登録)
   */
  public onClickCreateComp(): void {
    // 渡すidはないためnullを設定
    this.commonService.navigateWithEdit(CNS.pathToCreateAndEditComp, {
      id: null,
      newCompFlg: true,
      leagueMatch: false,
      tournamentMatch: false
    });
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
