import { error } from "@/lib/api";

export async function POST() {
  return error("Регистрация через email и пароль временно недоступна — войдите через Google", 403);
}
