# Release Radar — пошаговый учебный план

## Как работать с этим планом

Основной код пишешь самостоятельно. На каждом этапе ниже указано:

- какую пользовательскую функцию нужно реализовать;
- какие части Effect стоит изучить;
- какие файлы или области проекта затронуты;
- как понять, что этап завершён.

Ко мне стоит обращаться за:

- boilerplate Effect-сервисов и слоёв;
- тестами доменной логики;
- fake API-клиентами и fixtures;
- сложными SQL-миграциями;
- исправлением ошибок типизации;
- настройкой SSE, retry и graceful shutdown.

Не нужно заранее устанавливать все Effect-пакеты. Dependency добавляется только
на этапе, где он нужен.

## Текущее состояние шаблона

В проекте уже есть:

- Svelte 5 в runes mode;
- SvelteKit с TypeScript `strict`;
- `adapter-node`;
- Vitest для server/unit tests;
- ESLint и Prettier;
- Paraglide для `ru` и `en`;
- `src/hooks.server.ts` для локализации;
- базовая страница `src/routes/+page.svelte`.

В `package.json` уже установлен `effect@4.0.0-rc.117`. Не редактируй
генерируемые файлы в `src/lib/paraglide` и `.svelte-kit`.

Основные команды:

```sh
pnpm dev
pnpm check
pnpm lint
pnpm test
pnpm build
```

`pnpm check` запускает Svelte typecheck, `pnpm test` запускает тесты в
run-режиме, а `pnpm lint` проверяет Prettier и ESLint.

## Целевая структура

Не создавай все папки заранее. Добавляй их по мере необходимости.

```text
src/
├── lib/
│   ├── components/              # Svelte UI
│   ├── domain/                  # типы, Schema, Release Gate
│   └── server/
│       ├── adapters/            # npm и GitHub API
│       ├── effects/             # orchestration, retry, scheduler
│       ├── repositories/        # persistence
│       └── services/            # application services
└── routes/
    ├── +page.server.ts
    ├── +page.svelte
    └── api/
        ├── monitors/
        ├── checks/
        └── events/
```

Правило границы:

- `src/lib/domain` не знает о SvelteKit, SQLite и API;
- `src/lib/server` не импортируется в браузерные компоненты;
- UI вызывает серверные load/actions или API routes;
- внешние API вызываются только на сервере;
- Svelte-компоненты не создают и не хранят Effect-значения.

## Стратегия разработки

Сначала сделай один работающий вертикальный срез:

```text
добавить npm-пакет → получить данные → показать версию и дату → показать eligibleAt
```

Только после этого добавляй расписание, SQLite, GitHub, SSE и alerts. Это
уменьшит количество одновременно неизвестных частей.

---

## Этап 0. Baseline шаблона

### Цель

Убедиться, что исходный шаблон работает до добавления Effect.

### Что проверить

1. Запустить `pnpm dev`.
2. Открыть стартовую страницу.
3. Запустить `pnpm check`.
4. Запустить `pnpm lint`.
5. Запустить `pnpm test`.
6. Запустить `pnpm build`.
7. Зафиксировать версию Node.js и pnpm.

### Что не делать

- не устанавливать Effect и SQL-пакеты заранее;
- не удалять demo-файлы до проверки baseline;
- не менять SvelteKit experimental features без необходимости.

### Готово, когда

Все команды завершаются успешно, а на странице открывается стандартный
SvelteKit-шаблон.

---

## Этап 1. Domain-модель и Release Gate

### Цель

Сначала реализовать чистую бизнес-логику без HTTP, базы и UI.

### Что изучаешь

- `Schema`;
- `Data` или tagged values для состояний;
- типизированные ошибки;
- `Effect` как значение программы;
- `TestClock` в следующих тестах.

### Что написать

Создать минимальные типы и функции для:

- `SourceKind`: `npm_package` и `github_repo`;
- `ReleaseStatus`: `cooling_down`, `ready`, `date_unknown`;
- `Monitor`;
- `Release`;
- `CheckRun`;
- `ReleaseAgeWindow`;
- вычисления `eligibleAt`;
- вычисления оставшегося времени;
- определения статуса версии.

Правила:

```text
eligibleAt = publishedAt + releaseAgeWindow
```

- default окно — 72 часа;
- окно можно менять глобально и для отдельного монитора;
- отсутствие `publishedAt` не исправляется выдуманной датой;
- `now === eligibleAt` означает `ready`;
- время хранится в UTC.

### Какие файлы создать

Начни с:

```text
src/lib/domain/
├── monitor.ts
├── release.ts
├── check-run.ts
├── release-age.ts
└── errors.ts
```

Не связывай эти файлы с SvelteKit и API.

### Проверка

Тесты заранее подготовлены в `src/lib/domain/release-age.test.ts` и
`src/lib/domain/monitor.test.ts`. Они задают контракт для `evaluateReleaseGate`,
`ReleaseGateInput`, `Monitor` и `SourceKind`.

Реализуй production-код так, чтобы прошли сценарии:

- версия до окна;
- версия ровно на границе;
- версия после окна;
- отсутствующая дата;
- пользовательское окно.

### Готово, когда

Можно вызвать расчёт для произвольной версии и получить один из ожидаемых
статусов без базы и сети.

---

## Этап 2. Первый Effect-сервис и in-memory repository

### Цель

Добавить минимальную application-сервисную архитектуру и понять dependency
injection.

### Что изучаешь

- `Context.Service` в Effect 4;
- `Layer`;
- `Effect.provide`;
- создание сервисов через `Layer`;
- разделение интерфейса и реализации.

### Какие сервисы реализовать

На первом этапе достаточно:

- `MonitorRepository` с in-memory реализацией;
- `MonitorService` с операциями:
  - `list`;
  - `get`;
  - `create`;
  - `update`;
  - `remove`;
  - `pause`;
  - `resume`.

### Правила

- repository возвращает Effect, а не Promise;
- сервис не знает, откуда пришли данные;
- тестовый repository можно заменить через другой Layer;
- не использовать глобальные mutable-коллекции.

### Проверка

- создать два монитора;
- получить список;
- изменить настройки;
- отключить монитор;
- повторно создать тот же идентификатор и получить ожидаемую ошибку;
- собрать сервис с fake repository.

### Готово, когда

UI пока не подключён, но application-слой уже умеет выполнять операции через
Effect и заменяемый repository.

---

## Этап 3. Первый SvelteKit vertical slice

### Цель

Показать пользователю один реальный сценарий: добавить npm-пакет и увидеть его в
watchlist.

### Что изучаешь

- `+page.server.ts`;
- SvelteKit `load`;
- form actions;
- переход между server и client;
- Svelte 5 runes: `$state`, `$derived`, `$effect`;
- локализация через Paraglide.

### Что написать

Сделать одну страницу:

- форма добавления npm-пакета;
- список мониторов;
- кнопка `Check now`;
- отображение статуса проверки;
- loading, empty и error states.

Для первого этапа можно использовать in-memory repository.

### UI-состояния

Не смешивай:

- состояние формы;
- состояние загрузки;
- состояние ошибки;
- данные монитора;
- Effect-ошибку сервера.

Svelte UI хранит только presentation state. Данные и orchestration остаются на
сервере.

### Локализация

Добавляй видимые строки в:

```text
messages/ru.json
messages/en.json
```

Не редактируй сгенерированный `src/lib/paraglide`.

### Готово, когда

Пользователь может добавить npm-пакет через форму и увидеть его в списке без
обращения к внешнему API.

---

## Этап 4. Реальный npm adapter

### Цель

Подключить первый настоящий внешний API.

### Что изучаешь

- Effect HTTP client;
- `Schema.decode` и ошибки валидации;
- `Effect.tryPromise` или HTTP-эффект;
- timeout;
- retry;
- `Layer` для API-клиента;
- server-only imports.

### Что реализовать

Создать интерфейс:

```text
NpmRegistry
```

и операцию:

```text
getPackageMetadata(packageName)
```

Получать только необходимые поля:

- `name`;
- `dist-tags`;
- versions;
- timestamp каждой версии;
- repository URL;
- npm URL.

Не скачивать tarball и не сохранять README целиком.

### Ошибки

Разделить как минимум:

- invalid package name;
- package not found;
- network failure;
- timeout;
- malformed response;
- rate limit;
- server error.

Не превращать все ошибки в строку `unknown error`.

### Проверка

- запросить реальный публичный пакет;
- проверить malformed fixture;
- проверить timeout;
- проверить отсутствие timestamp;
- проверить отсутствие пакета;
- убедиться, что запрос идёт только с сервера.

### Готово, когда

Один npm-пакет получает реальные metadata, а не fixture, и ошибки видны в
CheckRun.

---

## Этап 5. Release Gate в UI

### Цель

Показать главную пользовательскую ценность: когда конкретную версию можно
устанавливать.

### Что реализовать

- настройку default `releaseAgeWindow`;
- настройку окна для монитора;
- отображение `publishedAt`;
- отображение `eligibleAt`;
- countdown;
- статус `cooling_down`;
- статус `ready`;
- статус `date_unknown`;
- кнопку изменения окна;
- пересчёт даты после изменения политики.

### Ограничения

- не предлагать safe install command для `cooling_down`;
- для `ready` показывать рекомендацию, но не запускать npm;
- не менять `.npmrc` автоматически;
- не обещать, что одна версия защищает все транзитивные зависимости.

### Готово, когда

Для реальной версии видно точную дату, через которую она станет `ready`, и при
изменении окна эта дата меняется.

---

## Этап 6. SQLite и migrations

### Цель

Перевести in-memory repository в постоянное хранилище.

### Что изучаешь

- Effect SQL;
- `SqlClient`;
- migrations;
- transactions;
- mapping rows в domain types;
- Layer для выбора SQLite implementation.

### Перед установкой пакета

Проверь версию Node.js. В Effect 4 RC выбор SQLite driver зависит от Node и
способа запуска:

- native Node SQLite;
- SQLite WASM;
- PGlite.

Не устанавливай driver наугад. На этом этапе попроси меня проверить
совместимость с текущим Node и выбрать вариант.

### Таблицы

Минимальный набор:

- `monitors`;
- `check_runs`;
- `releases`;
- `alerts`;
- `settings`.

Для releases нужен уникальный ключ:

```text
(source, identifier, version)
```

### Проверка

- создать монитор;
- перезапустить приложение;
- убедиться, что данные сохранились;
- повторно добавить тот же релиз;
- убедиться, что duplicate не создаётся;
- проверить rollback или безопасное поведение при ошибке миграции.

### Готово, когда

приложение запускается на пустой базе, применяет migrations и сохраняет данные
между перезапусками.

---

## Этап 7. Check orchestration

### Цель

Автоматизировать проверки, не создавая long-running fiber на каждый HTTP
request.

### Что изучаешь

- `Schedule`;
- `Queue`;
- `Semaphore`;
- fibers;
- interruption;
- structured concurrency;
- graceful shutdown;
- retry policy.

### Что реализовать

- `CheckScheduler`;
- `CheckQueue`;
- bounded concurrency;
- pause/resume;
- ручной запуск;
- периодический запуск;
- timeout;
- retry;
- `rate_limited` status;
- `CheckRun` history.

### Правила retry

- retry для временной сети и 5xx;
- не retry для malformed response;
- не retry для 404;
- 429 и `Retry-After` обрабатывать отдельно;
- не выполнять частые запросы к одному источнику;
- сохранять attempt number.

### Готово, когда

несколько мониторов проверяются ограниченно, pause работает, ошибка одного
источника не останавливает остальные, а остановка процесса корректно освобождает
ресурсы.

---

## Этап 8. GitHub adapter

### Цель

Добавить второй источник через тот же application interface.

### Что реализовать

- `owner/repository` Schema;
- public releases endpoint;
- `published_at`;
- `draft`;
- `prerelease`;
- release URL;
- GitHub rate-limit headers;
- optional server-side token.

### Правила

- использовать только read-only GET;
- не обходить authentication;
- не делать polling чаще безопасного интервала;
- не отправлять токен в браузер;
- `created_at` не заменяет `published_at`, если release опубликован позже;
- `date_unknown` не превращается в безопасную дату.

### Готово, когда

GitHub и npm подключены через общий интерфейс монитора, а UI умеет показывать
оба типа источников.

---

## Этап 9. SSE и уведомления

### Цель

Сделать обновления видимыми без постоянного polling страницы.

### Что изучаешь

- `Stream`;
- `PubSub`;
- SSE;
- reconnect;
- event serialization;
- server-only event bus.

### Что реализовать

- endpoint событий;
- события проверки;
- события нового release;
- событие перехода в `ready`;
- live-обновление dashboard;
- reconnect с загрузкой snapshot;
- in-app alerts;
- acknowledge/snooze/ignore.

### Правила

- не отправлять токены и секреты;
- не отправлять неограниченную историю;
- ограничить размер события;
- после reconnect не полагаться только на пропущенные SSE-события.

### Готово, когда

проверка и обнаружение release отражаются в UI без нажатия кнопки обновления.

---

## Этап 10. Observability и hardening

### Цель

Сделать приложение понятным при ошибке и безопасным при внешних сбоях.

### Что реализовать

- structured logging;
- correlation ID;
- latency;
- HTTP status;
- retry count;
- rate-limit state;
- error code;
- retention policy;
- graceful shutdown;
- audit секретов;
- accessibility pass;
- security pass.

### Проверка

- временно недоступен npm;
- API вернул malformed JSON;
- GitHub вернул 429;
- пользователь закрыл вкладку во время SSE;
- приложение было остановлено во время check run;
- в БД много старых check runs;
- API token не появляется в логах и browser payload.

### Готово, когда

проблема диагностируется по correlation ID, а приложение восстанавливается без
duplicate alerts и утечки секретов.

---

## Этап 11. MVP acceptance и polish

### Цель

Проверить пользовательский сценарий целиком.

### Acceptance scenario

1. Добавить `npm:effect`.
2. Добавить `github:Effect-TS/effect`.
3. Выполнить ручную проверку.
4. Увидеть новую версию и `publishedAt`.
5. Увидеть `cooling_down` и `eligibleAt`.
6. Изменить окно с 72 часов.
7. Увидеть пересчёт `eligibleAt`.
8. Дождаться или смоделировать наступление `ready`.
9. Увидеть рекомендацию установки только для `ready`.
10. Получить live-событие.
11. Перезапустить приложение.
12. Увидеть сохранённые check runs и alerts.
13. Проверить обработку 429 и retry.
14. Убедиться, что один release не создаёт duplicate alert.

### Финальные проверки

```sh
pnpm check
pnpm lint
pnpm test
pnpm build
```

## Что пока не реализовывать

До завершения MVP не добавляй:

- Effect Cluster;
- Effect Workflow;
- distributed queues;
- private registries;
- private repositories;
- arbitrary URL fetch;
- scraping;
- email/Telegram;
- multi-user authorization;
- автоматическую установку пакетов;
- AI-функции;
- отдельный worker process.

## Когда просить помощь

Обращайся за помощью в следующих точках:

1. **После этапа 0** — проверить baseline и выбрать способ установки Effect.
2. **Перед этапом 1** — получить минимальный boilerplate `Schema` и
   `Release Gate`.
3. **Перед этапом 2** — получить пример `Context.Service` и `Layer` для v4 RC.
4. **Перед этапом 4** — проверить HTTP API v4 и написать fixture-тесты.
5. **Перед этапом 6** — выбрать SQLite driver и помочь с миграцией.
6. **Перед этапом 7** — собрать scheduler/queue с корректным lifecycle.
7. **Перед этапом 9** — сделать SSE endpoint и reconnect.
8. **Перед финальной проверкой** — написать недостающие integration tests.

Рекомендуемый следующий шаг: выполнить этап 0 и прислать результаты
`pnpm check`, `pnpm lint`, `pnpm test` и `pnpm build`. После этого можно перейти
к этапу 1, не добавляя инфраструктуру вперёд.
