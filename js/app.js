(() => {
  "use strict";
  const D = window.AB_DATA;
  const CFG = window.AB_CONFIG;
  const LANG = window.AB_LANG;
  const EN = LANG === "en";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  // Браузеры плохо форматируют kk-KZ («2026 M10 25», «178,889»), поэтому числа и время для казахского — как в ru-RU
  const LOCALE = L("en-US", "ru-RU", "ru-RU");
  const nf = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
  const dec = (x, d) => (EN ? x.toFixed(d) : x.toFixed(d).replace(".", ","));
  const tg = (n) => nf.format(Math.round(n)) + " ₸";
  const mln = (n) => (n >= 1e9 ? dec(n / 1e9, 2) + L("B ₸", " млрд ₸") : dec(n / 1e6, 1) + L("M ₸", " млн ₸"));
  const pct = (x, d = 0) => dec(x * 100, d) + "%";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // plural(n, [one, many], [one, few, many], kk) — в казахском после числа форма не меняется
  const plural = (n, en, ru, kk) => {
    if (LANG === "kk") return kk;
    if (EN) return n === 1 ? en[0] : en[1];
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return ru[0];
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return ru[1];
    return ru[2];
  };
  const download = (name, text) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const KK_MONTHS = ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"];
  const today = () => {
    const d = new Date();
    return LANG === "kk"
      ? `${d.getFullYear()} жылғы ${d.getDate()} ${KK_MONTHS[d.getMonth()]}`
      : d.toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric" });
  };
  const smooth = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

  // Supabase REST: anonymous visitors may only insert rows and read the waitlist count.
  const sb = (path, body, prefer) => fetch(`${CFG.supabaseUrl}/rest/v1/${path}`, {
    method: "POST",
    headers: { apikey: CFG.supabaseKey, "Content-Type": "application/json", ...(prefer ? { Prefer: prefer } : {}) },
    body: JSON.stringify(body)
  });

  /* ---------- Mobile nav ---------- */
  const navBtn = $(".nav-toggle"), nav = $("#nav");
  navBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    navBtn.setAttribute("aria-expanded", open);
  });
  $$("#nav a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("open"); navBtn.setAttribute("aria-expanded", "false"); }));
  // Keep the section anchor when switching language
  $$("[data-lang]").forEach((a) => a.addEventListener("click", () => { a.href = `?lang=${a.dataset.lang}${location.hash}`; }));

  /* ---------- Hero: the flat, metre by metre ---------- */
  const flat = { members: D.flatMembers.map((m) => ({ ...m })), lastBought: -1 };
  const flatGrid = $("#flat-grid");
  for (let i = 0; i < D.flatArea; i++) flatGrid.appendChild(Object.assign(document.createElement("div"), { className: "cell" }));
  const payInput = $("#flat-pay");

  function renderFlat() {
    const cells = flatGrid.children;
    let i = 0;
    flat.members.forEach((m) => { for (let k = 0; k < m.m2; k++, i++) { cells[i].style.background = m.color; } });
    for (; i < cells.length; i++) cells[i].style.background = "";
    if (flat.lastBought >= 0) {
      const c = cells[flat.lastBought];
      c.classList.remove("new"); void c.offsetWidth; c.classList.add("new");
    }
    $("#flat-legend").innerHTML = flat.members.map((m) => `<li><span class="swatch" style="background:${m.color}"></span>${esc(m.name)}<b>${m.m2} ${L("m²", "м²")}</b></li>`).join("");

    const me = flat.members[0];
    const share = me.m2 / D.flatArea;
    const rent = D.flatRent * (1 - share);
    const pay = +payInput.value;
    $("#flat-pay-out").textContent = tg(pay);
    const monthsPerM2 = D.coopPricePerM2 / pay;
    const left = D.flatArea - me.m2;
    const monthsAll = Math.ceil(left * monthsPerM2);
    const years = monthsAll / 12;
    const when = years < 1
      ? monthsAll + L(" months", " мес.", " ай")
      : dec(years, 1) + L(" years", " года", " жыл"); // дробное число: «11,3 года»
    $("#flat-calc").innerHTML = left > 0
      ? L(`Rent now: ${tg(rent)} a month, charged only on the ${left} ${plural(left, ["metre", "metres"], [])} you don't own yet. Paying ${tg(pay)} a month buys one metre every ${dec(monthsPerM2, 1)} months; the whole flat is yours in about ${when}.`,
          `Аренда сейчас ${tg(rent)} в месяц — только за ${left} ${plural(left, [], ["метр", "метра", "метров"])}, которые ещё не ваши. При взносе ${tg(pay)} один метр выкупается за ${dec(monthsPerM2, 1)} мес., вся квартира станет вашей примерно через ${when}.`,
          `Қазір жалдау ақысы айына ${tg(rent)} — тек әлі сізге тиесілі емес ${left} метр үшін. Айына ${tg(pay)} жарна төлесеңіз, бір метр ${dec(monthsPerM2, 1)} айда сатып алынады, бүкіл пәтер шамамен ${when}дан кейін сіздікі болады.`)
      : L("The flat is fully yours. No more rent is charged.", "Квартира полностью ваша. Аренда больше не начисляется.", "Пәтер толығымен сіздікі. Жалдау ақысы енді есептелмейді.");
    $("#flat-buy").disabled = left <= 0;
    $("#flat-buy").textContent = left > 0
      ? L(`Buy 1 m² for ${tg(D.coopPricePerM2)}`, `Выкупить 1 м² за ${tg(D.coopPricePerM2)}`, `1 м² сатып алу: ${tg(D.coopPricePerM2)}`)
      : L("Flat bought out", "Квартира выкуплена", "Пәтер сатып алынды");
  }
  $("#flat-buy").addEventListener("click", () => {
    const me = flat.members[0];
    const seller = flat.members.slice(1).find((m) => m.m2 > 0);
    if (!seller) return;
    seller.m2--; me.m2++;
    flat.lastBought = me.m2 - 1;
    renderFlat();
  });
  payInput.addEventListener("input", () => { flat.lastBought = -1; renderFlat(); });
  renderFlat();

  /* ---------- Co-building: map ---------- */
  const svgNS = "http://www.w3.org/2000/svg";
  const map = $("#plot-map");
  map.innerHTML = `
    <path d="M0 165 C 90 140, 160 190, 260 168 S 420 130, 520 160" fill="none" stroke="#9EC1D6" stroke-width="22" stroke-linecap="round"/>
    <path d="M0 120 H520 M0 300 H520 M200 0 V340 M340 0 V340" stroke="#C3CABF" stroke-width="7"/>
    <text x="440" y="185" font-size="12" fill="#5d7e93" font-style="italic">${L("Yesil River", "р. Есиль", "Есіл өзені")}</text>`;
  D.plots.forEach((p) => {
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("class", "plot");
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", L(`${p.title} plot, ${D.districts[p.district]}`, `Участок «${p.title}», район ${D.districts[p.district]}`, `«${p.title}» учаскесі, ${D.districts[p.district]}`));
    g.dataset.id = p.id;
    g.innerHTML = `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="3"/>
      <text x="${p.x + 10}" y="${p.y + 22}">${esc(p.title)}</text>
      <text x="${p.x + 10}" y="${p.y + 40}" style="font-weight:400;font-size:11px">${p.units} ${L("flats", "кв.", "пәтер")}</text>`;
    map.appendChild(g);
  });
  function selectPlot(id) {
    const p = D.plots.find((x) => x.id === id);
    $$(".plot", map).forEach((g) => g.classList.toggle("active", g.dataset.id === id));
    const flatCost = 45 * p.price, flatMarket = 45 * p.market;
    const title = L(p.title, `«${p.title}»`);
    const district = D.districts[p.district];
    $("#plot-info").innerHTML = `
      <div class="plot-info">
        <h3>${esc(L(`${p.title}, ${district}`, `«${p.title}», район ${district}`, `«${p.title}», ${district}`))}</h3>
        <dl>
          <dt>${L("Project", "Проект", "Жоба")}</dt><dd>${esc(p.type)}</dd>
          <dt>${L("Flats", "Квартир", "Пәтерлер")}</dt><dd>${p.units}</dd>
          <dt>${L("Plot", "Участок", "Учаске")}</dt><dd>${esc(p.area)}</dd>
          <dt>${L("Move-in", "Заселение", "Қоныстану")}</dt><dd>${esc(p.ready)}</dd>
        </dl>
        <div class="compare">
          <div class="good"><strong>${tg(p.price)}</strong><span>${L("per m² in the co-op", "за м² в кооперативе", "кооперативте 1 м² үшін")}</span></div>
          <div><strong>${tg(p.market)}</strong><span>${L("per m² on the market", "за м² на рынке", "нарықта 1 м² үшін")}</span></div>
        </div>
        <p>${L(`A 45 m² flat costs <b>${mln(flatCost)}</b> instead of ${mln(flatMarket)}, a saving of ${mln(flatMarket - flatCost)}.`,
               `Квартира 45 м² обойдётся в <b>${mln(flatCost)}</b> вместо ${mln(flatMarket)} — экономия ${mln(flatMarket - flatCost)}.`,
               `45 м² пәтер ${mln(flatMarket)} орнына <b>${mln(flatCost)}</b> тұрады — үнем ${mln(flatMarket - flatCost)}.`)}</p>
        <p class="small muted">${L(`${p.members} of ${p.need} members have joined. ${pct(p.funded)} of the construction budget is raised.`,
                                  `В пуле ${p.members} из ${p.need} участников. Собрано ${pct(p.funded)} бюджета стройки.`,
                                  `Пулда ${p.need} орынның ${p.members} қатысушысы бар. Құрылыс бюджетінің ${pct(p.funded)} жиналды.`)}</p>
        <div class="progress" aria-hidden="true"><span style="width:${p.funded * 100}%"></span></div>
        <button class="btn btn-primary" id="join-pool">${esc(L(`Join the ${title} pool`, `Вступить в пул ${title}`, `${title} пулына кіру`))}</button>
        <p class="small" id="join-msg" aria-live="polite"></p>
      </div>`;
    $("#join-pool").addEventListener("click", (e) => {
      p.members = Math.min(p.need, p.members + 1);
      e.target.disabled = true;
      e.target.textContent = L("Request sent", "Заявка отправлена", "Өтінім жіберілді");
      $("#join-msg").textContent = L(`You're member no. ${p.members}. The pool coordinator will contact you; the first payment starts from 1 m².`,
                                     `Вы ${p.members}-й участник пула. Координатор пула свяжется с вами, первый взнос — от 1 м².`,
                                     `Сіз пулдың ${p.members}-қатысушысысыз. Пул үйлестірушісі сізбен байланысады, алғашқы жарна — 1 м²-ден.`);
    });
  }
  map.addEventListener("click", (e) => { const g = e.target.closest(".plot"); if (g) selectPlot(g.dataset.id); });
  map.addEventListener("keydown", (e) => { const g = e.target.closest(".plot"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); selectPlot(g.dataset.id); } });
  selectPlot("p1");

  /* ---------- Co-building: pool shares & queue ---------- */
  const RISK_RESERVE = 24000000;
  function renderPool() {
    const me = { name: L("You", "Вы", "Сіз"), m2: clamp(+$("#me-m2").value || 0, 0, 80), activity: clamp(+$("#me-act").value || 0, 0, 100), me: true };
    const all = [...D.pool, me];
    const total = all.reduce((s, x) => s + x.m2, 0) || 1;
    const maxM2 = Math.max(...all.map((x) => x.m2)) || 1;
    all.forEach((x) => { x.share = x.m2 / total; x.score = 0.7 * (x.m2 / maxM2) + 0.3 * (x.activity / 100); });
    const ranked = [...all].sort((a, b) => b.score - a.score);
    ranked.forEach((x, i) => (x.queue = i + 1));
    $("#pool-table tbody").innerHTML = all.map((x) => `
      <tr class="${x.me ? "me" : ""}">
        <td>${esc(x.name)}</td>
        <td class="num">${x.m2}</td>
        <td class="num">${pct(x.share, 1)}</td>
        <td class="num">${tg(RISK_RESERVE * x.share)}</td>
        <td class="num">${x.activity}</td>
        <td><span class="tag ${x.queue <= 2 ? "" : x.queue <= 4 ? "mid" : "warn"}">${L(`No. ${x.queue}`, `${x.queue}-е место`, `${x.queue}-орын`)}</span></td>
      </tr>`).join("");
  }
  ["#me-m2", "#me-act"].forEach((s) => $(s).addEventListener("input", renderPool));
  renderPool();

  /* ---------- Co-building: suppliers ---------- */
  $("#supply-table tbody").innerHTML = D.suppliers.map((s, i) => `
    <tr>
      <td><input type="checkbox" class="sup" data-i="${i}" ${i < 3 ? "checked" : ""} aria-label="${esc(L(`Add ${s.item} to the order`, `Добавить ${s.item} в закупку`, `${s.item}: сатып алуға қосу`))}"></td>
      <td>${esc(s.name)}</td><td>${esc(s.item)}</td>
      <td class="num">${tg(s.price)}</td><td class="num">${tg(s.market)}</td>
      <td><span class="tag">−${Math.round((1 - s.price / s.market) * 100)}%</span></td>
    </tr>`).join("");
  function renderSupply() {
    let pool = 0, market = 0;
    $$(".sup").forEach((c) => { if (c.checked) { const i = +c.dataset.i; pool += D.suppliers[i].price * D.supplyQty[i]; market += D.suppliers[i].market * D.supplyQty[i]; } });
    $("#supply-total").innerHTML = pool
      ? L(`Order for one building: <b>${mln(pool)}</b> instead of ${mln(market)}. The pool saves <b>${mln(market - pool)}</b> (${pct(1 - pool / market)}).`,
          `Закупка на один дом: <b>${mln(pool)}</b> вместо ${mln(market)}. Пул экономит <b>${mln(market - pool)}</b> (${pct(1 - pool / market)}).`,
          `Бір үйге сатып алу: ${mln(market)} орнына <b>${mln(pool)}</b>. Пул <b>${mln(market - pool)}</b> үнемдейді (${pct(1 - pool / market)}).`)
      : L("Tick at least one item to calculate the saving.", "Отметьте хотя бы одну позицию, чтобы посчитать экономию.", "Үнемді есептеу үшін кемінде бір позицияны белгілеңіз.");
  }
  $("#supply-table").addEventListener("change", renderSupply);
  renderSupply();

  /* ---------- Co-living matcher ---------- */
  $("#match-district").innerHTML = Object.entries(D.districts)
    .map(([k, name]) => `<option value="${k}" ${k === "almaty" ? "selected" : ""}>${esc(name)}</option>`).join("");
  const SCHED = {
    day: { day: 1, shift: 0.7, night: 0.8, remote: 0.6 },
    shift: { day: 0.7, shift: 1, night: 0.7, remote: 0.6 },
    night: { day: 0.8, shift: 0.7, night: 0.9, remote: 0.4 },
    remote: { day: 0.6, shift: 0.6, night: 0.4, remote: 0.8 }
  };
  const HABIT_NAMES = {
    nosmoke: L("non-smoker", "не курит", "темекі шекпейді"),
    quiet: L("quiet after 10 pm", "тишина после 22:00", "22:00-ден кейін тыныштық"),
    cook: L("cooks at home", "готовит дома", "үйде тамақ әзірлейді"),
    pets: L("has a pet", "питомец", "үй жануары бар"),
    guests: L("often has guests", "часто гости", "қонақ жиі келеді")
  };
  function habitScore(a, b) {
    let s = 1;
    if (a.includes("nosmoke") !== b.includes("nosmoke")) s -= 0.45;
    if ((a.includes("quiet") && b.includes("guests")) || (b.includes("quiet") && a.includes("guests"))) s -= 0.3;
    if (a.includes("pets") !== b.includes("pets")) s -= 0.15;
    const shared = a.filter((h) => b.includes(h)).length;
    s += shared * 0.04;
    return clamp(s, 0, 1);
  }
  function matchScore(me, c) {
    const sched = SCHED[me.schedule][c.schedule];
    const hab = habitScore(me.habits, c.habits);
    const bud = 1 - Math.abs(me.budget - c.budget) / Math.max(me.budget, c.budget, 1);
    const dist = me.district === c.district ? 1 : 0.45;
    return Math.min(0.98, 0.28 * sched + 0.37 * hab + 0.2 * bud + 0.15 * dist);
  }
  let lastMatch = null;
  $("#match-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const me = {
      name: (f.get("name") || L("You", "Вы", "Сіз")).trim(), job: f.get("job"), income: +f.get("income"), budget: +f.get("budget"),
      schedule: f.get("schedule"), district: f.get("district"), habits: f.getAll("habits")
    };
    const ranked = D.candidates.map((c) => ({ ...c, score: matchScore(me, c) })).sort((a, b) => b.score - a.score);
    const top = ranked.slice(0, 3);
    const perPerson = D.rent.four / 4;
    const saving = 1 - perPerson / D.rent.one;
    const overBudget = top.filter((c) => c.budget < perPerson).map((c) => c.name);
    const burden = me.income ? perPerson / me.income : 0;
    lastMatch = { me, top, perPerson };
    $("#match-result").innerHTML = `
      <h3>${L("Your matches", "Совпадения для вас", "Сізге сәйкестер")}</h3>
      ${top.map((c) => `
        <div class="match">
          <div class="avatar" style="background:${c.color}">${esc(c.name[0])}</div>
          <b>${esc(c.name)}, ${c.age}, ${esc(c.job)}</b>
          <span class="pct">${Math.round(c.score * 100)}%</span>
          <p>${esc(D.districts[c.district])} · ${L(`budget up to ${tg(c.budget)}`, `бюджет до ${tg(c.budget)}`, `бюджеті ${tg(c.budget)} дейін`)} · ${c.habits.map((h) => HABIT_NAMES[h]).join(", ")}</p>
        </div>`).join("")}
      <div class="saving">
        <strong>${tg(perPerson)} ${L("a month", "в месяц", "айына")}</strong>
        ${L(`Your share of a four-room flat at ${tg(D.rent.four)} (our estimate). A one-room flat alone costs about ${tg(D.rent.one)}, the Astana median. You save ${pct(saving)}.`,
            `Ваша доля в четырёхкомнатной квартире за ${tg(D.rent.four)} (наша оценка). Однушка в одиночку — около ${tg(D.rent.one)}, медиана по Астане. Экономия ${pct(saving)}.`,
            `${tg(D.rent.four)} тұратын төрт бөлмелі пәтердегі сіздің үлесіңіз (біздің бағалауымыз). Жалғыз бір бөлмелі пәтер шамамен ${tg(D.rent.one)} тұрады, бұл — Астанадағы медиана. Үнем ${pct(saving)}.`)}
      </div>
      ${me.budget < perPerson ? `<p class="small"><span class="tag warn">${L("Note", "Внимание", "Назар аударыңыз")}</span> ${L(`your limit of ${tg(me.budget)} is below the share. Try a five-room house or a cheaper district.`, `ваш предел ${tg(me.budget)} ниже доли. Попробуйте пятикомнатный дом или район подешевле.`, `сіздің ${tg(me.budget)} шегіңіз үлестен төмен. Бес бөлмелі үйді немесе арзанырақ ауданды қарастырыңыз.`)}</p>` : ""}
      ${overBudget.length ? `<p class="small muted">${L(`${overBudget.join(", ")}'s budget is slightly below the share; the mutual-aid fund can cover the difference for the first months.`, `Бюджет ${overBudget.join(", ")} чуть ниже доли — разницу можно покрыть из фонда взаимопомощи на первые месяцы.`, `${overBudget.join(", ")} бюджеті үлестен сәл төмен — алғашқы айларда айырманы өзара көмек қорынан жабуға болады.`)}</p>` : ""}
      <p class="small muted">${L(`Housing would take ${pct(burden)} of your income${burden > 0.4 ? ". That's a lot; see the mutual-aid fund below" : ""}.`, `Жильё займёт ${pct(burden)} вашего дохода${burden > 0.4 ? " — это много, посмотрите раздел «Фонд»" : ""}.`, `Баспана табысыңыздың ${pct(burden)} алады${burden > 0.4 ? " — бұл көп, төмендегі өзара көмек қорын қараңыз" : ""}.`)}</p>
      <button class="btn btn-primary" id="make-lease">${L("Generate the co-lease", "Сформировать договор совместной аренды", "Бірлескен жалдау шартын жасау")}</button>`;
    $("#make-lease").addEventListener("click", makeLease);
  });
  function makeLease() {
    const { me, top, perPerson } = lastMatch;
    const names = [me.name, ...top.map((c) => c.name)];
    const signs = names.map((n) => n + " ______________").join("\n");
    const text = L(
`RESIDENTIAL CO-LEASE AGREEMENT
Astana, ${today()}

Owner: ____________________ (the Landlord)
Co-tenants: ${names.join(", ")} (the Co-tenants)
Property: four-room flat, address ____________________

1. RENT
1.1. The rent is ${tg(D.rent.four)} a month. Each Co-tenant's share is ${tg(perPerson)}.
1.2. The rent is fixed for 12 months. It may rise no more than once a year, by no more than 7%, with 60 days' written notice.
1.3. Rent is paid by bank transfer through AffordBase with an electronic receipt.

2. CO-TENANTS' LIABILITY
2.1. Each Co-tenant is liable only for their own share of the rent and for damage they personally cause.
2.2. If a Co-tenant leaves, the others have 45 days to find a replacement through the platform. Until then the Landlord may not claim the departing Co-tenant's share from them.

3. EVICTION PROTECTION
3.1. The Landlord may terminate the agreement only on grounds provided by law, with at least 90 days' written notice.
3.2. If a Co-tenant temporarily cannot pay, the AffordBase mutual-aid fund pays the Landlord directly for up to 3 months. The agreement cannot be terminated during this period.
3.3. The Landlord enters the flat only by agreement with the Co-tenants, except in emergencies.

4. DEPOSIT
4.1. The deposit is ${tg(D.rent.four)}, held in the platform's escrow account.
4.2. The deposit is returned within 10 days of moving out. Deductions are allowed only for damage recorded in the digital condition report with photos and timestamps.

5. DISPUTES
5.1. Disputes go first to AffordBase digital mediation, then to the court where the flat is located.

Signatures:
Landlord ______________
${signs}

Template generated by AffordBase. Have it checked by a lawyer before signing.`,
`ДОГОВОР СОВМЕСТНОЙ АРЕНДЫ ЖИЛОГО ПОМЕЩЕНИЯ
г. Астана, ${today()}

Собственник: ____________________ (далее — Арендодатель)
Соарендаторы: ${names.join(", ")} (далее — Соарендаторы)
Объект: четырёхкомнатная квартира, адрес ____________________

1. ПЛАТА
1.1. Арендная плата — ${tg(D.rent.four)} в месяц. Доля каждого Соарендатора — ${tg(perPerson)}.
1.2. Плата фиксируется на 12 месяцев. Повышение возможно не чаще одного раза в год, не более чем на 7%, с письменным уведомлением за 60 дней.
1.3. Оплата — безналичным переводом через AffordBase с электронным чеком.

2. ОТВЕТСТВЕННОСТЬ СОАРЕНДАТОРОВ
2.1. Каждый Соарендатор отвечает только за свою долю платы и ущерб, причинённый им лично.
2.2. Если Соарендатор выбывает, остальные вправе в течение 45 дней найти замену через платформу. До этого срока Арендодатель не вправе требовать с них долю выбывшего.

3. ЗАЩИТА ОТ ВЫСЕЛЕНИЯ
3.1. Арендодатель может расторгнуть договор только по основаниям, предусмотренным законом, с письменным уведомлением не менее чем за 90 дней.
3.2. При временной неплатёжеспособности Соарендатора платёж до 3 месяцев вносит фонд взаимопомощи AffordBase напрямую Арендодателю. В этот период договор не расторгается.
3.3. Арендодатель входит в квартиру только по согласованию с Соарендаторами, кроме аварийных ситуаций.

4. ЗАЛОГ
4.1. Залог — ${tg(D.rent.four)}, хранится на условном счёте платформы.
4.2. Залог возвращается в течение 10 дней после выезда. Удержание возможно только за ущерб, зафиксированный в цифровом акте состояния жилья с фото и временными метками.

5. СПОРЫ
5.1. Споры сначала решаются через цифровой арбитраж AffordBase, затем — в суде по месту нахождения квартиры.

Подписи:
Арендодатель ______________
${signs}

Шаблон сформирован AffordBase. Перед подписанием проверьте его с юристом.`,
`ТҰРҒЫН ҮЙ-ЖАЙДЫ БІРЛЕСІП ЖАЛДАУ ШАРТЫ
Астана қ., ${today()}

Меншік иесі: ____________________ (бұдан әрі — Жалға беруші)
Бірлескен жалдаушылар: ${names.join(", ")} (бұдан әрі — Бірлескен жалдаушылар)
Нысан: төрт бөлмелі пәтер, мекенжайы ____________________

1. АҚЫ
1.1. Жалдау ақысы — айына ${tg(D.rent.four)}. Әр Бірлескен жалдаушының үлесі — ${tg(perPerson)}.
1.2. Ақы 12 айға тіркеледі. Ақы жылына бір реттен жиі емес, 7%-дан аспайтын мөлшерде, 60 күн бұрын жазбаша ескерту арқылы ғана көтерілуі мүмкін.
1.3. Төлем AffordBase арқылы электрондық чекпен қолма-қол ақшасыз аударым түрінде жүргізіледі.

2. БІРЛЕСКЕН ЖАЛДАУШЫЛАРДЫҢ ЖАУАПКЕРШІЛІГІ
2.1. Әр Бірлескен жалдаушы ақының тек өз үлесі үшін және өзі келтірген залал үшін ғана жауап береді.
2.2. Бірлескен жалдаушылардың бірі шығып кетсе, қалғандары 45 күн ішінде платформа арқылы оның орнына адам табуға құқылы. Осы мерзім өткенге дейін Жалға беруші олардан шығып кеткен адамның үлесін талап етуге құқылы емес.

3. ПӘТЕРДЕН ШЫҒАРУДАН ҚОРҒАУ
3.1. Жалға беруші шартты заңда көзделген негіздер бойынша ғана, кемінде 90 күн бұрын жазбаша ескерту арқылы бұза алады.
3.2. Бірлескен жалдаушы уақытша төлей алмаған жағдайда, 3 айға дейінгі төлемді AffordBase өзара көмек қоры тікелей Жалға берушіге енгізеді. Бұл кезеңде шарт бұзылмайды.
3.3. Жалға беруші пәтерге авариялық жағдайлардан басқа кезде тек Бірлескен жалдаушылармен келісіп кіреді.

4. КЕПІЛАҚЫ
4.1. Кепілақы — ${tg(D.rent.four)}, платформаның шартты шотында сақталады.
4.2. Кепілақы шыққаннан кейін 10 күн ішінде қайтарылады. Тек фотосуреттер мен уақыт белгілері бар баспана күйінің цифрлық актісінде тіркелген залал үшін ғана ұстап қалуға болады.

5. ДАУЛАР
5.1. Даулар алдымен AffordBase цифрлық арбитражы арқылы, содан кейін пәтер орналасқан жердегі сотта шешіледі.

Қолдар:
Жалға беруші ______________
${signs}

Үлгіні AffordBase жасады. Қол қоймас бұрын оны заңгермен тексеріңіз.`);
    $("#lease-text").textContent = text;
    $("#lease-wrap").hidden = false;
    $("#lease-wrap").scrollIntoView({ behavior: smooth(), block: "start" });
  }
  $("#lease-download").addEventListener("click", () => download(L("co-lease-agreement.txt", "dogovor-sovmestnoy-arendy.txt", "birlesip-zhaldau-sharty.txt"), $("#lease-text").textContent));

  /* ---------- Reliability index ---------- */
  const gauge = $("#gauge-fill");
  const gLen = gauge.getTotalLength();
  gauge.style.strokeDasharray = gLen;
  const FACTOR_TIPS = {
    util: L("Set up autopay for utilities: every month without a late payment adds points.", "Подключите автоплатёж за коммуналку — каждый месяц без просрочки прибавляет баллы.", "Коммуналдық төлемдерге автотөлем қосыңыз — кешіктірусіз өткен әр ай ұпай қосады."),
    transfers: L("Link the wallet or card you're paid into: your transfer history builds up automatically.", "Привяжите кошелёк или карту, через которую получаете доход: история переводов копится автоматически.", "Табыс түсетін әмиянды немесе картаны байланыстырыңыз: аударымдар тарихы автоматты түрде жиналады."),
    stability: L("Add a second platform or a regular client to smooth out your income.", "Добавьте второго агрегатора или постоянного заказчика — доход станет ровнее.", "Екінші агрегаторды немесе тұрақты тапсырыс берушіні қосыңыз — табысыңыз біркелкі болады."),
    burden: L("Co-renting lowers the share of income spent on housing: try the matcher above.", "Совместная аренда снизит долю дохода на жильё — загляните в «Соарендаторы».", "Бірлескен жалдау табыстың баспанаға кететін үлесін азайтады — жоғарыдағы іріктеуді байқап көріңіз."),
    community: L("Help at a pool clean-up day or mentor newcomers: that counts too.", "Помогите на субботнике пула или станьте наставником новичков — это тоже учитывается.", "Пулдың сенбілігіне көмектесіңіз немесе жаңа қатысушыларға тәлімгер болыңыз — бұл да есепке алынады."),
    sources: L("Tick all your income sources: taxi, delivery, freelance.", "Отметьте все источники дохода: такси, доставку, фриланс.", "Барлық табыс көздерін белгілеңіз: такси, жеткізу, фриланс.")
  };
  function renderScore() {
    const f = $("#score-form");
    const v = (n) => +$(`[name=${n}]`, f).value;
    const util = v("util"), transfers = v("transfers"), vol = v("volatility"), comm = v("community"), burden = v("burden");
    const srcs = $$("[name=src]:checked", f).length;
    $("[data-out=util]").textContent = util + "%";
    $("[data-out=transfers]").textContent = transfers;
    $("[data-out=volatility]").textContent = vol + "%";
    $("[data-out=community]").textContent = comm;
    $("[data-out=burden]").textContent = burden + "%";
    const parts = [
      { id: "util", name: L("Utility payments", "Коммунальные платежи", "Коммуналдық төлемдер"), got: Math.pow(util / 100, 1.5) * 200, max: 200 },
      { id: "transfers", name: L("Regular transfers", "Регулярные переводы", "Тұрақты аударымдар"), got: (Math.min(transfers, 24) / 24) * 120, max: 120 },
      { id: "stability", name: L("Income stability", "Стабильность дохода", "Табыс тұрақтылығы"), got: (1 - vol / 80) * 140, max: 140 },
      { id: "burden", name: L("Housing burden", "Нагрузка жильём", "Баспана жүктемесі"), got: clamp((70 - burden) / 40, 0, 1) * 100, max: 100 },
      { id: "community", name: L("Community involvement", "Участие в сообществе", "Қоғамдағы белсенділік"), got: (Math.min(comm, 12) / 12) * 80, max: 80 },
      { id: "sources", name: L("Several income sources", "Разные источники дохода", "Әртүрлі табыс көздері"), got: [0, 30, 50, 60, 60][srcs], max: 60 }
    ];
    const score = Math.round(200 + parts.reduce((s, p) => s + p.got, 0));
    $("#score-num").textContent = score;
    const t = (score - 200) / 700;
    gauge.style.strokeDashoffset = gLen * (1 - t);
    let band, color;
    if (score < 450) { band = L("Low. A guarantor or double deposit is still needed.", "Низкий. Пока нужен поручитель или двойной залог.", "Төмен. Әзірге кепілгер немесе екі есе кепілақы қажет."); color = "var(--brick)"; }
    else if (score < 600) { band = L("Fair. Co-renting through the platform is open to you.", "Средний. Доступна совместная аренда через платформу.", "Орташа. Платформа арқылы бірлескен жалдау қолжетімді."); color = "var(--signal)"; }
    else if (score < 750) { band = L("Good. Landlords accept you without a guarantor.", "Хороший. Собственники принимают без поручителя.", "Жақсы. Пәтер иелері кепілгерсіз қабылдайды."); color = "var(--teal)"; }
    else { band = L("Excellent. Rent-to-own and building pools are open to you.", "Отличный. Открыт выкуп жилья и вступление в стройпул.", "Өте жақсы. Баспананы сатып алу және құрылыс пулына кіру ашық."); color = "var(--teal)"; }
    gauge.style.stroke = color;
    $("#score-band").textContent = band;
    $("#score-factors").innerHTML = parts.map((p) => `<li>${p.name}<span class="bar"><span style="width:${(p.got / p.max) * 100}%"></span></span><b>${Math.round(p.got)}</b></li>`).join("");
    const tips = parts.map((p) => ({ ...p, gap: p.max - p.got })).sort((a, b) => b.gap - a.gap).slice(0, 3).filter((p) => p.gap > 8).map((p) => FACTOR_TIPS[p.id]);
    $("#score-tips").innerHTML = tips.length
      ? tips.map((t) => `<li>${t}</li>`).join("")
      : `<li>${L("All good. Keep paying on time.", "Всё отлично. Поддерживайте платёжную дисциплину.", "Бәрі тамаша. Төлем тәртібін сақтай беріңіз.")}</li>`;
  }
  $("#score-form").addEventListener("input", renderScore);
  renderScore();

  /* ---------- Resilience vault ---------- */
  const MONTHS = L(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                   ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
                   ["қаң", "ақп", "нау", "сәу", "мам", "мау", "шіл", "там", "қыр", "қаз", "қар", "жел"]);
  const FUND = 48200000;
  $("#fund-balance").textContent = mln(FUND);
  const monthsWord = (n) => `${n} ${plural(n, ["month", "months"], ["месяц", "месяца", "месяцев"], "ай")}`;
  function simulate() {
    const f = $("#vault-form");
    const g = (n) => +$(`[name=${n}]`, f).value || 0;
    const rent = g("rent"), income = g("income"), spend = g("spend"), saved = g("saved");
    const shock = $("[name=shock]", f).value;
    const inc = Array(13).fill(income);
    if (shock === "job") { inc[2] = inc[3] = inc[4] = 0; inc[5] = income * 0.7; }
    if (shock === "ill") { inc[2] = income * 0.4; }
    if (shock === "delay") { inc[2] = inc[3] = 0; inc[4] = income * 3; }
    const plain = [saved], helped = [saved];
    let loanMonths = 0, loanSum = 0, firstGap = -1, worst = 0;
    for (let m = 1; m <= 12; m++) {
      const fee = inc[m] * 0.015; // 1,5% в фонд
      const flow = inc[m] - rent - spend - fee;
      plain.push(plain[m - 1] + flow);
      let h = helped[m - 1] + flow;
      if (h < 0 && loanMonths < 3) { h += rent; loanMonths++; loanSum += rent; }
      helped.push(h);
      if (plain[m] < 0 && firstGap < 0) firstGap = m;
      worst = Math.min(worst, plain[m]);
    }
    return { rent, plain, helped, loanMonths, loanSum, firstGap, worst, shock, income };
  }
  function renderVault() {
    const s = simulate();
    const svg = $("#vault-chart");
    const W = 520, H = 240, P = { l: 56, r: 12, t: 16, b: 34 };
    const all = [...s.plain, ...s.helped, 0];
    let lo = Math.min(...all), hi = Math.max(...all);
    if (hi - lo < 1) hi = lo + 1;
    const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    const x = (i) => P.l + (i / 12) * (W - P.l - P.r);
    const y = (v) => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
    const line = (arr) => arr.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
    const now = new Date().getMonth();
    let grid = "";
    for (let k = 0; k <= 4; k++) {
      const v = lo + ((hi - lo) * k) / 4;
      grid += `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" stroke="#DADFD7"/><text x="${P.l - 8}" y="${y(v) + 4}" text-anchor="end">${Math.round(v / 1000)}${L("k", "к")}</text>`;
    }
    let labels = "";
    for (let i = 0; i <= 12; i += 2) labels += `<text x="${x(i)}" y="${H - 10}" text-anchor="middle">${MONTHS[(now + i) % 12]}</text>`;
    const negArea = s.plain.some((v) => v < 0)
      ? `<path d="${line(s.plain)} L${x(12)} ${y(0)} L${x(0)} ${y(0)} Z" fill="var(--brick)" opacity=".08"/>` : "";
    svg.innerHTML = `${grid}${labels}
      <rect x="${P.l}" y="${y(0)}" width="${W - P.l - P.r}" height="${Math.max(0, H - P.b - y(0))}" fill="var(--brick-2)" opacity=".5"/>
      <line x1="${P.l}" x2="${W - P.r}" y1="${y(0)}" y2="${y(0)}" stroke="var(--ink)" stroke-width="1.5"/>
      ${negArea}
      <path d="${line(s.plain)}" fill="none" stroke="var(--brick)" stroke-width="2.5" stroke-dasharray="6 5"/>
      <path d="${line(s.helped)}" fill="none" stroke="var(--teal)" stroke-width="3"/>`;
    const gap = $("#vault-gap");
    if (s.firstGap > 0) {
      const rest = Math.min(0, ...s.helped);
      const month = MONTHS[(now + s.firstGap) % 12];
      gap.className = "gap-note bad";
      gap.textContent = L(`Cash gap in ${month}: you'd be short by up to ${tg(-s.worst)}. The fund can cover rent for ${monthsWord(s.loanMonths)}, ${tg(s.loanSum)} in total.`,
                          `Кассовый разрыв в ${month}: не хватит до ${tg(-s.worst)}. Фонд может покрыть аренду за ${monthsWord(s.loanMonths)} — ${tg(s.loanSum)}.`,
                          `Қаржы тапшылығы (${month}): ${tg(-s.worst)} дейін жетпейді. Қор ${monthsWord(s.loanMonths)} бойы жалдау ақысын жаба алады — барлығы ${tg(s.loanSum)}.`) +
        (rest < 0
          ? L(` The fund pays rent only: you'd need to cut the remaining ${tg(-rest)} of other spending.`, ` Фонд платит только аренду: оставшиеся ${tg(-rest)} на остальные расходы придётся сократить.`, ` Қор тек жалдау ақысын төлейді: басқа шығындардың қалған ${tg(-rest)} бөлігін қысқартуға тура келеді.`)
          : L(" With the fund you get through this period without debt.", " С помощью фонда вы проходите этот период без долгов.", " Қордың көмегімен бұл кезеңнен қарызсыз өтесіз."));
    } else {
      gap.className = "gap-note";
      gap.textContent = L(`No gap ahead: by the end of the year you'll have saved ${tg(s.plain[12])}. Each month 1.5% of your transactions top up the shared fund.`,
                          `Разрыва не видно: к концу года накопится ${tg(s.plain[12])}. Каждый месяц 1,5% ваших транзакций пополняют общий фонд.`,
                          `Тапшылық көрінбейді: жыл соңына қарай ${tg(s.plain[12])} жиналады. Ай сайын транзакцияларыңыздың 1,5%-ы ортақ қорды толықтырады.`);
    }
    $("#vault-loan").hidden = true;
    $("#vault-sos").disabled = false;
    $("#vault-sos").textContent = L("Request help from the fund", "Запросить помощь фонда", "Қордан көмек сұрау");
    return s;
  }
  $("#vault-form").addEventListener("input", renderVault);
  $("#vault-sos").addEventListener("click", () => {
    const s = simulate();
    const box = $("#vault-loan");
    box.hidden = false;
    if (!s.loanMonths) {
      box.innerHTML = `<b>${L("No help needed right now.", "Сейчас помощь не требуется.", "Қазір көмек қажет емес.")}</b><p class="small" style="margin:6px 0 0">${L("If your income stops, press the button again: requests are reviewed automatically, with no bank statements.", "Если доход пропадёт, нажмите кнопку снова — заявка рассматривается автоматически, без справок из банка.", "Табысыңыз тоқтап қалса, батырманы қайта басыңыз — өтінім банк анықтамасынсыз автоматты түрде қаралады.")}</p>`;
      return;
    }
    const monthly = s.loanSum / 12;
    box.innerHTML = `
      <b>${L(`Approved: an interest-free micro-loan of ${tg(s.loanSum)}`, `Заявка одобрена: беспроцентный микрозаём ${tg(s.loanSum)}`, `Өтінім мақұлданды: ${tg(s.loanSum)} пайызсыз микронесие`)}</b>
      <ol class="small">
        <li>${L(`The fund pays your landlord ${tg(s.rent)} a month directly, for ${monthsWord(s.loanMonths)} in a row.`, `Фонд платит арендодателю напрямую ${tg(s.rent)} в месяц, ${monthsWord(s.loanMonths)} подряд.`, `Қор пәтер иесіне тікелей айына ${tg(s.rent)} төлейді, қатарынан ${monthsWord(s.loanMonths)}.`)}</li>
        <li>${L("The landlord is notified that the lease cannot be terminated during this period.", "Арендодатель получает уведомление: договор в этот период не расторгается.", "Пәтер иесі хабарлама алады: бұл кезеңде шарт бұзылмайды.")}</li>
        <li>${L(`Repayment starts 2 months after your income recovers: ${tg(monthly)} a month for a year, 0%.`, `Возврат — через 2 месяца после восстановления дохода, по ${tg(monthly)} в месяц в течение года, 0%.`, `Қайтару — табыс қалпына келгеннен 2 ай өткен соң, бір жыл бойы айына ${tg(monthly)}, 0%.`)}</li>
      </ol>
      <p class="small demo-note">${L("Demo: no real loans are issued yet.", "Это демонстрация: реальные займы пока не выдаются.", "Бұл — демонстрация: нақты қарыз әзірге берілмейді.")}</p>`;
    $("#vault-sos").disabled = true;
    $("#vault-sos").textContent = L("Request sent", "Заявка отправлена", "Өтінім жіберілді");
    $("#fund-balance").textContent = mln(FUND - s.loanSum);
  });
  renderVault();

  /* ---------- Legal shield ---------- */
  const SAMPLE = L(
`RESIDENTIAL LEASE AGREEMENT
Astana

1. The Landlord lets to the Tenant a one-room flat at 40 Kenesary Street, flat 17.
2. The rent is 180,000 tenge per month, payable by the 5th of each month.
3. The Landlord may unilaterally increase the rent with 3 days' notice.
4. The Tenant pays a deposit of 150,000 tenge. The deposit is non-refundable if the Tenant moves out early for any reason.
5. A penalty of 5% of the monthly rent is charged for each day of late payment.
6. The Landlord may enter the flat at any time without notice to inspect it.
7. All repairs, including replacement of plumbing and wiring, are made at the Tenant's expense.
8. If any clause is breached, the Tenant must vacate the premises within 24 hours.
9. Rent is paid in cash without a receipt.
10. Registration of the Tenant at the flat's address is not allowed.
11. The Tenant must keep the flat clean and tidy.`,
`ДОГОВОР НАЙМА ЖИЛОГО ПОМЕЩЕНИЯ
г. Астана

1. Наймодатель передаёт Нанимателю однокомнатную квартиру по адресу: ул. Кенесары, д. 40, кв. 17.
2. Плата за наём составляет 180 000 тенге в месяц и вносится до 5 числа.
3. Наймодатель вправе в одностороннем порядке повысить плату, уведомив Нанимателя за 3 дня.
4. Наниматель вносит залог 150 000 тенге. Залог не возвращается при досрочном выезде по любой причине.
5. За каждый день просрочки оплаты начисляется штраф 5% от месячной платы.
6. Наймодатель вправе входить в квартиру в любое время без предупреждения для проверки состояния.
7. Все виды ремонта, включая замену сантехники и проводки, производятся за счёт Нанимателя.
8. В случае нарушения любого пункта Наниматель обязан освободить помещение в течение 24 часов.
9. Оплата производится наличными без расписки.
10. Регистрация Нанимателя по адресу квартиры не допускается.
11. Наниматель обязан поддерживать чистоту и порядок.`,
`ТҰРҒЫН ҮЙ-ЖАЙДЫ ЖАЛДАУ ШАРТЫ
Астана қаласы

1. Жалға беруші Жалдаушыға Кенесары көшесі, 40-үй, 17-пәтердегі бір бөлмелі пәтерді береді.
2. Жалдау ақысы айына 180 000 теңге құрайды және әр айдың 5-іне дейін төленеді.
3. Жалға беруші Жалдаушыны 3 күн бұрын ескертіп, ақыны біржақты тәртіппен көтеруге құқылы.
4. Жалдаушы 150 000 теңге кепілақы төлейді. Мерзімінен бұрын шыққан жағдайда кепілақы ешбір себеппен қайтарылмайды.
5. Төлем кешіктірілген әр күн үшін айлық ақының 5% мөлшерінде айыппұл есептеледі.
6. Жалға беруші пәтердің күйін тексеру үшін кез келген уақытта ескертусіз кіруге құқылы.
7. Сантехника мен электр сымдарын ауыстыруды қоса алғанда, жөндеудің барлық түрлері Жалдаушының есебінен жүргізіледі.
8. Кез келген тармақ бұзылған жағдайда Жалдаушы үй-жайды 24 сағат ішінде босатуға міндетті.
9. Төлем қолхатсыз қолма-қол ақшамен жүргізіледі.
10. Жалдаушыны пәтердің мекенжайына тіркеуге жол берілмейді.
11. Жалдаушы тазалық пен тәртіпті сақтауға міндетті.`);
  const RULES = window.AB_RULES;
  const ct = $("#contract-text");
  ct.value = SAMPLE;
  // Откуда текст: вставлен вручную, загружен файлом или распознан с фото. Для статистики проверок.
  let leaseSource = "paste", lastLogged = "";
  ct.addEventListener("input", () => { leaseSource = "paste"; });
  function logLeaseCheck(text, hits, money) {
    const words = text.split(/\s+/).filter(Boolean).length;
    // Пример с сайта, повторную проверку и обрывки текста не считаем
    if (text.trim() === SAMPLE.trim() || text === lastLogged || words < 30) return;
    lastLogged = text;
    sb("lease_checks", {
      lang: LANG, source: leaseSource, words: Math.min(words, 100000),
      risk_ids: [...new Set(hits.map((h) => h.rule.id))], money_at_risk: Math.min(Math.round(money), 1e9)
    }, "return=minimal").then(loadLeaseCount).catch(() => {});
  }
  function loadLeaseCount() {
    sb("rpc/lease_check_count", {})
      .then((r) => (r.ok ? r.json() : null))
      .then((n) => {
        if (typeof n !== "number" || n < CFG.showCountFrom) return;
        const el = $("#lease-count");
        el.innerHTML = L(`<b>${nf.format(n)}</b> real leases checked so far`, `Уже проверено договоров: <b>${nf.format(n)}</b>`, `Тексерілген шарттар саны: <b>${nf.format(n)}</b>`);
        el.hidden = false;
      })
      .catch(() => {});
  }
  loadLeaseCount();
  function checkContract() {
    const text = ct.value;
    const dep = +$("#deposit").value || 0;
    const rentMatch = text.match(/(\d[\d\s]{3,})\s*(тенге|₸|тг)\s*в месяц/i)
      || text.match(/айына\s*(\d[\d\s]{3,})\s*(теңге|₸)/i)
      || text.match(/(\d[\d,\s]{3,})\s*(tenge|₸|KZT)\s*(per|a|each) month/i);
    const rent = rentMatch ? +rentMatch[1].replace(/[\s,]/g, "") : 150000;
    const hits = window.AB_findRisks(text);
    // Опасные пункты договора (в одном пункте может быть несколько рисков) и найденные типы рисков
    const marks = [];
    hits.forEach((h) => {
      let m = marks.find((x) => x.s === h.s);
      if (!m) marks.push((m = { s: h.s, e: h.e, rules: [] }));
      m.rules.push(h.rule);
    });
    marks.sort((a, b) => a.s - b.s).forEach((m, i) => (m.n = i + 1));
    const found = RULES.filter((r) => marks.some((m) => m.rules.includes(r)))
      .map((r) => ({ r, refs: marks.filter((m) => m.rules.includes(r)).map((m) => m.n) }));
    let html = "", pos = 0;
    marks.forEach((m) => {
      html += esc(text.slice(pos, m.s)) + `<mark class="risk" title="${esc(m.rules.map((r) => r.title).join("; "))}">${esc(text.slice(m.s, m.e))}<sup>${m.n}</sup></mark>`;
      pos = m.e;
    });
    html += esc(text.slice(pos));
    const n = marks.length;
    const high = marks.filter((m) => m.rules.some((r) => r.sev === "high")).length;
    // Деньги на кону считаем по типу риска один раз, даже если он повторяется в нескольких пунктах
    const money = found.reduce((s, f) => s + f.r.money(dep, rent), 0);
    $("#legal-result").innerHTML = `
      <h3>${L("Review", "Разбор", "Талдау")}</h3>
      <div class="risk-sum">
        <div class="${n ? "" : "ok"}"><strong>${n}</strong><span>${L(`unfair ${plural(n, ["clause", "clauses"], [])}, ${high} serious`, `${plural(n, [], ["опасный пункт", "опасных пункта", "опасных пунктов"])}, из них ${high} серьёзных`, `қауіпті тармақ, оның ${high} маңызды`)}</span></div>
        <div class="${money ? "" : "ok"}"><strong>${tg(money)}</strong><span>${L("you could lose in a year, worst case", "можете потерять за год при худшем сценарии", "ең нашар жағдайда бір жылда жоғалтуыңыз мүмкін")}</span></div>
      </div>
      <div class="contract-view">${html}</div>
      ${n ? `<ol class="findings">${found.map((f) => `
        <li class="${f.r.sev === "mid" ? "mid" : ""}">
          <h4>${f.r.title} <span class="refs">${f.refs.map((x) => `<b>${x}</b>`).join("")}</span></h4><p>${f.r.tip}</p>
        </li>`).join("")}</ol>` :`<p>${L("No clearly unfair clauses found. Still check the term, the deposit and how the lease can be ended.", "Явно опасных пунктов не нашли. Всё равно проверьте сроки, залог и порядок расторжения.", "Анық қауіпті тармақ табылмады. Бәрібір мерзімдерді, кепілақыны және шартты бұзу тәртібін тексеріңіз.")}</p>`}
      <p class="small muted">${L("This is an automated hint, not legal advice. In a dispute, contact a lawyer or a free legal aid centre.", "Это автоматическая подсказка, а не юридическая консультация. В спорной ситуации обратитесь к юристу или в центр бесплатной юридической помощи.", "Бұл — автоматты кеңес, заңгерлік консультация емес. Даулы жағдайда заңгерге немесе тегін заң көмегі орталығына жүгініңіз.")}</p>`;
    logLeaseCheck(text, hits, money);
  }
  $("#contract-check").addEventListener("click", checkContract);

  // Загрузка: .txt — читаем как текст, фото — распознаём (Tesseract.js, язык страницы плюс русский)
  let tesseractLoading = null;
  const loadTesseract = () => tesseractLoading || (tesseractLoading = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
    s.onload = () => res(window.Tesseract); s.onerror = rej;
    document.head.appendChild(s);
  }));
  $("#contract-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const st = $("#ocr-status");
    if (file.type.startsWith("image/")) {
      try {
        st.textContent = L("Loading text recognition…", "Загружаем распознавание текста…", "Мәтінді тану жүктелуде…");
        const T = await loadTesseract();
        const { data } = await T.recognize(file, L("eng+rus", "rus+eng", "kaz+rus"), {
          logger: (m) => {
            if (m.status === "recognizing text") {
              const p = Math.round(m.progress * 100);
              st.textContent = L(`Reading the photo: ${p}%`, `Распознаём фото: ${p}%`, `Фото танылуда: ${p}%`);
            }
          }
        });
        ct.value = data.text.trim();
        leaseSource = "photo";
        st.textContent = L("Text recognised. Check it and press “Check the lease”.", "Текст распознан. Проверьте его и нажмите «Проверить договор».", "Мәтін танылды. Оны тексеріп, «Шартты тексеру» батырмасын басыңыз.");
      } catch {
        st.textContent = L("Couldn't read the photo. Take it in good light or paste the text by hand.", "Не удалось распознать фото. Сделайте снимок при хорошем свете или вставьте текст вручную.", "Фотоны тану мүмкін болмады. Жақсы жарықта түсіріңіз немесе мәтінді қолмен қойыңыз.");
      }
    } else {
      ct.value = await file.text();
      leaseSource = "file";
      st.textContent = L(`Loaded “${file.name}”.`, `Загружен файл «${file.name}».`, `«${file.name}» файлы жүктелді.`);
      checkContract();
    }
    e.target.value = "";
  });

  /* ---------- Digital arbitration: condition act ---------- */
  const act = [];
  const drop = $("#act-drop");
  ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, () => drop.classList.add("over")));
  ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, () => drop.classList.remove("over")));
  const fmtDT = (d) => d.toLocaleString(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  function exifDate(buf) {
    // Ищем дату съёмки EXIF вида "2026:10:14 18:22:05" в начале файла
    const head = new TextDecoder("latin1").decode(new Uint8Array(buf, 0, Math.min(buf.byteLength, 131072)));
    const m = head.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : null;
  }
  $("#act-files").addEventListener("change", async (e) => {
    for (const file of e.target.files) {
      const buf = await file.arrayBuffer();
      const hashBuf = await crypto.subtle.digest("SHA-256", buf);
      const hash = [...new Uint8Array(hashBuf)].map((b) => b.toString(16).padStart(2, "0")).join("");
      const exif = file.type === "image/jpeg" ? exifDate(buf) : null;
      act.push({
        name: file.name, size: file.size, type: file.type,
        shot: exif || new Date(file.lastModified), shotSrc: exif ? "EXIF" : L("file date", "дата файла", "файл күні"),
        fixed: new Date(), hash, stage: $("#act-stage").value,
        url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null
      });
    }
    e.target.value = "";
    renderAct();
  });
  function renderAct() {
    $("#act-table").hidden = !act.length;
    $("#act-download").hidden = !act.length;
    $("#act-table tbody").innerHTML = act.map((a) => `
      <tr>
        <td>${a.url ? `<img class="thumb" src="${a.url}" alt="">` : ""}${esc(a.name)}<br><span class="small muted">${esc(a.stage)}</span></td>
        <td>${fmtDT(a.shot)}<br><span class="small muted">${a.shotSrc}</span></td>
        <td>${fmtDT(a.fixed)}</td>
        <td class="hash">${a.hash}</td>
      </tr>`).join("");
  }
  $("#act-download").addEventListener("click", () => {
    const body = act.map((a, i) => {
      const kb = Math.round(a.size / 1024);
      return L(
`${i + 1}. ${a.name} (${kb} KB, ${a.type || "file"})
   Stage: ${a.stage}
   Taken: ${fmtDT(a.shot)} (${a.shotSrc})
   Recorded on the platform: ${fmtDT(a.fixed)}
   SHA-256: ${a.hash}`,
`${i + 1}. ${a.name} (${kb} КБ, ${a.type || "файл"})
   Этап: ${a.stage}
   Снято: ${fmtDT(a.shot)} (${a.shotSrc})
   Зафиксировано на платформе: ${fmtDT(a.fixed)}
   SHA-256: ${a.hash}`,
`${i + 1}. ${a.name} (${kb} КБ, ${a.type || "файл"})
   Кезең: ${a.stage}
   Түсірілген: ${fmtDT(a.shot)} (${a.shotSrc})
   Платформада тіркелген: ${fmtDT(a.fixed)}
   SHA-256: ${a.hash}`);
    }).join("\n\n");
    const now = fmtDT(new Date());
    download(L("condition-report.txt", "akt-sostoyaniya-zhilya.txt", "baspana-kuiinin-aktisi.txt"), L(
`PROPERTY CONDITION REPORT
Generated by AffordBase ${now}

${body}

To verify a file, compute its SHA-256 and compare it with the fingerprint above.
A match means the file has not changed since it was recorded.

Tenant ______________     Landlord ______________`,
`АКТ СОСТОЯНИЯ ЖИЛОГО ПОМЕЩЕНИЯ
Сформирован AffordBase ${now}

${body}

Чтобы проверить подлинность файла, посчитайте его SHA-256 и сравните с отпечатком выше.
Совпадение означает, что файл не изменялся после фиксации.

Наниматель ______________     Наймодатель ______________`,
`ТҰРҒЫН ҮЙ-ЖАЙ КҮЙІНІҢ АКТІСІ
AffordBase жасаған уақыты: ${now}

${body}

Файлдың түпнұсқалығын тексеру үшін оның SHA-256 мәнін есептеп, жоғарыдағы саусақ ізімен салыстырыңыз.
Сәйкес келсе, файл тіркелгеннен кейін өзгертілмеген.

Жалдаушы ______________     Жалға беруші ______________`));
  });

  /* ---------- Partners ---------- */
  const tabs = [$("#tab-inv"), $("#tab-city")];
  const panes = [$("#pane-inv"), $("#pane-city")];
  function selectTab(i) {
    tabs.forEach((t, k) => { t.setAttribute("aria-selected", k === i); t.tabIndex = k === i ? 0 : -1; panes[k].hidden = k !== i; });
    tabs[i].focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(i));
    t.addEventListener("keydown", (e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") selectTab(1 - i); });
  });
  const maxFam = Math.max(...D.regions.map((r) => r.families));
  $("#region-table tbody").innerHTML = D.regions.map((r) => `
    <tr>
      <td>${esc(r.name)}</td>
      <td><div class="minibar"><span class="bar"><span style="width:${(r.collect - 85) / 15 * 100}%"></span></span>${r.collect}%</div></td>
      <td class="num">${r.index}</td>
      <td><div class="minibar"><span class="bar"><span style="width:${(r.families / maxFam) * 100}%"></span></span>${r.families}</div></td>
    </tr>`).join("");
  $("#invest-pool").innerHTML = D.plots.map((p) => {
    const d = D.districts[p.district];
    return `<option value="${p.id}">${esc(L(`${p.title}, ${d}: ${pct(p.funded)} raised`, `«${p.title}», ${d} — собрано ${pct(p.funded)}`, `«${p.title}», ${d} — ${pct(p.funded)} жиналды`))}</option>`;
  }).join("");
  function renderInvest() {
    const f = $("#invest-form");
    const amount = +$("[name=amount]", f).value || 0;
    const years = +$("[name=years]", f).value;
    const rate = +$("[name=rate]", f).value / 100;
    const p = D.plots.find((x) => x.id === $("#invest-pool").value);
    $("[data-out=years]", f).textContent = years;
    $("[data-out=rate]", f).textContent = pct(rate, 1);
    const total = amount * Math.pow(1 + rate, years);
    const families = Math.floor(amount / (45 * p.price));
    $("#invest-out").innerHTML = `
      <div><strong>${mln(total - amount)}</strong><span>${L(`return over ${years} ${plural(years, ["year", "years"], [])}`, `доход за ${years} ${plural(years, [], ["год", "года", "лет"])}`, `${years} жылдағы табыс`)}</span></div>
      <div><strong>${mln(total)}</strong><span>${L("paid back by the end of the term", "вернётся к концу срока", "мерзім соңында қайтарылады")}</span></div>
      <div><strong>${families}</strong><span>${L(`${plural(families, ["family gets", "families get"], [])} a 45 m² flat`, `${plural(families, [], ["семья получит", "семьи получат", "семей получат"])} квартиру 45 м²`, "отбасы 45 м² пәтер алады")}</span></div>
      <div><strong>${pct(Math.min(1, p.funded + amount / (p.units * 45 * p.price)))}</strong><span>${esc(L(`of ${p.title} funded with your money`, `собрано на «${p.title}» с вашим вкладом`, `сіздің салымыңызбен «${p.title}» үшін жиналғаны`))}</span></div>`;
  }
  $("#invest-form").addEventListener("input", renderInvest);
  renderInvest();

  function renderLands() {
    $("#land-table tbody").innerHTML = D.lands.map((l) => `
      <tr><td>${esc(l.where)}</td><td>${esc(l.kind)}</td><td class="num">${dec(l.area, 1)} ${L("ha", "га")}</td><td>${esc(l.use)}</td>
      <td>${l.zerotax ? '<span class="tag">0%</span>' : `<span class="tag mid">${L("standard", "обычный", "қалыпты")}</span>`}</td></tr>`).join("");
  }
  $("#land-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    D.lands.unshift({ where: f.get("where").trim(), kind: f.get("kind"), area: +f.get("area"), use: f.get("use"), zerotax: !!f.get("zerotax") });
    renderLands();
    $("#land-msg").textContent = L("Site listed. Co-ops will see it on the plot map.", "Объект размещён. Кооперативы увидят его на карте участков.", "Нысан орналастырылды. Кооперативтер оны учаскелер картасынан көреді.");
    e.target.reset();
  });
  renderLands();

  /* ---------- Green utility ---------- */
  const NORM = { el: 70, water: 4.5, gas: 22 }; // на человека в месяц, ориентир
  function renderGreen() {
    const f = $("#green-form");
    const g = (n) => +$(`[name=${n}]`, f).value || 0;
    const people = Math.max(1, g("people"));
    const use = [
      { k: "el", name: L("Electricity", "Электричество", "Электр қуаты"), unit: L("kWh", "кВт·ч", "кВт·сағ"), v: g("el"), t: g("tel") },
      { k: "water", name: L("Water", "Вода", "Су"), unit: L("m³", "м³"), v: g("water"), t: g("twater") },
      { k: "gas", name: L("Gas", "Газ", "Газ"), unit: L("m³", "м³"), v: g("gas"), t: g("tgas") }
    ];
    let bill = 0, over = 0;
    use.forEach((u) => { u.norm = NORM[u.k] * people; u.cost = u.v * u.t; bill += u.cost; u.over = Math.max(0, u.v - u.norm); over += u.over * u.t; });
    const save = over + bill * 0.08;
    $("#green-bill").innerHTML = `
      <div><strong>${tg(bill)}</strong><span>${L("monthly bill", "счёт за месяц", "айлық шот")}</span></div>
      <div><strong>${tg(save)}</strong><span>${L("could be saved a month", "можно сэкономить в месяц", "айына үнемдеуге болады")}</span></div>
      <div><strong>${tg(save * 12)}</strong><span>${L("a year", "за год", "жылына")}</span></div>`;
    $("#green-usage").innerHTML = use.map((u) => {
      const scale = Math.max(u.v, u.norm) * 1.2 || 1;
      const num = (x) => (EN ? String(x) : String(x).replace(".", ","));
      return `<div class="usage-row">
        <div class="lbl"><span>${u.name}</span><span>${L(`${num(u.v)} of a ${num(u.norm)} ${u.unit} norm`, `${num(u.v)} из ${num(u.norm)} ${u.unit} нормы`, `${num(u.v)} (норма ${num(u.norm)} ${u.unit})`)}</span></div>
        <div class="usage-track"><span class="${u.v > u.norm ? "over" : ""}" style="width:${(u.v / scale) * 100}%"></span><i style="left:${(u.norm / scale) * 100}%" title="${L("norm", "норма", "норма")}"></i></div>
      </div>`;
    }).join("");
    const tips = [];
    const [el, w, gs] = use;
    const elOver = Math.round((el.v / el.norm - 1) * 100);
    if (el.v > el.norm) tips.push(L(`Electricity is ${elOver}% above the norm. Check an old fridge or water heater: they often eat a third of the bill. Running the laundry on the night tariff saves another 10–15%.`,
                                    `Электричество на ${elOver}% выше нормы. Проверьте старый холодильник и бойлер: они часто съедают треть счёта. Ночной тариф для стирки сэкономит ещё 10–15%.`,
                                    `Электр қуаты нормадан ${elOver}% жоғары. Ескі тоңазытқыш пен бойлерді тексеріңіз: олар көбіне шоттың үштен бірін алады. Кір жууға түнгі тарифті пайдалансаңыз, тағы 10–15% үнемдейсіз.`));
    if (w.v > w.norm) tips.push(L(`Water is ${dec(w.v - w.norm, 1)} m³ above the norm. Tap aerators cost about 1,500 ₸ and cut use by roughly a third.`,
                                  `Вода выше нормы на ${dec(w.v - w.norm, 1)} м³. Аэраторы на краны стоят около 1 500 ₸ и снижают расход примерно на треть.`,
                                  `Су нормадан ${dec(w.v - w.norm, 1)} м³ артық. Шүмекке арналған аэраторлар шамамен 1 500 ₸ тұрады және шығынды үштен бірге жуық азайтады.`));
    if (gs.v > gs.norm) tips.push(L("Gas use is above the norm. Sealing windows and tuning the boiler can save up to 20% in winter.", "Газа уходит больше нормы. Утепление окон и регулировка котла дают до 20% экономии зимой.", "Газ нормадан көп жұмсалады. Терезелерді жылыту және қазандықты реттеу қыста 20%-ға дейін үнемдейді."));
    tips.push(L("Switch lighting to LED: 80% less spent on light.", "Переведите освещение на LED — минус 80% на свет.", "Жарықтандыруды LED-ке ауыстырыңыз — жарыққа кететін шығын 80%-ға азаяды."));
    if (el.v <= el.norm && w.v <= w.norm && gs.v <= gs.norm) tips.unshift(L("You're within the norm for every utility. Great result.", "Вы укладываетесь в норму по всем ресурсам. Отличный результат.", "Барлық ресурс бойынша нормадан аспайсыз. Тамаша нәтиже."));
    $("#green-tips").innerHTML = tips.map((t) => `<li>${t}</li>`).join("");
  }
  $("#green-form").addEventListener("input", renderGreen);
  renderGreen();

  $("#grant-opts").innerHTML = D.grants.map((g, i) => `
    <label class="grant-opt"><input type="checkbox" value="${g.id}" ${i < 2 ? "checked" : ""}>
      <div><b>${esc(g.title)}</b><span>${esc(g.note)} · ${mln(g.cost)}, ${L(`grant up to ${pct(g.cover)}`, `грант до ${pct(g.cover)}`, `${pct(g.cover)}-ға дейін грант`)}</span></div>
    </label>`).join("");
  function grantCalc() {
    const sel = $$("#grant-opts input:checked").map((c) => D.grants.find((g) => g.id === c.value));
    const cost = sel.reduce((s, g) => s + g.cost, 0);
    const grant = sel.reduce((s, g) => s + g.cost * g.cover, 0);
    const save = Math.min(0.4, sel.reduce((s, g) => s + g.save, 0));
    return { sel, cost, grant, save };
  }
  function renderGrant() {
    const c = grantCalc();
    $("#grant-out").innerHTML = `
      <div><strong>${mln(c.cost)}</strong><span>${L("cost of works", "стоимость работ", "жұмыстар құны")}</span></div>
      <div><strong>${mln(c.grant)}</strong><span>${L("covered by the grant", "покроет грант", "грант жабады")}</span></div>
      <div><strong>${mln(c.cost - c.grant)}</strong><span>${L("co-op's share", "доля кооператива", "кооператив үлесі")}</span></div>
      <div><strong>−${pct(c.save)}</strong><span>${L("running costs", "расходы на эксплуатацию", "пайдалану шығындары")}</span></div>`;
    $("#grant-make").disabled = !c.sel.length;
  }
  $("#grant-opts").addEventListener("change", renderGrant);
  $("#grant-make").addEventListener("click", () => {
    const c = grantCalc();
    const items = c.sel.map((g, i) => L(
      `${i + 1}. ${g.title} (${g.note}): ${tg(g.cost)}, requested co-funding ${pct(g.cover)} = ${tg(g.cost * g.cover)}`,
      `${i + 1}. ${g.title} (${g.note}) — ${tg(g.cost)}, запрашиваемое софинансирование ${pct(g.cover)} = ${tg(g.cost * g.cover)}`,
      `${i + 1}. ${g.title} (${g.note}) — ${tg(g.cost)}, сұралатын қоса қаржыландыру ${pct(g.cover)} = ${tg(g.cost * g.cover)}`)).join("\n");
    $("#grant-doc").textContent = L(
`ENERGY-EFFICIENCY GRANT APPLICATION
Date: ${today()}

Applicant: Bereke housing co-op, pool no. 12, AffordBase
Property: modular residential building, 60 flats, Nura district, Astana

Requested measures:
${items}

Total cost of works: ${tg(c.cost)}
Grant requested: ${tg(c.grant)}
Co-op's own funds: ${tg(c.cost - c.grant)}

Expected effect: building running costs reduced by ${pct(c.save)}.
Evidence: residents' consumption readings collected through AffordBase over 12 months are attached.

Co-op chair ______________`,
`ЗАЯВКА НА ГРАНТ ПО ПРОГРАММЕ ЭНЕРГОСБЕРЕЖЕНИЯ
Дата: ${today()}

Заявитель: жилищный кооператив «Береке», пул № 12, AffordBase
Объект: модульный жилой дом, 60 квартир, г. Астана, р-н Нура

Запрашиваемые мероприятия:
${items}

Общая стоимость работ: ${tg(c.cost)}
Запрашиваемая сумма гранта: ${tg(c.grant)}
Собственные средства кооператива: ${tg(c.cost - c.grant)}

Ожидаемый эффект: снижение расходов на эксплуатацию дома на ${pct(c.save)}.
Обоснование: показания потребления жильцов собраны через AffordBase за 12 месяцев и прилагаются.

Председатель кооператива ______________`,
`ЭНЕРГИЯ ҮНЕМДЕУ БАҒДАРЛАМАСЫ БОЙЫНША ГРАНТҚА ӨТІНІМ
Күні: ${today()}

Өтініш беруші: «Береке» тұрғын үй кооперативі, № 12 пул, AffordBase
Нысан: модульдік тұрғын үй, 60 пәтер, Астана қ., Нұра ауданы

Сұралатын іс-шаралар:
${items}

Жұмыстардың жалпы құны: ${tg(c.cost)}
Сұралатын грант сомасы: ${tg(c.grant)}
Кооперативтің өз қаражаты: ${tg(c.cost - c.grant)}

Күтілетін әсер: үйді пайдалану шығындарын ${pct(c.save)}-ға азайту.
Негіздеме: тұрғындардың тұтыну көрсеткіштері AffordBase арқылы 12 ай бойы жиналды және қоса беріледі.

Кооператив төрағасы ______________`);
    $("#grant-doc-wrap").hidden = false;
    $("#grant-make").textContent = L("Application drafted", "Заявка сформирована", "Өтінім жасалды");
    setTimeout(() => ($("#grant-make").textContent = L("Draft the application", "Сформировать заявку", "Өтінімді жасау")), 2500);
  });
  $("#grant-download").addEventListener("click", () => download(L("green-grant-application.txt", "zayavka-na-zelenyy-grant.txt", "zhasyl-grantka-otinim.txt"), $("#grant-doc").textContent));
  renderGrant();

  /* ---------- Team ---------- */
  if (D.team.length) {
    $("#team").hidden = false;
    $("#team-list").innerHTML = D.team.map((m) => `
      <li>
        ${m.photo ? `<img src="${esc(m.photo)}" alt="" loading="lazy">` : `<span class="avatar" style="background:var(--teal)">${esc(m.name[0])}</span>`}
        <b>${esc(m.name)}</b><span>${esc(m.role)}</span>
        ${m.bio ? `<p>${esc(m.bio)}</p>` : ""}
      </li>`).join("");
  }

  /* ---------- Anonymous pilot survey ---------- */
  // Имён и контактов не собираем: персональные данные граждан РК должны храниться в РК, а база — во Франкфурте.
  const countEl = $("#wl-count");
  function loadCount() {
    sb("rpc/survey_count", {})
      .then((r) => (r.ok ? r.json() : null))
      .then((n) => {
        if (typeof n !== "number" || n < CFG.showCountFrom) return;
        const num = `<b>${nf.format(n)}</b>`;
        countEl.innerHTML = L(`${num} ${plural(n, ["person has", "people have"], [])} answered our survey`,
                              `Ответов на опрос: ${num}`,
                              `Сауалнамаға жауап бергендер: ${num}`);
        countEl.hidden = false;
      })
      .catch(() => {});
  }
  loadCount();

  const pilotForm = $("#pilot-form");
  const pilotMsg = $("#pilot-msg");
  pilotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(pilotForm);
    const btn = $("button[type=submit]", pilotForm);
    pilotMsg.className = "form-msg";
    const done = () => {
      pilotForm.reset();
      pilotMsg.classList.add("ok");
      pilotMsg.textContent = L("Thank you! Your answer helps us decide what to build first.", "Спасибо! Ваш ответ поможет решить, что строить в первую очередь.", "Рақмет! Жауабыңыз алдымен нені жасау керектігін шешуге көмектеседі.");
    };
    if (f.get("website")) return done(); // бот заполнил скрытое поле
    const num = (k) => (f.get(k) === "" ? null : Math.round(+f.get(k)));
    const row = {
      city: f.get("city"), role: f.get("role"), monthly_rent: num("monthly_rent"), income_share: num("income_share"),
      pain: f.get("pain").trim() || null, lang: LANG
    };
    btn.disabled = true;
    try {
      const r = await sb("pilot_survey", row, "return=minimal");
      if (!r.ok) throw new Error(r.status);
      done();
      loadCount();
    } catch {
      pilotMsg.classList.add("bad");
      pilotMsg.textContent = L("Something went wrong. Check your connection and try again.", "Не получилось отправить. Проверьте интернет и попробуйте ещё раз.", "Жіберу мүмкін болмады. Интернетті тексеріп, қайталап көріңіз.");
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- Feedback widget under each module ---------- */
  const fbTargets = [...$$(".module[data-fb]"), ...$$(".fb-slot[data-fb]")];
  fbTargets.forEach((host) => {
    const box = document.createElement("form");
    box.className = "fb";
    box.innerHTML = `
      <fieldset class="fb-stars">
        <legend>${host.dataset.fb === "general"
          ? L("How useful would AffordBase be for you?", "Насколько AffordBase был бы вам полезен?", "AffordBase сізге қаншалықты пайдалы болар еді?")
          : L("Would this help you?", "Это бы вам помогло?", "Бұл сізге көмектесер ме еді?")}</legend>
        ${[1, 2, 3, 4, 5].map((n) => `<label><input type="radio" name="rating" value="${n}"><span aria-hidden="true">★</span><span class="sr-only">${n}</span></label>`).join("")}
      </fieldset>
      <div class="fb-more" hidden>
        <input name="comment" maxlength="1000" aria-label="${L("Comment", "Комментарий", "Пікір")}" placeholder="${L("What would make it better? No personal details, please", "Что улучшить? Без личных данных, пожалуйста", "Нені жақсартуға болады? Жеке деректерсіз")}">
        <button class="btn btn-ghost" type="submit">${L("Send", "Отправить", "Жіберу")}</button>
      </div>
      <p class="fb-msg small" aria-live="polite"></p>`;
    host.appendChild(box);
    box.addEventListener("change", (e) => { if (e.target.name === "rating") $(".fb-more", box).hidden = false; });
    box.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = new FormData(box);
      const rating = +f.get("rating");
      if (!rating) return;
      $("button", box).disabled = true;
      try {
        const r = await sb("feedback", { module: host.dataset.fb, rating, comment: f.get("comment").trim() || null, lang: LANG }, "return=minimal");
        if (!r.ok) throw new Error(r.status);
        box.innerHTML = `<p class="fb-msg small">${L("Thank you! This helps us decide what to build next.", "Спасибо! Это помогает нам решить, что строить дальше.", "Рақмет! Бұл келесі кезекте не жасау керектігін шешуге көмектеседі.")}</p>`;
      } catch {
        $(".fb-msg", box).textContent = L("Couldn't send. Try again.", "Не удалось отправить. Попробуйте ещё раз.", "Жіберу мүмкін болмады. Қайталап көріңіз.");
        $("button", box).disabled = false;
      }
    });
  });
})();
