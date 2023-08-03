import puppeteer from "puppeteer";
import TelegramBot from "node-telegram-bot-api";

const telegramToken = '6451340423:AAHCXyYw61Vl6YeD_YAVWN09jrWoofSDmpQ';
const chatId = '-920624938'; // Puedes obtenerlo al enviar un mensaje al bot y leerlo desde la propiedad "chat.id" del objeto recibido
const bot = new TelegramBot(telegramToken, { polling: true });

async function scrapeFlightPrice() {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--incognito',
      ]
    });
    const page = await browser.newPage();

    // URL del sitio web que quieres hacer scraping
    const url = 'https://www.despegar.com.ar/shop/flights/results/roundtrip/SCL/BKK/2024-02-17/2024-03-12/1/0/0?from=SB&di=1-0';
    await page.goto(url);

    // Espera a que el elemento que contiene el precio aparezca en la página
    await page.waitForSelector('.amount');

    // Obtiene el precio de la página
    const priceElement = await page.$('.amount');
    const price = await page.evaluate(element => element.textContent, priceElement);

    console.log(`Precio encontrado: ${price}`);

    // Cierra el navegador de Puppeteer
    await browser.close();

    return price;
  } catch (error) {
    console.error('Error en el scraping:', error);
    return null;
  }
}

async function checkPriceAndNotify() {
  const price = await scrapeFlightPrice();

  if (price) {
    const message = `El precio actual del vuelo es: ${price}`;
    bot.sendMessage(chatId, message);
  } else {
    const errorMessage = 'Lo siento, no se pudo obtener el precio en este momento. Inténtalo de nuevo más tarde.';
    bot.sendMessage(chatId, errorMessage);
  }
}

bot.onText(/precio/i, async (msg) => {
  const chatId = msg.chat.id;
  const price = await scrapeFlightPrice();

  if (price) {
    const message = `El precio actual del vuelo es: ${price}`;
    bot.sendMessage(chatId, message);
  } else {
    const errorMessage = 'Lo siento, no se pudo obtener el precio en este momento. Inténtalo de nuevo más tarde.';
    bot.sendMessage(chatId, errorMessage);
  }
});

// Ejecuta la función checkPriceAndNotify cada cierto intervalo (por ejemplo, cada 20 segundos)
setInterval(checkPriceAndNotify, 3600000);

// Ejecuta checkPriceAndNotify al inicio para notificar el precio actual (opcional)
checkPriceAndNotify();
