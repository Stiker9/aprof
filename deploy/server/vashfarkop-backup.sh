#!/bin/bash
# Ночная копия админки: база и фото владельца.
#
# Ставится в /usr/local/bin/vashfarkop-backup, запускается таймером
# systemd vashfarkop-backup.timer в 04:30.
#
# ── Что и куда ──
#
# База — согласованный снимок от самой админки (/api/kopiya, см.
# src/app/(admin)/api/kopiya/route.admin.ts), фото — папка
# public/images/own. Всё складывается в /var/backups/vashfarkop,
# хранится 14 последних ночей.
#
# Копия на том же диске не спасёт, если умрёт сервер. Поэтому та же
# папка уезжает на хостинг reg.ru в ~/backup-admin — вне папки сайта,
# из интернета её не открыть. Ключ к хостингу тот же, что у публикации.
set -euo pipefail

APP=/opt/vashfarkop
DEST=/var/backups/vashfarkop
KEEP=14
STAMP="$(date +%F)"

# Ключ и адрес хостинга — из настроек админки.
TOKEN="$(grep -E '^BACKUP_TOKEN=' "$APP/.env.local" | cut -d= -f2-)"
SSH_TARGET="$(grep -E '^PUBLISH_SSH=' "$APP/.env.local" | cut -d= -f2-)"
[[ -n "$TOKEN" ]] || { echo "Нет BACKUP_TOKEN в .env.local" >&2; exit 2; }

mkdir -p "$DEST"
chmod 700 "$DEST"

echo "→ База"
curl -fsS --max-time 300 -X POST -H "Authorization: Bearer $TOKEN" \
  -o "$DEST/pgdata-$STAMP.tar.gz.part" http://127.0.0.1:3000/api/kopiya
# Пустой или битый архив хуже отсутствующего: проверяем, что он читается.
tar -tzf "$DEST/pgdata-$STAMP.tar.gz.part" > /dev/null
mv "$DEST/pgdata-$STAMP.tar.gz.part" "$DEST/pgdata-$STAMP.tar.gz"

# Фото не архивом каждую ночь, а зеркалом: их сотни мегабайт, и
# четырнадцать полных копий съели бы диск. Без --delete — удалённое в
# админке по ошибке здесь остаётся.
echo "→ Фото"
mkdir -p "$DEST/photos"
rsync -a "$APP/public/images/own/" "$DEST/photos/"

# Старше KEEP ночей — удалить.
ls -1t "$DEST"/pgdata-*.tar.gz | tail -n +$((KEEP + 1)) | xargs -r rm -f

if [[ -n "$SSH_TARGET" ]]; then
  echo "→ На хостинг"
  ssh -o BatchMode=yes "$SSH_TARGET" 'mkdir -p ~/backup-admin && chmod 700 ~/backup-admin'
  # rsync на хостинге может не быть — тогда scp только сегодняшней базы
  # и фото целиком (они дописываются, а не меняются).
  if ssh -o BatchMode=yes "$SSH_TARGET" 'command -v rsync' > /dev/null; then
    rsync -a --delete -e "ssh -o BatchMode=yes" "$DEST/" "$SSH_TARGET:backup-admin/"
  else
    scp -o BatchMode=yes -q "$DEST/pgdata-$STAMP.tar.gz" "$SSH_TARGET:backup-admin/"
    tar -czf - -C "$DEST" photos | ssh -o BatchMode=yes "$SSH_TARGET" 'cat > ~/backup-admin/photos.tar.gz'
    ssh -o BatchMode=yes "$SSH_TARGET" \
      "ls -1t ~/backup-admin/pgdata-*.tar.gz | tail -n +$((KEEP + 1)) | xargs -r rm -f"
  fi
fi

echo "Копия $STAMP готова: $(du -sh "$DEST" | cut -f1)"
