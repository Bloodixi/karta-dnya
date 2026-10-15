/** Письма с сайта от help@karta-dnya.ru через SMTP VK WorkSpace (SMTP_USER / SMTP_PASSWORD — пароль внешнего приложения). Только сервер. */
import nodemailer from "nodemailer";

let transport: nodemailer.Transporter | null = null;

export function mailReady(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

export async function sendMail(m: { to: string; subject: string; text: string; html: string }): Promise<void> {
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.mail.ru",
    port: 465,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  await transport.sendMail({ from: { name: "Карта дня", address: process.env.SMTP_USER! }, ...m });
}
