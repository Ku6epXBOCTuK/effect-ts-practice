# Release Radar

Учебное приложение для отслеживания новых релизов npm-пакетов и
GitHub-репозиториев с настраиваемым `minimum release age`.

## Документация

- [План продукта](docs/PLAN.md)
- [Пошаговый учебный план](docs/IMPLEMENTATION.md)

## Команды

```sh
pnpm dev
pnpm check
pnpm lint
pnpm test
pnpm build
```

`pnpm check` и `pnpm build` генерируют Paraglide перед запуском SvelteKit.

## Текущий этап

Сейчас подготовлен чистый SvelteKit-шаблон. Effect и остальные интеграции
добавляются по этапам из `docs/IMPLEMENTATION.md`.
