import { Component } from '@angular/core';
import { userPolicy } from '../../../common/message-defines';
import { CommonService } from '../../../common/common.service';

@Component({
  selector: 'app-terms-use',
  templateUrl: './terms-use.component.html',
  styleUrls: ['./terms-use.component.scss']
})
export class TermsUseComponent {

  // デバイス判定用変数
  device: 'pc' | 'sp';

  // 利用規約内容
  userPolicy = userPolicy;

  constructor(public commonService: CommonService) {
    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';
  }
}
