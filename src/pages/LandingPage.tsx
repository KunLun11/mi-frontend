import { useState } from "react";
import { Link } from "react-router-dom";

import { Avatar } from "@/components/Avatar";
import { Brand } from "@/components/Brand";
import { Dialog } from "@/components/Dialog";
import {
  ArrowRightIcon,
  BranchIcon,
  CloseIcon,
  ClockIcon,
  MenuIcon,
  QuoteIcon,
  ShieldCheckIcon,
  SlidersIcon,
  TerminalIcon,
  UsersIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { buttonClassName } from "@/components/ui/buttonStyles";
import { dashboardPathFor } from "@/lib/auth-redirect";
import { useAuthStore } from "@/store/auth";

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      {children}
    </p>
  );
}

const STEPS = [
  {
    number: "01",
    title: "Расскажите, что происходит",
    text: "Пять коротких вопросов: роль, состояние, формат и бюджет. Это займёт около четырёх минут.",
  },
  {
    number: "02",
    title: "Куратор подберёт вручную",
    text: "Мы читаем каждый ответ. Присылаем одного-двух специалистов и объясняем, почему выбрали именно их.",
  },
  {
    number: "03",
    title: "Запишитесь на сессию",
    text: "Выбираете удобное время. Оплата — после того, как психолог подтвердит встречу.",
  },
];

const FEATURES = [
  {
    icon: <SlidersIcon />,
    title: "Ручной подбор",
    text: "Никаких каталогов и фильтров. Куратор сравнивает запрос с опытом специалистов и присылает короткую подборку.",
  },
  {
    icon: <TerminalIcon />,
    title: "Психологи с IT-опытом",
    text: "Каждый специалист прошёл проверку: работал в tech или несколько лет консультирует команды. Не нужно объяснять, что такое релиз.",
  },
  {
    icon: <BranchIcon />,
    title: "Без конвейера",
    text: "Один куратор ведёт вас до записи. Мы не продаём пакеты сессий и не удерживаем в терапии.",
  },
];

export default function LandingPage() {
  const user = useAuthStore((state) => state.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const quizPath = user
    ? user.role === "client"
      ? "/quiz"
      : dashboardPathFor(user.role)
    : "/login?next=/quiz";
  const dashboardPath = user ? dashboardPathFor(user.role) : null;

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-50 pt-3">
        <div className="container-app">
          <div className="flex h-16 items-center justify-between gap-3 rounded-2xl border border-white/80 bg-[#f3f8fc]/40 px-3 shadow-[0_0_0_1px_rgba(20,20,20,0.05),0_20px_52px_-26px_rgba(20,20,20,0.34)] backdrop-blur-[36px] sm:gap-6 sm:px-[18px]">
            <Brand />

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Основная навигация">
              <a
                href="#how"
                className="inline-flex min-h-10 items-center rounded-[7px] px-3 text-sm text-muted transition hover:bg-black/5 hover:text-ink"
              >
                Как это работает
              </a>
              <Link
                to="/register?role=psychologist"
                className="inline-flex min-h-10 items-center rounded-[7px] px-3 text-sm text-muted transition hover:bg-black/5 hover:text-ink"
              >
                Психологам
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              {dashboardPath ? (
                <Link
                  to={dashboardPath}
                  className={buttonClassName({ variant: "secondary", size: "md" })}
                >
                  Кабинет
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex min-h-11 items-center px-2.5 text-sm text-muted transition hover:text-ink"
                >
                  Войти
                </Link>
              )}
              <Link
                to={quizPath}
                className={buttonClassName({
                  variant: "secondary",
                  size: "md",
                  className: "hidden sm:inline-flex",
                })}
              >
                Пройти квиз
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                className="grid h-11 w-11 place-items-center rounded-[7px] text-ink transition hover:bg-black/5 lg:hidden"
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
                aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>

          {mobileOpen ? (
            <nav
              id="mobile-menu"
              className="mt-2 rounded-2xl border border-white/70 bg-[#f5fafd]/70 p-3 shadow-card backdrop-blur-[32px] lg:hidden"
              aria-label="Мобильная навигация"
            >
              {[
                { label: "Как это работает", href: "#how" },
                { label: "Психологам", href: "/register?role=psychologist" },
                ...(dashboardPath
                  ? [{ label: "Кабинет", href: dashboardPath }]
                  : [{ label: "Войти", href: "/login" }]),
                { label: "Пройти квиз", href: quizPath },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-[46px] items-center border-b border-black/[0.07] px-1 text-[15px] last:border-b-0"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          ) : null}
        </div>
      </header>

      <main>
        <section className="py-[clamp(56px,7vw,92px)]" aria-labelledby="hero-title">
          <div className="container-app grid items-center gap-[clamp(36px,5vw,76px)] lg:grid-cols-[5.1fr_5.4fr]">
            <div>
              <Eyebrow>Подбор психологов для IT</Eyebrow>
              <h1
                id="hero-title"
                className="mt-5 max-w-[12.5ch] text-[clamp(42px,5.4vw,74px)] leading-[0.99] tracking-[-0.045em]"
              >
                Психолог, который понимает ваш IT-контекст
              </h1>
              <p className="mt-[22px] max-w-[44ch] text-[clamp(17px,1.35vw,19px)] leading-[1.55] text-muted">
                Куратор вручную подберёт одного-двух специалистов, знакомых с выгоранием,
                дедлайнами и синдромом самозванца. Без каталога на сотни анкет.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3.5">
                <Link
                  to={quizPath}
                  className={buttonClassName({ variant: "primary", size: "lg", className: "group" })}
                >
                  Пройти квиз
                  <ArrowRightIcon className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/register?role=psychologist"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink transition hover:underline"
                >
                  Я психолог
                  <ArrowRightIcon className="h-[15px] w-[15px]" />
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-[12.5px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheckIcon /> Проверяем IT-контекст
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon className="h-3.5 w-3.5" /> Ответ куратора до 24 часов
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UsersIcon className="h-3.5 w-3.5" /> 1–2 специалиста, не список
                </span>
              </div>
            </div>

            <aside
              className="rounded-lg border border-border bg-surface p-[22px] shadow-card"
              aria-label="Пример кураторской подборки"
            >
              <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-muted">
                    Кураторская подборка
                  </span>
                  <span className="font-display text-[17px] font-semibold tracking-[-0.02em]">
                    Подбор № 118
                  </span>
                </div>
                <span className="inline-flex min-h-6 items-center rounded-pill bg-accent-tint px-2.5 py-0.5 text-xs font-medium text-accent-ink">
                  Собрано вручную
                </span>
              </div>

              <div className="py-1">
                {[
                  {
                    index: "01",
                    label: "Запрос",
                    title: "Разработчик · выгорание",
                    meta: "Онлайн · до 5 000 ₽",
                  },
                  {
                    index: "02",
                    label: "Куратор",
                    title: "Анна изучила запрос и историю",
                    meta: "Сравнила 7 специалистов",
                  },
                ].map((row) => (
                  <div
                    key={row.index}
                    className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 border-b border-[#ededed] py-[15px]"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full border border-border text-[10.5px] font-semibold tabular-nums text-muted">
                      {row.index}
                    </span>
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                        {row.label}
                      </span>
                      <span className="text-sm leading-[1.45] text-ink-soft">{row.title}</span>
                      <span className="text-[13px] text-muted">{row.meta}</span>
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 py-[15px]">
                  <span className="grid h-6 w-6 place-items-center rounded-full border border-border text-[10.5px] font-semibold tabular-nums text-muted">
                    03
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                      Специалист
                    </span>
                    <div className="flex items-center gap-2.5">
                      <Avatar name="Марина Ковалёва" size="sm" />
                      <div>
                        <strong className="block text-[14.5px] font-semibold">Марина Ковалёва</strong>
                        <span className="text-[12.5px] text-muted">КПТ · 9 лет · IT-команды</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded bg-accent-tint p-4">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-ink">
                  <QuoteIcon className="h-[13px] w-[13px]" />
                  Почему Марина
                </div>
                <p className="text-[13.5px] leading-[1.52] text-accent-ink">
                  Шесть лет работала с продуктовыми командами и знает, как устроен релизный цикл.
                  Поможет разобрать выгорание без совета «просто больше отдыхать».
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3.5 text-xs text-muted">
                <span className="flex items-center gap-2">
                  <Avatar name="Анна Куратор" size="sm" />
                  Анна, куратор подбора
                </span>
                <span>Ответ — до 24 часов</span>
              </div>
            </aside>
          </div>
        </section>

        <section id="how" className="border-t border-border py-[clamp(56px,6.5vw,96px)]" aria-labelledby="how-title">
          <div className="container-app">
            <div className="mb-[clamp(32px,4vw,52px)] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
              <div className="max-w-[620px]">
                <Eyebrow>Как это работает</Eyebrow>
                <h2
                  id="how-title"
                  className="mt-3.5 text-[clamp(30px,3.4vw,46px)] leading-[1.05] tracking-[-0.032em]"
                >
                  Три шага без алгоритма и бесконечного списка
                </h2>
              </div>
              <p className="max-w-[320px] pb-1 text-sm leading-[1.55] text-muted">
                Вы не выбираете из каталога. Вы рассказываете ситуацию, а куратор находит
                специалиста, который уже работал с похожим контекстом.
              </p>
            </div>

            <div className="grid gap-[clamp(24px,4vw,48px)] md:grid-cols-3">
              {STEPS.map((step) => (
                <article key={step.number} className="border-t border-ink pt-[18px]">
                  <span className="text-[11.5px] font-semibold tracking-[0.1em] text-muted tabular-nums">
                    {step.number}
                  </span>
                  <h3 className="mt-[18px] text-xl leading-[1.25] tracking-[-0.022em]">{step.title}</h3>
                  <p className="mt-2.5 text-sm leading-[1.55] text-muted">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border py-[clamp(56px,6.5vw,96px)]" aria-labelledby="difference-title">
          <div className="container-app">
            <div className="mb-[clamp(32px,4vw,52px)] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
              <div className="max-w-[620px]">
                <Eyebrow>Что меняется</Eyebrow>
                <h2
                  id="difference-title"
                  className="mt-3.5 text-[clamp(30px,3.4vw,46px)] leading-[1.05] tracking-[-0.032em]"
                >
                  Не сервис на потоке, а внимательный подбор
                </h2>
              </div>
              <p className="max-w-[320px] pb-1 text-sm leading-[1.55] text-muted">
                Терапия начинается не с анкеты на сто пунктов, а с разговора о вашей реальной
                ситуации.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded border border-border bg-surface p-[26px]"
                >
                  <div className="mb-[26px] grid h-10 w-10 place-items-center rounded-[9px] bg-accent-tint text-accent-ink">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg leading-[1.3] tracking-[-0.018em]">{feature.title}</h3>
                  <p className="mt-[9px] text-[13.5px] leading-[1.55] text-muted">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-surface-blue py-[clamp(56px,6vw,88px)]" aria-labelledby="quote-title">
          <div className="container-app grid items-start gap-[clamp(36px,6vw,96px)] lg:grid-cols-[1.05fr_0.8fr]">
            <blockquote
              id="quote-title"
              className="font-display text-[clamp(30px,3.3vw,46px)] font-medium leading-[1.1] tracking-[-0.035em] text-[#223b4a]"
            >
              Вы не обязаны объяснять психологу, что такое дедлайн,{" "}
              <span className="text-blue-ink">on-call</span> и синдром самозванца.
            </blockquote>
            <div className="flex flex-col gap-4 pt-2">
              <p className="text-[14.5px] leading-[1.6] text-[#445c69]">
                Мы знаем, как выгорание выглядит в продуктовой команде: когда ещё вчера
                интересный проект превращается в череду задач, а отдых не возвращает сил.
              </p>
              <p className="text-[14.5px] leading-[1.6] text-[#445c69]">
                Начните с короткого разговора. Куратор прочитает ваш запрос и предложит
                специалиста, с которым не придётся начинать с нуля.
              </p>
              <Link
                to={quizPath}
                className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-[#284b5d] underline decoration-[#284b5d]/30 underline-offset-4 transition hover:text-[#1d3a49]"
              >
                Пройти квиз
                <ArrowRightIcon className="h-[15px] w-[15px]" />
              </Link>
              <span className="mt-2.5 flex items-center gap-2.5 text-[12.5px] text-[#58707c]">
                <Avatar name="Анна Куратор" size="sm" />
                Анна, куратор подбора
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-12">
        <div className="container-app">
          <div className="grid gap-10 md:grid-cols-[1.6fr_0.7fr_0.7fr]">
            <div>
              <Brand />
              <p className="mt-3.5 max-w-[34ch] text-[13.5px] text-muted">
                Ручной подбор психологов для специалистов в IT.
              </p>
            </div>
            <nav aria-label="Сервис">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Сервис
              </h3>
              <a href="#how" className="block py-[5px] text-[13.5px] text-ink-soft transition hover:text-accent-ink">
                Как это работает
              </a>
              <Link to={quizPath} className="block py-[5px] text-[13.5px] text-ink-soft transition hover:text-accent-ink">
                Пройти квиз
              </Link>
              <Link
                to={dashboardPath ?? "/login"}
                className="block py-[5px] text-[13.5px] text-ink-soft transition hover:text-accent-ink"
              >
                Мои заявки
              </Link>
            </nav>
            <nav aria-label="Психологам">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Психологам
              </h3>
              <Link
                to="/register?role=psychologist"
                className="block py-[5px] text-[13.5px] text-ink-soft transition hover:text-accent-ink"
              >
                Заполнить профиль
              </Link>
              <Link
                to="/login"
                className="block py-[5px] text-[13.5px] text-ink-soft transition hover:text-accent-ink"
              >
                Войти в кабинет
              </Link>
              <Link
                to="/login"
                className="block py-[5px] text-[13.5px] text-ink-soft transition hover:text-accent-ink"
              >
                Вход для клиентов
              </Link>
            </nav>
          </div>

          <div className="mt-11 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-[12.5px] text-muted">
            <span>© 2026 Контекст</span>
            <div className="flex flex-wrap gap-[18px]">
              <button
                type="button"
                onClick={() => setPrivacyOpen(true)}
                className="transition hover:text-ink"
              >
                Политика конфиденциальности
              </button>
              <Link to="/login" className="transition hover:text-ink">
                Войти
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <Dialog
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        title="Политика конфиденциальности"
        description="Коротко о том, как обрабатываются ваши данные."
        footer={
          <Button onClick={() => setPrivacyOpen(false)}>Понятно</Button>
        }
      >
        <div className="space-y-3 text-[13.5px] leading-[1.6] text-ink-soft">
          <p>
            Ответы квиза и контактные данные используются только для подбора психолога
            и организации сессии. Доступ к ответам есть у куратора и подобранного
            специалиста.
          </p>
          <p>
            Мы не передаём данные третьим лицам и не используем их для рекламы.
            Вы можете запросить удаление аккаунта, написав в поддержку.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
