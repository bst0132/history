import { CNS } from './common/defines';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './common/auth.guard';
import { CanDeactiveGuard } from './common/can-deactive.guard';
import { SendMailComponent } from './pages/user/send-mail/send-mail.component';
import { CreateUserComponent } from './pages/user/create-user/create-user.component';
import { LoginComponent } from './pages/login/login.component';
import { ProfileDetailComponent } from './pages/user/profile-detail/profile-detail.component';
import { ChangePasswordComponent } from './pages/user/change-password/change-password.component';
import { CreateTeamComponent } from './pages/team/create-team/create-team.component';
import { TeamListComponent } from './pages/team/team-list/team-list.component';
import { TeamDetailComponent } from './pages/team/team-detail/team-detail.component';
import { EditTeamComponent } from './pages/team/edit-team/edit-team.component';
import { UserListComponent } from './pages/user-list/user-list.component';
import { ManagePlayerComponent } from './pages/team/manage-player/manage-player.component';
import { PlayerListComponent } from './pages/player-list/player-list.component';
import { CreateCompetitionComponent } from './pages/competition/create-competition/create-competition.component';
import { CompetitionListComponent } from './pages/competition/competition-list/competition-list.component';
import { CreateOrganizationComponent } from './pages/organization/create-organization/create-organization.component';
import { OrganizationListComponent } from './pages/organization/organization-list/organization-list.component';
import { OrganDetailComponent } from './pages/organization/organ-detail/organ-detail.component';
import { ManageOrganInfComponent } from './pages/organization/manage-organ-inf/manage-organ-inf.component';
import { GameListComponent } from './pages/game/game-list/game-list.component';
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
import { HealthComponent } from './pages/etc/health/health.component';
import { CreateCompetitionLeagueComponent } from './pages/competition/create-competition-league/create-competition-league.component';
import { ReferenceCompetitionLeagueComponent } from './pages/competition/reference-competition-league/reference-competition-league.component';
import { CompetitionGuideComponent } from './pages/competition/competition-guide/competition-guide.component';
import { CompetitionCollectionComponent } from './pages/competition/competition-collection/competition-collection.component';
import { CreateAndEditCompComponent } from './pages/competition/create-and-edit-comp/create-and-edit-comp.component';
import { CreateAndEditCompTournamentComponent } from './pages/competition/create-and-edit-comp-tournament/create-and-edit-comp-tournament.component';
import { ReferenceCompetitionGuideComponent } from './pages/competition/reference-competition-guide/reference-competition-guide.component';
import { ReferenceCompetitionTournamentComponent } from './pages/competition/reference-competition-tournament/reference-competition-tournament.component';


const routes: Routes = [
  {path: '', redirectTo: CNS.pathToLogin, pathMatch: 'full'},
  {path: CNS.pathToSendMail, component: SendMailComponent},
  {path: CNS.pathToResetPassword, component: SendMailComponent},
  {path: CNS.pathToCreateUser, component: CreateUserComponent},
  {path: CNS.pathToLogin, component: LoginComponent},
  {path: CNS.pathToProfileDetail, component: ProfileDetailComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToChangePassword, component: ChangePasswordComponent},
  {path: CNS.pathToCreateTeam, component: CreateTeamComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToTeamList, component: TeamListComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToTeamDetail, component: TeamDetailComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToEditTeam, component: EditTeamComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToUserList, component: UserListComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToManagePlayer, component: ManagePlayerComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToPlayerList, component: PlayerListComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToCreateCompetition, component: CreateCompetitionComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToCompetitionList, component: CompetitionListComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToCreateOrganization, component: CreateOrganizationComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToOrganList, component: OrganizationListComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToOrganDetail, component: OrganDetailComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToManageOrgan, component: ManageOrganInfComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToGameList, component: GameListComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToTeamHistoryList, component: TeamHistoryListComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToManageTmOrgList, component: ManageTmOrgListComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToCompetitionDetail, component: CompetitionDetailComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToManageCompetition, component: ManageCompetitionComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToCreateGame, component: CreateGameComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  // {path: CNS.pathToCreateTournament, component: CreateTournamentComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToCreateLeague, component: CreateLeagueComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToInviteOrgan, component: InviteOrganComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToInviteMember, component: InviteMemberComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToInviteTeam, component: InviteTeamComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToCreatePlace, component: CreatePlaceComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToPlaceList, component: PlaceListComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToGameDetail, component: GameDetailComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToEditGame, component: EditGameComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToEditGameMember, component: EditGameMemberComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToEditGameResult, component: EditGameResultComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToEditGameProgress, component: EditGameProgressComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToPlayerResult, component: PlayerResultComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToEditPassword, component: EditPasswordComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToSiteMap, component: SiteMapComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToCompanyProfile, component: CompanyProfileComponent},
  {path: CNS.pathToTermsUse, component: TermsUseComponent},
  {path: CNS.pathToPrivacyPolicy, component: PrivacyPolicyComponent},
  {path: CNS.pathToLeagueDetail, component: LeagueDetailComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToTournamentDetail, component: TournamentDetailComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToEditLeague, component: EditLeagueComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  // {path: CNS.pathToEditTournament, component: EditTournamentComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToManageCompList, component: ManageCompListComponent, canActivate: [AuthGuard]},
  {path: CNS.pathToEditProfile, component: EditProfileComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToEditEmail, component: EditEmailComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToHealth, component: HealthComponent},
  {path: CNS.pathToCreateCompetitionLeague, component: CreateCompetitionLeagueComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToReferenceCompetitionLeague, component: ReferenceCompetitionLeagueComponent},
  {path: CNS.pathToCompetitionGuide, component: CompetitionGuideComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToCollectionCompetition, component: CompetitionCollectionComponent},
  {path: CNS.pathToCreateAndEditComp, component: CreateAndEditCompComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]},
  {path: CNS.pathToReferenceCompetitionGuide, component: ReferenceCompetitionGuideComponent},
  {path: CNS.pathToReferenceTournament, component: ReferenceCompetitionTournamentComponent},
  {path: CNS.pathToCreateAndEditCompTournament, component: CreateAndEditCompTournamentComponent, canDeactivate: [CanDeactiveGuard], canActivate: [AuthGuard]}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
