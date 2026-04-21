import { Component, Input } from '@angular/core';
import { CommonService } from '../../common/common.service';
import ImageInf from 'defs/entity/imageInf';

@Component({
  selector: 'app-image-panel',
  templateUrl: './image-panel.component.html',
  styleUrls: ['./image-panel.component.scss']
})
export class ImagePanelComponent {

  @Input()
  imageInfo: ImageInf;

  @Input()
  mode: 'picture';

  device: 'sp' | 'pc';

  constructor(commonService: CommonService) {
    this.device = commonService.isMobile ? 'sp' : 'pc';
  }

}
