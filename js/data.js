/* Демонстрационные данные AffordBase. В рабочей версии приходят с бэкенда.
   L(en, ru, kk) выбирает подпись на языке страницы (см. i18n.js). */
window.AB_DATA = {
  // Команда для раздела «Команда». Пока список пуст, раздел скрыт.
  // Пример: { name: "Имя Фамилия", role: L("Founder & CEO", "Основатель и CEO", "Негізін қалаушы, CEO"), bio: L("…", "…", "…"), photo: "img/team/name.jpg" }
  team: [],

  // Rent-to-own: метры, которые ещё не ваши, принадлежат инвестору и фонду кооператива.
  // Вы платите аренду только за них и постепенно выкупаете.
  flatMembers: [
    { id: "me", name: L("Your metres", "Ваши метры", "Сіздің метрлеріңіз"), color: "#F0BE2C", m2: 12 },
    { id: "investor", name: L("Social investor", "Социальный инвестор", "Әлеуметтік инвестор"), color: "#5B8DB8", m2: 26 },
    { id: "coop", name: L("Co-op fund", "Фонд кооператива", "Кооператив қоры"), color: "#1E7564", m2: 16 }
  ],
  flatArea: 54,
  flatRent: 230000,
  coopPricePerM2: 385000,
  marketPricePerM2: 610000,

  districts: {
    yesil: L("Yesil", "Есиль", "Есіл"),
    almaty: L("Almaty district", "Алматы", "Алматы ауданы"),
    saryarka: L("Saryarka", "Сарыарка", "Сарыарқа"),
    baikonur: L("Baikonur", "Байконур", "Байқоңыр"),
    nura: L("Nura", "Нура", "Нұра")
  },

  plots: [
    { id: "p1", x: 60, y: 40, w: 110, h: 70, title: L("Bereke", "Береке", "Береке"), district: "nura", type: L("Modular block, 5 floors", "Модульный дом, 5 этажей", "Модульдік үй, 5 қабат"), units: 60, area: L("0.9 ha", "0,9 га", "0,9 га"), price: 385000, market: 610000, members: 41, need: 60, funded: 0.58, ready: L("Q4 2027", "IV кв. 2027", "2027 ж. IV тоқсан") },
    { id: "p2", x: 220, y: 30, w: 90, h: 60, title: L("Shanyrak", "Шаңырақ", "Шаңырақ"), district: "yesil", type: L("3D-printed townhouses", "3D-печать, таунхаусы", "3D-басып шығару, таунхаустар"), units: 24, area: L("1.4 ha", "1,4 га", "1,4 га"), price: 342000, market: 680000, members: 19, need: 24, funded: 0.71, ready: L("Q2 2027", "II кв. 2027", "2027 ж. II тоқсан") },
    { id: "p3", x: 360, y: 60, w: 120, h: 80, title: L("Zhastar", "Жастар", "Жастар"), district: "saryarka", type: L("Building retrofit for social rent", "Реконструкция здания под соцаренду", "Ғимаратты әлеуметтік жалдауға қайта жаңарту"), units: 88, area: L("0.6 ha", "0,6 га", "0,6 га"), price: 298000, market: 520000, members: 52, need: 88, funded: 0.34, ready: L("Q1 2028", "I кв. 2028", "2028 ж. I тоқсан") },
    { id: "p4", x: 90, y: 200, w: 130, h: 80, title: L("Dostyk", "Достық", "Достық"), district: "almaty", type: L("Modular block, 9 floors", "Модульный дом, 9 этажей", "Модульдік үй, 9 қабат"), units: 126, area: L("1.1 ha", "1,1 га", "1,1 га"), price: 401000, market: 590000, members: 77, need: 126, funded: 0.46, ready: L("Q3 2028", "III кв. 2028", "2028 ж. III тоқсан") },
    { id: "p5", x: 300, y: 210, w: 100, h: 70, title: L("Samal", "Самал", "Самал"), district: "baikonur", type: L("3D-printed low-rise homes", "3D-печать, малоэтажные дома", "3D-басып шығару, аз қабатты үйлер"), units: 36, area: L("2.0 ha", "2,0 га", "2,0 га"), price: 330000, market: 560000, members: 12, need: 36, funded: 0.21, ready: L("Q4 2028", "IV кв. 2028", "2028 ж. IV тоқсан") }
  ],

  pool: [
    { name: L("Aigerim", "Айгерим", "Айгерім"), m2: 14, activity: 80 },
    { name: L("Sadykov family", "Семья Садыковых", "Садықовтар отбасы"), m2: 12, activity: 64 },
    { name: L("Timur", "Тимур", "Тимур"), m2: 9, activity: 92 },
    { name: L("Madina", "Мадина", "Мадина"), m2: 7, activity: 30 },
    { name: L("Yerzhan", "Ержан", "Ержан"), m2: 4, activity: 70 }
  ],

  suppliers: [
    { name: "PrintHaus KZ", item: L("3D-printed walls, per m² of wall", "3D-печать стен, за м² стены", "3D-басып шығарылған қабырға, қабырғаның 1 м² үшін"), price: 18500, market: 26000 },
    { name: L("Modul-Stroy", "Модуль-Строй", "Модуль-Строй"), item: L("18 m² living module, turnkey", "Жилой модуль 18 м² под ключ", "18 м² тұрғын модуль, кілтін тапсырумен"), price: 4950000, market: 6700000 },
    { name: L("EcoBlock Karaganda", "ЭкоБлок Караганда", "ЭкоБлок Қарағанды"), item: L("Aerated concrete, per m³", "Газоблок, за м³", "Газоблок, 1 м³ үшін"), price: 23500, market: 31000 },
    { name: L("Warm Home", "Теплый Дом", "Жылы Үй"), item: L("Mineral wool facade insulation, per m²", "Минвата, утепление фасада, за м²", "Минералды мақта, қасбетті жылыту, 1 м² үшін"), price: 3900, market: 5300 },
    { name: "SunQazaq", item: L("450 W solar panel", "Солнечная панель 450 Вт", "450 Вт күн панелі"), price: 61000, market: 84000 },
    { name: L("Steppe Windows", "Окна Степи", "Дала Терезелері"), item: L("Energy-saving window 1.2×1.4 m", "Энергосберегающее окно 1,2×1,4 м", "Энергия үнемдейтін терезе 1,2×1,4 м"), price: 64000, market: 89000 }
  ],
  // Объёмы закупки для одного дома пула
  supplyQty: [1400, 12, 220, 1800, 40, 120],

  candidates: [
    { name: L("Madina", "Мадина", "Мадина"), age: 27, job: L("nurse", "медсестра", "мейірбике"), schedule: "shift", district: "almaty", budget: 105000, habits: ["nosmoke", "quiet", "cook"], color: "#8A5A86" },
    { name: L("Zhanar", "Жанар", "Жанар"), age: 31, job: L("freelance accountant", "бухгалтер на аутсорсе", "аутсорстағы бухгалтер"), schedule: "remote", district: "almaty", budget: 120000, habits: ["nosmoke", "quiet"], color: "#5B8DB8" },
    { name: L("Olzhas", "Олжас", "Олжас"), age: 24, job: L("courier", "курьер", "курьер"), schedule: "day", district: "saryarka", budget: 90000, habits: ["guests", "cook"], color: "#1E7564" },
    { name: L("Dinara", "Динара", "Динара"), age: 29, job: L("pharmacist", "фармацевт", "фармацевт"), schedule: "shift", district: "yesil", budget: 115000, habits: ["nosmoke", "quiet", "cook", "pets"], color: "#B4452C" },
    { name: L("Akmaral", "Акмарал", "Ақмарал"), age: 26, job: L("kindergarten teacher", "воспитатель", "тәрбиеші"), schedule: "day", district: "almaty", budget: 100000, habits: ["nosmoke", "quiet", "cook"], color: "#C2862B" },
    { name: L("Ruslan", "Руслан", "Руслан"), age: 33, job: L("taxi driver", "таксист", "такси жүргізушісі"), schedule: "night", district: "baikonur", budget: 95000, habits: ["nosmoke"], color: "#4E625C" },
    { name: L("Gulnur", "Гульнур", "Гүлнұр"), age: 35, job: L("self-employed seamstress", "швея, самозанятая", "тігінші, өзін-өзі жұмыспен қамтыған"), schedule: "remote", district: "nura", budget: 85000, habits: ["quiet", "cook", "pets"], color: "#6B7FA8" },
    { name: L("Saule", "Сауле", "Сәуле"), age: 23, job: L("student, freelancer", "студентка-фрилансер", "студент-фрилансер"), schedule: "remote", district: "almaty", budget: 80000, habits: ["nosmoke", "cook", "guests"], color: "#2F8F7A" }
  ],
  // Аренда в Астане, ₸/мес. one — медиана однокомнатной на krisha.kz, 18.08.2026 (через CMN.KZ);
  // four — наша оценка для четырёхкомнатной.
  rent: { one: 240000, four: 480000 },

  regions: [
    { name: L("Astana", "Астана", "Астана"), collect: 97, index: 712, families: 486 },
    { name: L("Almaty", "Алматы", "Алматы"), collect: 95, index: 688, families: 402 },
    { name: L("Shymkent", "Шымкент", "Шымкент"), collect: 93, index: 654, families: 211 },
    { name: L("Karaganda", "Караганда", "Қарағанды"), collect: 96, index: 701, families: 138 },
    { name: L("Aktobe", "Актобе", "Ақтөбе"), collect: 94, index: 667, families: 97 },
    { name: L("Pavlodar", "Павлодар", "Павлодар"), collect: 98, index: 724, families: 80 }
  ],

  lands: [
    { where: L("Astana, Nura district", "Астана, р-н Нура", "Астана, Нұра ауданы"), kind: L("vacant land", "свободная земля", "бос жер"), area: 3.4, use: L("modular construction", "модульное строительство", "модульдік құрылыс"), zerotax: true },
    { where: L("Karaganda, Maikuduk", "Караганда, Майкудук", "Қарағанды, Майқұдық"), kind: L("abandoned building", "заброшенное здание", "тасталған ғимарат"), area: 0.7, use: L("retrofit into a hostel", "реконструкция под общежитие", "жатақханаға қайта жаңарту"), zerotax: true },
    { where: L("Shymkent, Karatau", "Шымкент, Каратау", "Шымкент, Қаратау"), kind: L("unfinished building", "недострой", "аяқталмаған құрылыс"), area: 1.1, use: L("social rental housing", "социальное арендное жильё", "әлеуметтік жалдау баспанасы"), zerotax: false }
  ],

  grants: [
    { id: "solar", title: L("Rooftop solar panels", "Солнечные панели на крыше", "Шатырдағы күн панельдері"), note: L("40 panels × 450 W", "40 панелей по 450 Вт", "450 Вт-тық 40 панель"), cost: 3900000, cover: 0.5, save: 0.22 },
    { id: "insul", title: L("Facade insulation", "Утепление фасада", "Қасбетті жылыту"), note: L("1,800 m² of mineral wool", "1 800 м² минваты", "1 800 м² минералды мақта"), cost: 8600000, cover: 0.6, save: 0.18 },
    { id: "windows", title: L("Energy-saving windows", "Энергосберегающие окна", "Энергия үнемдейтін терезелер"), note: L("120 windows", "120 окон", "120 терезе"), cost: 7700000, cover: 0.4, save: 0.08 },
    { id: "meters", title: L("Smart meters", "Умные счётчики", "Ақылды есептегіштер"), note: L("3 per flat, 60 flats", "по 3 на квартиру, 60 квартир", "әр пәтерге 3-тен, 60 пәтер"), cost: 2700000, cover: 0.7, save: 0.05 },
    { id: "led", title: L("LED stairwell lighting", "LED-освещение подъездов", "Кіреберістердің LED-жарығы"), note: L("5 entrances", "5 подъездов", "5 кіреберіс"), cost: 650000, cover: 0.5, save: 0.03 }
  ]
};
