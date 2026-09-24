# Release Radar — план реализации

## 1. Цель

Создать локальное приложение, которое отслеживает выбранные пользователем
npm-пакеты и GitHub-репозитории, показывает новые релизы и помогает безопасно
выбирать момент обновления.

Пользовательский сценарий:

1. Пользователь добавляет npm-пакет или GitHub-репозиторий.
2. Приложение проверяет источник по расписанию или вручную через официальный
   API.
3. Приложение сохраняет версию, дату публикации, ссылку на релиз и состояние
   проверки.
4. Для npm-пакета вычисляется `eligibleAt` — дата, после которой версия прошла
   `minimum release age`.
5. До этой даты версия отображается как `cooling_down`, после неё — как `ready`.
6. Пользователь получает уведомление о новом релизе и может открыть страницу
   пакета или GitHub release.

Внутренняя часть приложения остаётся системой фоновых проверок, но пользователю
не нужно работать с абстрактными jobs: пользователь видит реальные обновления,
даты и рекомендации по установке.

## 2. Терминология: minimum release age

Для задержки перед использованием свежих релизов используется термин **minimum
release age**.

Другие названия:

- `minimum release age`;
- `release age window`;
- `cooldown period` — понятное пользователю название;
- `min-release-age` — соответствующая npm-конфигурация;
- `minimumReleaseAge` — название аналогичной настройки pnpm.

В приложении основная политика называется `Release Gate` и хранится как
`releaseAgeWindow`.

Расчёт:

```text
eligibleAt = publishedAt + releaseAgeWindow
```

Пример:

```text
publishedAt: 2026-09-24T10:00:00Z
releaseAgeWindow: 72 часа
eligibleAt: 2026-09-27T10:00:00Z
```

Статусы готовности npm-версии:

- `cooling_down` — версия опубликована недавно, `now < eligibleAt`;
- `ready` — версия опубликована достаточно давно, `now >= eligibleAt`;
- `date_unknown` — API не вернул надёжную дату публикации;
- `ignored` — пользователь отложил или отключил уведомление;
- `unavailable` — версия больше не доступна в источнике.

`minimum release age` не является гарантией безопасности. Это защитная задержка,
которая даёт время заметить проблемный релиз, удалить пакет или обнаружить
публичное сообщение о компрометации.

## 3. Настройки Release Gate

### Глобальная настройка

- значение по умолчанию — 72 часа;
- единица хранения — длительность;
- допустимый диапазон — от 0 до 30 дней;
- значение 0 разрешено только с явным подтверждением пользователя;
- настройка применяется ко всем новым мониторам по умолчанию.

### Индивидуальная настройка

Для каждого монитора можно задать собственное окно:

- например, 48 часов для доверенного репозитория;
- 72 часа для обычного npm-пакета;
- 168 часов для критичного production-проекта.

Изменение политики пересчитывает `eligibleAt` для всех ещё не обработанных
релизов.

### Отображение времени

- расчёт выполняется в UTC;
- интерфейс отображает дату в локальной таймзоне пользователя;
- показывается обратный отсчёт до `eligibleAt`;
- для старых версий отображается фактический возраст;
- отображается точная дата и время, а не только «через 3 дня».

## 4. Допущения MVP

Приложение на первом этапе:

- локальное;
- однопользовательское;
- работает в одном Node-процессе;
- использует SvelteKit Node adapter;
- использует SQLite для persistence;
- использует SSE для live-обновлений;
- поддерживает npm Registry API и GitHub REST API;
- не выполняет установку и обновление пакетов автоматически;
- не принимает произвольные URL;
- не работает с private registry и private repositories;
- не требует обязательного API-ключа.

## 5. Границы MVP

Входит в MVP:

- watchlist npm-пакетов;
- watchlist GitHub-репозиториев;
- ручная проверка;
- проверка по расписанию;
- дата публикации релиза;
- настраиваемый `minimum release age`;
- расчёт `eligibleAt` для npm;
- состояние `cooling_down` и `ready`;
- рекомендация безопасной команды установки только после `eligibleAt`;
- история проверок;
- health-check каждого источника;
- in-app уведомления;
- acknowledge/snooze/ignore для обновления;
- structured logs и базовые metrics;
- unit- и integration-тесты.

Не входит в MVP:

- автоматическая установка пакетов;
- автоматическое изменение `package.json`;
- автоматический `npm update`;
- private registry;
- private GitHub repositories;
- scraping HTML-страниц;
- произвольные пользовательские URL;
- email, Telegram и другие внешние уведомления;
- security scanning;
- публичный multi-user deployment;
- AI;
- Effect Cluster и Effect Workflow.

## 6. Функциональные требования

### FR-1. Пользовательский список мониторов

Пользователь может:

- добавить npm-пакет по имени;
- добавить GitHub-репозиторий по `owner/repository`;
- посмотреть список мониторов;
- отфильтровать список по источнику и состоянию;
- изменить имя, описание и настройки монитора;
- поставить монитор на паузу;
- удалить монитор;
- вручную запустить проверку.

Идентификаторы источников должны проверяться через Schema. Произвольные URL не
принимаются.

### FR-2. Типы источников

Поддерживаются два типа источников:

- `npm_package`;
- `github_repo`.

Каждый тип имеет отдельный adapter и отдельные правила валидации ответа.

### FR-3. Npm Registry API

Для npm-пакета приложение получает официальные metadata и сохраняет:

- имя пакета;
- `dist-tags`;
- доступные версии;
- дату публикации каждой версии;
- текущую зафиксированную версию, если она импортирована из `package.json` или
  lock-файла;
- repository URL;
- ссылку на страницу npm;
- дату последней проверки.

Для определения даты версии используется timestamp конкретной версии из
metadata. Если timestamp отсутствует, версия получает состояние `date_unknown`,
а не выдуманную дату.

### FR-4. GitHub REST API

Для GitHub-репозитория приложение получает сведения о публичных releases:

- tag/name;
- `published_at`;
- признак prerelease;
- признак draft;
- URL release;
- краткое описание, если API его возвращает.

Дата `published_at` является основной датой релиза. Значение `created_at` не
используется как замена, если release опубликован позже.

### FR-5. Проверки и расписание

Каждый запуск проверки сохраняется как `CheckRun` со статусами:

```text
scheduled → running → succeeded
                  ├→ failed
                  ├→ rate_limited
                  └→ cancelled
```

Проверка запускается:

- автоматически по расписанию;
- вручную из интерфейса;
- после создания монитора;
- при необходимости после восстановления приложения.

Для разных источников могут быть разные минимальные интервалы. Частоту проверки
пользователь не может сделать меньше безопасного предела.

### FR-6. Release Gate

Для каждого найденного npm-релиза приложение вычисляет:

- `publishedAt`;
- `releaseAgeWindow`;
- `eligibleAt`;
- текущий возраст;
- оставшееся время до `eligibleAt`;
- итоговый статус готовности.

Правила:

- до `eligibleAt` показывать `cooling_down`;
- после `eligibleAt` показывать `ready`;
- не рекомендовать установку cooling-down версии;
- показывать `date_unknown`, если дата публикации неизвестна;
- пересчитывать `eligibleAt` при изменении настройки;
- не считать GitHub release npm-устанавливаемым пакетом без отдельной связи с
  npm-пакетом.

### FR-7. Рекомендация установки npm

Когда версия имеет статус `ready`, UI может сформировать рекомендацию:

```text
npm install package@version
```

До наступления `eligibleAt` команда не должна предлагаться как безопасная.

Приложение также может сгенерировать, но не применять автоматически,
конфигурацию npm:

```ini
min-release-age=3
```

Для точной границы по дате может быть предложен npm-параметр `before`. Нужно
учитывать, что `before` имеет приоритет над `min-release-age`, если оба
параметра заданы.

Важно: политика приложения для одного пакета не гарантирует, что все
транзитивные зависимости имеют такую же дату. Для защиты всего dependency tree
нужен проектный npm/pnpm policy.

### FR-8. История и health-check

Для каждого монитора отображаются:

- последняя проверка;
- результат последней проверки;
- latency;
- HTTP status;
- число retry;
- оставшийся rate limit, если источник его сообщает;
- последний успешный snapshot;
- количество обнаруженных релизов;
- состояние API-источника.

Историю проверок и релизов можно фильтровать и постранично открывать.

### FR-9. Уведомления

При обнаружении нового релиза создаётся `Alert`.

Пользователь может:

- отметить уведомление прочитанным;
- отложить его на заданный срок;
- игнорировать конкретную версию;
- вернуть игнорирование в список;
- открыть ссылку на npm или GitHub.

Один и тот же релиз не должен создавать повторные уведомления после каждой
проверки.

### FR-10. Dashboard

Dashboard показывает:

- общее число мониторов;
- число новых релизов;
- число версий в `cooling_down`;
- число версий, готовых к установке;
- ближайшие `eligibleAt`;
- здоровье npm и GitHub API;
- последние ошибки;
- последние проверки;
- непрочитанные уведомления.

### FR-11. Импорт зависимостей

В MVP можно добавить необязательную функцию:

- загрузить или вставить `package.json`;
- извлечь `dependencies` и `devDependencies`;
- создать мониторы для выбранных пакетов;
- показать текущие диапазоны версий;
- не изменять исходный `package.json`.

Для версий из lock-файла можно позже определить фактически установленную версию.

### FR-12. Persistence и миграции

SQLite хранит:

- мониторы;
- настройки Release Gate;
- check runs;
- releases;
- snapshots;
- alerts;
- события;
- rate-limit metadata.

Нужны версионируемые миграции и транзакции.

### FR-13. Live-обновления

Через SSE UI получает события:

- монитор добавлен;
- проверка началась;
- проверка завершилась;
- найден новый релиз;
- версия вошла в `cooling_down`;
- версия стала `ready`;
- API источника вернул rate limit или ошибку;
- пользователь изменил Release Gate.

После разрыва соединения UI перезапрашивает snapshot.

### FR-14. Конфигурация

Через типизированный Effect `Config` задаются:

- путь к SQLite;
- интервалы проверок;
- максимальная конкурентность;
- timeout;
- retry policy;
- default release age;
- режим логирования;
- необязательный GitHub token.

## 7. Нефункциональные требования

### NFR-1. Корректность расчёта возраста

- все времена хранятся в UTC;
- `eligibleAt` вычисляется из фактического `publishedAt`;
- отсутствующая дата не заменяется текущей датой;
- изменение окна пересчитывает будущую дату;
- версия не становится `ready` раньше `eligibleAt`;
- расчёт не зависит от таймзоны браузера.

### NFR-2. Идемпотентность

- один `(source, identifier, version)` соответствует одной записи release;
- повторная проверка не создаёт дубликат;
- уведомление создаётся один раз;
- ручной запуск проверки не ломает историю;
- восстановление после restart не создаёт повторные алерты.

### NFR-3. Надёжность

- check runs переживают перезапуск;
- незавершённые проверки после аварии обнаруживаются;
- API-таймауты не оставляют workers в работе;
- graceful shutdown освобождает fibers, timers, HTTP connections и очереди;
- ошибка одного источника не останавливает остальные.

### NFR-4. Ограничение внешних запросов

- используются только documented public GET API;
- минимальный интервал проверки задаётся для каждого источника;
- запросы разных мониторов ограничиваются per-source rate limiter;
- обрабатываются `429`, `403`, `Retry-After` и rate-limit headers;
- после исчерпания лимита не выполняется агрессивный retry;
- используются timeout и кэширование;
- conditional requests применяются, если поддерживаются API;
- не выполняется массовый обход или scraping.

### NFR-5. Безопасность

- arbitrary URL fetch запрещён;
- source identifier валидируется по схеме источника;
- GitHub token хранится только на сервере;
- токен не попадает в браузер, URL, логи и SSE;
- API-ответы проходят Schema validation;
- SQL использует параметризованные запросы;
- отображаемые тексты экранируются;
- rate-limit и user-agent не позволяют обходить ограничения источника.

### NFR-6. Производительность

Начальные цели для локального MVP:

- dashboard загружается не более чем за 1 секунду;
- SSE-событие отображается с задержкой не более 500 мс;
- одна проверка не создаёт бесконечный поток повторных запросов;
- история релизов и проверок пагинируется;
- кэш не позволяет делать одинаковые запросы чаще заданного интервала.

### NFR-7. Наблюдаемость

Каждый check run имеет correlation ID. В логах и UI доступны:

- monitor ID;
- source;
- identifier;
- check run ID;
- latency;
- attempt;
- HTTP status;
- rate-limit state;
- retry count;
- structured error code.

### NFR-8. Тестируемость

- domain не зависит от SvelteKit;
- fake npm и GitHub clients используются в тестах;
- fake clock позволяет проверять `eligibleAt` без ожидания реальных дней;
- тестируются границы `now === eligibleAt`;
- тестируются отсутствующая дата, 429, timeout и malformed response;
- используется `@effect/vitest` и `TestClock`;
- обязательны `typecheck`, lint и test.

### NFR-9. Удобство и доступность

- статус готовности всегда сопровождается текстом;
- дата и countdown видны без наведения;
- цвет не является единственным способом понять состояние;
- таблицы и фильтры управляются с клавиатуры;
- есть loading, empty и error states;
- ссылки на источник явно показывают источник данных.

### NFR-10. Совместимость

- включён TypeScript `strict`;
- используется TypeScript 5.9+;
- версия `effect@rc` фиксируется в lock-файле;
- примеры из Effect v3 не используются;
- unstable API v4 изолируются за адаптерами;
- приложение запускается через SvelteKit Node adapter.

## 8. Внешние API и ограничения

### Npm Registry

Используется официальный metadata API для получения сведений о пакете.
Приложение не скачивает tarball без необходимости и не хранит полный README по
умолчанию.

Политика приложения:

- проверять только официальный npm Registry;
- не обходить authentication и rate limits;
- не выполнять массовые запросы;
- сохранять только metadata, нужные для мониторинга;
- показывать ссылку на npm как источник истины.

### GitHub REST API

Используются documented public read-only endpoints для releases. Не выполняются
операции создания, редактирования или удаления данных.

Для публичного доступа без authentication GitHub устанавливает ограничение 60
запросов в час на IP; authenticated requests имеют отдельный лимит. Приложение
должно:

- использовать `x-ratelimit-*` headers;
- учитывать `Retry-After`;
- не создавать частые проверки одного репозитория;
- использовать token только при необходимости;
- хранить token на сервере;
- иметь безопасный режим без token.

### Пользовательская политика

Перед публичным размещением приложения необходимо повторно проверить актуальные
условия npm, GitHub и всех добавленных источников. Приложение не должно обходить
авторизацию, rate limits, robots-политику или условия использования API.

## 9. Доменная модель

### Monitor

- `id`;
- `source`;
- `identifier`;
- `displayName`;
- `enabled`;
- `checkInterval`;
- `releaseAgeWindow`;
- `includePrerelease`;
- `createdAt`;
- `lastCheckedAt`;
- `lastHealth`.

### CheckRun

- `id`;
- `monitorId`;
- `status`;
- `startedAt`;
- `finishedAt`;
- `latencyMs`;
- `attempt`;
- `httpStatus`;
- `errorCode`;
- `rateLimitRemaining`;
- `rateLimitResetAt`.

### Release

- `source`;
- `identifier`;
- `version`;
- `publishedAt`;
- `detectedAt`;
- `eligibleAt`;
- `ageStatus`;
- `releaseUrl`;
- `isPrerelease`;
- `ignored`.

### Alert

- `releaseId`;
- `createdAt`;
- `readAt`;
- `snoozedUntil`;
- `ignoredAt`.

## 10. Архитектура

```text
SvelteKit UI
    │
    ├── load/actions/API routes
    │
    ▼
Application layer
    │
    ├── MonitorService
    ├── CheckScheduler
    ├── CheckQueue
    ├── ReleaseAgePolicy
    ├── NotificationService
    └── EventBus
    │
    ▼
Effect domain
    │
    ├── Schema
    ├── typed errors
    ├── retry/timeout
    ├── Schedule
    └── state transitions
    │
    ├── NpmRegistryAdapter
    ├── GitHubReleasesAdapter
    ├── MonitorRepository
    ├── CheckRunRepository
    ├── ReleaseRepository
    └── NotificationRepository
```

### Сервисы

- `MonitorService` — CRUD и настройки мониторов;
- `CheckScheduler` — расписание проверок;
- `CheckQueue` — bounded queue;
- `ReleaseAgePolicy` — единый расчёт `eligibleAt`;
- `NpmRegistryAdapter` — metadata npm;
- `GitHubReleasesAdapter` — releases GitHub;
- `NotificationService` — in-app alerts;
- `EventBus` — события для SSE;
- repositories — persistence.

### Границы

- SvelteKit отвечает за UI и HTTP boundary;
- Effect отвечает за orchestration, API calls, schedules и typed errors;
- API-адаптеры не зависят от SvelteKit;
- repository-адаптеры можно заменить без изменения domain;
- один долгоживущий Effect runtime создаётся на процесс;
- фоновые задачи не запускаются на каждый form action;
- Node-only код не попадает в browser bundle.

## 11. Что изучается через Effect

| Возможность приложения | Effect                        |
| ---------------------- | ----------------------------- |
| Npm/GitHub adapters    | `Context.Service`, `Layer`    |
| HTTP-запросы           | `HttpClient`                  |
| Валидация metadata     | `Schema`                      |
| Ошибки API             | typed errors                  |
| Повторные запросы      | retry, `Schedule`, backoff    |
| Проверки по времени    | `Schedule`, `Cron`            |
| Одновременные мониторы | `Queue`, `Semaphore`, fibers  |
| Live UI                | `Stream`, `PubSub`, SSE       |
| История                | SQL, migrations, transactions |
| Кэш                    | `Cache`, TTL                  |
| Наблюдаемость          | `Logger`, `Tracer`, `Metric`  |
| Тестирование времени   | `TestClock`                   |
| Тестирование API       | fake clients и test Layers    |

## 12. План реализации

### Этап 0. Проверка решений

- проверить версию Node.js;
- выбрать SQLite driver для Effect 4 RC;
- зафиксировать default `releaseAgeWindow = 72 часа`;
- определить, нужны ли prerelease;
- проверить актуальные API policies;
- создать acceptance scenarios.

### Этап 1. Каркас проекта

- создать SvelteKit Node-проект;
- включить strict TypeScript;
- зафиксировать Effect RC;
- создать серверный runtime;
- настроить SQLite и migrations;
- создать `server-only` boundary;
- добавить базовую страницу мониторов.

### Этап 2. Первый npm vertical slice

- добавить один npm-пакет;
- получить metadata через официальный Registry API;
- распарсить ответ через Schema;
- сохранить версию и `publishedAt`;
- показать версию на странице;
- реализовать ручную проверку.

### Этап 3. Release Gate

- реализовать `ReleaseAgePolicy`;
- вычислять `eligibleAt`;
- отображать `cooling_down`, `ready` и `date_unknown`;
- добавить countdown;
- добавить глобальную и индивидуальную настройку;
- тестировать границу времени через `TestClock`.

### Этап 4. Расписание и retries

- добавить scheduler;
- добавить bounded queue;
- ограничить concurrency;
- добавить timeout;
- добавить retry только для допустимых ошибок;
- обработать 429 и `Retry-After`;
- добавить pause/resume.

### Этап 5. GitHub adapter

- добавить `owner/repository` validation;
- получать public releases;
- использовать `published_at`;
- исключить draft или показывать отдельный статус;
- добавить rate-limit headers;
- покрыть adapter тестами.

### Этап 6. История и persistence

- сохранять CheckRun;
- сохранять Release;
- обеспечить уникальность версий;
- добавить pagination;
- добавить retention policy;
- восстановить мониторы после restart;
- не создавать повторные alerts.

### Этап 7. Live UI и уведомления

- добавить SSE;
- обновлять dashboard;
- показывать progress check run;
- добавить in-app alerts;
- добавить acknowledge/snooze/ignore;
- показывать источник и ссылку на release.

### Этап 8. Observability и hardening

- structured logs;
- correlation IDs;
- latency metrics;
- error metrics;
- rate-limit dashboard;
- проверка interruption;
- graceful shutdown;
- security review;
- accessibility;
- полный test suite.

### Необязательные расширения

- импорт `package.json` и lock-файла;
- npm audit metadata;
- GitHub security advisories;
- email/Telegram;
- OpenTelemetry exporter;
- PostgreSQL;
- отдельный worker process;
- Effect Workflow;
- Effect Cluster.

## 13. Критерии готовности MVP

Пользователь должен иметь возможность:

1. Добавить минимум один npm-пакет и один GitHub-репозиторий.
2. Получить реальные metadata через официальные API.
3. Увидеть версию и дату публикации.
4. Увидеть `eligibleAt` для npm-версии.
5. Увидеть `cooling_down` до окончания окна.
6. Увидеть `ready` после окончания окна.
7. Изменить окно с 72 часов на другое значение.
8. Увидеть обновлённый `eligibleAt`.
9. Получить ссылку на источник.
10. Запустить проверку вручную.
11. Увидеть retry после временной ошибки.
12. Увидеть корректную обработку rate limit.
13. Не получить повторное уведомление об одном и том же релизе.
14. Перезапустить приложение и увидеть сохранённую историю.
15. Запустить тесты с fake API и `TestClock`.

## 14. Зафиксированные решения по умолчанию

- приложение называется `Release Radar`;
- источники: npm и GitHub;
- default `minimum release age`: 72 часа;
- окно настраивается глобально и для каждого монитора;
- stable npm releases по умолчанию;
- prerelease отключены по умолчанию;
- автоматическая установка отсутствует;
- команда установки предлагается только для `ready` npm-версий;
- SQLite;
- SSE;
- локальный single-user режим;
- без произвольных URL;
- без scraping;
- без Cluster, Workflow и AI в MVP.

## 15. Документация и источники

- [npm `min-release-age`](https://docs.npmjs.com/cli/v11/using-npm/config#min-release-age)
- [npm `before`](https://docs.npmjs.com/cli/v11/using-npm/config#before)
- [npm Registry API](https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md)
- [GitHub REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [Effect v4 documentation](https://effect.website/docs/v4)
