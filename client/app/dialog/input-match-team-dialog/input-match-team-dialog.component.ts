import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { ObjectId } from 'mongodb';
import { CommonService } from 'client/app/common/common.service';

export interface DialogData {
  teamName: string;
  teamId: ObjectId;
  recordId: ObjectId;
  noEntry: boolean;
  teams: {
    joinTeamName: string;
    recordId: ObjectId;
    teamId: ObjectId;
  }[];
}

@Component({
  selector: 'app-input-match-team-dialog',
  templateUrl: './input-match-team-dialog.component.html',
  styleUrls: ['./input-match-team-dialog.component.scss']
})
export class InputMatchTeamDialogComponent {
  formGroup: UntypedFormGroup;
  inputData = {
    teamName: this.data.teamName,
    teamId: this.data.teamId,
    recordId: this.data.recordId,
    noEntry: this.data.noEntry,
    teams: this.data.teams
  };

  teams = this.inputData.teams;

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData, private formBuilder: UntypedFormBuilder,
  public matDialogRef: MatDialogRef<InputMatchTeamDialogComponent>, private commonService: CommonService) {
    this.formGroup = formBuilder.group({
      recordId: this.data.recordId
    });
  }

  public editTeamName(): void {
    const selectTeamInf = this.teams.find(selectTeamInf => {
      return selectTeamInf.recordId == this.formGroup.value.recordId;
    });

    this.inputData.teamName = selectTeamInf.joinTeamName;
    this.inputData.teamId = selectTeamInf.teamId ? selectTeamInf.teamId : null;
    this.inputData.recordId = selectTeamInf.recordId;
    this.inputData.noEntry = false;
    this.matDialogRef.close(this.inputData);
  }

  public onClickNoEntry(): void {
    this.inputData.noEntry = true;
    this.inputData.teamName = '';
    this.inputData.recordId = null;
    this.inputData.teamId = null;
    this.matDialogRef.close(this.inputData);
  }

  public closeDialog(): void {
    this.matDialogRef.close();
  }

  /**
   * Enterキー・スペースキー押下時にクリックイベント発火
   */
  public onKeyCheck(value: KeyboardEvent): void {
    this.commonService.onKeyCheck(value);
  }
}
