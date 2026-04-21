import { Component } from '@angular/core';
import { privacyPolicy } from '../../../common/message-defines';
import { CommonService } from '../../../common/common.service';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss']
})
export class PrivacyPolicyComponent {

  // デバイス判定用変数
  device: 'pc' | 'sp';

  // 個人情報保護方針内容表示
  privacyPolicy = privacyPolicy;

  constructor(public commonService: CommonService) {
    // デバイス判定
    this.device = commonService.isMobile ? 'sp' : 'pc';
  }
}
