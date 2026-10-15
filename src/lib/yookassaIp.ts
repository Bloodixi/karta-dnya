/** Адреса, с которых ЮKassa шлёт HTTP-уведомления (https://yookassa.ru/developers/using-api/webhooks, «Проверка IP-адреса»). Только сервер. */
import { BlockList, isIP } from "node:net";

const NETS: [string, number, "ipv4" | "ipv6"][] = [
  ["185.71.76.0", 27, "ipv4"],
  ["185.71.77.0", 27, "ipv4"],
  ["77.75.153.0", 25, "ipv4"],
  ["77.75.156.11", 32, "ipv4"],
  ["77.75.156.35", 32, "ipv4"],
  ["77.75.154.128", 25, "ipv4"],
  ["2a02:5180::", 32, "ipv6"],
];

const list = new BlockList();
for (const [net, prefix, type] of NETS) list.addSubnet(net, prefix, type);

/** true — адрес из списка ЮKassa. IPv4 в виде IPv6 (::ffff:1.2.3.4) приводится к IPv4. */
export function isYookassaIp(ip: string): boolean {
  const a = ip.trim().replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/i, "");
  const v = isIP(a);
  if (!v) return false;
  return list.check(a, v === 4 ? "ipv4" : "ipv6");
}
