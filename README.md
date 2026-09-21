# Template

Шаблон нового проекта: Playwright из коробки, папка задач, пайплайн аудита безопасности навыков.

## Быстрый старт

```powershell
npm install
npx playwright install chromium
Copy-Item .env.example .env   # и заполни значения
npm test                      # ждём: 1 passed
```

## Структура

- `tests/smoke.spec.ts` — smoke-тест тулчейна (без внешней сети)
- `playwright.config.ts` — читает `.env`, `baseURL` из `SITE_URL`
- `.env.example` — шаблон переменных (коммитится); `.env` — только локально, в игноре
- `tasks/` — папка задач, в репо едет пустой (см. `SETUP_PROJECT.md`, п.3)
- `security-audit/`, `pre-push-audit/`, `SKILL_SECURITY_PIPELINE.md` — аудит навыков и pre-push gate
- `.opencode/` — плагин graphify для OpenCode

Полная инструкция для нового проекта — `SETUP_PROJECT.md`.
