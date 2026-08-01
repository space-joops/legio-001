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

const OUR_FATHER_KO = [
  "하늘에 계신 우리 아버지,",
  "아버지의 이름이 거룩히 빛나시며 아버지의 나라가 오시며",
  "아버지의 뜻이 하늘에서와 같이 땅에서도 이루어지소서!",
  "오늘 저희에게 일용할 양식을 주시고",
  "저희에게 잘못한 이를 저희가 용서하오니 저희 죄를 용서하시고",
  "저희를 유혹에 빠지지 않게 하시고 악에서 구하소서. 아멘.",
];

const HAIL_MARY_KO = [
  "은총이 가득하신 마리아님, 기뻐하소서!",
  "주님께서 함께 계시니 여인 중에 복되시며",
  "태중의 아들 예수님 또한 복되시나이다.",
  "천주의 성모 마리아님, 이제와 저희 죽을 때에",
  "저희 죄인을 위하여 빌어 주소서. 아멘.",
];

const GLORY_BE_KO = ["영광이 성부와 성자와 성령께,", "처음과 같이 이제와 항상 영원히. 아멘."];

/** 구원을 비는 기도 — 2011년 주교회의 통일안. */
const SALVATION_PRAYER_KO = [
  "예수님, 저희 죄를 용서하시며",
  "저희를 지옥 불에서 구하시고",
  "연옥 영혼을 돌보시며",
  "가장 버림받은 영혼을 돌보소서.",
];

const APOSTLES_CREED_KO = [
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
const SALVE_REGINA_KO = [
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

const OUR_FATHER_EN = [
  "Our Father, who art in heaven, hallowed be thy name;",
  "thy kingdom come, thy will be done on earth as it is in heaven.",
  "Give us this day our daily bread,",
  "and forgive us our trespasses as we forgive those who trespass against us;",
  "and lead us not into temptation, but deliver us from evil. Amen.",
];

const HAIL_MARY_EN = [
  "Hail Mary, full of grace, the Lord is with thee.",
  "Blessed art thou amongst women,",
  "and blessed is the fruit of thy womb, Jesus.",
  "Holy Mary, Mother of God, pray for us sinners,",
  "now and at the hour of our death. Amen.",
];

const GLORY_BE_EN = [
  "Glory be to the Father, and to the Son, and to the Holy Spirit,",
  "as it was in the beginning, is now, and ever shall be, world without end. Amen.",
];

const FATIMA_PRAYER_EN = [
  "O my Jesus, forgive us our sins, save us from the fires of hell,",
  "and lead all souls to Heaven,",
  "especially those most in need of thy mercy. Amen.",
];

const APOSTLES_CREED_EN = [
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

const SALVE_REGINA_EN = [
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

export const PRAYER_TEXTS: PrayerTextMap = {
  priestPrayer: {
    ko: {
      sections: [
        {
          lines: [
            "주님, 저희에게 훌륭한 사제를 보내시어",
            "그들의 마음은 오직 주님만을 사랑하게 하시고,",
            "그들의 말은 오직 주님의 뜻만을 전하게 하시며,",
            "그들의 삶은 온전히 주님을 따르는 표양이 되게 하소서.",
            "사제들의 나약함을 붙들어 주시고 그들의 노고에 힘을 주시며",
            "그들의 기쁨을 늘려 주시고 그들의 외로움을 감싸 주소서. 아멘.",
          ],
        },
      ],
      note: "레지오 마리애 지침서의 공식 번역이 아닌, 널리 쓰이는 일반적인 문구입니다. 소속 쁘레시디움의 문구와 다를 수 있습니다.",
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
