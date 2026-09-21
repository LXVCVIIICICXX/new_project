# Internal Skill Security Pipeline v1
### Единое решение для внутренних проектов: установка + ресерч + починка навыков и MCP

Стек:
1. **Cisco Skill-Scanner** — ворота перед установкой + ресерч (статика + семантика).
2. **JadeGate** — runtime-защита + аудит уже стоящих MCP.
3. **Свой скилл `security-audit`** — ресерч, проверка в чате и починка самописных.

Спека **Skills Over MCP (SEP-2640)** отдельно не ставится — это правило, как пишем свои скиллы: манифест + SHA-256 + пин версий.

Источники:
- Cisco: https://github.com/cisco-ai-defense/skill-scanner , PyPI `cisco-ai-skill-scanner`, Apache 2.0
- JadeGate: https://github.com/JadeGate/jadegate , PyPI `jadegate`, сайт https://jadegate.io

Правило: скиллы = статика (сканируется при установке), MCP tools = динамика (описания подтягиваются при каждом коннекте, возможен rug-pull). Проверять оба слоя.

---

## 0. Установка — один раз, в этом порядке

> Нюансы Windows, учтены в командах ниже:
> - Рабочий Python — **Python 3.14** (`py -3.14`). Если `py`-лаунчер находит несколько версий — вызывай явно через `py -3.14`.
> - Если каталог `Scripts` используемого Python нет в PATH — вызывать сканеры по полному пути через `$scripts\skill-scanner.exe` / `$scripts\jade.exe` либо добавить этот каталог в PATH.
> - На русской Windows обязателен `$env:PYTHONUTF8="1"`, иначе `jade` падает с `UnicodeEncodeError: charmap can't encode` (эмодзи в выводе + cp1251).
> - PyPI-пакет `jadegate` v1.3.3 — это **jade-core**: CLI `jade verify/list/...`, проверяет только собственный JSON-формат скиллов, `SKILL.md` молча игнорирует. Команд `jadegate scan/install` (прокси из README репозитория JadeGate/jadegate) в этом релизе **нет**. Поэтому для `SKILL.md`/MCP основной инструмент — Cisco; `jade` — только для JSON-реестра jade-core / как MCP-сервер (`jade mcp-serve`).

```powershell
$env:PYTHONUTF8="1"
$scripts = Join-Path $env:LOCALAPPDATA "Python\...\Scripts"  # путь к Scripts твоего Python, подставь свой

# 1. Базовые сканеры (без ключей, оффлайн)
py -3.14 -m pip install cisco-ai-skill-scanner jadegate

# проверка (установлены: skill-scanner 2.1.0, jade v0.1.0 + движок 1.3.3)
& "$scripts\skill-scanner.exe" --version
& "$scripts\jade.exe" --help

# 2. Для deep-проверки (опционально, нужен ключ)
$env:ANTHROPIC_API_KEY="sk-ant-..."
# или OpenAI, для --use-llm --enable-meta
```

---

## 1. Задача А: Установка навыков — только через ворота

Запрет: не ставить скилл/MCP прямым копированием / `npx` без скана.

```powershell
# положить кандидат в карантин
mkdir quarantine; Expand-Archive skill.zip quarantine\candidate

# ворота 1: строгий скан
& "$scripts\skill-scanner.exe" scan quarantine\candidate --policy strict --use-behavioral --format table

# ворота 2: если HIGH/CRITICAL или незнакомый автор — добивка LLM
& "$scripts\skill-scanner.exe" scan quarantine\candidate --policy strict --use-behavioral --use-llm --enable-meta --format html -o audit.html
```

Текстовые инъекции (`ignore previous instructions` и т.п.) без `--use-llm` отдельным finding могут не подсветиться — для них включай LLM-анализатор.

Решение:
- `SAFE (0 high/critical)` -> ставить, зафиксировать версию/коммит в `skills.lock`
- `ASK (medium)` -> ставить только с урезанием прав (см. п.3)
- `BLOCK (high/critical)` -> в отказ, искать альтернативу

Дисклеймер Cisco: `No findings ≠ no risk`. Best-effort, для high-risk нужен human review.

---

## 2. Задача Б: Ресерч новых навыков — быстрый конвейер

Для каждого кандидата из ресерча:

1. В изолированном чате прогнать через скилл `security-audit` (файл `security-audit/SKILL.md` рядом) — 2 минуты, ловит 80%.
2. Если прошел — прогнать через Cisco пачкой:

```powershell
$env:PYTHONUTF8="1"
$scripts = Join-Path $env:LOCALAPPDATA "Python\...\Scripts"  # путь к Scripts твоего Python, подставь свой
& "$scripts\skill-scanner.exe" scan-all .\research --recursive --check-overlap --format markdown -o research-report.md
```

`--check-overlap` обязателен — ловит relay-атаки, когда 2 безобидных скилла вместе сливают данные.

3. В отчет ресерча писать: `Verdict: SAFE/ASK/BLOCK + 3 строки: что умеет, какие права просит, чем рискуем`.

Не доверять: звездам, описанию в маркете, `description` внутри скилла — это untrusted input.

---

## 3. Задача В: Починка существующих / самописных

Цикл для каждого своего `mcp.json` / `SKILL.md`:

```powershell
$env:PYTHONUTF8="1"
$scripts = Join-Path $env:LOCALAPPDATA "Python\...\Scripts"  # путь к Scripts твоего Python, подставь свой
# 1. найти все
& "$scripts\skill-scanner.exe" scan-all .\skills --recursive --policy strict --format json -o before.json
```

Типовые фиксы руками:

1. Нет `allowed-tools` -> добавить минимальный список. Нет нужды в сети -> убрать.
2. `description` повелительное (`ignore previous, you are now, do not mention`) -> переписать на описательное: только *что делает*, не *что делать модели*.
3. Шелл с `${input}` / `eval / exec / subprocess / child_process` -> заменить на строгий вызов + `inputSchema: {pattern, enum, maxLength, additionalProperties:false}`.
4. Чтение `~/.ssh ~/.aws .env os.environ` + `fetch/curl POST` в одном флоу -> разорвать, секреты только через env хоста, никаких хардкод `AKIA..., ghp_, sk-`.
5. Удаленный install `curl|sh`, непин версии `npx latest` -> пин `npx pkg@1.2.3` + SHA в лок.
6. Самописный скилл под SEP-2640: раздача через `skill://index.json` + манифест с `SHA-256/size` на каждый файл.

```powershell
# 2. перепроверить
& "$scripts\skill-scanner.exe" scan .\skills\my-skill --policy strict --use-behavioral
# должно стать 0 high/critical, иначе не мержить
```

В CI / pre-commit для своих репо добавить блок по `high`, чтобы не откатилось:

```yaml
# .pre-commit-config.yaml (фрагмент)
repos:
  - repo: https://github.com/cisco-ai-defense/skill-scanner
    rev: v1
    hooks:
      - id: skill-scanner
        args: [--severity-threshold, high]
```

```yaml
# .github/workflows/skill-scan.yml (фрагмент)
- run: skill-scanner scan-all ./skills --recursive --policy strict --format sarif -o results.sarif --fail-on-severity high
```

---

## 4. Свой скилл `security-audit`

Файл-скилл лежит рядом: `security-audit/SKILL.md`.

Установка скилла:
- Claude Code: `%USERPROFILE%\.claude\skills\security-audit\SKILL.md`
- OpenCode / Cursor: `.opencode/skills/security-audit/SKILL.md` или `.cursor/skills/` — скопировать туда же.

Использование:
- в чате: `проаудируй через security-audit: [вставь SKILL.md/mcp.json]`
- агентом: сам подхватит по `description`, когда увидит скилл/MCP.

Промпт для разовой проверки без установки скилла:

> Проанализируй этот файл конфигурации MCP / код скилла на безопасность. Проверь: 1) Prompt Injection в description/параметрах (override-фразы, ролевые захваты, скрытый unicode). 2) Least Privilege — нужен ли write/exec/network если задача read-only, есть ли `allowed-tools`. 3) Hardcoded secrets/токены/ключи. 4) Изоляция опасных команд — eval, shell с подстановкой пользовательского ввода, fetch+exec, отсутствие валидации схемы. 5) Эксфильтрация и цепочки — чтение `~/.ssh ~/.aws env` + отправка наружу. Выведи таблицу с severity, evidence-цитатой и fix. В конце verdict: BLOCK/ASK/SAFE.

---

## 5. Эксплуатация

- Обнова стороннего скилла = новая установка: снова через ворота А. Перескан всего каталога раз в неделю: `scan-all --policy strict`.
- Все свои скиллы держать в одном репо `internal-skills/` + `skills.lock` (URL + коммит + SHA). Чужое без пина не держать.
- Правило команды: нет `allowed-tools` и пина — не ревьюим, сразу BLOCK.

Итог: Cisco — основной gate для SKILL.md (проверено: ловит curl|sh, exfil, chaining), `jade` — только для JSON-формата jade-core, `security-audit` — единый чек-лист для ресерча и починки своих.

---

## 6. Pre-push gate: свой код наружу

Слои: скилл `pre-push-audit` (файл `pre-push-audit/SKILL.md` рядом — чек-лист: секреты BLOCK / привязка к конкретике ASK / гигиена) → Gitleaks локально → Push Protection на сервере (не обходится через `--no-verify`) → TruffleHog в CI/по расписанию.

```powershell
# установка (Windows): winget install Gitleaks.Gitleaks  # стоит 8.30.1
# разовый аудит истории ПЕРЕД хуками:
gitleaks detect --source . --log-opts "--all" --report-path gitleaks-history.json
# проверка diff перед пушем:
gitleaks detect --source . --log-opts "origin/main..HEAD"
# pre-commit framework: repo https://github.com/gitleaks/gitleaks, rev v8.18.0, hook id gitleaks
```

На сервере включить: GitHub → Secret scanning + Push protection; GitLab 19 → Secret Push Protection (Security Configuration Profiles).

Перед пушем нового проекта:
- `gitleaks detect --source . --log-opts "--all"` — история должна быть чистой.
- Рабочее дерево: `.env` и другие файлы с секретами — в `.gitignore`, не трекаются, в историю не попадали. При любом сомнении ключ считать скомпрометированным и крутить.
- Рядом с кодом не держать файлы вида `test/.env.txt` с dev-логинами — удалить или унести в менеджер секретов.
- Имена переменных (`ANTHROPIC_API_KEY` и т.п.) в `.env.example`/чеk-листах с пустыми значениями — безопасны, Gitleaks их не флагает.

Процедура ротации ключа (пример для Anthropic, console.anthropic.com → API Keys):
1. Usage — проверить аномалии по старому ключу. 2. Create Key. 3. Заменить значение в локальном `.env` (+ CI-секреты/другие машины при наличии). 4. Мелкий запрос — новый жив. 5. Revoke старого. 6. Billing → Spend limits.
