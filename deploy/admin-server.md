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
