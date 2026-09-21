---
name: pre-push-audit
description: Pre-push review before git push to GitHub/GitLab. Checks staged diff and repo for leaked secrets and project-specific leftovers. Use when user says check before push, before publish, перед пушем, перед отправкой в репозиторий.
license: MIT
---

# Pre-Push Audit

Ревизия только по diff + новые файлы. Уже запушенное — не твоя зона (это задача history-скана `gitleaks detect --log-opts "--all"`).

## 0. Собери контекст

```bash
git status --short
git diff --cached --stat
git log origin/main..HEAD --oneline
git remote -v  # куда едет: публичный GitHub = строже всего
```

## 1. Секреты (BLOCK)

Паттерны: `AKIA, ghp_, gho_, glpat-, sk-, xoxb-, -----BEGIN.*PRIVATE KEY`,
`mongodb://.*@, postgres://.*@`, `VISION_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY`,
файлы `.env, .env.*, credentials.json, *.pem, id_rsa, *_token.txt`.
Также: закомменченные секреты, секреты в примерах/README, токены в скриншотах и логах (`test-results/`, `*.log`).

Если нашел — BLOCK: убрать из diff, перенести в env/secret-manager,
проверить `git log -S "<строка>"` — не светилось ли раньше (если да — rotate + history rewrite).
Проверь `.gitignore` покрывает: `.env, .env.*, *.pem, credentials.json, __pycache__, .venv, *.log, test-results/`.

## 2. Привязка к конкретике (ASK)

Для универсального инструмента в diff не должно быть:
- абсолютных путей (`C:\Users\...`, `/home/...`),
- внутренних хостов/URL, IP, портов захардкоженных (`localhost:XXXX` в коде, а не в примере),
- имен проектов/людей/клиентов, названий локальных веток в доках,
- реальных данных: пользователи, пароли, телефоны, скриншоты с продом.

Фикс: вынести в config/example + `README` с плейсхолдерами (`https://example.com`, `user@example.com`).

## 3. Гигиена универсального инструмента

Есть `README` + `LICENSE`? Нет `print`-отладки и закомменченного кода в diff?
Версии/зависимости не `latest`? Нет бинарей/артефактов (`node_modules/`, `dist/`, `*.pyc`)?

## Вывод

Таблица `Файл:строка | Категория | Severity | Fix`, затем `Verdict: PUSH / FIX-FIRST / BLOCK`.
Дополнительно дай команду перепроверки: `gitleaks detect --source . --log-opts "origin/main..HEAD"`.
