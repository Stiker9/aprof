# Сервер админки

VPS RuVDS, `193.42.113.207`, Ubuntu. Админка: https://193-42-113-207.sslip.io/admin

Код — `/opt/vashfarkop` (клон GitHub `Stiker9/aprof`, ветка `main`).

## Обновление

```bash
/usr/local/bin/vashfarkop-update
```

Подтягивает `main`, собирает в `.next-build` и только после успешной сборки
подменяет `.next` и перезапускает службу — простой около 10 секунд. Если
сборка упала, работает прежняя версия.

Сборка падает на устаревших типах (`Cannot find module …/page.js` в
`.next/types/validator.ts`), если из проекта удалили страницы. Лечится так:
`rm -rf /opt/vashfarkop/.next/types /opt/vashfarkop/.next-build/types`.

Сборка идёт по копии базы (`.pgdata-build`), а не по `.pgdata`: PGlite
держит один процесс, и сборка рядом с работающей админкой падала с
`Aborted()`. Копию скрипт снимает сам и удаляет после сборки.

## Служба

`/etc/systemd/system/vashfarkop-admin.service` — `npm start`,
`HOSTNAME=127.0.0.1`, `PORT=3000`, окружение из `/opt/vashfarkop/.env.local`.

`/etc/systemd/system/vashfarkop-admin.service.d/dist.conf` —
`Environment=NEXT_DIST_DIR=.next-admin`. Админка работает из своей папки
сборки, не из `.next`: статическая выгрузка сайта (кнопка «Опубликовать»)
в Next 16 при `output: 'export'` всегда пишет служебные файлы в `.next`,
куда бы ни указывал `distDir`, — 22.10.2026 так затёрла админку, и после
перезагрузки та отдавала 404. Скрипт обновления подменяет `.next-admin`.

`/etc/systemd/system/vashfarkop-admin.service.d/db.conf` —
`Environment=PGLITE_RUNTIME_PATH=/opt/vashfarkop/.pgdata`. Без этой строки
запущенная админка открыла бы снимок базы, в который смотрела сборка, —
скрипт обновления проверяет её и без неё не подменяет версию.

## nginx — `/etc/nginx/sites-available/vashfarkop-admin`

```nginx
server {
    server_name 193-42-113-207.sslip.io admin.vashfarkop.ru;

    # Фото с телефона — до 25 МБ; по умолчанию nginx режет на 1 МБ.
    client_max_body_size 30M;

    # Фото, загруженные владельцем, отдаёт nginx напрямую: Next в рабочем
    # режиме видит только файлы, лежавшие в public на момент сборки, и на
    # новые отвечает 404 — в админке вместо снимка была пустая рамка.
    # try_files здесь не ставить: вместе с alias он ищет не тот путь.
    location /images/own/ {
        alias /opt/vashfarkop/public/images/own/;
        expires 30d;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # дальше — строки certbot (listen 443 ssl, сертификаты)
}
```

## Публикация сайта с сервера

Кнопка «Опубликовать» в админке запускает `npm run publish` здесь же.

- Куда заливать — `PUBLISH_SSH`, `PUBLISH_PATH` в `.env.local`.
- Ключ к хостингу — `/root/.ssh/regru_deploy`, прописан в `/root/.ssh/config`.
- `.env.publish` — адрес приёма заявок для статической выгрузки:
  `NEXT_PUBLIC_REQUESTS_URL=https://193-42-113-207.sslip.io/api/zayavka`.
  Без него опубликованный сайт выключит форму заявок.

Правки владельца (цены, фото, тексты) живут в базе этого сервера. Сайт,
собранный на другом компьютере, их не содержит — публиковать нужно отсюда,
иначе правки владельца с сайта пропадут до следующей публикации из админки.

## Подкачка

`/etc/sysctl.d/99-vashfarkop-swap.conf` — `vm.swappiness = 60`. В
`/etc/sysctl.conf` стоит `vm.swappiness = 0`: ядро не трогает подкачку,
пока память не кончится, и сборка (Next держит около 1,3 ГБ) падала с
OOM при пустых 5 ГБ swap. Файл в `sysctl.d` читается позже и перекрывает.
Память сервера — 2 ГБ (увеличена с 1 ГБ 22.10.2026 в кабинете RuVDS;
1270 ₽/мес).

## Ночная копия

`/usr/local/bin/vashfarkop-backup` (из `deploy/server/vashfarkop-backup.sh`),
таймер `vashfarkop-backup.timer` — каждую ночь в 04:30.

- База — согласованный снимок от самой админки через `POST /api/kopiya`
  (без остановки, заявки не теряются). Адрес отвечает только запросу
  изнутри сервера (без `X-Forwarded-For` от nginx) с ключом
  `BACKUP_TOKEN` из `.env.local`; нет ключа — адрес выключен.
- Фото владельца — зеркало `public/images/own` (без удаления).
- Лежит в `/var/backups/vashfarkop`, 14 последних ночей, и копией на
  хостинге reg.ru в `~/backup-admin` (вне папки сайта).

Восстановить базу:

```bash
systemctl stop vashfarkop-admin
mv /opt/vashfarkop/.pgdata /opt/vashfarkop/.pgdata.old
cd /opt/vashfarkop && node scripts/load-snapshot.mjs /var/backups/vashfarkop/pgdata-ГГГГ-ММ-ДД.tar.gz .pgdata
systemctl start vashfarkop-admin
```

Проверить вручную: `systemctl start vashfarkop-backup; journalctl -u vashfarkop-backup -n 20`.
