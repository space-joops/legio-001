import type { Language } from "./types";
import {
  FATIMA_PRAYER_EN,
  GLORY_BE_EN,
  GLORY_BE_KO,
  HAIL_MARY_EN,
  HAIL_MARY_KO,
  OUR_FATHER_EN,
  OUR_FATHER_KO,
  ROSARY_MYSTERY_SECTIONS_EN,
  ROSARY_MYSTERY_SECTIONS_KO,
  SALVATION_PRAYER_KO,
  SALVE_REGINA_EN,
  SALVE_REGINA_KO,
  type PrayerTextEntry,
} from "./prayerTexts";

/**
 * 뗏세라(Tessera) — 레지오 마리애 주회합 기도문 전문, 회합 순서 그대로.
 *
 * 한국어는 가톨릭 기도문 자료의 뗏세라 전문(cno.kr/prayer/54)을 기준으로 하되,
 * 마니피캇의 누락 구절 복원과 현행 표기(세례자, 세 대천사)는 Concilium 공식
 * 영문 뗏세라(legionofmary.ie)와 대조해 맞췄다. 묵주기도 기본 기도문·신비·성모찬송은
 * 홈 화면 기도문과 같은 검수 문구를 prayerTexts.ts에서 공유한다.
 * 발행 판본에 따라 표현이 조금씩 다를 수 있어 각 장의 note로 안내한다.
 *
 * 기호: ○ 선창, ● 응답, ◎ 함께, † 성호경 (페이지 상단 범례로 표시).
 */

export type TesseraChapterId = "opening" | "rosary" | "catena" | "closing";

export interface TesseraChapter {
  /** 목차 앵커 id이자 i18n 제목 키(tessera.<id>). */
  id: TesseraChapterId;
  entry: Record<Language, PrayerTextEntry>;
}

const SIGN_OF_CROSS_KO = "† 성부와 성자와 성령의 이름으로. 아멘.";
const SIGN_OF_CROSS_EN = "† In the name of the Father, and of the Son, and of the Holy Spirit. Amen.";

const ANTIPHON_KO = [
  "◎ 먼동이 트이듯 나타나고, 달과 같이 아름답고,",
  "해와 같이 빛나며, 진을 친 군대처럼 두려운 저 여인은 누구실까?",
];

const ANTIPHON_EN = [
  "◎ Who is she that comes forth as the morning rising,",
  "fair as the moon, bright as the sun,",
  "terrible as an army set in battle array?",
];

export const TESSERA_CHAPTERS: TesseraChapter[] = [
  {
    id: "opening",
    entry: {
      ko: {
        sections: [
          { lines: [SIGN_OF_CROSS_KO] },
          {
            heading: "성령 청원",
            lines: [
              "○ 오소서 성령님, 저희 마음을 성령으로 가득 채우시어",
              "저희 안에 사랑의 불이 타오르게 하소서.",
              "○ 주님의 성령을 보내소서. 저희가 새로워지리이다.",
              "● 또한 온 누리가 새롭게 되리이다.",
            ],
          },
          {
            heading: "기도",
            lines: [
              "○ 기도합시다.",
              "하느님, 성령의 빛으로 저희 마음을 이끄시어 바르게 생각하고,",
              "언제나 성령의 위로를 받아 누리게 하소서.",
              "우리 주 그리스도를 통하여 비나이다.",
              "◎ 아멘.",
            ],
          },
          {
            heading: "시편 계응",
            lines: [
              "○ 주님, 제 입술을 열어 주소서.",
              "● 제 입이 주님을 찬미할 것입니다.",
              "○ 하느님, 저를 도와주소서.",
              "● 주님, 어서 오시어 저를 도와주소서.",
              "○ 영광이 성부와 성자와 성령께,",
              "● 처음과 같이 이제와 항상 영원히. 아멘.",
            ],
          },
          { lines: ["(이어서 그날의 신비로 묵주기도 5단을 바칩니다.)"] },
        ],
      },
      en: {
        sections: [
          { lines: [SIGN_OF_CROSS_EN] },
          {
            heading: "Invocation of the Holy Spirit",
            lines: [
              "○ Come, O Holy Spirit, fill the hearts of Your faithful,",
              "and enkindle in them the fire of Your love.",
              "○ Send forth Your Spirit, O Lord, and they shall be created.",
              "● And You shall renew the face of the earth.",
            ],
          },
          {
            heading: "Prayer",
            lines: [
              "○ Let us pray.",
              "God our Father, pour out the gifts of Your Holy Spirit on the world.",
              "You sent the Spirit on Your Church to begin the teaching of the gospel:",
              "now let the Spirit continue to work in the world",
              "through the hearts of all who believe.",
              "Through Christ our Lord.",
              "◎ Amen.",
            ],
          },
          {
            heading: "Versicles",
            lines: [
              "○ You, O Lord, will open my lips.",
              "● And my tongue shall announce Your praise.",
              "○ Incline unto my aid, O God.",
              "● O Lord, make haste to help me.",
              "○ Glory be to the Father, and to the Son, and to the Holy Spirit,",
              "● As it was in the beginning, is now and ever shall be, world without end. Amen.",
            ],
          },
          { lines: ["(Then follow five decades of the Rosary with the Hail, Holy Queen.)"] },
        ],
      },
    },
  },

  {
    id: "rosary",
    entry: {
      ko: {
        sections: [
          { heading: "주님의 기도", lines: OUR_FATHER_KO },
          { heading: "성모송", lines: HAIL_MARY_KO },
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
          { heading: "성모찬송", lines: SALVE_REGINA_KO },
          {
            heading: "묵주기도 후 기도",
            lines: [
              "○ 기도합시다.",
              "하느님, 외아드님이 삶과 죽음과 부활로써",
              "저희에게 영원한 구원을 마련해 주셨나이다.",
              "복되신 동정 마리아와 함께 이 신비를 묵상하며 묵주기도를 바치오니,",
              "저희가 그 가르침을 따라 영원한 생명을 얻게 하소서.",
              "우리 주 그리스도를 통하여 비나이다.",
              "◎ 아멘.",
            ],
          },
          {
            heading: "호칭 기도",
            lines: [
              "○ 지극히 거룩하신 예수 성심이여,",
              "● 저희에게 자비를 베푸소서.",
              "○ 티 없이 깨끗하신 마리아 성심이여,",
              "● 저희를 위하여 빌어 주소서.",
              "○ 성 요셉,",
              "● 저희를 위하여 빌어 주소서.",
              "○ 사도 성 요한,",
              "● 저희를 위하여 빌어 주소서.",
              "○ 몽포르의 성 루도비코 마리아,",
              "● 저희를 위하여 빌어 주소서.",
            ],
          },
          { lines: [SIGN_OF_CROSS_KO] },
        ],
        note: "주회합에서는 개회 기도에 이어 바로 그날의 신비로 5단을 바칩니다. 기본 기도문과 신비는 가톨릭 기도서의 현행 공식 문구입니다.",
      },
      en: {
        sections: [
          { heading: "Our Father", lines: OUR_FATHER_EN },
          { heading: "Hail Mary", lines: HAIL_MARY_EN },
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
          { heading: "Hail, Holy Queen", lines: SALVE_REGINA_EN },
          {
            heading: "Prayer after the Rosary",
            lines: [
              "○ Pray for us, O holy Mother of God.",
              "● That we may be made worthy of the promises of Christ.",
              "○ Let us pray.",
              "O God, Whose only-begotten Son, by His life, death and resurrection,",
              "has purchased for us the rewards of eternal salvation;",
              "grant, we beseech You, that meditating upon these mysteries",
              "in the most holy Rosary of the Blessed Virgin Mary,",
              "we may imitate what they contain, and obtain what they promise.",
              "Through the same Christ our Lord.",
              "◎ Amen.",
            ],
          },
          {
            heading: "Invocations",
            lines: [
              "○ Most Sacred Heart of Jesus,",
              "● Have mercy on us.",
              "○ Immaculate Heart of Mary,",
              "● Pray for us.",
              "○ St. Joseph,",
              "● Pray for us.",
              "○ St. John the Evangelist,",
              "● Pray for us.",
              "○ St. Louis-Marie de Montfort,",
              "● Pray for us.",
            ],
          },
          { lines: [SIGN_OF_CROSS_EN] },
        ],
        note: "In the Legion meeting the five decades follow the opening prayers directly.",
      },
    },
  },

  {
    id: "catena",
    entry: {
      ko: {
        sections: [
          { heading: "후렴", lines: ANTIPHON_KO },
          {
            heading: "마리아의 노래 (루카 1,46-55)",
            lines: [
              "○ 내 영혼이 주님을 찬송하며, 나를 구하신 하느님께",
              "내 마음 기뻐 뛰노나니, 당신 종의 비천함을 돌보셨음이로다.",
              "● 이제로부터 과연 만세가 나를 복되다 일컬으리니,",
              "능하신 분이 큰일을 내게 하셨음이요, 그 이름은 거룩하신 분이시로다.",
              "○ 그 인자하심은 세세 대대로 당신을 두리는 이들에게 미치시리라.",
              "● 당신 팔의 큰 힘을 떨쳐 보이시어, 마음이 교만한 자들을 흩으셨도다.",
              "○ 권세 있는 자를 자리에서 내치시고, 미천한 이를 끌어 올리셨도다.",
              "● 주리는 이를 은혜로 채워 주시고, 부요한 자를 빈손으로 보내셨도다.",
              "○ 인자하심을 잊지 않으시어 당신 종 이스라엘을 도우셨으니,",
              "● 이미 아브라함과 그 후손을 위하여 영원히 우리 조상들에게 언약하신 바로다.",
              "○ 영광이 성부와 성자와 성령께,",
              "● 처음과 같이 이제와 항상 영원히. 아멘.",
            ],
          },
          { heading: "후렴 (반복)", lines: ANTIPHON_KO },
          {
            heading: "계응",
            lines: [
              "○ 원죄 없이 잉태되신 마리아님,",
              "● 당신께 매달리는 저희를 위하여 빌어 주소서.",
            ],
          },
          {
            heading: "기도",
            lines: [
              "○ 기도합시다.",
              "저희를 하느님 아버지께 이끄시는 주 예수 그리스도님,",
              "주님의 어머니 동정 마리아를 저희 어머니가 되게 하시고",
              "저희의 전구자로 세우셨나이다.",
              "비오니, 성모 마리아의 전구를 들으시어",
              "저희가 주님께 간구하는 모든 은혜를 받아 누리게 하소서.",
              "◎ 아멘.",
            ],
          },
        ],
        note: "행동 단원은 매일 까떼나를 바칩니다. '당신께 매달리는'은 판본에 따라 '당신께 의탁하는'으로도 바칩니다.",
      },
      en: {
        sections: [
          { heading: "Antiphon", lines: ANTIPHON_EN },
          {
            heading: "Magnificat (Luke 1:46-55)",
            lines: [
              "○ My soul glorifies the Lord.",
              "● My spirit rejoices in God, my Saviour.",
              "○ He looks on His servant in her lowliness;",
              "● henceforth all ages will call me blessed.",
              "○ The Almighty works marvels for me.",
              "● Holy His name!",
              "○ His mercy is from age to age, on those who fear Him.",
              "● He puts forth His arm in strength and scatters the proud-hearted.",
              "○ He casts the mighty from their thrones and raises the lowly.",
              "● He fills the starving with good things, sends the rich away empty.",
              "○ He protects Israel His servant, remembering His mercy,",
              "● The mercy promised to our fathers, to Abraham and his sons for ever.",
              "○ Glory be to the Father, and to the Son, and to the Holy Spirit,",
              "● As it was in the beginning, is now and ever shall be, world without end. Amen.",
            ],
          },
          { heading: "Antiphon (repeat)", lines: ANTIPHON_EN },
          {
            heading: "Versicle",
            lines: [
              "○ O Mary, conceived without sin.",
              "● Pray for us who have recourse to you.",
            ],
          },
          {
            heading: "Prayer",
            lines: [
              "○ Let us pray.",
              "O Lord Jesus Christ, our mediator with the Father,",
              "Who has been pleased to appoint the Most Blessed Virgin, Your mother,",
              "to be our mother also, and our mediatrix with You,",
              "mercifully grant that whoever comes to You seeking Your favours",
              "may rejoice to receive all of them through her.",
              "◎ Amen.",
            ],
          },
        ],
        note: "Active members pray the Catena every day.",
      },
    },
  },

  {
    id: "closing",
    entry: {
      ko: {
        sections: [
          { lines: [SIGN_OF_CROSS_KO] },
          {
            heading: "성모님께 의탁하는 기도",
            lines: [
              "○ 거룩하신 천주의 성모님, 저희를 지켜 주시고",
              "어려울 때 저희가 드리는 간절한 기도를 물리치지 마소서.",
              "또한 온갖 위험에서 언제나 저희를 지켜 주소서.",
              "● 영화롭고 복되신 동정녀여.",
            ],
          },
          {
            heading: "호칭 기도",
            lines: [
              "○ 티 없이 깨끗하신 마리아, 모든 은총의 중재자시여,",
              "(주회 때에는 이 호칭을 쁘레시디움 이름으로 바꾸어 바칩니다)",
              "● 저희를 위하여 빌어 주소서.",
              "○ 성 미카엘과 성 가브리엘과 성 라파엘 대천사,",
              "● 저희를 위하여 빌어 주소서.",
              "○ 성모님의 천상 군단, 모든 천사들이여,",
              "● 저희를 위하여 빌어 주소서.",
              "○ 세례자 성 요한,",
              "● 저희를 위하여 빌어 주소서.",
              "○ 성 베드로와 성 바오로,",
              "● 저희를 위하여 빌어 주소서.",
            ],
          },
          {
            heading: "마침 기도 (레지오 기도)",
            lines: [
              "◎ 주님, 마리아의 깃발 아래 모여 봉사하는 저희에게",
              "주님께 대한 온전한 믿음과 마리아께 대한 굳은 신뢰심을 주소서.",
              "이로써 저희는 세상을 정복하렵니다.",
              "사랑으로 불타는 힘찬 믿음을 저희에게 주소서.",
              "이 믿음으로써 주님을 사랑하는 순수한 지향으로",
              "저희의 모든 사명을 완수하고, 이웃 안에서 항상 주님을 뵙고 섬기렵니다.",
              "바위와 같이 튼튼하고 흔들리지 않는 믿음을 저희에게 주소서.",
              "이 튼튼한 믿음을 통하여, 삶의 십자가와 노고와 실패 속에서도",
              "평온하고 꿋꿋하게 나아가렵니다.",
              "저희의 힘을 북돋우는 용감한 믿음을 주소서.",
              "이 용감한 믿음을 통하여, 하느님의 영광과 영혼의 구원을 위해",
              "큰일을 서슴지 않고 떠맡아 완수하렵니다.",
              "저희 레지오의 불기둥이 될 믿음을 주소서.",
              "이 믿음으로써 저희가 한데 뭉쳐 나아가며,",
              "하느님의 무한한 사랑의 불을 온 누리에 밝히어",
              "어둠과 죽음의 그늘 밑에 있는 모든 이를 깨우치렵니다.",
              "또한 미지근한 이들을 열정으로 불태우고,",
              "죄로 죽은 영혼들을 다시 살아나게 하렵니다.",
              "그리하여 마침내 한평생 싸움이 끝난 다음,",
              "저희 레지오가 한 사람도 빠짐없이 주님의 사랑과 영광의 나라에서",
              "다시 모일 수 있도록 저희의 발걸음을 평화의 길로 인도하는 믿음을 주소서.",
              "아멘.",
            ],
          },
          {
            heading: "죽은 단원을 위한 기도",
            lines: [
              "○ 세상을 떠난 저희 레지오 단원들과",
              "세상을 떠난 모든 신자들의 영혼이",
              "하느님의 자비로 평화의 안식을 얻게 하소서.",
              "◎ 아멘.",
            ],
          },
          {
            lines: [
              "(이어서 사제의 강복을 받습니다. 사제가 안 계시면 성호경으로 마칩니다.)",
              SIGN_OF_CROSS_KO,
            ],
          },
        ],
        note: "'모든 은총의 중재자' 호칭과 대천사 호칭 등은 발행 판본에 따라 표현이 조금 다를 수 있습니다.",
      },
      en: {
        sections: [
          { lines: [SIGN_OF_CROSS_EN] },
          {
            heading: "We Fly to Your Patronage",
            lines: [
              "○ We fly to your patronage, O holy Mother of God;",
              "despise not our prayers in our necessities,",
              "but ever deliver us from all dangers,",
              "● O glorious and blessed Virgin.",
            ],
          },
          {
            heading: "Invocations",
            lines: [
              "○ Mary Immaculate, Mediatrix of all Graces,",
              "(or the invocation proper to the praesidium)",
              "● Pray for us.",
              "○ Saints Michael, Gabriel and Raphael,",
              "● Pray for us.",
              "○ All you heavenly Powers, Mary's Legion of Angels,",
              "● Pray for us.",
              "○ St. John the Baptist,",
              "● Pray for us.",
              "○ Saints Peter and Paul,",
              "● Pray for us.",
            ],
          },
          {
            heading: "Concluding Prayer",
            lines: [
              "◎ Confer, O Lord, on us, who serve beneath the standard of Mary,",
              "that fullness of faith in You and trust in her,",
              "to which it is given to conquer the world.",
              "Grant us a lively faith, animated by charity,",
              "which will enable us to perform all our actions",
              "from the motive of pure love of You,",
              "and ever to see You and serve You in our neighbour;",
              "a faith, firm and immovable as a rock,",
              "through which we shall rest tranquil and steadfast",
              "amid the crosses, toils and disappointments of life;",
              "a courageous faith which will inspire us",
              "to undertake and carry out without hesitation",
              "great things for Your glory and for the salvation of souls;",
              "a faith which will be our Legion's Pillar of Fire",
              "— to lead us forth united —",
              "to kindle everywhere the fires of divine love —",
              "to enlighten those who are in darkness and in the shadow of death —",
              "to inflame those who are lukewarm —",
              "to bring back life to those who are dead in sin;",
              "and which will guide our own feet in the way of peace;",
              "so that — the battle of life over —",
              "our Legion may reassemble, without the loss of any one,",
              "in the kingdom of Your love and glory.",
              "Amen.",
            ],
          },
          {
            heading: "For Departed Legionaries",
            lines: [
              "○ May the souls of our departed legionaries",
              "and the souls of all the faithful departed,",
              "through the mercy of God, rest in peace.",
              "◎ Amen.",
            ],
          },
          {
            lines: [
              "(The priest's blessing follows; without a priest, close with the Sign of the Cross.)",
              SIGN_OF_CROSS_EN,
            ],
          },
        ],
        note: "Wording follows the official Concilium Tessera; printings may vary slightly.",
      },
    },
  },
];
