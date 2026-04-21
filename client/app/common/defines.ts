import { TransactionOptions } from 'mongodb';

/** 競技一覧 */
export const sports = [{
  key: 'Football',
  value: 'サッカー'
}];

/** 都道府県一覧 */
export const prefectures = [
  '北海道', '青森県', '岩手県', '宮城県',
  '秋田県', '山形県', '福島県', '茨城県',
  '栃木県', '群馬県', '埼玉県', '千葉県',
  '東京都', '神奈川県', '新潟県', '富山県',
  '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県',
  '岡山県', '広島県', '山口県', '徳島県',
  '香川県', '愛媛県', '高知県', '福岡県',
  '佐賀県', '長崎県', '熊本県', '大分県',
  '宮崎県', '鹿児島県', '沖縄県'
];

/** トーナメントチーム数 */
export const tournamentTeamCnt = {
  '2～4': 4,
  '4～8': 8,
  '9～16': 16,
  '17～32': 32,
  '33～64': 64,
  '65～128': 128
};

/** 個人情報画面背景画像(PC版) */
export const pcBackImages = [
  'assets/images/grass-84622_1920.jpg',
  'assets/images/autumn-83761.jpg',
  'assets/images/background-1789175.png',
  'assets/images/background-3104413_1920.jpg',
  'assets/images/mesh-1430108.png',
  'assets/images/milky-way-2695569_1920.jpg',
  'assets/images/mountains-100367_1920.jpg',
  'assets/images/texture-2659241_1920.jpg',
  'assets/images/water-1330252_1920.jpg'
];

/** 個人情報画面背景画像(SP版) */
export const spBackImages = [
  'assets/images/grass-84622_1280.jpg',
  'assets/images/autumn-83761_1280.jpg',
  'assets/images/background-1789175_1280.png',
  'assets/images/background-3104413_1280.jpg',
  'assets/images/mesh-1430108_1280.png',
  'assets/images/milky-way-2695569_1280.jpg',
  'assets/images/mountains-100367_1280.jpg',
  'assets/images/texture-2659241_1280.jpg',
  'assets/images/water-1330252_1280.jpg'
];

/**
 * 定数
 */
export class CNS {
  // ロゴ画像のMAXサイズ
  public static readonly maxLogoFileSize = 1024 * 1024;

  // 編集情報のタイプ
  public static readonly infoTypeOrgan = 'organInfo';
  public static readonly infoTypeGame = 'gameInfo';
  public static readonly infoTypeTeam = 'team';

  // 認証情報のタイプ
  public static readonly authTypeOrganizerOrgan = 'organizerOrgan';
  public static readonly authTypeOrganizerTeam = 'organizerTeam';
  public static readonly authTypeTeam = 'team';
  public static readonly authTypeMember = 'member';

  // メンバー検索画面の種別
  public static readonly typeofUserListTeam = 'team';
  public static readonly typeofUserListOrgan = 'organ';

  // 試合方式の種別
  public static readonly tournament = '1';
  public static readonly league = '2';
  public static readonly leagueTournament = '3';

  /* 試合経過の状態 */
  public static readonly beforeGame = '1';
  public static readonly duringGame = '2';
  public static readonly afterGame = '3';

  // 認証コードの有効期限
  public static readonly expirationMinutes = 10;

  // 定数化されたメッセージ（該当箇所）
  public static readonly targetTypeScreen = '画面';
  public static readonly targetTypeConnection = '関連';
  public static readonly targetTypeQr = 'QRコード';
  public static readonly targetTypeGame = '試合';
  public static readonly targetTypeInformation = '情報';
  public static readonly targetTypeTeamStartDate = '所属開始日';
  public static readonly targetTypeAffiliationPeriod = '所属期間';
  public static readonly targetTypePlayer = '選手';
  public static readonly targetTypeComp = '大会';
  public static readonly targetTypeGameTeam = '大会参加チーム';
  public static readonly targetTypeTarget = '対象';
  public static readonly targetTypeOrg = '団体';
  public static readonly targetTypeTeam = 'チーム';
  public static readonly targetTypeTeamName = 'チーム名';
  public static readonly targetTypeNotify = '通知';
  public static readonly targetTypeTournament = 'トーナメント';
  public static readonly targetTypeEnterEmail = '入力されたメールアドレス';
  public static readonly targetTypeCode = '認証コード';
  public static readonly targetTypePass = 'パスワード';
  public static readonly targetTypeProfile = 'プロフィール';
  public static readonly targetTypeMail = 'メール';
  public static readonly targetTypeEmail = 'メールアドレス';
  public static readonly targetTypeUser = 'ユーザー';
  public static readonly targetTypeLeague = 'リーグ';
  public static readonly targetTypeLogin = 'ログイン';

  // 定数化されたメッセージ（行動）
  public static readonly actionTypeCancell = '解除';
  public static readonly actionTypeConfirm = '確認';
  public static readonly actionTypeRefuse = '拒否';
  public static readonly actionTypeSearch = '検索';
  public static readonly actionTypeUpdate = '更新';
  public static readonly actionTypeDel = '削除';
  public static readonly actionTypeJoin = '参加';
  public static readonly actionTypeCorrect = '修正';
  public static readonly actionTypeGet = '取得';
  public static readonly actionTypePrepare = '準備';
  public static readonly actionTypeInvite = '招待';
  public static readonly actionTypeProcess = '処理';
  public static readonly actionTypeSend = '送信';
  public static readonly actionTypeReg = '登録';
  public static readonly actionTypeIssue = '発行';
  public static readonly actionTypeCopy = '複製';
  public static readonly actionTypeChange = '変更';
  public static readonly actionTypeEdit = '編集';

  // 主要画面名一覧
  public static readonly userPolicy = '利用規約';
  public static readonly operatingCompany = '運営会社情報';
  public static readonly privacyPolicy = '個人情報保護方針';
  public static readonly login = 'トップページ';
  public static readonly profileDetail = '個人情報';
  public static readonly teamHistoryList = '所属チーム履歴';
  public static readonly playerResult = '個人成績';
  public static readonly manageTmOrgList = '管理チーム/団体';
  public static readonly playerList = '選手検索';
  public static readonly playerDetail = '選手詳細';
  public static readonly teamList = 'チーム検索';
  public static readonly teamDetail = 'チーム詳細';
  public static readonly competitionList = '大会検索';
  public static readonly competitionDetail = '大会詳細';
  public static readonly createGame = '試合登録';
  public static readonly gameList = '試合検索';
  public static readonly gameDetail = '試合詳細';
  public static readonly organList = '団体検索';
  public static readonly organDetail = '団体詳細';
  public static readonly createTeam = 'チーム登録';
  public static readonly createCompetition = '大会登録';
  public static readonly createOrgan = '団体登録';
  public static readonly manageCompList = '管理大会';
  public static readonly manageCompetition = '大会編集';

  // 画面URL
  public static readonly pathToSendMail = 'sendMail';
  public static readonly pathToResetPassword = 'resetPassword';
  public static readonly pathToCreateUser = 'createUser';
  public static readonly pathToLogin = 'login';
  public static readonly pathToProfileDetail = 'profileDetail';
  public static readonly pathToChangePassword = 'changePassword';
  public static readonly pathToCreateTeam = 'createTeam';
  public static readonly pathToTeamList = 'teamList';
  public static readonly pathToTeamDetail = 'teamDetail';
  public static readonly pathToEditTeam = 'editTeam';
  public static readonly pathToUserList = ':searchType/userList';
  public static readonly pathToManagePlayer = 'managePlayer';
  public static readonly pathToPlayerList = ':searchType/playerList';
  public static readonly pathToCreateCompetition = 'createCompetition';
  public static readonly pathToCompetitionList = 'competitionList';
  public static readonly pathToCreateOrganization = 'createOrganization';
  public static readonly pathToOrganList = 'organList';
  public static readonly pathToOrganDetail = 'organDetail';
  public static readonly pathToManageOrgan = 'manageOrgan';
  public static readonly pathToTeamHistoryList = 'teamHistoryList';
  public static readonly pathToManageTmOrgList = 'manageTmOrgList';
  public static readonly pathToCompetitionDetail = 'competitionDetail';
  public static readonly pathToManageCompetition = 'manageCompetition';
  public static readonly pathToCreateGame = 'createGame';
  // public static readonly pathToCreateTournament = 'createTournament';
  public static readonly pathToCreateLeague = 'createLeague';
  public static readonly pathToInviteOrgan = 'inviteOrgan';
  public static readonly pathToInviteMember = 'inviteMember';
  public static readonly pathToInviteTeam = 'inviteTeam';
  public static readonly pathToCreatePlace = 'createPlace';
  public static readonly pathToPlaceList = 'placeList';
  public static readonly pathToEditGame = 'editGame';
  public static readonly pathToEditGameMember = 'editGameMember';
  public static readonly pathToEditGameResult = 'editGameResult';
  public static readonly pathToEditGameProgress = 'editGameProgress';
  public static readonly pathToGameDetail = 'gameDetail';
  public static readonly pathToGameList = 'gameList';
  public static readonly pathToPlayerResult = 'playerResult';
  public static readonly pathToEditPassword = 'editPassword';
  public static readonly pathToSiteMap = 'siteMap';
  public static readonly pathToCompanyProfile = 'companyProfile';
  public static readonly pathToTermsUse = 'termsUse';
  public static readonly pathToPrivacyPolicy = 'privacyPolicy';
  public static readonly pathToLeagueDetail = 'leagueDetail';
  public static readonly pathToTournamentDetail = 'tournamentDetail';
  public static readonly pathToEditLeague = 'editLeague';
  // public static readonly pathToEditTournament = 'editTournament';
  public static readonly pathToManageCompList = 'manageCompList';
  public static readonly pathToEditProfile = 'editProfile';
  public static readonly pathToEditEmail = 'editEmail';
  public static readonly pathToHealth = 'health';
  public static readonly pathToCompetitionGuide = 'competitionGuide';
  public static readonly pathToCollectionCompetition = 'collectionCompetition';
  public static readonly pathToCreateAndEditComp = 'createAndEditComp';
  public static readonly pathToCreateAndEditLeague = 'createAndEditLeague';
  public static readonly pathToReferenceTournament = 'referenceTournament';
  public static readonly pathToCreateAndEditCompTournament = 'createAndEditTournament';
  public static readonly pathToCreateCompetitionLeague = 'createCompetitionLeague';
  public static readonly pathToReferenceCompetitionGuide = 'referenceCompetitionGuide';
  public static readonly pathToReferenceCompetitionLeague = 'referenceLeague';
}

/** 試合方式一覧 */
export const compSystems = [
  {
    key: CNS.leagueTournament,
    value: 'リーグ・トーナメント'
  },
  {
    key: CNS.league,
    value: 'リーグ'
  },
  {
    key: CNS.tournament,
    value: 'トーナメント'
  }
];

/* 試合経過一覧 */
export const gameProgressStatuses = [
  {
    key: CNS.beforeGame,
    value: '試合開始前'
  },
  {
    key: CNS.duringGame,
    value: '試合中'
  },
  {
    key: CNS.afterGame,
    value: '試合終了'
  }
];

/* トランザクションオプション */
export const transactionOptions: TransactionOptions = {
  readConcern: { level: 'local'},
  writeConcern: { w: 1 },
  readPreference: 'primary'
};
