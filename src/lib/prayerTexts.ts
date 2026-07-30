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
        {
          heading: "주님의 기도",
          lines: [
            "하늘에 계신 우리 아버지,",
            "아버지의 이름이 거룩히 빛나시며 아버지의 나라가 오시며",
            "아버지의 뜻이 하늘에서와 같이 땅에서도 이루어지소서.",
            "오늘 저희에게 일용할 양식을 주시고",
            "저희에게 잘못한 이를 저희가 용서하오니 저희 죄를 용서하시고",
            "저희를 유혹에 빠지지 않게 하시고 악에서 구하소서. 아멘.",
          ],
        },
        {
          heading: "성모송",
          lines: [
            "은총이 가득하신 마리아님, 기뻐하소서.",
            "주님께서 함께 계시니 여인 중에 복되시며",
            "태중의 아들 예수님 또한 복되시나이다.",
            "천주의 성모 마리아님, 이제와 저희 죽을 때에",
            "저희 죄인을 위하여 빌어 주소서. 아멘.",
          ],
        },
        {
          heading: "영광송",
          lines: ["영광이 성부와 성자와 성령께,", "처음과 같이 이제와 항상 영원히. 아멘."],
        },
      ],
    },
    en: {
      sections: [
        {
          heading: "Our Father",
          lines: [
            "Our Father, who art in heaven, hallowed be thy name;",
            "thy kingdom come, thy will be done on earth as it is in heaven.",
            "Give us this day our daily bread,",
            "and forgive us our trespasses as we forgive those who trespass against us;",
            "and lead us not into temptation, but deliver us from evil. Amen.",
          ],
        },
        {
          heading: "Hail Mary",
          lines: [
            "Hail Mary, full of grace, the Lord is with thee.",
            "Blessed art thou amongst women,",
            "and blessed is the fruit of thy womb, Jesus.",
            "Holy Mary, Mother of God, pray for us sinners,",
            "now and at the hour of our death. Amen.",
          ],
        },
        {
          heading: "Glory Be",
          lines: [
            "Glory be to the Father, and to the Son, and to the Holy Spirit,",
            "as it was in the beginning, is now, and ever shall be, world without end. Amen.",
          ],
        },
      ],
    },
  },

  rosaryDecades: {
    ko: {
      sections: [
        {
          heading: "한 단(10단)의 순서",
          lines: [
            "1. 그 단의 신비를 묵상하며 주님의 기도 1번",
            "2. 성모송 10번",
            "3. 영광송 1번",
            "4. 파티마의 기도: \"오 나의 예수님, 저희 죄를 용서하시고 저희를 지옥불에서 구하여 주시며 모든 영혼을, 특히 주님의 자비가 가장 필요한 영혼을 천국으로 이끌어 주소서. 아멘.\"",
          ],
        },
        {
          heading: "환희의 신비 (월요일·토요일)",
          lines: [
            "1단: 마리아께서 성령으로 잉태하심을 묵상합시다",
            "2단: 마리아께서 엘리사벳을 찾아보심을 묵상합시다",
            "3단: 예수님께서 마구간에서 탄생하심을 묵상합시다",
            "4단: 아기 예수를 성전에 봉헌하심을 묵상합시다",
            "5단: 아기 예수를 성전에서 찾으심을 묵상합시다",
          ],
        },
        {
          heading: "고통의 신비 (화요일·금요일)",
          lines: [
            "1단: 예수님께서 피땀 흘리심을 묵상합시다",
            "2단: 예수님께서 채찍질 당하심을 묵상합시다",
            "3단: 예수님께서 가시관을 쓰심을 묵상합시다",
            "4단: 예수님께서 십자가를 지심을 묵상합시다",
            "5단: 예수님께서 십자가에 못박혀 돌아가심을 묵상합시다",
          ],
        },
        {
          heading: "영광의 신비 (수요일·일요일)",
          lines: [
            "1단: 예수님께서 부활하심을 묵상합시다",
            "2단: 예수님께서 승천하심을 묵상합시다",
            "3단: 성령께서 강림하심을 묵상합시다",
            "4단: 마리아께서 승천하심을 묵상합시다",
            "5단: 마리아께서 천상 모후로 관을 받으심을 묵상합시다",
          ],
        },
        {
          heading: "빛의 신비 (목요일)",
          lines: [
            "1단: 예수님께서 세례받으심을 묵상합시다",
            "2단: 가나의 혼인 잔치에서 첫 기적을 행하심을 묵상합시다",
            "3단: 하느님 나라를 선포하심을 묵상합시다",
            "4단: 예수님께서 거룩하게 변모하심을 묵상합시다",
            "5단: 예수님께서 성체성사를 세우심을 묵상합시다",
          ],
        },
      ],
    },
    en: {
      sections: [
        {
          heading: "Order of one decade",
          lines: [
            "1. Announce the mystery, then one Our Father",
            "2. Ten Hail Marys",
            "3. One Glory Be",
            "4. Fatima Prayer: \"O my Jesus, forgive us our sins, save us from the fires of hell, and lead all souls to Heaven, especially those most in need of thy mercy. Amen.\"",
          ],
        },
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
      ],
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
