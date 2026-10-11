// Random Japanese address for the owner's Telegram bot (/jp). Prefecture,
// city, ward, town and postal code are real and consistent with each other
// (a form that checks the postal code against the city accepts them); the
// block number, building and room are random. Written both in Japanese and
// in Western-order romaji so it can be pasted into either kind of form.

type Locality = {
  zip: string;
  pref: string;
  prefR: string;
  /** Empty for Tokyo's special wards, which have no city level. */
  city: string;
  cityR: string;
  /** Empty for cities without wards. */
  ward: string;
  wardR: string;
  town: string;
  townR: string;
  /** Highest chōme the town has; 0 when the town is numbered by block only. */
  chome: number;
};

const LOCALITIES: Locality[] = [
  { zip: '150-0041', pref: '東京都', prefR: 'Tokyo', city: '', cityR: '', ward: '渋谷区', wardR: 'Shibuya-ku', town: '神南', townR: 'Jinnan', chome: 2 },
  { zip: '106-0032', pref: '東京都', prefR: 'Tokyo', city: '', cityR: '', ward: '港区', wardR: 'Minato-ku', town: '六本木', townR: 'Roppongi', chome: 7 },
  { zip: '160-0023', pref: '東京都', prefR: 'Tokyo', city: '', cityR: '', ward: '新宿区', wardR: 'Shinjuku-ku', town: '西新宿', townR: 'Nishi-Shinjuku', chome: 8 },
  { zip: '100-0005', pref: '東京都', prefR: 'Tokyo', city: '', cityR: '', ward: '千代田区', wardR: 'Chiyoda-ku', town: '丸の内', townR: 'Marunouchi', chome: 3 },
  { zip: '104-0061', pref: '東京都', prefR: 'Tokyo', city: '', cityR: '', ward: '中央区', wardR: 'Chuo-ku', town: '銀座', townR: 'Ginza', chome: 8 },
  { zip: '153-0042', pref: '東京都', prefR: 'Tokyo', city: '', cityR: '', ward: '目黒区', wardR: 'Meguro-ku', town: '青葉台', townR: 'Aobadai', chome: 4 },
  { zip: '530-0001', pref: '大阪府', prefR: 'Osaka', city: '大阪市', cityR: 'Osaka-shi', ward: '北区', wardR: 'Kita-ku', town: '梅田', townR: 'Umeda', chome: 3 },
  { zip: '542-0085', pref: '大阪府', prefR: 'Osaka', city: '大阪市', cityR: 'Osaka-shi', ward: '中央区', wardR: 'Chuo-ku', town: '心斎橋筋', townR: 'Shinsaibashisuji', chome: 2 },
  { zip: '460-0008', pref: '愛知県', prefR: 'Aichi', city: '名古屋市', cityR: 'Nagoya-shi', ward: '中区', wardR: 'Naka-ku', town: '栄', townR: 'Sakae', chome: 5 },
  { zip: '220-0012', pref: '神奈川県', prefR: 'Kanagawa', city: '横浜市', cityR: 'Yokohama-shi', ward: '西区', wardR: 'Nishi-ku', town: 'みなとみらい', townR: 'Minatomirai', chome: 6 },
  { zip: '812-0011', pref: '福岡県', prefR: 'Fukuoka', city: '福岡市', cityR: 'Fukuoka-shi', ward: '博多区', wardR: 'Hakata-ku', town: '博多駅前', townR: 'Hakata-ekimae', chome: 4 },
  { zip: '060-0001', pref: '北海道', prefR: 'Hokkaido', city: '札幌市', cityR: 'Sapporo-shi', ward: '中央区', wardR: 'Chuo-ku', town: '北1条西', townR: 'Kita 1-jo Nishi', chome: 10 },
  { zip: '650-0021', pref: '兵庫県', prefR: 'Hyogo', city: '神戸市', cityR: 'Kobe-shi', ward: '中央区', wardR: 'Chuo-ku', town: '三宮町', townR: 'Sannomiya-cho', chome: 3 },
  { zip: '980-0021', pref: '宮城県', prefR: 'Miyagi', city: '仙台市', cityR: 'Sendai-shi', ward: '青葉区', wardR: 'Aoba-ku', town: '中央', townR: 'Chuo', chome: 4 },
  { zip: '730-0031', pref: '広島県', prefR: 'Hiroshima', city: '広島市', cityR: 'Hiroshima-shi', ward: '中区', wardR: 'Naka-ku', town: '紙屋町', townR: 'Kamiya-cho', chome: 2 },
  { zip: '330-0854', pref: '埼玉県', prefR: 'Saitama', city: 'さいたま市', cityR: 'Saitama-shi', ward: '大宮区', wardR: 'Omiya-ku', town: '桜木町', townR: 'Sakuragicho', chome: 4 },
  { zip: '260-0013', pref: '千葉県', prefR: 'Chiba', city: '千葉市', cityR: 'Chiba-shi', ward: '中央区', wardR: 'Chuo-ku', town: '中央', townR: 'Chuo', chome: 4 },
  { zip: '600-8216', pref: '京都府', prefR: 'Kyoto', city: '京都市', cityR: 'Kyoto-shi', ward: '下京区', wardR: 'Shimogyo-ku', town: '東塩小路町', townR: 'Higashi-Shiokoji-cho', chome: 0 },
  { zip: '420-0858', pref: '静岡県', prefR: 'Shizuoka', city: '静岡市', cityR: 'Shizuoka-shi', ward: '葵区', wardR: 'Aoi-ku', town: '伝馬町', townR: 'Denma-cho', chome: 0 },
  { zip: '700-0023', pref: '岡山県', prefR: 'Okayama', city: '岡山市', cityR: 'Okayama-shi', ward: '北区', wardR: 'Kita-ku', town: '駅元町', townR: 'Ekimotomachi', chome: 0 },
  { zip: '900-0015', pref: '沖縄県', prefR: 'Okinawa', city: '那覇市', cityR: 'Naha-shi', ward: '', wardR: '', town: '久茂地', townR: 'Kumoji', chome: 3 },
  { zip: '950-0088', pref: '新潟県', prefR: 'Niigata', city: '新潟市', cityR: 'Niigata-shi', ward: '中央区', wardR: 'Chuo-ku', town: '万代', townR: 'Bandai', chome: 6 },
  { zip: '860-0806', pref: '熊本県', prefR: 'Kumamoto', city: '熊本市', cityR: 'Kumamoto-shi', ward: '中央区', wardR: 'Chuo-ku', town: '花畑町', townR: 'Hanabatacho', chome: 0 },
  { zip: '380-0823', pref: '長野県', prefR: 'Nagano', city: '長野市', cityR: 'Nagano-shi', ward: '', wardR: '', town: '南千歳', townR: 'Minami-Chitose', chome: 2 },
  { zip: '390-0811', pref: '長野県', prefR: 'Nagano', city: '松本市', cityR: 'Matsumoto-shi', ward: '', wardR: '', town: '中央', townR: 'Chuo', chome: 4 },
  { zip: '920-0853', pref: '石川県', prefR: 'Ishikawa', city: '金沢市', cityR: 'Kanazawa-shi', ward: '', wardR: '', town: '本町', townR: 'Honmachi', chome: 2 },
];

// Building names are "<type><town>" or "<town><type>", the way Japanese
// apartment blocks are actually named.
const BUILDING_TYPES: { jp: string; r: string; prefix: boolean }[] = [
  { jp: 'メゾン', r: 'Maison', prefix: true },
  { jp: 'コーポ', r: 'Corpo', prefix: true },
  { jp: 'ハイツ', r: 'Heights', prefix: false },
  { jp: 'レジデンス', r: 'Residence', prefix: false },
  { jp: 'パークハウス', r: 'Park House', prefix: false },
  { jp: 'マンション', r: 'Mansion', prefix: false },
];

const rnd = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(a: T[]): T => a[rnd(a.length)];

export type JpAddress = {
  zip: string;
  /** 東京都渋谷区神南1-2-3 メゾン神南 302 */
  jp: string;
  /** Maison Jinnan 302, 1-2-3 Jinnan, Shibuya-ku, Tokyo 150-0041, Japan */
  romaji: string;
  /** Western-order lines, for forms that take the address field by field. */
  fields: { building: string; street: string; cityWard: string; prefecture: string; zip: string; country: 'Japan' };
};

export function randomJpAddress(): JpAddress {
  const l = pick(LOCALITIES);
  const ban = 1 + rnd(20);
  const go = 1 + rnd(15);
  const block = l.chome ? `${1 + rnd(l.chome)}-${ban}-${go}` : `${ban}-${go}`;

  // Two in three live in a block of flats; the rest is a house with no building line.
  let bldgJp = '';
  let bldgR = '';
  if (rnd(3) !== 0) {
    const t = pick(BUILDING_TYPES);
    const room = `${1 + rnd(9)}0${1 + rnd(8)}`;
    bldgJp = `${t.prefix ? t.jp + l.town : l.town + t.jp} ${room}`;
    bldgR = `${t.prefix ? `${t.r} ${l.townR}` : `${l.townR} ${t.r}`} ${room}`;
  }

  const cityWard = [l.wardR, l.cityR].filter(Boolean).join(', ');
  const street = `${block} ${l.townR}`;
  const romaji = [bldgR, street, cityWard, `${l.prefR} ${l.zip}`, 'Japan'].filter(Boolean).join(', ');

  return {
    zip: l.zip,
    jp: `${l.pref}${l.city}${l.ward}${l.town}${block}${bldgJp ? ` ${bldgJp}` : ''}`,
    romaji,
    fields: { building: bldgR, street, cityWard, prefecture: l.prefR, zip: l.zip, country: 'Japan' },
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The Telegram message for /jp: both scripts, a field-by-field breakdown and copy buttons. */
export function jpAddressMessage(): { text: string; keyboard: { inline_keyboard: unknown[][] } } {
  const a = randomJpAddress();
  const f = a.fields;
  const text = [
    '🇯🇵 <b>Random Japanese address</b>',
    '━━━━━━━━━━━━━━━━━━━',
    `〒${a.zip}`,
    esc(a.jp),
    '',
    '<b>Romaji</b>',
    `<code>${esc(a.romaji)}</code>`,
    '',
    '<b>Field by field</b>',
    ...(f.building ? [`🏢 Building / room: <code>${esc(f.building)}</code>`] : []),
    `🛣 Street / block: <code>${esc(f.street)}</code>`,
    `🏙 City / ward: <code>${esc(f.cityWard)}</code>`,
    `🗾 Prefecture: <code>${esc(f.prefecture)}</code>`,
    `📮 Postal code: <code>${f.zip}</code>`,
    `🌏 Country: <code>Japan</code>`,
  ].join('\n');
  const keyboard = {
    inline_keyboard: [
      [
        { text: '📋 Copy romaji', copy_text: { text: a.romaji.slice(0, 256) } },
        { text: '📋 Copy 日本語', copy_text: { text: `〒${a.zip} ${a.jp}`.slice(0, 256) } },
      ],
      [{ text: '🎲 Another one', callback_data: 'jp:new' }],
    ],
  };
  return { text, keyboard };
}
