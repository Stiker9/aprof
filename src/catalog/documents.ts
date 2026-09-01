/**
 * Документы товара: что показываем и откуда отдаём.
 *
 * У поставщика к каждому товару приложены два PDF — сертификат
 * соответствия и инструкция завода. Сами файлы чистые: это документы
 * производителей, знака конкурента внутри нет, я их открывал. Но лежат
 * они на его домене, и при нажатии в строке браузера у покупателя
 * появлялся адрес конкурирующего магазина. Заказчик это заметил.
 *
 * Сертификаты перенесены к себе: их всего двадцать, по одному на завод,
 * 127 МБ на все — и они закрывают 5 733 товара из 5 808. Ссылка теперь
 * ведёт на наш домен.
 *
 * Инструкции временно скрыты. Их 4 335 штук, по своей на артикул, вместе
 * это около 10,5 ГБ — столько в репозиторий не положишь, нужно отдельное
 * файловое хранилище. Вернём вместе с переездом на российский хостинг,
 * который всё равно предстоит из-за 152-ФЗ: там хранилище и появится.
 *
 * Прятать, а не оставлять чужую ссылку, — сознательный выбор: показывать
 * покупателю дорогу к конкуренту хуже, чем не показывать документ.
 */
import type { ProductRow } from '@/catalog/queries'

/** Адрес сертификата у поставщика → наш файл в public/documents. */
const LOCAL_CERTIFICATES: Record<string, string> = {
  "https://xn--80aumecw.xn--p1ai/sert/%D0%90%D0%B2%D1%82%D0%BE%D0%A1.pdf":
    "/documents/sertifikaty/avtos.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/%D0%90%D0%B2%D1%82%D0%BE%D0%A1%D1%82%D0%B0%D0%BD%D0%B4%D0%B0%D1%80%D1%82.pdf":
    "/documents/sertifikaty/avtostandart.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/Berg.pdf":
    "/documents/sertifikaty/berg.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/%D0%91%D0%B8%D0%B7%D0%BE%D0%BD.pdf":
    "/documents/sertifikaty/bizon.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/%D0%91%D1%83%D0%BA%D1%81%D0%B8%D1%80%D0%BE%D1%84%D1%84.pdf":
    "/documents/sertifikaty/buksiroff.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/FarkopRos25.pdf":
    "/documents/sertifikaty/farkopros25.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/Galia%2023-27.pdf":
    "/documents/sertifikaty/galia-23-27.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/Halty%202028.pdf":
    "/documents/sertifikaty/halty-2028.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/Imiola%202026.pdf":
    "/documents/sertifikaty/imiola-2026.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/%D0%9B%D0%B8%D0%B4%D0%B5%D1%80-%D0%BF%D0%BB%D1%8E%D1%81-2024-2028.pdf":
    "/documents/sertifikaty/lider-plyus-2024-2028.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/MOTODOR.pdf":
    "/documents/sertifikaty/motodor.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/Oris-Weso.pdf":
    "/documents/sertifikaty/oris-weso.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/PT-GROUP.pdf":
    "/documents/sertifikaty/pt-group.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/sheriff-%D1%84%D0%B0%D1%80%D0%BA%D0%BE%D0%BF%D1%8B-2027.pdf":
    "/documents/sertifikaty/sheriff-farkopy-2027.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/steinhof2028.pdf":
    "/documents/sertifikaty/steinhof2028.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/TAVIALS.pdf":
    "/documents/sertifikaty/tavials.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/TowRus.pdf":
    "/documents/sertifikaty/towrus.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/%D0%A2%D1%80%D0%B5%D0%B8%CC%86%D0%BB%D0%B5%D1%80.pdf":
    "/documents/sertifikaty/treyler.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/%D0%A2%D0%A1%D0%A1.pdf":
    "/documents/sertifikaty/tss.pdf",
  "https://xn--80aumecw.xn--p1ai/sert/Zincar%20%D1%84%D0%B0%D1%80%D0%BA%D0%BE%D0%BF%D1%8B.pdf":
    "/documents/sertifikaty/zincar-farkopy.pdf",
}

export type ProductDocument = ProductRow['documents'][number]

/**
 * Оставляет только те документы, которые мы отдаём со своего домена.
 *
 * Инструкции отсеиваются целиком, сертификаты получают локальный путь.
 * Если сертификат в списке не нашёлся (у поставщика появился новый
 * завод), он тоже отсеивается — молча вести на чужой домен нельзя,
 * а увидим мы это по пустому блоку документов.
 */
export function publishableDocuments(documents: ProductDocument[]): ProductDocument[] {
  return documents.flatMap((doc) => {
    const local = LOCAL_CERTIFICATES[doc.url]
    return local ? [{ ...doc, url: local }] : []
  })
}
