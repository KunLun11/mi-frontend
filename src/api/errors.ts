import axios from "axios";

const ERROR_MESSAGES: Record<string, string> = {
  email_not_verified: "Подтвердите email",
  email_already_verified: "Email уже подтверждён",
  invalid_credentials: "Неверный email или пароль",
  email_taken: "Этот email уже зарегистрирован",
  email_send_failed: "Не удалось отправить письмо. Попробуйте позже",
  invalid_role: "Нельзя зарегистрироваться с этой ролью",
  invalid_code: "Неверный код подтверждения",
  code_expired: "Срок действия кода истёк",
  psychologist_not_approved: "Профиль на модерации",
  invalid_token: "Сессия истекла, войдите снова",
  token_expired: "Сессия истекла, войдите снова",
  token_revoked: "Сессия завершена, войдите снова",
  not_authenticated: "Войдите, чтобы продолжить",
  forbidden_role: "Доступ запрещён",
  invalid_profile_status: "Профиль нельзя отправить на модерацию",
  quiz_not_ready: "Куратор ещё подбирает специалиста",
  request_exists: "Заявка уже отправлена",
  request_not_found: "Заявка не найдена",
  invalid_request_status: "Эту заявку уже нельзя изменить",
  session_not_found: "Сессия не найдена",
  invalid_session_status: "Действие недоступно для этой сессии",
  recommendation_not_found: "Рекомендация не найдена",
  unknown_approach: "Выбран неизвестный подход",
  unknown_it_context: "Выбран неизвестный IT-контекст",
  profile_not_found: "Профиль не найден",
  rate_limited: "Слишком много попыток, попробуйте позже",
  oauth_provider_disabled: "Этот способ входа недоступен",
  oauth_provider_not_configured: "Этот способ входа пока не настроен",
  oauth_denied: "Вход через провайдера отменён",
  oauth_email_unverified: "Провайдер не подтвердил email",
  oauth_exchange_failed: "Не удалось войти через провайдера",
  oauth_profile_unavailable: "Провайдер не вернул профиль",
  invalid_oauth_state: "Ссылка входа устарела, попробуйте снова",
  user_inactive: "Аккаунт заблокирован",
};

export function getErrorCode(error: unknown): string | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }
  const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;
  return typeof detail === "string" ? detail : null;
}

export function getErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Что-то пошло не так. Попробуйте ещё раз.";
  }

  if (error.response?.status === 422) {
    return "Проверьте правильность заполнения полей";
  }

  if (!error.response) {
    return "Не удалось связаться с сервером. Проверьте соединение.";
  }

  const code = getErrorCode(error);
  if (code && code in ERROR_MESSAGES) {
    return ERROR_MESSAGES[code] ?? "Что-то пошло не так. Попробуйте ещё раз.";
  }

  return "Что-то пошло не так. Попробуйте ещё раз.";
}
