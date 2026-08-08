import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "Flocker@gmail.com").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "FlockerPasword";
const ADMIN_NAME = process.env.ADMIN_NAME || "Flocker";

function svgGradient(seed: string, label: string, from: string, to: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <filter id="b" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="40"/>
    </filter>
  </defs>
  <rect width="640" height="400" fill="#0a0a12"/>
  <circle cx="${120 + (seed.length * 37) % 220}" cy="${100 + (seed.length * 53) % 180}" r="140" fill="${from}" opacity="0.5" filter="url(#b)"/>
  <circle cx="${480 - (seed.length * 29) % 220}" cy="${280 - (seed.length * 41) % 160}" r="160" fill="${to}" opacity="0.5" filter="url(#b)"/>
  <text x="320" y="205" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="white" text-anchor="middle">${label}</text>
  <text x="320" y="245" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.65)" text-anchor="middle">FlockerPlay</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const IMG: Record<string, (...args: string[]) => string> = {
  keys: () => svgGradient("keys", "Игровые ключи", "#38bdf8", "#6366f1"),
  currency: () => svgGradient("coins", "Валюта игр", "#fbbf24", "#f97316"),
  boost: () => svgGradient("boost", "Буст и прокачка", "#a855f7", "#ec4899"),
  donates: () => svgGradient("donate", "Донаты", "#22d3ee", "#3b82f6"),
  "gift-cards": () => svgGradient("cards", "Подарочные карты", "#34d399", "#0ea5e9"),
  services: () => svgGradient("service", "Игровые услуги", "#f472b6", "#8b5cf6"),
  banner: (t: string) => svgGradient("bn-" + t, t, "#6366f1", "#a855f7"),
};

async function main() {
  console.log("→ Seed FlockerPlay...");

  await prisma.banner.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.topUpRequest.deleteMany();
  await prisma.balanceTransaction.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "ROLE_ADMIN",
      isVerified: true,
      isSeller: true,
      balance: 0,
      about: "Супер-администратор FlockerPlay",
    },
  });

  const demoBuyer = await prisma.user.create({
    data: {
      name: "Игрок Демо",
      email: "player@example.com",
      passwordHash: await bcrypt.hash("player123", 10),
      role: "ROLE_USER",
      isVerified: true,
      balance: 2500,
    },
  });

  const sellers = [
    { name: "GigaKeys", about: "Официальный продавец ключей и аккаунтов", verified: true, balance: 120000 },
    { name: "BoostMaster", about: "Профессиональные бусты и прокачка", verified: true, balance: 86000 },
    { name: "CoinExpress", about: "Внутриигровая валюта за 5 минут", verified: false, balance: 43000 },
    { name: "DonatePro", about: "Донаты, подарочные карты, услуги", verified: true, balance: 150000 },
  ];

  const createdSellers = [];
  for (const s of sellers) {
    createdSellers.push(
      await prisma.user.create({
        data: {
          name: s.name,
          email: `${s.name.toLowerCase()}@flocker.example`,
          passwordHash: await bcrypt.hash("seller123", 10),
          role: "ROLE_USER",
          isSeller: true,
          isVerified: s.verified,
          balance: s.balance,
          about: s.about,
        },
      })
    );
  }

  const cats = [
    { name: "Ключи и доступы", slug: "keys", icon: "key", accent: "#38bdf8", sortOrder: 1 },
    { name: "Игровая валюта", slug: "currency", icon: "coins", accent: "#fbbf24", sortOrder: 2 },
    { name: "Буст и прокачка", slug: "boost", icon: "zap", accent: "#a855f7", sortOrder: 3 },
    { name: "Донаты", slug: "donates", icon: "gift", accent: "#22d3ee", sortOrder: 4 },
    { name: "Подарочные карты", slug: "gift-cards", icon: "credit-card", accent: "#34d399", sortOrder: 5 },
    { name: "Услуги и сервисы", slug: "services", icon: "wrench", accent: "#f472b6", sortOrder: 6 },
    { name: "Telegram", slug: "telegram", icon: "✈️", accent: "#229ED9", sortOrder: 10, featured: true },
    { name: "Steam", slug: "steam", icon: "🎮", accent: "#1b2838", sortOrder: 11, featured: true },
    { name: "Standoff 2", slug: "standoff", icon: "🔫", accent: "#eab308", sortOrder: 12, featured: true },
    { name: "Minecraft", slug: "minecraft", icon: "⛏️", accent: "#16a34a", sortOrder: 13, featured: true },
    { name: "CS", slug: "cs", icon: "🎯", accent: "#f97316", sortOrder: 14, featured: true },
    { name: "Roblox", slug: "roblox", icon: "🧱", accent: "#ef4444", sortOrder: 15, featured: true },
    { name: "PUBG", slug: "pubg", icon: "🪂", accent: "#f59e0b", sortOrder: 16, featured: true },
    { name: "Brawl Stars", slug: "brawl-stars", icon: "⭐", accent: "#fbbf24", sortOrder: 17, featured: true },
  ];
  const categoryIds: Record<string, string> = {};
  for (const c of cats) {
    const created = await prisma.category.create({ data: c });
    categoryIds[c.slug] = created.id;
  }

  const telegramSubs: [string, string, string][] = [
    ["stars", "⭐", "Звёзды"], ["premium", "👑", "Премиум"], ["gifts", "🎁", "Подарки (NFT)"],
    ["channels", "📢", "Каналы"], ["services", "🛠️", "Услуги"], ["usernames", "🔤", "Юзернеймы"],
    ["ads", "📣", "Реклама"], ["boosts", "🚀", "Бусты"], ["rent", "🏠", "Аренда"], ["mods", "🧩", "Моды"],
    ["bots", "🤖", "Боты"], ["groups", "👥", "Группы"], ["design", "🎨", "Дизайн"], ["stickers", "🖼️", "Стикеры"],
    ["clickers", "👆", "Кликеры"],
  ];
  const subcategoryIds: Record<string, string> = {};
  let subSort = 1;
  for (const [slug, icon, name] of telegramSubs) {
    const created = await prisma.subcategory.create({
      data: {
        category: { connect: { id: categoryIds["telegram"] } },
        name,
        slug,
        icon,
        sortOrder: subSort++,
      },
    });
    subcategoryIds["telegram_" + slug] = created.id;
  }

  // Официальный товар «ТГ Звёзды» (1 звезда = starsRate/100 ₽), продавец — админ
  const starsProduct = await prisma.product.create({
    data: {
      sellerId: admin.id,
      categoryId: categoryIds["telegram"],
      subcategoryId: subcategoryIds["telegram_stars"],
      title: "ТГ Звёзды",
      description:
        "Официальное пополнение Telegram Stars от FlockerPlay. После оплаты звёзды будут отправлены на указанный @username в течение нескольких минут. Минимальный заказ — 100 звёзд.",
      price: 150,
      stock: 0,
      deliveryType: "MANUAL",
      deliveryInfo: "Введите @username получателя в поле примечания при оформлении заказа. Звёзды отправляются на этот аккаунт.",
      status: "APPROVED",
      isFeatured: false,
      rating: 5,
      ratingCount: 1,
    },
  });

  const products = [
    {
      seller: 0, cat: "keys", title: "Steam Gift Card 500 RUB", price: 520, oldPrice: 550,
      stock: 0, deliveryType: "AUTO", deliveryInfo: "STEAM-5X9F-K2PL-A7QR-RT4M",
      description: "Мгновенная выдача кода Steam на 500 ₽. Подходит для пополнения баланса Steam, покупки игр, DLC и скинов в CS2 и Dota 2.",
      featured: true,
    },
    {
      seller: 0, cat: "keys", title: "PUBG: BATTLEGROUNDS — G-COIN 1250", price: 390, oldPrice: 450,
      stock: 40, deliveryType: "AUTO", deliveryInfo: "PUBG-GCOIN-4D2A-KK19",
      description: "1250 G-COIN для PUBG: BATTLEGROUNDS. Выдача в течение 1–3 минут после оплаты.",
    },
    {
      seller: 0, cat: "keys", title: "Xbox Game Pass Ultimate 1 месяц", price: 699, oldPrice: 799,
      stock: 25, deliveryType: "AUTO", deliveryInfo: "XGP-M7T2-QQ11-CODE",
      description: "Подписка Xbox Game Pass Ultimate на 30 дней. Активация на новом аккаунте или существующем.",
      featured: true,
    },
    {
      seller: 2, cat: "currency", title: "100.000 VP в Standoff 2", price: 149, oldPrice: 199,
      stock: 0, deliveryType: "AUTO", deliveryInfo: "SO2-VP-100K-CODE-X9",
      description: "100 000 виртуальных поинтов Standoff 2. Доставка через игровой обмен в течение 10 минут.",
    },
    {
      seller: 2, cat: "currency", title: "1.000.000 монет Brawl Stars", price: 899, oldPrice: 1099,
      stock: 15, deliveryType: "MANUAL", deliveryInfo: "После оплаты укажите игровой ID — валюту зачислим через магазин.",
      description: "Милион монет для Brawl Stars. Прокачайте любой бравлер до максимума за один день.",
    },
    {
      seller: 1, cat: "boost", title: "Буст рейтинга CS2 до Глобал Элиты", price: 2999, oldPrice: 3999,
      stock: 5, deliveryType: "MANUAL", deliveryInfo: "После оплаты свяжемся с вами в поддержке и согласуем расписание игры.",
      description: "Командный буст до Глобал Элиты. Только официальные аккаунты, без VAC-рисков.",
      featured: true,
    },
    {
      seller: 1, cat: "boost", title: "Прокачка аккаунта до 150 уровня", price: 1200, oldPrice: 1500,
      stock: 0, deliveryType: "MANUAL", deliveryInfo: "Укажите Steam логин и пароль в поддержке — начнём прокачку сразу.",
      description: "Прокачка Steam-аккаунта до 150 уровня с бейджем. Вручную, опытными игроками.",
    },
    {
      seller: 3, cat: "donates", title: "Донат в Genshin Impact на 5.480 кристаллов", price: 990, oldPrice: 1090,
      stock: 0, deliveryType: "MANUAL", deliveryInfo: "Введите UID вашего персонажа после оплаты — кристаллы придут в течение 15 минут.",
      description: "Пополнение Genesis Crystals для Genshin Impact. Безопасно, от проверенного продавца.",
    },
    {
      seller: 3, cat: "donates", title: "V-Bucks 1350 (Fortnite)", price: 1190, oldPrice: 1390,
      stock: 30, deliveryType: "AUTO", deliveryInfo: "FORTNITE-VB-1350-CODE",
      description: "1350 V-Bucks для Fortnite. Код отправляется автоматически сразу после оплаты.",
      featured: true,
    },
    {
      seller: 3, cat: "gift-cards", title: "Подарочная карта Steam 10$", price: 1090, oldPrice: 1250,
      stock: 50, deliveryType: "AUTO", deliveryInfo: "STEAM-10USD-K7QP-9X3L",
      description: "Подарочная карта Steam номиналом 10$. Код придёт мгновенно.",
    },
    {
      seller: 3, cat: "gift-cards", title: "Подарочная карта Google Play 1000 ₽", price: 1099, oldPrice: 1150,
      stock: 20, deliveryType: "AUTO", deliveryInfo: "GP-1000RUB-2M4N-Q7W8",
      description: "Карта Google Play на 1000 ₽ для покупок в приложениях и играх.",
    },
    {
      seller: 0, cat: "services", title: "Открытие кейсов CS2 под ключ", price: 350, oldPrice: 400,
      stock: 0, deliveryType: "MANUAL", deliveryInfo: "После оплаты мы откроем до 10 кейсов с вашего аккаунта и пришлём отчёт.",
      description: "Откроем кейсы CS2 за вас. Отчёт со скриншотами и статистикой.",
    },
    {
      seller: 1, cat: "boost", title: "Калибровка Dota 2 (10 игр)", price: 2499, oldPrice: 2999,
      stock: 8, deliveryType: "MANUAL", deliveryInfo: "Укажите Steam логин после оплаты. Игры проведут опытные мидеры и саппорты.",
      description: "Профессиональная калибровка рейтинга Dota 2. Гарантия результата.",
    },
    {
      seller: 2, cat: "currency", title: "50.000 Diamonds в Mobile Legends", price: 199, oldPrice: 249,
      stock: 0, deliveryType: "AUTO", deliveryInfo: "ML-DIAMONDS-50K-CODE-77",
      description: "50 000 алмазов Mobile Legends: Bang Bang. Мгновенная доставка.",
    },
  ];

  for (const p of products) {
    const seller = createdSellers[p.seller];
    await prisma.product.create({
      data: {
        sellerId: seller.id,
        categoryId: categoryIds[p.cat],
        title: p.title,
        description: p.description,
        price: p.price,
        oldPrice: p.oldPrice,
        stock: p.stock,
        images: [IMG[p.cat](),],
        deliveryType: p.deliveryType as "AUTO" | "MANUAL",
        deliveryInfo: p.deliveryInfo,
        status: "APPROVED",
        isFeatured: p.featured,
        soldCount: 10 + (p.price % 40),
        rating: 4.4 + ((p.price % 6) / 10),
        ratingCount: 20 + (p.price % 90),
      },
    });
  }

  for (let i = 1; i <= 3; i++) {
    const seller = createdSellers[(i + 1) % createdSellers.length];
    await prisma.banner.create({
      data: {
        ownerId: seller.id,
        title: `Сезонная распродажа ${i}`,
        imageUrl: IMG.banner(`Распродажа ${i}`),
        linkUrl: "/catalog",
        placement: "HOME",
        status: "ACTIVE",
        sortOrder: i,
        durationMs: 3000 + i * 1000,
      },
    });
  }

  await prisma.banner.create({
    data: {
      ownerId: createdSellers[0].id,
      title: "🔥 Скидки до 30% на популярные товары — только до конца недели!",
      imageUrl: null,
      linkUrl: "/catalog",
      placement: "TOP",
      status: "ACTIVE",
      sortOrder: 0,
      durationMs: 5000,
    },
  });

  await prisma.siteSetting.upsert({
    where: { id: "main" },
    update: {
      starsRate: 150,
      starsMin: 100,
      starsMax: 100000,
    },
    create: {
      id: "main",
      siteName: "FlockerPlay",
      tagline: "Игровой маркетплейс цифровых товаров и услуг",
      supportEmail: ADMIN_EMAIL,
      commission: 20,
      minTopUp: 50,
      minWithdrawal: 100,
      starsRate: 150,
      starsMin: 100,
      starsMax: 100000,
    },
  });

  const ticket = await prisma.ticket.create({
    data: {
      userId: demoBuyer.id,
      subject: "Как получить заказанный код?",
      status: "OPEN",
      messages: {
        create: [
          {
            senderId: demoBuyer.id,
            body: "Здравствуйте! Купил ключ Steam, но не понял, где его посмотреть.",
            isRead: true,
          },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      ticketId: ticket.id,
      senderId: admin.id,
      body: "Привет! Код появился в разделе «Мои заказы» → «Детали заказа» сразу после оплаты. Если код не пришёл — напишите, проверим вручную.",
      isRead: false,
    },
  });

  await prisma.topUpRequest.create({
    data: {
      userId: demoBuyer.id,
      amount: 1000,
      method: "СБП",
      comment: "Перевёл с телефона",
      status: "PENDING",
    },
  });

  await prisma.complaint.create({
    data: {
      reporterId: demoBuyer.id,
      targetId: createdSellers[2].id,
      orderId: null,
      reason: "Задержка доставки",
      text: "Не пришёл товар уже 3 часа.",
      status: "PENDING",
    },
  });

  await prisma.notification.createMany({
    data: [
      { userId: demoBuyer.id, title: "Добро пожаловать!", body: "Рады видеть вас на FlockerPlay 🎮", type: "info" },
      { userId: admin.id, title: "Новая заявка на пополнение", body: "Пользователь Игрок Демо запросил пополнение на 1000 ₽", type: "topup" },
      { userId: admin.id, title: "Новый тикет поддержки", body: "Игрок Демо: «Как получить заказанный код?»", type: "ticket" },
    ],
  });

  console.log("→ Seed completed.");
  console.log("  Admin:  ", ADMIN_EMAIL, " / ", ADMIN_PASSWORD);
  console.log("  Demo:   player@example.com / player123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
