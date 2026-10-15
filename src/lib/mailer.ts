/**
 * Письма с сайта от help@karta-dnya.ru через SMTP VK WorkSpace (SMTP_USER / SMTP_PASSWORD — пароль внешнего приложения). Только сервер.
 * Хостинг VPS закрывает исходящие 465 и 587, поэтому по умолчанию 2525 со STARTTLS (SMTP_PORT).
 */
import nodemailer from "nodemailer";

let transport: nodemailer.Transporter | null = null;

export function mailReady(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

export type Inline = { cid: string; filename: string; content: Buffer; contentType: string };

export async function sendMail(m: { to: string; subject: string; text: string; html: string; inline?: Inline[] }): Promise<void> {
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.mail.ru",
    port: Number(process.env.SMTP_PORT) || 2525,
    secure: Number(process.env.SMTP_PORT) === 465,
    requireTLS: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  const { inline, ...rest } = m;
  await transport.sendMail({ from: { name: "Карта дня", address: process.env.SMTP_USER! }, ...rest, attachments: inline?.map((a) => ({ ...a, contentDisposition: "inline" as const })) });
}
