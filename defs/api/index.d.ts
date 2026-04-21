import { Observable } from 'rxjs';
import { User, Team, InvitationInf, Organ, Competition, Game, GameResult, TeamHistory, PlaceHistory, PlayerHistory, TeamGameRecord, CompetitionInf as CompInf, GameGroups as GameInf} from '../entity';
import SportsInf from '../entity/sportsInf';
import { ObjectId } from 'mongodb';
import ImageInf from 'defs/entity/imageInf';

export interface CommonRes {
  result: 'ok' | 'ng';
  message?: string;
}

export interface LoginInfo {
  nickname: string;
  userId: string;
  isPlayer: boolean;
  isAdminTeam: boolean;
  isAdminOrgan: boolean;
  isAdminComp: boolean;
  backImage?: string;
  management: ObjectId[];
  userImage?: ImageInf;
}

export interface LoginRes extends CommonRes {
  loginInfo: LoginInfo;
}

export interface ProfileRes extends CommonRes {
  userInfo: Omit<User, '_id' | 'password' | 'mailAdd' | 'parentId'>;
}

export interface UserListRes extends CommonRes {
  user: User;
}

export interface TeamListRes extends CommonRes {
  teamList: TeamForTmOrgList[];
  teamsCnt: number;
}

export interface CompetitionInf extends Omit<Competition, '_id'> {
  compId: Competition['_id'];
}

export interface TeamDetailRes extends CommonRes {
  teamInfo: TeamInfoDetail;
  players: ManagePlayerInfo[];
  pastPlayers: ManagePlayerInfo[];
  futurePlayers: ManagePlayerInfo[];
  organizeComp: CompetitionInf[];
  partCompHisList: CompetitionInf[];
  organList: OrganInfo[];
  teamList: TeamInfo[];
}

export interface EditTeamInitRes extends CommonRes {
  teamInfo: TeamInfoDetail;
  players: ManagePlayerInfo[];
  admins: InviteMemberInfo[];
  invitationPlayer: string[];
  invitationStaff: string[];
}

export interface OrganListRes extends CommonRes {
  organList: Organ[];
  organCnt: number;
}

export interface OrganDetail extends CommonRes{
  organInfo?: Organ;
  staffList?: Omit<User, 'password' | 'mailAdd' | 'parentId'>[];
  compList?: CompetitionInf[];
  invitationStaff?: string[];
}

export interface CreateOrganRes extends CommonRes {
  message?: string;
  id?: ObjectId;
}

export interface InviteStaffRes extends CommonRes {
  invitedUser: ObjectId[];
}

export interface ManagePlayerInfo {
  userId: ObjectId;
  playerName: string;
  uniNum: string;
  gamePosition: string;
  teamStartDate: string;
  teamEndDate: string;
  userImage: ImageInf;
  teamHistoryId: ObjectId;
}

export interface TeamManagePlayerListRes extends CommonRes {
  teamInfo: Team;
  playerList: ManagePlayerInfo[];
}

export interface PlayerInfo {
  userId: ObjectId;
  playerName: string;
  sports?: SportsInf['sport'][];
  age?: number;
  userImage: ImageInf;
  heightNum: string;
  heightUnit: string;
  weightNum: string;
  weightUnit: string;
}

export interface PlayerListRes extends CommonRes {
  playerList: PlayerInfo[];
}

export interface PlayerRes extends CommonRes {
  playerInfo: PlayerSearchResult;
}

export interface PlayerSearchResult {
  id: ObjectId;
  playerName: string;
  userImage?: ImageInf;
}

export interface InvitePlayerRes extends CommonRes {
  invitedPlayer: ObjectId[];
}

export interface InviteInfo {
  inviteId: ObjectId;
  inviteOriName: string;
  inviteDestName?: string;
  inviteType: InvitationInf['authType'];
}

export interface InviteListRes extends CommonRes {
  inviteList: InviteInfo[];
}

export interface GameList {
  gameID: ObjectId;
  sports: string;
  competitionID: string;
  teamID: string[];
  teamName: string[];
  gameResults: string[];
  gameDate: string;
  compName: string;
  gameInf: string;
}

export interface GameListRes extends CommonRes{
  gameList?: GameList[];
}

export interface LeagueTournamentInfo {
  gameSystem: string;
  groupName: string;
  groupPartTeamCnt: number;
  gameConfirmFlg?: string;
  teamIdList?: string[];
}

export interface TeamHistoryInfo {
  teamID: string;
  sports: string;
  teamName: string;
  teamStartDate: string;
  teamEndDate: string;
}

export interface TeamHistoryListRes extends CommonRes {
  teamHistoryList: TeamHistoryInfo[];
}

export interface TeamForTmOrgList extends Pick<Team, 'teamName' | 'teamAddInf' | 'teamLogo'> {
  teamID: Team['_id'];
}
export interface OrganForTmOrgList extends Pick<Organ, 'organName' | 'organAddInf' | 'organLogo'> {
  organID: Organ['_id'];
}
export interface ManageTmOrgListRes extends CommonRes {
  teamList: TeamForTmOrgList[];
  organList: OrganForTmOrgList[];
}

export interface ManageCompListRes extends CommonRes {
  compList: CompetitionForCompList[];
  organList: OrganInfo[];
  teamList: TeamInfo[];
}

export interface CompetitionForCompList extends Pick<Competition, 'compName' | 'heldDate' | 'compLogo' | 'organizerInf'> {
  compID: Competition['_id'];
}

export interface CompetitionListRes extends CommonRes {
  compList: CompetitionForCompList[];
  organList: OrganInfo[];
  teamList: TeamInfo[];
  count?: number;
}

export interface CompetitionDetailRes extends CommonRes {
  compInfo: Competition;
  gameGroupList: LeagueTournamentInfo[];
}

export interface ManageCompetitionRes extends CommonRes {
  compInfo: Competition;
  teamList: Team[];
  organList: CompOrganInfo[];
  gameList: LeagueTournamentInfo[];
  memberList: CompAdminInfo[];
  placeList: PlaceInfo[];
  gameInfoListAll: Game[];
  gameInfoList: Game[];
  gameResultList: Omit<GameResult, '_id'>[];
}

export interface CompOrganInfo {
  id: string;
  organName: string;
  organLogo?: ImageInf;
}

export interface CompAdminInfo {
  id: string;
  adminFlg: string;
  organizerNames?: string[];
  userImage?: ImageInf;
  name: string;
}

export interface CompInfForCreGame extends Pick<Competition, 'compName' | 'sports' | 'compLogo'> {
  compId: Competition['_id'];
}
export interface CreateGameRes extends CommonRes {
  compInfo: CompInfForCreGame;
  teamList?: TeamInfo[];
}

export interface InviteOrganInfo {
  id: ObjectId;
  type: string;
  organName: string;
  organAddInf: Organ['organAddInf'];
  organLogo: ImageInf;
}

export interface InviteOrganizerTeamInfo {
  id: ObjectId;
  type: string;
  teamName: string;
  teamAddInf: Team['teamAddInf'];
  teamLogo: ImageInf;
}

export interface InviteOrganRes extends CommonRes {
  organInfoList: InviteOrganInfo[];
  teamInfoList: InviteOrganizerTeamInfo[];
  invitedList: ObjectId[];
}

export interface InviteRes extends CommonRes {
  invitedId: ObjectId;
}

export interface OrganizerInfo {
  _id: ObjectId;
  organName: string;
  organFlg: '1' | '2';
}

export interface GetorganizerRes extends CommonRes {
  organizerList: OrganizerInfo[];
}

export interface InviteMemberInfo {
  _id: ObjectId;
  adminFlg: string;
  userId?: string;
  organizerNames?: string[];
  name: string;
}

export interface InviteMemberRes extends CommonRes {
  inviteMemberInfoList: InviteMemberInfo[];
  invitedList: ObjectId[];
}

export interface InviteTeamInfo {
  _id: ObjectId;
  teamName: string;
  teamAddress: string;
}

export interface InviteTeamRes extends CommonRes {
  teamInfoList: InviteTeamInfo[];
  invitedList: ObjectId[];
}

export interface PlaceInfo {
  _idList?: ObjectId[];
  id?: string;
  placeName: string;
  placeAdd?: string;
  placeTel?: string;
}

export interface SearchPlaceRes extends CommonRes {
  placeList: PlaceInfo[];
  placeIdList: ObjectId[];
}

export interface GameInfo extends Pick<Game, 'gameInfCom' | 'gameInfSports' | 'teamInfo'> {
  gameID: Game['_id'];
}
export interface CompInfo extends Pick<Competition, 'compName' | 'sports' | 'compLogo' | 'organizerInf' | 'teamID' | 'placeID'> {
  compId: Competition['_id'];
}
export interface Place extends Pick<PlaceHistory, 'placeName' | 'placeAdd' | 'placeTel'> {
  placeID: PlaceHistory['_id'];
}
export interface TeamInfo extends Pick<Team, 'teamName'> {
  teamID: Team['_id'];
}
export interface TeamInfoDetail extends Omit<Team, '_id'> {
  teamID: Team['_id'];
}
export interface OrganInfo extends Pick<Organ, 'organName'> {
  organID: Organ['_id'];
}

export interface EditGameInfo extends CommonRes {
  game: GameInfo;
  competition: CompInfo;
  place: Place[];
  team: TeamInfo[];
  organ: OrganInfo[];
}

export interface GamePlayerInfo extends Pick<User, 'playerInf'> {
  userID: User['_id'];
}
export interface EditGameMemberInfo extends CommonRes {
  game: GameInfo;
  competition: CompInfo;
  playerInfo: GamePlayerInfo[];
  teamHis: Pick<TeamHistory, 'userID' | 'teamPosition' | 'teamSportsHisInf'>[];
  team: TeamInfo[];
  organ: OrganInfo[];
}

export interface EditGameResultInfo extends CommonRes {
  game: GameInfo;
  gameResult: Omit<GameResult, '_id'>;
  competition: Omit<Competition, '_id'>;
  team: TeamInfo[];
  organ: OrganInfo[];
  oppScoreResult: number;
}

export interface EditGameProgressInfo extends CommonRes {
  game: GameInfo;
  gameResult: Omit<GameResult, '_id'>;
  competition: Omit<Competition, '_id'>;
  playerInfo: GamePlayerInfo[];
  team: TeamInfo[];
  organ: OrganInfo[];
}

export interface NameList {
  id: ObjectId;
  name: string;
}

export interface GameDetailteamInf extends Pick<Team, 'teamName' | 'teamAdminInf'> {
  teamID: Team['_id'];
}

export interface GameDetailRes extends CommonRes{
  gameInf: Pick<Game, 'competitionID' | 'gameInfCom' |  'gameInfSports' | 'teamInfo'>;
  gameResultInf: Pick<GameResult, 'groupFlg' | 'groupID' | 'gameResult' | 'gameResultPlayer'>[];
  compInf: Pick<Competition, 'compName' | 'compLogo' | 'compAdminInf' | 'organizerInf'>;
  teamInf: GameDetailteamInf[];
  userNameList: NameList[];
  organNameList: NameList[];
}

export interface GRPlayerResultList {
  resultTime: string;
  team1UserID: string;
  team1RecordType: string;
  team2UserID: string;
  team2RecordType: string;
}

export interface TeamInfoForCreateComp extends Pick<Team, 'teamName' | 'sports' | 'teamAdminInf'> {
  teamID: Team['_id'];
}
export interface OrganInfoForCreateComp extends Pick<Organ, 'organName' | 'sports' | 'organAdminInf'> {
  organID: Organ['_id'];
}
export interface CreateCompetitionInit extends CommonRes {
  teamList: TeamInfoForCreateComp[];
  organList: OrganInfoForCreateComp[];
}

export interface CreateCompRes extends CommonRes {
  compID?: ObjectId;
}

export interface PlayerResultRes extends CommonRes {
  gameInfo: GameInfo[];
  compInfo: CompInfo[];
  playerResults: Pick<PlayerHistory, 'competitionID' | 'gameID' | 'records' | 'userID'>[];
  user: Pick<User, 'nickname' | 'playerInf'>;
}

export interface GameGroupDetailRes extends CommonRes {
  gameList: Pick<GameInfo, 'gameID' | 'gameInfCom' | 'teamInfo'>[];
  gameResultList: Pick<GameResult, 'gameID' | 'groupID' | 'gameResult'>[];
  teamList: TeamInfo[];
  teamIdList: string[];
  partTeam: Pick<Competition, 'teamID'>;
}

export interface RemoveAdminInfRes extends CommonRes {
  isAdminOrgan?: boolean;
  isAdminTeam?: boolean;
}

export interface RemoveCompInfRes extends CommonRes {
  isAdminComp?: boolean;
}

export interface UpdateProfileRes extends CommonRes {
  isPlayer: boolean;
}

export interface CreateTeamRes extends CommonRes {
  id?: ObjectId;
}

export interface CreateUserRes extends CommonRes {
  registeredFlg?: boolean;
}

export interface CheckAuthCodeRes extends CommonRes {
  oldEmailAdd: string;
  newEmailAdd: string;
  addHistoryInfId: string;
  expiredFlg?: boolean;
}

export interface GetCompDetailRes extends CommonRes {
  compBaseInf: CompDetailInf;
  gameGroups: GameGroups[];
  regTeamList: EntryTeamInfo[];
  inputTeamList: EntryTeamInfo[];
  teamIdList: ObjectId[];
}

export interface CompDetailInf extends Omit<CompInf, '_id' | 'organizer' | 'otherOrgs'
| 'docIsValid' | 'docCreUserID' | 'docCreTimeStamp' | 'docModUserID' | 'docModTimeStamp'> {
  compOrgName: string[];
  editorList: string[];
}

export interface GameGroups {
  gameGroupId: ObjectId;
  gameSystem: string;
  gameGroupTitle: string;
  groupPlaceNum: number;
  perDate: {
    gameDate?: string;
    gamesInf: {
      gamePlace?: string;
      gameStartTime?: number;
      criteriaName: string;
      criteriaLogo?: ImageInf;
      criteriaScore?: number;
      opponentName: string;
      opponentLogo?: ImageInf;
      opponentScore?: number;
    }[];
  }[];
}

export interface RegCompInfoRes extends CommonRes {
  compId?: ObjectId;
}

export interface CompBaseInfo extends Omit<CompInf, '_id' | 'organizer' | 'compAdminInf' | 'docIsValid'
| 'docCreUserID' | 'docCreTimeStamp' | 'docModUserID' | 'docModTimeStamp'> {
  organizer?: {
    orgId: string;
    orgEditFlag: boolean;
    orgFlag: string;
    orgName?: string;
  }[];
}

export interface GetCompBaseInfRes extends CommonRes {
  compBaseInfo?: CompBaseInfo;
}

export interface GameGroupRes extends CommonRes {
  missingTeamIds?: ObjectId[];
}

export interface GetGameGroupsRes extends CommonRes {
  gameGroupInfo: GameInf;
  gameId?: string;
}

export interface CompTeamInfo extends Pick<Team, 'teamName' | 'teamAddInf' | 'teamLogo'> {
  teamId: Team['_id'];
}

export interface GetCompTeamListRes extends CommonRes {
  compTeamList: CompTeamInfo[];
  teamsCnt: number;
}

export interface AddEntryTeamRes extends CommonRes {
  teamIdList?: Team['_id'][];
}

export interface CompTeamList {
  recordId: ObjectId;
  teamId: ObjectId;
  teamName?: string;
  gameRecord?: [];
  teamInfo?: {
    teamName: string;
  }[];
}

export interface CompOrganInfoList extends Pick<Organ, 'organName' | 'organAddInf' | 'organLogo'> {
  organId: Organ['_id'];
}

export interface SearchCompOrganListRes extends CommonRes {
  compOrganList: CompOrganInfoList[];
  organsCnt: number;
}

export interface EntryTeamInfo {
  recordId: ObjectId;
  teamName: string;
  isSelected: boolean;
}

export interface GetEntryTeamRes extends CommonRes {
  regTeamList: EntryTeamInfo[];
  inputTeamList: EntryTeamInfo[];
  teamIdList: ObjectId[];
}

export interface ParticipatingTeamListInfo {
  recordId: ObjectId;
  teamId?: ObjectId;
  teamName: string;
}

export interface GetParticipatingTeamListRes extends CommonRes {
  participatingTeamList: ParticipatingTeamListInfo[];
}

export interface CompCollectionInfsList extends Pick<CompInf, 'compAdminInf'> {
  compId: ObjectId;
  openingDate: string;
  compName: string;
  compPlace: string[];
}

export interface CompCollectionInfsRes extends CommonRes {
  compCollectionList: CompCollectionInfsList[];
}

export interface GameGroupRes extends CommonRes {
  missingIds?: ObjectId[];
}

export interface TeamGameRecordRes extends CommonRes {
  teamGameRecordRes: TeamGameRecord[];
}

export interface EncryptionForQrcodeRes {
  result: 'ok';
  encryptedId: string;
  encryptedDate: string;
}

export interface createBaseUrlForQrcodeRes {
  result: 'ok' | 'ng';
  baseUrl: string;
}

export interface EncryptionGameIdRes extends CommonRes {
  encryptedGameId: string;
}

// pathに対応するレスポンスの型
// TODO 他の定義体取り込んで自動で作れないものか
declare interface ApiResponse {
  'user/login': LoginRes;
  'user/createUser': CreateUserRes;
  'user/sendMail': CommonRes;
  'user/getProfile': ProfileRes;
  'user/updateProfile': UpdateProfileRes;
  'user/updateTeamStartDate': CommonRes;
  'user/resetPassword': CommonRes;
  'user/changePassword': CommonRes;
  'user/userList': UserListRes;
  'user/inviteList': InviteListRes;
  'user/responseInvite': InviteListRes;
  'user/playerList': PlayerListRes;
  'team/createTeam': CreateTeamRes;
  'team/teamList': TeamListRes;
  'team/teamDetail': TeamDetailRes;
  'team/editTeam': CommonRes;
  'team/inviteStaff': InviteStaffRes;
  'team/getInvitedStaff': InviteStaffRes;
  'team/managePlayerList': TeamManagePlayerListRes;
  'team/updatePlayer': CommonRes;
  'team/playerList': PlayerRes;
  'team/invitePlayer': InvitePlayerRes;
  'team/getInvitedPlayer': InvitePlayerRes;
  'team/removeAdminInf': RemoveAdminInfRes;
  'competition/createCompetition': CreateCompRes;
  'competition/competitionList': CompetitionListRes;
  'organ/createOrgan': CreateOrganRes;
  'organ/organList': OrganListRes;
  'organ/searchCompOrganList': SearchCompOrganListRes;
  'organ/getOrganFromId': OrganDetail;
  'organ/editOrgan': CreateOrganRes;
  'organ/getInvitedStaff': InviteStaffRes;
  'organ/inviteStaff': InviteStaffRes;
  'organ/removeAdminInf': RemoveAdminInfRes;
  'game/gameList': GameListRes;
  'user/teamHistoryList': TeamHistoryListRes;
  'user/manageTmOrgList': ManageTmOrgListRes;
  'user/manageCompList': ManageCompListRes;
  'competition/competitionDetail': CompetitionDetailRes;
  'competition/manageCompetition': ManageCompetitionRes;
  'competition/modCompetition': CommonRes;
  'game/createGame': CreateGameRes;
  'game/duplicationCheck': CommonRes;
  'game/createTournament': CommonRes;
  'game/createLeague': CommonRes;
  'game/getCompInfo': CreateGameRes;
  'game/gameDetail': GameDetailRes;
  'competition/searchOrgan': InviteOrganRes;
  'competition/invite': InviteRes;
  'competition/getOrganizer': GetorganizerRes;
  'competition/searchMember': InviteMemberRes;
  'competition/searchTeam': InviteTeamRes;
  'competition/createPlace': CommonRes;
  'competition/searchPlace': SearchPlaceRes;
  'competition/addPlace': CommonRes;
  'competition/removeCompInfo': RemoveCompInfRes;
  'competition/removeGame': CommonRes;
  'competitionInf/encryptionForQrcode': EncryptionForQrcodeRes;
  'competitionInf/createBaseUrlForQrcode': createBaseUrlForQrcodeRes;
  'game/editGameInit': EditGameInfo;
  'game/modGameInfo': CommonRes;
  'game/confirmGame': CommonRes;
  'game/editGameMemberInit': EditGameMemberInfo;
  'game/modGameMemberInf': CommonRes;
  'game/editGameResultInit': EditGameResultInfo;
  'game/modGameResult': CommonRes;
  'game/editGameProgressInit': EditGameProgressInfo;
  'game/addGameProgress': CommonRes;
  'game/modGameProgress': CommonRes;
  'game/removeGameProgress': CommonRes;
  'competition/createCompetitonInit': CreateCompetitionInit;
  'user/playerResult': PlayerResultRes;
  'user/editPassword': CommonRes;
  'game/getGameGroupInfo': GameGroupDetailRes;
  'game/editLeague': CommonRes;
  'game/editTournament': CommonRes;
  'user/editEmail': CommonRes;
  'user/sendAuthCode': CommonRes;
  'user/checkAuthCode': CheckAuthCodeRes;
  'team/editTeamInit': EditTeamInitRes;
  'competitionInf/getCompDetailForAdmin': GetCompDetailRes;
  'user/reloadLoginInf': LoginRes;
  'competitionInf/regCompInfo': RegCompInfoRes;
  'competitionInf/getCompBaseInfo': GetCompBaseInfRes;
  'competitionInf/modCompInfo': CommonRes;
  'competitionInf/getCompDetailForGuest': GetCompDetailRes;
  'gameInf/createGameGroups': GameGroupRes;
  'gameInf/updateGameGroups': GameGroupRes;
  'gameInf/getGameGroupInfoForAdmin': GetGameGroupsRes;
  'gameInf/getGameGroupInfoForGuest': GetGameGroupsRes;
  'gameInf/delGameGroups': CommonRes;
  'gameInf/encryptionGameId': EncryptionGameIdRes;
  'team/compTeamList': GetCompTeamListRes;
  'teamGameRecord/addEntryTeam': AddEntryTeamRes;
  'teamGameRecord/getEntryTeam': GetEntryTeamRes;
  'teamGameRecord/getParticipatingTeamListForAdmin': GetParticipatingTeamListRes;
  'teamGameRecord/getParticipatingTeamListForGuest': GetParticipatingTeamListRes;
  'teamGameRecord/updateEntryTeam': CommonRes;
  'teamGameRecord/delEntryTeam': CommonRes;
  'teamGameRecord/getTeamGameRecord': TeamGameRecordRes;
  'competitionInf/getCompCollectionInfs': CompCollectionInfsRes;
  'competitionInf/regModQrcodeParts': CommonRes;
  'competitionInf/regCopyCompInfo': RegCompInfoRes;
}

// MEMO path.method.Responseのような階層をうまく表現できればいけるんでは？
// この辺りは試作
declare interface Api<T extends ApiResponse, K extends keyof T> {
  K: T[K];
}
declare interface ApiBase {
  [path: string]: {
    POST: {
      Request: {};
      Response: {};
    };
  };
}

export class ApiService {

  // 指定したパス以外設定できないように型定義
  // TODO これをうまく自動化したい
  apiPost<T extends keyof ApiResponse>(path: T, data: object): Observable<ApiResponse[T]>;
}
