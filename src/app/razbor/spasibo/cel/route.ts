export const dynamic = "force-dynamic";

/**
 * Скрытая страница-посредник для цели «razbor_paid». Её открывает iframe со страницы «Спасибо» (RazborPaidGoal):
 * сама «Спасибо» остаётся без Метрики, потому что в её адресе номер заказа (он же короткая ссылка на разбор).
 * Здесь адрес чистый, Referer нет, счётчик без просмотра, карты кликов, ссылок и вебвизора — уходит только цель
 * с суммой. Данные приходят postMessage только от родительской страницы того же сайта.
 */
export function GET() {
  const id = process.env.METRIKA_ID;
  if (!id || !/^\d+$/.test(id)) return new Response("Not found", { status: 404 });
  const script = `(function(){
var id=${id},origin=location.origin,started=false;
function reply(ok){parent.postMessage({type:"razbor-goal-done",ok:ok},origin);}
addEventListener("message",function(e){
  if(started||e.origin!==origin||e.source!==parent)return;
  var d=e.data;if(!d||d.type!=="razbor-paid")return;
  var price=Number(d.price);if(!(price>0)||price>1e6)return;
  started=true;
  var ym=window.ym=function(){(ym.a=ym.a||[]).push(arguments);};ym.l=Date.now();
  var s=document.createElement("script");s.async=true;s.src="https://mc.yandex.ru/metrika/tag.js";s.onerror=function(){reply(false);};
  document.head.appendChild(s);
  ym(id,"init",{defer:true,clickmap:false,trackLinks:false,accurateTrackBounce:false,webvisor:false});
  ym(id,"reachGoal","razbor_paid",{order_price:price,currency:"RUB"},function(){reply(true);});
});
parent.postMessage({type:"razbor-goal-ready"},origin);
})();`;
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title>Оплата разбора</title></head><body><script>${script}</script></body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
