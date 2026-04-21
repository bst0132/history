import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// Angular Material
// 必要なモジュールがあれば追加
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatPasswordStrengthModule } from '@angular-material-extensions/password-strength';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatDividerModule } from '@angular/material/divider';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { ImageCropperModule } from 'ngx-image-cropper';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { QRCodeModule } from 'angularx-qrcode';
import {A11yModule} from '@angular/cdk/a11y';


// 自前のコンポーネント
// ng generate componentで追加される
import { CreateUserComponent } from './pages/user/create-user/create-user.component';
import { SendMailComponent } from './pages/user/send-mail/send-mail.component';
import { LoginComponent } from './pages/login/login.component';
import { ProfileDetailComponent } from './pages/user/profile-detail/profile-detail.component';
import { CommonDialogComponent } from './dialog/common-dialog/common-dialog.component';
import { ChangePasswordComponent } from './pages/user/change-password/change-password.component';
import { CreateTeamComponent } from './pages/team/create-team/create-team.component';
import { CreateTeamButtonComponent } from './parts/create-team-button/create-team-button.component';
import { TeamListComponent } from './pages/team/team-list/team-list.component';
import { TeamDetailComponent } from './pages/team/team-detail/team-detail.component';
import { OmitLongSentencePipe } from './pipes/omit-long-sentence.pipe';
import { EditTeamComponent } from './pages/team/edit-team/edit-team.component';
import { UserListComponent } from './pages/user-list/user-list.component';
import { ManagePlayerComponent } from './pages/team/manage-player/manage-player.component';
import { PlayerListComponent } from './pages/player-list/player-list.component';
import { InviteListComponent } from './parts/invite-list/invite-list.component';
import { CreateCompetitionComponent } from './pages/competition/create-competition/create-competition.component';
import { CompetitionListComponent } from './pages/competition/competition-list/competition-list.component';
import { CreateOrganizationComponent } from './pages/organization/create-organization/create-organization.component';
import { OrganizationListComponent } from './pages/organization/organization-list/organization-list.component';
import { OrganDetailComponent } from './pages/organization/organ-detail/organ-detail.component';
import { GetSportValuePipe } from './pipes/get-sport-value.pipe';
import { LabelComponent } from './parts/label/label.component';
import { ImageSelectComponent } from './parts/image-select/image-select.component';
import { ManageOrganInfComponent } from './pages/organization/manage-organ-inf/manage-organ-inf.component';
import { CommonHeaderComponent } from './parts/common-header/common-header.component';
import { CommonFooterComponent } from './parts/common-footer/common-footer.component';
import { GameListComponent } from './pages/game/game-list/game-list.component';
import { TeamPanelComponent } from './parts/team-panel/team-panel.component';
import { SelectImageAreaDialogComponent } from './dialog/select-image-area-dialog/select-image-area-dialog.component';
import { TeamHistoryListComponent } from './pages/user/team-history-list/team-history-list.component';
import { ManageTmOrgListComponent } from './pages/user/manage-tm-org-list/manage-tm-org-list.component';
import { CompetitionDetailComponent } from './pages/competition/competition-detail/competition-detail.component';
import { ManageCompetitionComponent } from './pages/competition/manage-competition/manage-competition.component';
import { CreateGameComponent } from './pages/game/create-game/create-game.component';
// import { CreateTournamentComponent } from './pages/game/create-tournament/create-tournament.component';
import { CreateLeagueComponent } from './pages/game/create-league/create-league.component';
import { InviteOrganComponent } from './pages/competition/invite-organ/invite-organ.component';
import { GameDetailComponent } from './pages/game/game-detail/game-detail.component';
import { InviteMemberComponent } from './pages/competition/invite-member/invite-member.component';
import { InviteTeamComponent } from './pages/competition/invite-team/invite-team.component';
import { CreatePlaceComponent } from './pages/competition/create-place/create-place.component';
import { PlaceListComponent } from './pages/competition/place-list/place-list.component';
import { EditGameComponent } from './pages/game/edit-game/edit-game.component';
import { EditGameMemberComponent } from './pages/game/edit-game-member/edit-game-member.component';
import { EditGameResultComponent } from './pages/game/edit-game-result/edit-game-result.component';
import { EditGameProgressComponent } from './pages/game/edit-game-progress/edit-game-progress.component';
import { PlayerResultComponent } from './pages/user/player-result/player-result.component';
import { ImagePanelComponent } from './parts/image-panel/image-panel.component';
import { EditPasswordComponent } from './pages/user/edit-password/edit-password.component';
import { SiteMapComponent } from './pages/footer/site-map/site-map.component';
import { CompanyProfileComponent } from './pages/footer/company-profile/company-profile.component';
import { TermsUseComponent } from './pages/footer/terms-use/terms-use.component';
import { LeagueDetailComponent } from './pages/game/league-detail/league-detail.component';
import { TournamentDetailComponent } from './pages/game/tournament-detail/tournament-detail.component';
import { EditLeagueComponent } from './pages/game/edit-league/edit-league.component';
import { PrivacyPolicyComponent } from './pages/footer/privacy-policy/privacy-policy.component';
import { EditTournamentComponent } from './pages/game/edit-tournament/edit-tournament.component';
import { ManageCompListComponent } from './pages/user/manage-comp-list/manage-comp-list.component';
import { EditProfileComponent } from './pages/user/edit-profile/edit-profile.component';
import { EditEmailComponent } from './pages/user/edit-email/edit-email.component';
import { CompleteScreenComponent } from './parts/complete-screen/complete-screen.component';
import { HealthComponent } from './pages/etc/health/health.component';
import { NotReceiveMailComponent } from './parts/not-receive-mail/not-receive-mail.component';
import { CompetitionGuideComponent } from './pages/competition/competition-guide/competition-guide.component';
import { GamePanelComponent } from './parts/game-panel/game-panel.component';
import { CompetitionCollectionComponent } from './pages/competition/competition-collection/competition-collection.component';
import { TimeNumberToStringPipe } from './pipes/time-number-to-string.pipe';
import { GetCompSystemValuePipe } from './pipes/get-compSystem-value.pipe';
import { CreateAndEditCompComponent } from './pages/competition/create-and-edit-comp/create-and-edit-comp.component';
import { InputTeamDialogComponent } from './dialog/input-team-dialog/input-team-dialog.component';
import { InputMatchTeamDialogComponent } from './dialog/input-match-team-dialog/input-match-team-dialog.component';
import { InputMatchDialogComponent } from './dialog/input-match-dialog/input-match-dialog.component';
import { SelectTeamDialogComponent } from './dialog/select-team-dialog/select-team-dialog.component';
import { ImageListPanelComponent } from './parts/image-list-panel/image-list-panel.component';
import { CreateCompetitionLeagueComponent } from './pages/competition/create-competition-league/create-competition-league.component';
import { CompetitionTabCommonComponent } from './pages/competition/competition-common/competition-tab-common/competition-tab-common.component';
import { ParticipatingTeamsTabCommonComponent } from './pages/competition/competition-common/participating-teams-tab-common/participating-teams-tab-common.component';
import { ScheduleTabCommonComponent } from './pages/competition/competition-common/schedule-tab-common/schedule-tab-common.component';
import { CompetitionCommonTournamentComponent } from './pages/competition/competition-common/competition-common-tournament/competition-common-tournament.component';
import { CreateQrcodeDialogComponent } from './dialog/create-qrcode-dialog/create-qrcode-dialog.component';
import { SelectOrgDialogComponent } from './dialog/select-org-dialog/select-org-dialog.component';
import { SelectManageOrgTmDialogComponent } from './dialog/select-manage-org-tm-dialog/select-manage-org-tm-dialog.component';
import { ReferenceCompetitionGuideComponent } from './pages/competition/reference-competition-guide/reference-competition-guide.component';
import { ReferenceCommonHeaderComponent } from './parts/reference-common-header/reference-common-header.component';
import { ReferenceCompetitionTournamentComponent } from './pages/competition/reference-competition-tournament/reference-competition-tournament.component';
import { CreateAndEditCompTournamentComponent } from './pages/competition/create-and-edit-comp-tournament/create-and-edit-comp-tournament.component';
import { ReferenceCompetitionLeagueComponent } from './pages/competition/reference-competition-league/reference-competition-league.component';
import { CompetitionCommonLeagueComponent } from './pages/competition/competition-common/competition-common-league/competition-common-league.component';
import { ChangeDateDisplayPipe } from './pipes/change-date-display.pipe';
import { CopyCompetitionDialogComponent } from './dialog/copy-competition-dialog/copy-competition-dialog.component';
import { EditTeamDialogComponent } from './dialog/edit-team-dialog/edit-team-dialog.component';
import { ChangeTimeDisplayPipe } from './pipes/change-time-display.pipe';
import { DisableStepperFocusDirective } from './common/disable-stepper-focus.directive';

export const MY_FORMATS = {
  parse: {
    dateInput: 'YYYY/MM/DD',
  },
  display: {
    dateInput: 'YYYY/MM/DD',
    monthYearLabel: 'YYYY/MM',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY MMMM',
  }
};

@NgModule({
  declarations: [
    AppComponent,
    CreateUserComponent,
    SendMailComponent,
    LoginComponent,
    ProfileDetailComponent,
    CommonDialogComponent,
    ChangePasswordComponent,
    CreateTeamComponent,
    CreateTeamButtonComponent,
    TeamListComponent,
    TeamDetailComponent,
    OmitLongSentencePipe,
    EditTeamComponent,
    UserListComponent,
    ManagePlayerComponent,
    PlayerListComponent,
    InviteListComponent,
    CreateCompetitionComponent,
    CompetitionListComponent,
    CreateOrganizationComponent,
    OrganizationListComponent,
    OrganDetailComponent,
    GetSportValuePipe,
    LabelComponent,
    ImageSelectComponent,
    ManageOrganInfComponent,
    CommonHeaderComponent,
    CommonFooterComponent,
    GameListComponent,
    TeamPanelComponent,
    SelectImageAreaDialogComponent,
    TeamHistoryListComponent,
    ManageTmOrgListComponent,
    CompetitionDetailComponent,
    ManageCompetitionComponent,
    CreateGameComponent,
    // CreateTournamentComponent,
    CreateLeagueComponent,
    InviteOrganComponent,
    GameDetailComponent,
    InviteMemberComponent,
    InviteTeamComponent,
    CreatePlaceComponent,
    PlaceListComponent,
    EditGameComponent,
    EditGameMemberComponent,
    EditGameResultComponent,
    EditGameProgressComponent,
    PlayerResultComponent,
    ImagePanelComponent,
    EditPasswordComponent,
    SiteMapComponent,
    CompanyProfileComponent,
    TermsUseComponent,
    PrivacyPolicyComponent,
    LeagueDetailComponent,
    TournamentDetailComponent,
    EditLeagueComponent,
    EditTournamentComponent,
    ManageCompListComponent,
    EditProfileComponent,
    EditEmailComponent,
    CompleteScreenComponent,
    HealthComponent,
    NotReceiveMailComponent,
    CompetitionGuideComponent,
    GamePanelComponent,
    CompetitionCollectionComponent,
    TimeNumberToStringPipe,
    GetCompSystemValuePipe,
    CreateAndEditCompComponent,
    InputTeamDialogComponent,
    InputMatchTeamDialogComponent,
    InputMatchDialogComponent,
    SelectTeamDialogComponent,
    ImageListPanelComponent,
    CreateCompetitionLeagueComponent,
    CompetitionTabCommonComponent,
    ParticipatingTeamsTabCommonComponent,
    ScheduleTabCommonComponent,
    CompetitionCommonTournamentComponent,
    CreateQrcodeDialogComponent,
    SelectOrgDialogComponent,
    SelectManageOrgTmDialogComponent,
    ReferenceCompetitionGuideComponent,
    ReferenceCommonHeaderComponent,
    ReferenceCompetitionTournamentComponent,
    CreateAndEditCompTournamentComponent,
    ReferenceCompetitionLeagueComponent,
    CompetitionCommonLeagueComponent,
    ChangeDateDisplayPipe,
    CopyCompetitionDialogComponent,
    EditTeamDialogComponent,
    ChangeTimeDisplayPipe,
    DisableStepperFocusDirective
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatSidenavModule,
    MatPasswordStrengthModule,
    MatDialogModule,
    MatSelectModule,
    MatIconModule,
    MatTableModule,
    MatToolbarModule,
    MatMenuModule,
    MatExpansionModule,
    DragDropModule,
    MatDividerModule,
    MatListModule,
    MatTabsModule,
    MatCheckboxModule,
    MatStepperModule,
    ImageCropperModule,
    HammerModule,
    MatGridListModule,
    MatRadioModule,
    MatTooltipModule,
    CdkAccordionModule,
    MatButtonToggleModule,
    ClipboardModule,
    MatSlideToggleModule,
    QRCodeModule,
    A11yModule
  ],
  providers: [{
    provide: DateAdapter,
    useClass: MomentDateAdapter,
    deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
  },{
    provide: MAT_DATE_FORMATS,
    useValue: MY_FORMATS
  },{
    provide: MAT_DATE_LOCALE,
    useValue: 'ja-JP'
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
