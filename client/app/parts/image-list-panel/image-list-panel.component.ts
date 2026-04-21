import { Component, Input } from '@angular/core';
import ImageInf from 'defs/entity/imageInf';

@Component({
  selector: 'app-image-list-panel',
  templateUrl: './image-list-panel.component.html',
  styleUrls: ['./image-list-panel.component.scss']
})
export class ImageListPanelComponent {

  @Input()
  imageInfo: ImageInf;

}
