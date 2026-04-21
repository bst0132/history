import { Component, Input } from '@angular/core';
import { CommonService } from '../../common/common.service';
import { Team } from 'defs/entity';

@Component({
  selector: 'app-team-panel',
  templateUrl: './team-panel.component.html',
  styleUrls: ['./team-panel.component.scss']
})
export class TeamPanelComponent {

  @Input()
  team: Team;

  device: 'sp' | 'pc';

  constructor(commonService: CommonService) {
    this.device = commonService.isMobile ? 'sp' : 'pc';
  }

}
