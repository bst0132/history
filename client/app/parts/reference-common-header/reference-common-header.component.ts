import { Component } from '@angular/core';
import { CommonService } from '../../common/common.service';

@Component({
  selector: 'app-reference-common-header',
  templateUrl: './reference-common-header.component.html',
  styleUrls: ['./reference-common-header.component.scss']
})
export class ReferenceCommonHeaderComponent {

  /**
   * コンストラクタ
   */
  constructor(public commonService: CommonService) {
    // 現時点で特別な処理はなし
  }

}
