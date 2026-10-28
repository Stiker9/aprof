# Статья 3. Блок согласования: зачем он нужен и что будет без него

Подключена локально: `/blog/blok-soglasovaniya`. Текст — `src/content/blog/blok-soglasovaniya.tsx`.
Написана по промту `docs/seo/prompt-teksty.md`. На хостинг не выкладывается.

---

## Задача

| Поле | Значение |
|---|---|
| Тип страницы | Статья блога |
| Главный запрос | блок согласования для фаркопа |
| Дополнительные запросы | зачем нужен блок согласования; смарт-коннект фаркоп; что будет без блока согласования; штатная электрика фаркопа или универсальная; подключение электрики фаркопа; нужен ли блок согласования |
| Интент | Узнать → заказать установку электрики |
| Регион | Вся Россия, установка — СПб |
| Объём | ~1 200 слов |

## План

1. Короткий ответ: что это и почему нужен.
2. Как работает: слушает сигналы, питает прицеп от АКБ.
3. Что будет без него — список последствий.
4. Нужен ли вашей машине: три признака и примеры из каталога, где граница — год выпуска.
5. Универсальный блок или штатная электрика — таблица.
6. Электрика не в комплекте фаркопа — данные каталога, розетка 7/13.
7. Ссылки на услугу, установку, подбор и две прошлые статьи.
8. Частые вопросы.

## SEO-поля

- **URL:** `/blog/blok-soglasovaniya`
- **Title** (59): Блок согласования фаркопа: зачем нужен и что будет без него
- **Description** (146): Как работает блок согласования фаркопа, на каких машинах он нужен, что будет без него и чем универсальный блок отличается от штатной электрики.
- **H1:** Блок согласования: зачем он нужен и что будет без него
- **Разметка:** Article + FAQPage + BreadcrumbList (шаблон страницы).

## Свои данные из каталога

- 3 674 фаркопа из ~5 800 помечены «без электрики в комплекте», с электрикой — 2.
- GALIA прямо пишет, с какого года нужен блок: Citroen C5 универсал — с 2005, Xsara Picasso — с 2006, FIAT Panda — с 2005. На этом построен тезис «граница — год, а не марка».

## Что сознательно не вошло

- **Штрафы за неработающие фонари прицепа.** Источники расходятся (ст. 12.5 или 12.20 КоАП), первоисточник не нашёл — не пишем.
- **Цены и сроки установки.** На сайте пока заглушки, ждут заказчика.
- **Названия брендов блоков** (кроме нарицательного Smart Connect) — не продаём, проверить не можем.

## Обложка — промт для Nano Banana

Сейчас временная обложка (`/images/odin-vizit.webp`, общий кадр фаркопа). Формат как у прошлых: 16:9, 2K, главное по центру по высоте.

Идея (согласована 26.10): синие сумерки, машина тянет прицеп, фонари прицепа горят синхронно с фонарями машины — визуально «электрика прицепа работает как штатная».

```
Cinematic photorealistic photograph at blue hour, shortly after sunset. Rear three-quarter view of a dark graphite mid-size SUV towing a compact enclosed cargo trailer along a two-lane country road through a Nordic pine forest, a calm lake glimpsed between the trees on the right. The scene is about lights working in sync: the SUV's LED tail lights and the trailer's tail lights glow the same deep red, and the left turn signals on both the car and the trailer blink amber at the same moment. The towbar and the coiled trailer cable between the car and the trailer are visible and slightly lit by the tail lights. Wet asphalt after light rain reflects the red and amber light in long streaks. Deep blue sky with a faint warm glow on the horizon, soft mist low over the road, cool ambient tones contrasting with warm vehicle lights. Car and trailer in sharp focus, placed in the center band of the frame with calm empty space above (sky) and below (road), background softly blurred. Shot on a full-frame camera, 50mm lens, f/2.8, slight motion feel on the road surface, natural film grain, realistic proportions and correct trailer coupling geometry. No text, no logos, no brand emblems, no readable license plates, no people. 16:9, 2K.
```

## Источники

- [avtotuning.by — принцип работы и разновидности блоков согласования](https://www.avtotuning.by/articles/dlya-chego-nuzhen-blok-soglasovaniya-farkopa/)
- [DRIVE2, ES-AUTO — штатная электрика против универсального блока](https://www.drive2.ru/o/b/583092732638034425/)
- [farkopov.ru — блок согласования: для чего нужен](https://farkopov.ru/blok-soglasovaniya/)
- [196.ru — что это и как работает](https://www.196.ru/blog/blok-soglasovaniya-dlya-farkopa-dlya-chego-nuzhen-i-kak-rabotaet/)
- [farkop.ru — как подключить электрику фаркопа](https://farkop.ru/articles/kak-podklyuchit-elektriku-farkopa/)
- Каталог VASHFARKOP — `data/catalog.json.gz`, выборка на 26.10.2026.
