import type { Language, PrayerItemKey } from "./types";

export interface PrayerTextSection {
  heading?: string;
  lines: string[];
}

export interface PrayerTextEntry {
  sections: PrayerTextSection[];
  /** Shown in small print under the text when the wording isn't a fixed liturgical text. */
  note?: string;
}

type PrayerTextMap = Partial<Record<PrayerItemKey, Record<Language, PrayerTextEntry>>>;

export const OUR_FATHER_KO = [
  "하늘에 계신 우리 아버지,",
  "아버지의 이름이 거룩히 빛나시며 아버지의 나라가 오시며",
  "아버지의 뜻이 하늘에서와 같이 땅에서도 이루어지소서!",
  "오늘 저희에게 일용할 양식을 주시고",
  "저희에게 잘못한 이를 저희가 용서하오니 저희 죄를 용서하시고",
  "저희를 유혹에 빠지지 않게 하시고 악에서 구하소서. 아멘.",
];

export const HAIL_MARY_KO = [
  "은총이 가득하신 마리아님, 기뻐하소서!",
  "주님께서 함께 계시니 여인 중에 복되시며",
  "태중의 아들 예수님 또한 복되시나이다.",
  "천주의 성모 마리아님, 이제와 저희 죽을 때에",
  "저희 죄인을 위하여 빌어 주소서. 아멘.",
];

export const GLORY_BE_KO = ["영광이 성부와 성자와 성령께,", "처음과 같이 이제와 항상 영원히. 아멘."];

/** 구원을 비는 기도 — 2011년 주교회의 통일안. */
export const SALVATION_PRAYER_KO = [
  "예수님, 저희 죄를 용서하시며",
  "저희를 지옥 불에서 구하시고",
  "연옥 영혼을 돌보시며",
  "가장 버림받은 영혼을 돌보소서.",
];

export const APOSTLES_CREED_KO = [
  "전능하신 천주 성부 천지의 창조주를 저는 믿나이다.",
  "그 외아들 우리 주 예수 그리스도님,",
  "성령으로 인하여 동정 마리아께 잉태되어 나시고",
  "본시오 빌라도 통치 아래서 고난을 받으시고",
  "십자가에 못박혀 돌아가시고 묻히셨으며",
  "저승에 가시어 사흗날에 죽은 이들 가운데서 부활하시고",
  "하늘에 올라 전능하신 천주 성부 오른편에 앉으시며",
  "그리로부터 산 이와 죽은 이를 심판하러 오시리라 믿나이다.",
  "성령을 믿으며 거룩하고 보편된 교회와 모든 성인의 통공을 믿으며",
  "죄의 용서와 육신의 부활을 믿으며 영원한 삶을 믿나이다. 아멘.",
];

/** 성모찬송 — 가톨릭 기도서의 현행 공식 문구(마침 계응 포함). */
export const SALVE_REGINA_KO = [
  "모후이시며 사랑이 넘친 어머니,",
  "우리의 생명, 기쁨, 희망이시여.",
  "당신 우러러 하와의 그 자손들이",
  "눈물을 흘리며 부르짖나이다, 슬픔의 골짜기에서.",
  "우리들의 보호자 성모님,",
  "불쌍한 저희를 인자로운 눈으로 굽어보소서.",
  "귀양살이 끝날 때에",
  "당신의 아들 우리 주 예수님 뵙게 하소서.",
  "너그러우시고 자애로우시며 오! 아름다우신 동정 마리아님.",
  "◎ 천주의 성모님, 저희를 위하여 빌어 주시어",
  "그리스도께서 약속하신 영원한 생명을 얻게 하소서.",
];

export const OUR_FATHER_EN = [
  "Our Father, who art in heaven, hallowed be thy name;",
  "thy kingdom come, thy will be done on earth as it is in heaven.",
  "Give us this day our daily bread,",
  "and forgive us our trespasses as we forgive those who trespass against us;",
  "and lead us not into temptation, but deliver us from evil. Amen.",
];

export const HAIL_MARY_EN = [
  "Hail Mary, full of grace, the Lord is with thee.",
  "Blessed art thou amongst women,",
  "and blessed is the fruit of thy womb, Jesus.",
  "Holy Mary, Mother of God, pray for us sinners,",
  "now and at the hour of our death. Amen.",
];

export const GLORY_BE_EN = [
  "Glory be to the Father, and to the Son, and to the Holy Spirit,",
  "as it was in the beginning, is now, and ever shall be, world without end. Amen.",
];

export const FATIMA_PRAYER_EN = [
  "O my Jesus, forgive us our sins, save us from the fires of hell,",
  "and lead all souls to Heaven,",
  "especially those most in need of thy mercy. Amen.",
];

export const APOSTLES_CREED_EN = [
  "I believe in God, the Father almighty, Creator of heaven and earth,",
  "and in Jesus Christ, his only Son, our Lord,",
  "who was conceived by the Holy Spirit, born of the Virgin Mary,",
  "suffered under Pontius Pilate,",
  "was crucified, died and was buried;",
  "he descended into hell; on the third day he rose again from the dead;",
  "he ascended into heaven, and is seated at the right hand of God the Father almighty;",
  "from there he will come to judge the living and the dead.",
  "I believe in the Holy Spirit, the holy catholic Church,",
  "the communion of saints, the forgiveness of sins,",
  "the resurrection of the body, and life everlasting. Amen.",
];

export const SALVE_REGINA_EN = [
  "Hail, holy Queen, Mother of mercy,",
  "our life, our sweetness, and our hope.",
  "To thee do we cry, poor banished children of Eve;",
  "to thee do we send up our sighs,",
  "mourning and weeping in this valley of tears.",
  "Turn then, most gracious advocate,",
  "thine eyes of mercy toward us,",
  "and after this our exile,",
  "show unto us the blessed fruit of thy womb, Jesus.",
  "O clement, O loving, O sweet Virgin Mary. Amen.",
];

/** 묵주기도 신비 4종 — 홈 묵주기도 다이얼로그와 뗏세라 페이지가 같은 검수 문구를 공유한다. */
export const ROSARY_MYSTERY_SECTIONS_KO: PrayerTextSection[] = [
  {
    heading: "환희의 신비 (월요일·토요일)",
    lines: [
      "1단: 마리아께서 예수님을 잉태하심을 묵상합시다",
      "2단: 마리아께서 엘리사벳을 찾아보심을 묵상합시다",
      "3단: 마리아께서 예수님을 낳으심을 묵상합시다",
      "4단: 마리아께서 예수님을 성전에 바치심을 묵상합시다",
      "5단: 마리아께서 성전에서 예수님을 찾으심을 묵상합시다",
    ],
  },
  {
    heading: "고통의 신비 (화요일·금요일)",
    lines: [
      "1단: 예수님께서 우리를 위하여 피땀 흘리심을 묵상합시다",
      "2단: 예수님께서 우리를 위하여 매맞으심을 묵상합시다",
      "3단: 예수님께서 우리를 위하여 가시관 쓰심을 묵상합시다",
      "4단: 예수님께서 우리를 위하여 십자가 지심을 묵상합시다",
      "5단: 예수님께서 우리를 위하여 십자가에 못박혀 돌아가심을 묵상합시다",
    ],
  },
  {
    heading: "영광의 신비 (수요일·일요일)",
    lines: [
      "1단: 예수님께서 부활하심을 묵상합시다",
      "2단: 예수님께서 승천하심을 묵상합시다",
      "3단: 예수님께서 성령을 보내심을 묵상합시다",
      "4단: 예수님께서 마리아를 하늘에 불러올리심을 묵상합시다",
      "5단: 예수님께서 마리아께 천상 모후의 관을 씌우심을 묵상합시다",
    ],
  },
  {
    heading: "빛의 신비 (목요일)",
    lines: [
      "1단: 예수님께서 세례받으심을 묵상합시다",
      "2단: 예수님께서 카나에서 첫 기적을 행하심을 묵상합시다",
      "3단: 예수님께서 하느님 나라를 선포하심을 묵상합시다",
      "4단: 예수님께서 거룩하게 변모하심을 묵상합시다",
      "5단: 예수님께서 성체성사를 세우심을 묵상합시다",
    ],
  },
];

export const ROSARY_MYSTERY_SECTIONS_EN: PrayerTextSection[] = [
  {
    heading: "Joyful Mysteries (Mon & Sat)",
    lines: [
      "1. The Annunciation",
      "2. The Visitation",
      "3. The Nativity",
      "4. The Presentation in the Temple",
      "5. The Finding in the Temple",
    ],
  },
  {
    heading: "Sorrowful Mysteries (Tue & Fri)",
    lines: [
      "1. The Agony in the Garden",
      "2. The Scourging at the Pillar",
      "3. The Crowning with Thorns",
      "4. The Carrying of the Cross",
      "5. The Crucifixion",
    ],
  },
  {
    heading: "Glorious Mysteries (Wed & Sun)",
    lines: [
      "1. The Resurrection",
      "2. The Ascension",
      "3. The Descent of the Holy Spirit",
      "4. The Assumption of Mary",
      "5. The Coronation of Mary",
    ],
  },
  {
    heading: "Luminous Mysteries (Thu)",
    lines: [
      "1. The Baptism of Jesus",
      "2. The Wedding at Cana",
      "3. The Proclamation of the Kingdom",
      "4. The Transfiguration",
      "5. The Institution of the Eucharist",
    ],
  },
];


export const ROSARY_MYSTERY_DESCRIPTIONS_KO: string[][][] = [
  // 0: 환희 (Joyful)
  [
    [
      "하느님께서 가브리엘 천사를 보내시어 마리아에게 그리스도의 어머니가 될 것이라는 소식을 전했을 때, 마리아는 \"보십시오, 저는 주님의 종입니다. 말씀하신 대로 저에게 이루어지기를 바랍니다.\"(루카 1,38)라는 응답으로 구세주의 잉태를 수락하십니다. 이는 인류 구원이 이루어지는 크나큰 사건의 순간입니다. 기쁨을 드러내는 신비의 뜻입니다. 이것은 주로 그리스도의 탄생에 관한 구원의 기쁜 소식을 묵상하는 내용입니다."
    ],
    [
      "엘리사벳은 마리아의 사촌언니였습니다. 마리아께서는 자신이 예수님의 어머니가 될 것이라는 천사의 소식을 듣고 엘리사벳을 방문하였는데, 그 때 엘리사벳은 성모님의 방문을 너무 기쁘게 생각하면서 \"당신은 여인들 가운데에서 가장 복되시며 당신 태중의 아기도 복되십니다.\" (루카 1,42) 하며 축하인사를 바쳤습니다."
    ],
    [
      "마리아는 인류의 구원자를 낳으셨습니다. 하늘과 땅의 주인이신 하느님의 아들이 베들레헴의 한 외양간에서 너무나 초라하고 가난하게 오심을 묵상하면서, 우리가 지나치게 물질에 관심을 두고 살았음을 반성해야 하겠습니다."
    ],
    [
      "예수님 당시 유대인들은 율법에 따라 아들을 낳으면 40일 만에, 딸은 80일 만에 성전에 봉헌하며 산모를 깨끗하게 하는 정결예식을 행했습니다. 마리아도 율법에 따라 아기 예수님을 성전에 봉헌하고 정결예식을 거행했습니다."
    ],
    [
      "예수님께서 12세가 되셨을 때 마리아와 요셉은 어린 예수님과 함께 그 당시 가장 큰 축제였던 '파스카' 축제를 지내기 위해 예루살렘 성전으로 가셨습니다. 축제를 마친 후 마리아는 마리아대로 요셉은 요셉대로 사람들과 어울려 하룻길을 오다가 예수님이 안 계신 것을 알고 다시 성전으로 돌아가 예수님을 찾는 광경입니다. 예수님은 그 때부터 벌써 성전에서 학자들의 말을 듣기도 하고 묻기도 하며 뚜렷한 지혜를 드러내셨습니다."
    ]
  ],
  // 1: 고통 (Sorrowful)
  [
    [
      "제자들과 최후의 만찬을 마치신 예수님께서는 겟세마니 동산에 오르셔서 앞으로 당하실 고통으로 근심과 번민에 휩싸여 \"아버지, 하실 수만 있으시면 이 잔이 저를 비켜 가게 해 주십시오. 그러나 제가 원하는 대로 하지 마시고 아버지께서 원하시는 대로 하십시오.\"(마태 26,39) 하며 기도하셨습니다. 인류 구원을 위해 성부의 뜻에 전적으로 순명하셨습니다."
    ],
    [
      "로마 군인들은 예수님의 옷을 벗기고 형틀에 잡아맨 후 무서운 매질을 하였습니다. 죄 없으신 분께서 우리를 대신하여 죄인으로 모진 고통을 당하셨습니다. 피범벅이 된 주님께서는 우리를 위해 고통의 길을 기꺼이 걸으셨습니다."
    ],
    [
      "로마 군인들은 예수님의 옷을 벗기고 진홍색 외투를 입힌 다음 가시나무로 관을 엮어 머리에 씌우며 \"유다인들의 임금님, 만세!\" (마태 27,29) 하며 조롱하였습니다. 만왕의 왕이신 주님께서 우리의 죄 때문에 너무도 비참한 대우를 받으셨습니다."
    ],
    [
      "사형 선고를 받으신 예수님께서는 당신께서 못 박히실 십자가를 메고 구원사업을 완성하시고자 고통을 참으며 골고타 언덕을 오르셨습니다. 세 번이나 넘어지시는 극심한 고통 중에서도 끝까지 우리를 대신해 십자가를 지고 오르셨습니다."
    ],
    [
      "예수님께서는 십자가에 못 박히는 순간에도 \"아버지, 저들을 용서해 주십시오. 저들은 자기들이 무슨 일을 하는지 모릅니다.\"(루카 23,34) 하며 기도하셨습니다. 끝까지 인류의 회개를 위해 하느님의 자비를 청하시며 십자가에서 숨을 거두셨습니다."
    ]
  ],
  // 2: 영광 (Glorious)
  [
    [
      "예수님께서는 사흘 만에 돌무덤을 열고 나와 부활하셨습니다. 주님의 부활은 죽음과 죄악에 대한 완전한 승리였습니다. 주님의 부활로 말미암아 우리 또한 주님 안에서 부활하리라는 믿음과 희망을 갖고 살아가게 되었습니다."
    ],
    [
      "부활하신 주님께서는 제자들이 보는 가운데 하늘로 오르시어 하느님 오른편에 앉으셨습니다. 예수님의 승천은 인간이 예수 그리스도로 말미암아 구원되어 하늘 나라에 들어갈 수 있음을 보여주는 희망의 사건입니다. 또한 다시 오실 주님의 모습을 미리 보여준 것입니다."
    ],
    [
      "예수님께서는 수난과 죽음을 앞두시고 또 승천하시기 전에 제자들에게 진리의 성령을 보내주시겠다고 약속하셨습니다. 주님께서 약속하신 대로 성령께서 제자들에게 내려오셨고, 성령으로 힘입은 제자들은 세상에 나가 용감히 복음을 선포하였습니다."
    ],
    [
      "성모님께서 돌아가실 때에 제자들이 모두 임종을 지켜보았지만, 토마스 사도만은 그 기회를 놓치고 말았습니다. 토마스는 마리아의 시신이라도 보기를 소원해서 성모님을 장사지낸 무덤을 열어 보았으나 빈 무덤이었습니다. 그래서 제자들은 그리스도께서는 당신 어머니를 흙속에서 썩도록 버려두지 않으셨음을 알게 되었습니다."
    ],
    [
      "성모님은 하늘에 오르시어 당신 아드님으로부터 천상 모후의 관을 받으셨습니다. 이로써 성모님은 늘 예수님 곁에서 우리를 위해 전구해 주십니다. 또한 우리도 예수님을 굳게 믿고 따르면 하늘 나라에 갈 수 있다는 희망을 몸소 보여주고 계십니다."
    ]
  ],
  // 3: 빛 (Luminous)
  [
    [
      "예수님께서는 공생활을 시작하시면서 요르단 강에 가셔서 세례자 요한으로부터 세례를 받으셨습니다. 예수님께서 세례를 받고 올라오시자 하늘이 열리며 성령께서 비둘기처럼 내려오시고 하늘에서는 \"이는 내가 사랑하는 아들, 내 마음에 드는 아들이다.\"(마태 3,17) 하는 소리가 들려왔습니다."
    ],
    [
      "예수님께서는 갈릴래아 카나에서 열린 혼인잔치에서 첫 번째 기적을 행하셨습니다. 포도주가 떨어진 잔치에서 물을 포도주로 변화시킨 기적을 통해 혼인잔치를 축복하시고 당신의 영광을 드러내셨습니다. 그리하여 제자들은 예수님을 믿게 되었습니다."
    ],
    [
      "예수님께서는 갈릴래아로 가셔서 \"회개하여라. 하늘 나라가 가까이 왔다.\" (마태 4,17)라는 말씀으로 하느님 나라의 도래를 선포하셨습니다. 이로써 어둠 속에 앉아 있는 백성들이 큰 빛을 보게 되었습니다. 그리고 제자들을 뽑아 하느님 나라 건설의 일꾼으로 삼으셨습니다."
    ],
    [
      "예수님께서는 베드로와 야고보와 그의 동생 요한만을 따로 데리고 높은 산에 오르셨습니다. 그들 앞에서 얼굴은 해처럼 빛나고 그분의 옷은 빛처럼 하얘졌습니다. 예수님께서는 당신의 영광스러운 변모를 통해 장차 우리가 참여할 구원의 영광을 미리 맛보게 해주셨습니다."
    ],
    [
      "예수님께서는 수난과 죽음을 앞두시고 사랑하는 제자들과 함께 파스카 만찬을 드시면서 성체성사를 제정하셨습니다. 빵과 포도주를 들고 감사의 기도를 올리신 다음 제자들에게 주시며 \"이는 내 몸이다\", \"이는 죄를 용서해 주려고 많은 사람을 위하여 흘리는 내 계약의 피다\"(마태 26,26-28) 하시며 당신의 한없는 사랑을 보여주셨습니다."
    ]
  ]
];

export const ROSARY_MYSTERY_DESCRIPTIONS_EN: string[][][] = Array.from({ length: 4 }, () =>
  Array.from({ length: 5 }, () => [])
);

export const PRAYER_TEXTS: PrayerTextMap = {

  priestPrayer: {
    ko: {
      sections: [
        {
          lines: [
            "○ 영원한 사제이신 예수님, 주님을 본받으려는 사제들을 지켜 주시어 어느 누구도 그들을 해 치지 못하게 하소서.",
            "● 주님의 영광스러운 사제직에 올라 날마다 주 님의 몸과 피를 축성하는 사제들을 언제나 깨 끗하고 거룩하게 지켜 주소서.",
            "○ 주님의 뜨거운 사랑으로 사제들을 세속에 물 들지 않도록 지켜 주소서.",
            "● 사제들이 하는 모든 일에 강복하시어 은총의 풍부한 열매를 맺게 하시고",
            "○ 저희로 말미암아 세상에서는 그들이 더없는 기쁨과 위안을 얻고 천국에서는 찬란히 빛나 는 영광을 누리게 하소서.",
            "◎ 아멘.",
          ],
        },
      ],
    },
    en: {
      sections: [
        {
          lines: [
            "Lord, send good priests to your Church,",
            "priests after your own heart,",
            "priests who will be true shepherds of your people.",
            "Give them the courage to lead, the wisdom to guide,",
            "and the compassion to heal.",
            "Bless them in their labours and comfort them in their loneliness. Amen.",
          ],
        },
      ],
      note: "A commonly used version, not an official Legion of Mary Handbook translation.",
    },
  },

  chainPrayer: {
    ko: {
      sections: [
        { heading: "주님의 기도", lines: OUR_FATHER_KO },
        { heading: "성모송", lines: HAIL_MARY_KO },
        { heading: "영광송", lines: GLORY_BE_KO },
      ],
    },
    en: {
      sections: [
        { heading: "Our Father", lines: OUR_FATHER_EN },
        { heading: "Hail Mary", lines: HAIL_MARY_EN },
        { heading: "Glory Be", lines: GLORY_BE_EN },
      ],
    },
  },

  rosaryDecades: {
    ko: {
      sections: [
        { heading: "시작 기도 · 사도신경", lines: APOSTLES_CREED_KO },
        { heading: "주님의 기도", lines: OUR_FATHER_KO },
        { heading: "성모송 (3번 · 믿음·희망·사랑을 청하며)", lines: HAIL_MARY_KO },
        { heading: "영광송", lines: GLORY_BE_KO },
        {
          heading: "한 단의 순서",
          lines: [
            "그 단의 신비를 묵상하며 주님의 기도 1번 →",
            "성모송 10번 → 영광송 → 구원을 비는 기도",
            "(위 주님의 기도·성모송·영광송을 그대로 반복합니다)",
          ],
        },
        { heading: "구원을 비는 기도 (파티마의 기도)", lines: SALVATION_PRAYER_KO },
        ...ROSARY_MYSTERY_SECTIONS_KO,
        { heading: "마침 기도 · 성모찬송", lines: SALVE_REGINA_KO },
      ],
      note: "가톨릭 기도서의 현행 공식 문구를 따랐습니다. ◎ 표시는 함께 바치는 마침 계응입니다.",
    },
    en: {
      sections: [
        { heading: "Opening · Apostles' Creed", lines: APOSTLES_CREED_EN },
        { heading: "Our Father", lines: OUR_FATHER_EN },
        { heading: "Hail Mary (x3, for faith, hope, and charity)", lines: HAIL_MARY_EN },
        { heading: "Glory Be", lines: GLORY_BE_EN },
        {
          heading: "Order of one decade",
          lines: [
            "Announce the mystery, then one Our Father →",
            "ten Hail Marys → one Glory Be → the Fatima Prayer",
            "(repeat the Our Father, Hail Mary, and Glory Be above)",
          ],
        },
        { heading: "Fatima Prayer", lines: FATIMA_PRAYER_EN },
        ...ROSARY_MYSTERY_SECTIONS_EN,
        { heading: "Closing · Hail Holy Queen", lines: SALVE_REGINA_EN },
      ],
      note: "The closing 'Hail Holy Queen' is a commonly used version, not a specific official translation. The rest are standard liturgical texts.",
    },
  },

  aspirations: {
    ko: {
      sections: [
        {
          heading: "자주 바치는 화살기도 예시",
          lines: [
            "\"오 마리아님, 원죄 없이 잉태되신 마리아님, 당신께 의탁하는 저희를 위하여 빌어 주소서.\"",
            "\"평화의 모후여, 저희를 위하여 빌어 주소서.\"",
            "\"예수 마리아 요셉이여, 저희를 도와주소서.\"",
          ],
        },
      ],
      note: "정해진 한 가지 문구가 아니라 그때그때 짧게 바치는 기도입니다. 위는 자주 쓰이는 예시입니다.",
    },
    en: {
      sections: [
        {
          heading: "Commonly used aspirations",
          lines: [
            "\"O Mary, conceived without sin, pray for us who have recourse to thee.\"",
            "\"Queen of Peace, pray for us.\"",
            "\"Jesus, Mary, Joseph, help us.\"",
          ],
        },
      ],
      note: "Aspirations are short, spontaneous prayers rather than one fixed text; these are common examples.",
    },
  },
};
