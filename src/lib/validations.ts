import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Имя должно быть не короче 2 символов").max(50, "Максимум 50 символов"),
  email: z.string().trim().email("Некорректный email"),
  password: z.string().min(6, "Пароль должен быть не короче 6 символов").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(50),
  about: z.string().max(500).optional().nullable(),
});

export const productBaseSchema = z.object({
  title: z.string().trim().min(3, "Минимум 3 символа").max(120, "Максимум 120 символов"),
  description: z.string().trim().min(10, "Опишите товар подробнее (мин. 10 символов)").max(3000),
  categoryId: z.string().min(1, "Выберите категорию"),
  price: z.coerce.number().int("Цена должна быть целым числом").min(1, "Цена не может быть 0"),
  oldPrice: z.coerce.number().int().min(0).optional().nullable(),
  stock: z.coerce.number().int("Остаток должен быть целым").min(0, "Остаток не может быть отрицательным").default(0),
  deliveryType: z.enum(["AUTO", "MANUAL"], { message: "Выберите тип выдачи" }),
  deliveryInfo: z.string().trim().max(2000),
});

export const productSchema = productBaseSchema.superRefine((val, ctx) => {
  if (val.deliveryType === "AUTO" && !val.deliveryInfo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["deliveryInfo"],
      message: "Укажите данные товара (логин, пароль, ключи) — без них нельзя опубликовать товар",
    });
  }
});

export const topUpSchema = z.object({
  amount: z.coerce.number().int("Сумма должна быть целой").min(1, "Минимальная сумма — 1 ₽"),
  method: z.string().trim().min(2, "Укажите способ пополнения").max(100),
  comment: z.string().trim().max(500).optional(),
});

export const withdrawalSchema = z.object({
  amount: z.coerce.number().int("Сумма должна быть целой").min(1, "Минимальная сумма — 1 ₽"),
  method: z.string().trim().min(2, "Укажите способ вывода").max(100),
  details: z.string().trim().min(4, "Укажите реквизиты для вывода").max(200),
});

export const ticketSchema = z.object({
  subject: z.string().trim().min(3, "Опишите тему обращения").max(200),
});

export const messageSchema = z.object({
  body: z.string().trim().min(1, "Сообщение не может быть пустым").max(3000),
});

export const complaintSchema = z.object({
  targetId: z.string().min(1, "Выберите пользователя"),
  orderId: z.string().nullable().optional(),
  reason: z.string().trim().min(3, "Укажите причину").max(100),
  text: z.string().trim().min(5, "Опишите ситуацию подробнее").max(2000),
});

export const bannerSchema = z.object({
  title: z.string().trim().min(3).max(120),
  imageUrl: z.string().min(1, "Добавьте изображение баннера"),
  linkUrl: z.string().max(300).optional(),
  placement: z.enum(["HOME", "CATALOG", "SIDEBAR"]).default("HOME"),
});

export const adminBannerSchema = z.object({
  title: z.string().trim().min(3).max(120),
  imageUrl: z.string().nullable().optional(),
  linkUrl: z.string().max(300).nullable().optional(),
  placement: z.enum(["HOME", "CATALOG", "SIDEBAR", "TOP"]).default("HOME"),
  status: z.enum(["PENDING", "ACTIVE", "HIDDEN"]).optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  durationMs: z.coerce.number().int().min(1000).max(60000).default(5000),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Только латиница, цифры и дефис"),
  icon: z.string().max(200).optional().nullable(),
  accent: z.string().max(20).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export const subcategorySchema = z.object({
  categoryId: z.string().min(1, "Выберите раздел"),
  name: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Только латиница, цифры и дефис"),
  icon: z.string().max(200).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  active: z.boolean().optional(),
});

export const topUpReviewSchema = z.object({
  adminNote: z.string().max(500).optional(),
});

export const promoCreateSchema = z.object({
  code: z.string().trim().min(3, "Код должен быть не короче 3 символов").max(40, "Максимум 40 символов"),
  type: z.enum(["BALANCE", "DISCOUNT"], { message: "Выберите тип бонуса" }),
  value: z.coerce.number().int("Значение должно быть целым").min(1, "Минимум 1").max(100000, "Слишком большое значение"),
  maxUses: z.coerce.number().int("Лимит должен быть целым").min(0, "Лимит не может быть отрицательным").default(0),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  active: z.boolean().optional(),
});

export const promoActivateSchema = z.object({
  code: z.string().trim().min(1, "Введите промокод").max(40),
});
