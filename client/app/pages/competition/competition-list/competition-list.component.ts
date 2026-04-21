import { Component } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, ValidatorFn } from '@angular/forms';
import { CommonService } from '../../../common/common.service';
import { sports, CNS } from '../../../common/defines';
import { CompetitionForCompList, OrganInfo, TeamInfo } from 'defs/api';
import { MSG } from '../../../common/message-defines';


@Component({
  selector: 'app-competition-list',
  templateUrl: './competition-list.component.html',
  styleUrls: ['./competition-list.component.scss']
})
export class CompetitionListComponent {

  compList: CompetitionForCompList[];

  formGroup: UntypedFormGroup;

  sports = sports;

  count: number;

  organList: OrganInfo[];

  teamList: TeamInfo[];

  msg = MSG;

  // 大会開催日の項目間チェック用バリデーター
  heldDateValidator = (group: UntypedFormGroup): ValidatorFn => {

    let result = null;

    // 大会開催日の(to)が入力されていて、(from)が未入力か判定
    if(!(group.get('heldDateFrom').value) && group.get('heldDateTo').value) {
    // 大会開催日の(to)が入力されていて、(from)が未入力の場合、エラー
      result = {
        'heldDateTo-only': true
      };
    }

    // 大会開催日(from)、(to)が未入力の場合は判定しない
    if(!group.get('heldDateFrom').value || !group.get('heldDateTo').value) {
      return result;
    // 大会開催日の(to)が(from)より過去か判定
    } else if(group.get('heldDateFrom').value > group.get('heldDateTo').value) {
      // 大会開催日の(to)が(from)より過去の場合、エラー
      result = {
        'heldDateTo-past': true
      };
    }

    return result;
  }

  constructor(private commonService: CommonService, private formBuilder: UntypedFormBuilder) {
    this.formGroup = formBuilder.group({
      compName: ['', Validators.required],
      sports: [sports[0].key, Validators.required],
      organName: [''],
      heldDateFrom: [''],
      heldDateTo: ['']
    }, {
      validator: this.heldDateValidator
    });
  }

  /**
   * 検索処理
   */
  async onSearch(): Promise<void> {
    // フォームの値を設定
    const data = this.formGroup.value;

    try {
      // 検索処理
      const res = await this.commonService.apiPost('competition/competitionList', data).toPromise();

      // サーバ処理エラー判定
      if(res.result == 'ok') {
        // 検索結果を受け取る
        this.compList = res.compList;
        this.count = res.count;
        this.organList = res.organList;
        this.teamList = res.teamList;
      } else {
        // エラーメッセージの表示
        await this.commonService.openNoticeDialog(this.msg.errTitle, this.msg.searchErr);
      }

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  /**
   * 大会情報に遷移する
   * @param competition
   */
  public competitionDetail(competition: CompetitionForCompList): void {
    // 大会情報に遷移
    this.commonService.navigateWithEdit(CNS.pathToCompetitionDetail, {
        id: competition.compID,
        type: 'competition'
    });
  }

  /**
   * 主催団体名を取得する
   * @param organID
   */
  public getorganizerName(organID: string): string {
    const findRsltTeam = this.teamList.find((team) => {
      return team.teamID.toString() == organID;
    });

    // 検索結果がある場合、チーム名を返却し、無い場合は空文字を返却
    if(findRsltTeam) {
      return findRsltTeam.teamName;

    } else {
      const findRsltOrgan = this.organList.find((organ) => {
        return organ.organID.toString() == organID;
      });

      if(findRsltOrgan) {
        return findRsltOrgan.organName;
      } else {
        return '';
      }
    }
  }

}
