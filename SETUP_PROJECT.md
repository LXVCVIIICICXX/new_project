# SETUP_PROJECT — новый проект за ~15 минут

Этот репозиторий — шаблон. Для нового проекта: выполни шаги 0–5,
файлы-шаблоны (`.gitignore`, `.env.example`, `playwright.config.ts`,
`tests/smoke.spec.ts`, `tasks/`, `security-audit/`,
`SKILL_SECURITY_PIPELINE.md`) скопируй отсюда как есть.

Правило про MD: новые файлы-инструкции создаются **только после
твоего «ОК»**. Исключения (уже согласованы): этот файл и файлы
решений в `tasks/`.

---

## 0. Машина — один раз

| Что | Как | Проверка |
|---|---|---|
| Node LTS | https://nodejs.org или `winget install -e --id OpenJS.NodeJS.LTS` | `node -v; npm -v` |
| Python 3.10+ | https://www.python.org/downloads (Windows: через `py`-лаунчер) | `py --version` |
| uv | `winget install -e --id astral-sh.uv --accept-source-agreements --accept-package-agreements`, затем **новый терминал** | `uv --version` |
| Git | https://git-scm.com или `winget install -e --id Git.Git` | `git --version` |
| Сканеры скиллов | `py -m pip install cisco-ai-skill-scanner jadegate` | `skill-scanner --version` |
| Graphify | `uv tool install graphifyy` (внимание: пакет с **двумя y**) | `graphify --version` |

Нюансы Windows:

- Если `graphify` не находится после установки: `uv tool update-shell`,
  открой новый терминал. Как запасной вариант добавь в PATH
  `%USERPROFILE%\.local\bin` — туда uv кладёт `graphify.exe`.
- На русской Windows перед сканерами всегда:
  `$env:PYTHONUTF8="1"` — иначе падают с `UnicodeEncodeError` (cp1251).
- Вызывай Python через `py` (`py -m pip ...`), а не голый `python`,
  если в системе несколько версий.

Ссылки: Node https://nodejs.org · Python https://www.python.org/downloads ·
uv https://docs.astral.sh/uv · Playwright https://playwright.dev ·
Graphify https://github.com/Graphify-Labs/graphify ·
Cisco skill-scanner https://github.com/cisco-ai-defense/skill-scanner ·
JadeGate https://github.com/JadeGate/jadegate

---

## 1. Новый проект — Playwright сразу

```powershell
mkdir <имя-проекта>; cd <имя-проекта>   # подставь своё имя папки
git init
npm init -y
npm install -D @playwright/test dotenv
npx playwright install chromium   # только Chrome; все браузеры: npx playwright install
```

Затем скопируй из этого репо-шаблона:

- `.gitignore` — `.env` уже в игноре по дефолту, см. п.2
- `.env.example` → переименуй копированием в `.env` и заполни значения
- `playwright.config.ts` — читает `.env`, `baseURL` берётся из переменной
  окружения (в шаблоне — `SITE_URL`; под свой проект подставь свою)
- `tests/smoke.spec.ts` — проверка тулчейна без внешней сети
- `tasks/` — папка задач, см. п.3
- `security-audit/` + `SKILL_SECURITY_PIPELINE.md` — см. п.5

```powershell
Copy-Item .env.example .env
npm test   # ждём: 1 passed (smoke: chromium стартует)
```

`package.json` → скрипт `"test": "playwright test"`.

---

## 2. `.env` — правило

- `.env` **всегда в `.gitignore` по дефолту**, никогда не коммитить.
- Шаблон с пустыми значениями — `.env.example`, он коммитится.
- Добавил новую переменную → добавь пустым значением и в `.env.example`.

---

## 3. `tasks/` — папка задач

Задачи ты описываешь в чате, решение ложится в файл. Формат имени:

```text
XXXXXX_<slug>_<статус>.md        # пример: A4F9K2_setup-project_🛠.md
```

- ID (`XXXXXX`): 6 символов, латиница + цифры (`[A-Z0-9]`, без `0/O/1/I`
  чтобы не путать). Это **задача** — единица, которую ты описал в чате.
  Каждой уникальной задаче свой ID. Если ты ID не указал — генерирует агент,
  проверяет что такого ID ещё нет.
- Слаг (`<slug>`): **подзадача** — конкретный кусок работы внутри задачи.
  По-английски, строчными, слова через дефис (`setup-project`,
  `admin-login`). Разделители в имени — подчёркивания.
- Одна задача = один ID, файлов-подзадач может быть несколько
  (`A4F9K2_setup-project_✅.md`, `A4F9K2_env-template_✅.md`, …),
  статус у каждой подзадачи свой.
- Смена статуса = **переименование файла**, ID и слаг не меняются никогда.

| Статус в имени | Значение |
|---|---|
| 🛠 | в работе |
| ❔ | нужен твой ответ / уточнение |
| ⚠️ | частично готово, нужна проверка |
| ✅ | готово |
| ❌ | не взлетело (в файле — причина) |
| 🚫 | отменено / неактуально |

- Скелет файла:

```markdown
# XXXXXX: <название>
Статус: 🛠
## Задача
## Решение
## Проверка
## История
```

### Канбан-доска (опционально — только после твоего «ОК»)

- По дефолту **не ставится**. Агент при установке нового проекта обязан
  уточнить два вопроса: (1) нужна ли канбан-доска вообще, (2) какой порт
  localhost использовать (дефолт `5000`, если занят — спросить другой).
- Если ответил «да» — готовую локальную доску взять отсюда:
  https://github.com/LXVCVIIICICXX/kanban-board
  (`tracker/` — Node.js-сервер без сторонних зависимостей; детали — `SETUP.md`
  в том репо).
- Установка (только после «ОК»):
  1. Скопировать `tracker/` в проект, открыть `tracker/config.js` и задать
     `PROJECT_NAME` и `TRACKER_PORT` (либо через env `PROJECT_NAME` /
     `TRACKER_PORT` — env перекрывает конфиг).
  2. Запуск: `cd tracker; node server.cjs`, затем открыть
     `http://localhost:<выбранный-порт>/` (по дефолту `http://localhost:5000`).
- Внимание: доска из коробки работает с раскладкой
  `.agents/tasks/<Backlog|To do|Done>/*.md` и двигает файлы между папками
  при drag-and-drop (синхронизация через SSE), а в этом шаблоне задачи
  лежат плоско в `tasks/` со статусом в имени файла
  (`XXXXXX_<slug>_<статус>.md`) — при подключении доски потребуется
  адаптация раскладки под один из форматов.

---

## 4. Graphify — цеплять по дефолту

Установка разовая (см. п.0). В каждом новом проекте:

```powershell
graphify install --platform opencode
```

Это регистрирует скилл и пишет `.opencode/` (плагин graphify) — коммитить.
Для скилла в скоупе репозитория добавь `--project`.

Дальше в ассистенте:

```text
graphify .     # в PowerShell без ведущего слэша
```

На выходе `graphify-out/`: `graph.html` (смотреть в браузере),
`GRAPH_REPORT.md` (суть графа), `graph.json` (полный граф для запросов).
В `.gitignore` уже убран локальный `graphify-out/cost.json`.

---

## 5. Аудит безопасности навыков и MCP

В новый проект копируй из шаблона два пути **как относительные**:

- `security-audit/SKILL.md` — чек-лист для проверки в чате
- `SKILL_SECURITY_PIPELINE.md` — полный пайплайн (ворота/ресерч/починка)

Абсолютные пути (типа `C:\Users\...`) не использовать никогда —
на другой машине и в другой директории они не заведутся.

Коротко (детали — в `SKILL_SECURITY_PIPELINE.md`):

```powershell
$env:PYTHONUTF8="1"
skill-scanner scan quarantine\candidate --policy strict --use-behavioral --format table
```

Вердикты: `SAFE` → ставим · `ASK` → ставим с урезанием прав ·
`BLOCK` → отказ. Обнова стороннего скилла = новая установка через те же ворота.

---

## 6. Чек-лист «новый проект готов»

- [ ] `npm test` → `1 passed`
- [ ] `.env` заполнен, в git его нет (`git status` чист от секретов)
- [ ] `.env.example` обновлён под все переменные
- [ ] `tasks/` на месте
- [ ] Канбан-доска: уточнено, нужна ли (по дефолту нет); если «ОК» — порт localhost согласован, `tracker/config.js` (`PROJECT_NAME`, `TRACKER_PORT`) настроен
- [ ] `graphify install --platform opencode` выполнен, `.opencode/` закоммичен
- [ ] `security-audit/` + `SKILL_SECURITY_PIPELINE.md` скопированы
