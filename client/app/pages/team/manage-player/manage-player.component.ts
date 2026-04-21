import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../common/common.service';
import { UntypedFormGroup, Validators, UntypedFormBuilder, UntypedFormArray, Form } from '@angular/forms';
import { Team } from 'defs';
import { sports } from '../../../common/defines';
import { MSG } from '../../../common/message-defines';

@Component({
  selector: 'app-manage-player',
  templateUrl: './manage-player.component.html',
  styleUrls: ['./manage-player.component.scss']
})
export class ManagePlayerComponent implements OnInit {

  tableForm: UntypedFormGroup;

  searchType: string

  teamInfo: Team;

  msg = MSG;

  constructor(private commonService: CommonService,
    private formBuilder: UntypedFormBuilder) {
      this.tableForm = this.formBuilder.group({
        playerList: this.formBuilder.array([])
      });
  }

  async ngOnInit(): Promise<void> {
    try {
      const res = await this.commonService.apiPost('team/managePlayerList', {
        teamId: this.commonService.getEditInfo().id
      }).toPromise();

      const formArray = this.tableForm.get('playerList') as UntypedFormArray;
      res.playerList.forEach(info => {
        formArray.push(this.formBuilder.group({
          userId: [info.userId],
          uniNum: [info.uniNum],
          playerName: [info.playerName],
          gamePosition: [info.gamePosition],
          teamStartDate: [info.teamStartDate],
          teamEndDate: [info.teamEndDate]
        }));
      });

      this.teamInfo = res.teamInfo;

    } catch(e) {
      this.commonService.errorOnApi(e);
      this.commonService.navigateBack();
    }

  }

  get getPlayerList(): UntypedFormGroup[] {
    const formArray = this.tableForm.get('playerList') as UntypedFormArray;
    return formArray.controls as UntypedFormGroup[];
  }

  getSportValue(key: string): string {
    if(!key) return '';
    return sports.find(s => s.key == key).value;
  }

  async onEditPlayer(player: UntypedFormGroup): Promise<void> {
    const data = player.value;
    try {
      const res = await this.commonService.apiPost('team/updatePlayer', {
        teamId: this.teamInfo._id,
        playerInfo: data
      }).toPromise();

      console.log(res);

    } catch(e) {
      this.commonService.errorOnApi(e);
    }

  }

  invitePlayer(): void {
    this.commonService.navigateTo('team/playerList');
  }

  returnToDetail(): void {
    this.commonService.navigateBack();
  }

}
