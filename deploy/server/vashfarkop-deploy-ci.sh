#!/bin/bash
# Приём готовой сборки админки от GitHub Actions.
#
# Ставится в /usr/local/bin/vashfarkop-deploy-ci. Ключ GitHub в
# /root/.ssh/authorized_keys привязан к нему опцией command=…: этим
# ключом нельзя ни войти на сервер, ни выполнить что-то другое — только
# передать сборку на вход этого скрипта.
#
#   ssh root@сервер <sha коммита> < сборка.tar.gz
#
# ── Зачем ──
#
# Собирать на самом сервере (vashfarkop-update) долго: одно ядро, 2 ГБ
# памяти, жёсткий диск — 20–40 минут, и сборка уходит в подкачку. GitHub
# собирает то же за несколько минут, а сюда приезжает готовое.
#
# ── Что делает ──
#
# Код подтягивается тот же, из которого собрано: скрипты миграций и
# зависимости должны совпадать со сборкой. Дальше — как у
# vashfarkop-update: копия базы, миграции при остановленной админке,
# подмена. Плюс проверка после запуска: не открылась админка — вернуть
# прежнюю сборку.
set -euo pipefail

SHA="${SSH_ORIGINAL_COMMAND:-}"
if [[ ! "$SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Нужен sha коммита сорока символами" >&2
  exit 2
fi

# Две доставки разом — это две подмены одной папки.
exec 9>/var/lock/vashfarkop-deploy.lock
if ! flock -n 9; then
  echo "Уже идёт другое обновление" >&2
  exit 3
fi

cd /opt/vashfarkop

echo "→ Код $SHA"
git fetch --depth 50 origin main
git checkout -f -B main "$SHA"

# Зависимости — только если сменился список. Иначе npm install тратит
# минуту впустую.
LOCK_HASH="$(sha1sum package-lock.json | cut -d' ' -f1)"
if [[ "$(cat .deploy-lock-hash 2>/dev/null || true)" != "$LOCK_HASH" ]]; then
  echo "→ Зависимости"
  npm install --no-audit --no-fund
  echo "$LOCK_HASH" > .deploy-lock-hash
fi

echo "→ Принимаю сборку"
rm -rf .next-build
mkdir .next-build
tar -xzf - -C .next-build
test -f .next-build/BUILD_ID || { echo "В сборке нет BUILD_ID — не подменяю" >&2; exit 4; }

systemctl stop vashfarkop-admin

echo "→ Сохраняю копию базы"
mkdir -p /root/pgdata-backups
cp -a .pgdata "/root/pgdata-backups/$(date +%Y%m%d-%H%M%S)"
ls -1dt /root/pgdata-backups/* | tail -n +6 | xargs -r rm -rf

echo "→ Обновляю базу"
if ! PGLITE_RUNTIME_PATH= PGLITE_PATH=/opt/vashfarkop/.pgdata npx tsx scripts/migrate.ts; then
  echo "Миграция не прошла — запускаю прежнюю версию" >&2
  systemctl start vashfarkop-admin
  exit 5
fi

echo "→ Подменяю сборку"
rm -rf .next-admin.prev
[[ -d .next-admin ]] && mv .next-admin .next-admin.prev
mv .next-build .next-admin
systemctl start vashfarkop-admin

# Проверка: страница входа должна открыться. Не открылась — прежняя
# сборка обратно, иначе владелец остался бы без админки до утра.
for _ in $(seq 1 20); do
  sleep 3
  if [[ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/admin/vhod)" == "200" ]]; then
    echo "Готово. Версия: $(git log --oneline -1)"
    exit 0
  fi
done

echo "Новая сборка не открылась — возвращаю прежнюю" >&2
systemctl stop vashfarkop-admin
rm -rf .next-admin
mv .next-admin.prev .next-admin
systemctl start vashfarkop-admin
exit 6
