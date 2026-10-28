import Script from 'next/script'
import { Suspense } from 'react'
import { MetrikaRouteHits } from './metrika-route-hits'

/**
 * Яндекс Метрика — счётчик посещений.
 *
 * Счётчик заведён 26.10.2026 в аккаунте заказчика (avt0.spb), номер
 * ниже. Вебвизор включён: запись того, как посетитель листает страницу
 * и куда нажимает.
 *
 * Только Метрика, без Google Analytics: в России сервисы, которые
 * передают данные посетителей за границу, — риск штрафа по 152-ФЗ.
 *
 * Скрипт грузится после того, как страница стала интерактивной
 * (afterInteractive), а не в начале: счётчик не должен задерживать
 * первый экран — от его скорости зависят и позиции, и терпение
 * посетителя. Сам tag.js Яндекс тоже грузит асинхронно.
 *
 * Код и настройки — как выдала Метрика при создании счётчика
 * (вкладка «HTML», 26.10.2026).
 *
 * Переходы между страницами Next делает без перезагрузки, поэтому
 * просмотры после первого отправляет MetrikaRouteHits. Он в Suspense:
 * useSearchParams в статической выгрузке без него ломает сборку.
 *
 * Только в боевой сборке: иначе каждый перезапуск dev-сервера и каждое
 * открытие localhost шли бы в статистику заказчика визитом.
 */
export const METRIKA_ID = 113801167

export function Metrika() {
  if (process.env.NODE_ENV !== 'production') return null

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}", "ym");
ym(${METRIKA_ID}, "init", { ssr: true, webvisor: true, clickmap: true, ecommerce: "dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce: true, trackLinks: true });`}
      </Script>
      <Suspense fallback={null}>
        <MetrikaRouteHits id={METRIKA_ID} />
      </Suspense>
      <noscript>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://mc.yandex.ru/watch/${METRIKA_ID}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  )
}
