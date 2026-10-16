/** Данные печатного буклета разбора для серверных страниц …/buklet: документ, банк вопросов, стиль, QR онлайн-версии. Только сервер. */
import { readJsonData } from "./content";
import { buildRazbor, type RazborInput } from "./razbor";
import { isBookletStyle, type BookletQuestions, type BookletStyle } from "./razborBooklet";
import { qrSvg } from "./receiptView";

/** Стиль: ?style=obs|geo|bot, иначе RAZBOR_BOOKLET_STYLE, иначе «Ботаника». */
export function bookletStyle(param: string | string[] | undefined): BookletStyle {
  const p = Array.isArray(param) ? param[0] : param;
  if (isBookletStyle(p)) return p;
  const env = process.env.RAZBOR_BOOKLET_STYLE;
  return isBookletStyle(env) ? env : "bot";
}

/** onlineUrl — адрес онлайн-версии этого разбора: QR на задней обложке. */
export async function bookletData(input: RazborInput, onlineUrl: string) {
  return {
    doc: buildRazbor(input),
    questions: readJsonData<BookletQuestions>("razbor/questions.json", {}),
    qr: await qrSvg(onlineUrl).catch(() => ""),
  };
}
