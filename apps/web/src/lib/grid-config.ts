type PositionGroup = "gk" | "def" | "mid" | "fwd";
type ClubGroupMode =
  | "istanbul"
  | "non_istanbul"
  | "big_four"
  | "two_big_four"
  | "champion_squad"
  | "champion_appearance";
type CareerMode = "clubs" | "appearances";

export type GridCriterion = {
  id: string;
  kind: "club" | "position" | "nationality" | "region" | "club_group" | "career" | "teammate";
  label: string;
  mark: string;
  sourceClubId?: number;
  positionGroup?: PositionGroup;
  rawSubPosition?: string;
  isoAlpha2?: string;
  confederation?: string;
  excludeTurkey?: boolean;
  clubGroupMode?: ClubGroupMode;
  careerMode?: CareerMode;
  threshold?: number;
  sourcePlayerId?: number;
};

function club(id: string, label: string, mark: string, sourceClubId: number): GridCriterion {
  return { id, kind: "club", label, mark, sourceClubId };
}

function position(
  id: string,
  label: string,
  mark: string,
  options: { positionGroup?: PositionGroup; rawSubPosition?: string },
): GridCriterion {
  return { id, kind: "position", label, mark, ...options };
}

function nationality(id: string, label: string, isoAlpha2: string): GridCriterion {
  return { id, kind: "nationality", label, mark: isoAlpha2, isoAlpha2 };
}

function region(
  id: string,
  label: string,
  mark: string,
  options: { confederation?: string; excludeTurkey?: boolean } = {},
): GridCriterion {
  return { id, kind: "region", label, mark, ...options };
}

function clubGroup(id: string, label: string, mark: string, clubGroupMode: ClubGroupMode) {
  return { id, kind: "club_group", label, mark, clubGroupMode } satisfies GridCriterion;
}

function career(
  id: string,
  label: string,
  mark: string,
  careerMode: CareerMode,
  threshold: number,
) {
  return { id, kind: "career", label, mark, careerMode, threshold } satisfies GridCriterion;
}

function teammate(id: string, label: string, mark: string, sourcePlayerId: number) {
  return { id, kind: "teammate", label, mark, sourcePlayerId } satisfies GridCriterion;
}

export const gridCriterionCatalog: readonly GridCriterion[] = [
  // 35 takım
  club("trabzonspor", "Trabzonspor", "TS", 449),
  club("kayserispor", "Kayserispor", "KYS", 3205),
  club("kasimpasa", "Kasımpaşa", "KPA", 10484),
  club("antalyaspor", "Antalyaspor", "ANT", 589),
  club("konyaspor", "Konyaspor", "KON", 2293),
  club("rizespor", "Çaykur Rizespor", "RİZ", 126),
  club("sivasspor", "Sivasspor", "SİV", 2381),
  club("fenerbahce", "Fenerbahçe", "FB", 36),
  club("galatasaray", "Galatasaray", "GS", 141),
  club("besiktas", "Beşiktaş", "BJK", 114),
  club("basaksehir", "Başakşehir", "BŞK", 6890),
  club("genclerbirligi", "Gençlerbirliği", "GB", 820),
  club("alanyaspor", "Alanyaspor", "ALA", 11282),
  club("goztepe", "Göztepe", "GÖZ", 1467),
  club("ankaragucu", "MKE Ankaragücü", "AG", 868),
  club("karagumruk", "Fatih Karagümrük", "FKG", 6646),
  club("gaziantep_fk", "Gaziantep FK", "GFK", 2832),
  club("bursaspor", "Bursaspor", "BUR", 20),
  club("yeni_malatyaspor", "Yeni Malatyaspor", "YMS", 19789),
  club("karabukspor", "Kardemir Karabükspor", "KRB", 1506),
  club("akhisarspor", "Akhisarspor", "AKH", 19771),
  club("hatayspor", "Hatayspor", "HAT", 7775),
  club("adana_demirspor", "Adana Demirspor", "ADS", 3840),
  club("gaziantepspor", "Gaziantepspor", "GAZ", 524),
  club("eskisehirspor", "Eskişehirspor", "ES", 825),
  club("eyupspor", "Eyüpspor", "EYP", 7160),
  club("erzurumspor", "Erzurumspor", "ERZ", 39722),
  club("mersin_idman_yurdu", "Mersin İdman Yurdu", "MİY", 3216),
  club("ankaraspor", "Ankaraspor", "ANK", 2944),
  club("elazigspor", "Elazığspor", "ELA", 2292),
  club("istanbulspor", "İstanbulspor", "İST", 924),
  club("samsunspor", "Samsunspor", "SAM", 152),
  club("denizlispor", "Denizlispor", "DEN", 833),
  club("giresunspor", "Giresunspor", "GİR", 11688),
  club("kayseri_erciyesspor", "Kayseri Erciyesspor", "KER", 6894),

  // 13 ana ve ayrıntılı mevki
  position("goalkeeper", "Kaleci", "KL", { positionGroup: "gk" }),
  position("defender", "Defans", "DF", { positionGroup: "def" }),
  position("midfielder", "Orta saha", "OS", { positionGroup: "mid" }),
  position("forward", "Forvet", "FV", { positionGroup: "fwd" }),
  position("centre_back", "Stoper", "STP", { rawSubPosition: "Centre-Back" }),
  position("centre_forward", "Santrfor", "SF", { rawSubPosition: "Centre-Forward" }),
  position("central_midfield", "Merkez orta saha", "MO", { rawSubPosition: "Central Midfield" }),
  position("defensive_midfield", "Ön libero", "ÖL", { rawSubPosition: "Defensive Midfield" }),
  position("left_winger", "Sol kanat", "SK", { rawSubPosition: "Left Winger" }),
  position("attacking_midfield", "On numara", "10", { rawSubPosition: "Attacking Midfield" }),
  position("right_winger", "Sağ kanat", "SĞK", { rawSubPosition: "Right Winger" }),
  position("right_back", "Sağ bek", "SĞB", { rawSubPosition: "Right-Back" }),
  position("left_back", "Sol bek", "SLB", { rawSubPosition: "Left-Back" }),

  // 25 uyruk
  nationality("turkiye", "Türkiye vatandaşı", "TR"),
  nationality("brezilya", "Brezilya vatandaşı", "BR"),
  nationality("portekiz", "Portekiz vatandaşı", "PT"),
  nationality("nijerya", "Nijerya vatandaşı", "NG"),
  nationality("senegal", "Senegal vatandaşı", "SN"),
  nationality("fransa", "Fransa vatandaşı", "FR"),
  nationality("almanya", "Almanya vatandaşı", "DE"),
  nationality("fildisi_sahili", "Fildişi Sahili vatandaşı", "CI"),
  nationality("gana", "Gana vatandaşı", "GH"),
  nationality("kamerun", "Kamerun vatandaşı", "CM"),
  nationality("bosna_hersek", "Bosna-Hersek vatandaşı", "BA"),
  nationality("sirbistan", "Sırbistan vatandaşı", "RS"),
  nationality("arjantin", "Arjantin vatandaşı", "AR"),
  nationality("hollanda", "Hollanda vatandaşı", "NL"),
  nationality("polonya", "Polonya vatandaşı", "PL"),
  nationality("fas", "Fas vatandaşı", "MA"),
  nationality("hirvatistan", "Hırvatistan vatandaşı", "HR"),
  nationality("romanya", "Romanya vatandaşı", "RO"),
  nationality("demokratik_kongo", "Demokratik Kongo vatandaşı", "CD"),
  nationality("ispanya", "İspanya vatandaşı", "ES"),
  nationality("cekya", "Çekya vatandaşı", "CZ"),
  nationality("belcika", "Belçika vatandaşı", "BE"),
  nationality("isvec", "İsveç vatandaşı", "SE"),
  nationality("mali", "Mali vatandaşı", "ML"),
  nationality("italya", "İtalya vatandaşı", "IT"),

  // 6 bölgesel uyruk grubu
  region("foreign", "Yabancı oyuncu", "Y", { excludeTurkey: true }),
  region("european_foreign", "Türk olmayan Avrupalı", "AVR", {
    confederation: "UEFA",
    excludeTurkey: true,
  }),
  region("african", "Afrikalı oyuncu", "AFR", { confederation: "CAF" }),
  region("south_american", "Güney Amerikalı", "G.AM", { confederation: "CONMEBOL" }),
  region("asian", "Asyalı oyuncu", "ASY", { confederation: "AFC" }),
  region("north_central_american", "Kuzey/Orta Amerikalı", "K.AM", {
    confederation: "CONCACAF",
  }),

  // 6 kulüp ve başarı grubu
  clubGroup("istanbul_club", "İstanbul takımında oynadı", "İST", "istanbul"),
  clubGroup("non_istanbul_club", "İstanbul dışında oynadı", "AND", "non_istanbul"),
  clubGroup("big_four", "Dört Büyükler'de oynadı", "4B", "big_four"),
  clubGroup("two_big_four", "2+ Dört Büyükler takımı", "2×4", "two_big_four"),
  clubGroup("champion", "Şampiyon takım kadrosu", "Ş", "champion_squad"),
  clubGroup("champion_appearance", "Şampiyon takımda oynadı", "Ş11", "champion_appearance"),

  // 6 kariyer eşiği
  career("two_clubs", "2+ Süper Lig takımı", "2K", "clubs", 2),
  career("three_clubs", "3+ Süper Lig takımı", "3K", "clubs", 3),
  career("four_clubs", "4+ Süper Lig takımı", "4K", "clubs", 4),
  career("fifty_appearances", "50+ Süper Lig maçı", "50", "appearances", 50),
  career("hundred_appearances", "100+ Süper Lig maçı", "100", "appearances", 100),
  career("hundred_fifty_appearances", "150+ Süper Lig maçı", "150", "appearances", 150),

  // 9 yıldız oyuncuyla aynı kulüp-sezonda takım arkadaşlığı
  teammate("teammate_visca", "Visca ile takım arkadaşı", "EV", 109217),
  teammate("teammate_muslera", "Muslera ile takım arkadaşı", "FM", 58088),
  teammate("teammate_burak", "Burak Yılmaz ile takım arkadaşı", "BY", 34987),
  teammate("teammate_selcuk", "Selçuk İnan ile takım arkadaşı", "Sİ", 35026),
  teammate("teammate_quaresma", "Quaresma ile takım arkadaşı", "RQ", 4188),
  teammate("teammate_arda", "Arda Turan ile takım arkadaşı", "AT", 21369),
  teammate("teammate_mesut", "Mesut Özil ile takım arkadaşı", "MÖ", 35664),
  teammate("teammate_icardi", "Icardi ile takım arkadaşı", "MI", 68863),
  teammate("teammate_sneijder", "Sneijder ile takım arkadaşı", "WS", 4673),
];

if (gridCriterionCatalog.length !== 100) {
  throw new Error(`Grid kriter havuzu 100 yerine ${gridCriterionCatalog.length} kriter içeriyor.`);
}

export type GridCellKey = `${string}-${string}`;

// Published grids carry their own randomized axes; these are safe rendering fallbacks only.
export const gridColumns = gridCriterionCatalog.slice(0, 3);
export const gridRows = gridCriterionCatalog.slice(35, 38);

const criterionIds = new Set(gridCriterionCatalog.map((criterion) => criterion.id));

export function isGridCellKey(value: unknown): value is GridCellKey {
  if (typeof value !== "string") return false;
  const [firstId, secondId, extra] = value.split("-");
  return (
    !extra &&
    firstId !== secondId &&
    criterionIds.has(firstId ?? "") &&
    criterionIds.has(secondId ?? "")
  );
}
