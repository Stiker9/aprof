# Статья 2. Чем отличаются шары A, C и F и какой нужен вам

Опубликована на сайте: `/blog/tipy-sharov-farkopa`. Текст — `src/content/blog/tipy-sharov.tsx`.
Написана по промту `docs/seo/prompt-teksty.md`.

---

## Задача

| Поле | Значение |
|---|---|
| Тип страницы | Статья блога |
| Главный запрос | типы шаров фаркопа |
| Дополнительные запросы | тип шара A, C, F фаркоп; шар на двух болтах; быстросъёмный шар фаркопа; фланцевый шар; какой фаркоп выбрать съёмный или нет; тип шара AV AH H E |
| Интент | Сравнить и выбрать → перейти в подбор |
| Регион | Вся Россия |
| Объём | ~1 300 слов |

## План

1. Короткий ответ: A — болты и ключ, C — рукой, F — фланец для тяжёлых машин.
2. Сравнительная таблица с нагрузками из нашего каталога.
3. Каждый тип отдельно: как держится, плюсы, минусы, на какие машины.
4. Остальные буквы: AV, AH, H, E.
5. Как выбрать — таблица «ситуация → тип».
6. Ссылка на статью о массе прицепа и в подбор.
7. Частые вопросы.

## SEO-поля

- **URL:** `/blog/tipy-sharov-farkopa`
- **Title** (55): Типы шара фаркопа A, C и F: чем отличаются и что выбрать
- **Description** (150): Шар A на двух болтах, быстросъёмный C и фланцевый F: как крепятся, сколько держат и какой выбрать под вашу машину и частоту поездок с прицепом.
- **H1:** Чем отличаются шары A, C и F и какой нужен вам
- **Разметка:** Article + FAQPage + BreadcrumbList (ставятся шаблоном страницы).

## Чем статья сильнее конкурентов

Цифры взяты из нашего каталога (8 тысяч фаркопов), а не пересказаны с чужих сайтов:

| Тип | Позиций | Прицеп / шар, медиана | Медианная цена поставщика |
|---|---:|---|---:|
| A | 2 599 | 1 500 / 75 кг | 18 530 ₽ |
| C | 665 | 1 600 / 80 кг | 30 990 ₽ |
| F | 245 | 2 300 / 100 кг (до 3 500) | 19 490 ₽ |
| AV | 590 | 1 950 / 90 кг | 52 990 ₽ |
| AH | 179 | 1 500 / 75 кг | 49 990 ₽ |
| H | 85 | 1 000 / 50 кг | 6 300 ₽ |

- C — почти целиком GALIA (642 из 668), легковые: Peugeot, Hyundai, BMW, Corolla, Focus.
- F — Land Cruiser, Transit, Sprinter, Pajero, Hilux, Patrol, Iveco Daily.
- В статье цены даны только соотношением («в 1,7 раза», «почти втрое»): рублёвые цены — поставщика, без нашей наценки.

## Обложка — промт для Nano Banana

Сейчас на странице временная обложка (студийный Prado). Новая должна показывать сам предмет статьи — съёмный шар фаркопа — и по настроению совпадать с обложкой первой статьи (северное лето, естественный свет, фотореализм).

**Основной вариант** — рука вставляет быстросъёмный шар:

```
Photorealistic close-up photograph, rear of a dark graphite crossover SUV parked on a gravel road by a Nordic lake in summer, pine forest softly blurred in the background. A man's hand is inserting a detachable chrome tow ball (50 mm ball on a curved steel neck) into the black receiver socket under the rear bumper. The ball and the receiver are the sharp focal point in the right third of the frame; the bumper, tail light and part of the rear wheel are visible but cropped. Soft late-afternoon sunlight from the side, natural warm tones, shallow depth of field, slight film grain, shot on a full-frame camera, 85mm lens, f/2.8. Clean realistic mechanics, correct proportions, no rust. No text, no logos, no brand emblems, no readable license plate (plate out of frame). Aspect ratio 16:9, high resolution.
```

**Запасной вариант** — три шара на верстаке (сложнее для нейросети: может нарисовать неправдоподобное крепление):

```
Photorealistic top-down product photograph of three different car tow balls lying side by side on a worn wooden workbench in a clean auto workshop: left — a tow ball on a steel bracket with two bolt holes; center — a detachable tow ball with a curved neck and a small locking lever; right — a heavy cast tow ball with a flat square flange and two large bolt holes. Each ball is 50 mm, galvanized and chrome finish. Soft daylight from a large window, gentle shadows, neutral warm tones, a few wrenches and bolts scattered near the edges, blurred garage background. Sharp focus, realistic metal texture, correct industrial proportions. No text, no labels, no logos. Aspect ratio 16:9, high resolution.
```

**Как поставить готовую картинку:** положить файл в проект — я сожму её в `public/images/blog/tipy-sharov.webp` (1600×900, ~300 КБ) и заменю `image` и `imageAlt` в `src/content/blog/posts.ts`.

## Источники

- [farkop36.ru — типы шаров фаркопов: A, F (FC), G, H, C, E](https://farkop36.ru/info/statyi/tipi-sharov-farkopov)
- [uralfarkop.ru — виды фаркопов и классификация шаров: болты М12 у A, М16 у F](https://uralfarkop.ru/stati/raznovidnosti-tjagovo-stsepnyh-ustrojstv.-%C2%A0vidy-farkopov-i-klassifikatsija-sharov.)
- [Багажникофф — виды фаркопов](https://xn--80aabjqmowl4da.xn--p1ai/blog/2017/07/17/vidy-farkopov/)
- [auto.ru — прицеп или фаркоп закрывает номер](https://auto.ru/mag/article/pricep-zakryvaet-nomernoy-znak-chto-delat-otvechaet-yurist/)
- Каталог VASHFARKOP — `data/catalog.json.gz`, выборка на 21.10.2026.
