import { Bot, InlineKeyboard } from 'grammy';

function webAppUrl(path) {
  const base = process.env.PUBLIC_BASE_URL;
  if (!base) return null;
  return `${base}${path}`;
}

export function startBots() {
  const passengerToken = process.env.BOT_PASSENGER_TOKEN;
  const driverToken = process.env.BOT_DRIVER_TOKEN;
  const adminToken = process.env.BOT_ADMIN_TOKEN;

  if (passengerToken) {
    const bot = new Bot(passengerToken);

    bot.command('start', async (ctx) => {
      const url = webAppUrl('/app/?bot=passenger');
      const kb = new InlineKeyboard().webApp('🚕 PayTaksi - Sifariş ver', url);
      await ctx.reply('PayTaksi 👋\nSifariş üçün düyməyə basın:', { reply_markup: kb });
    });

    bot.catch((e) => console.error('PassengerBot error', e));
    bot.start();
    console.log('Passenger bot started');
  }

  if (driverToken) {
    const bot = new Bot(driverToken);

    bot.command('start', async (ctx) => {
      const url = webAppUrl('/driver/?bot=driver');
      const kb = new InlineKeyboard().webApp('🧑‍✈️ Sürücü paneli', url);
      await ctx.reply('PayTaksi Sürücü 👋\nPanelə keçin:', { reply_markup: kb });
    });

    bot.command('panel', async (ctx) => {
      const url = webAppUrl('/driver/?bot=driver');
      const kb = new InlineKeyboard().webApp('🧑‍✈️ Sürücü paneli', url);
      await ctx.reply('Panel:', { reply_markup: kb });
    });

    bot.catch((e) => console.error('DriverBot error', e));
    bot.start();
    console.log('Driver bot started');
  }

  if (adminToken) {
    const bot = new Bot(adminToken);

    bot.command('start', async (ctx) => {
      const url = webAppUrl('/admin/');
      await ctx.reply('PayTaksi Admin 👋\nAdmin panel: ' + (url || '(PUBLIC_BASE_URL set edin)'));
    });

    bot.catch((e) => console.error('AdminBot error', e));
    bot.start();
    console.log('Admin bot started');
  }
}
