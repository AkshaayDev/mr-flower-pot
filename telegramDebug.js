require("dotenv").config();
const chatid = process.env.TELEGRAM_DEBUGCHAT;
const token = process.env.TELEGRAM_TOKEN;
const message = "Hello, World!";

const send = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatid}&text=${message}`;
const reset = `https://api.telegram.org/bot${token}/getUpdates?offset=-1`;
const get = `https://api.telegram.org/bot${token}/getMe`;
console.log(send);
console.log(reset);
console.log(get);