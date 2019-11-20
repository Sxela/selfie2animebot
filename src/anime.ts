
var Telegraf = require('telegraf')
var uuidv4 = require('uuid/v4')

import * as ratelimit from 'telegraf-ratelimit';

var Algorithmia = require('algorithmia');
var client = Algorithmia.client(process.env.ALGO_KEY)
var session = require('telegraf/session')

console.log('Loaded Algorithmia client')

async function selfie2anime (image, ctx): Promise<string> {

  let out = 'data://defileroff/selfie2anime_out/'+uuidv4()+'.jpg'
  let request = {"in":image, "out":out}
  console.log('sent to algo')
  const response = await client
    .algo('defileroff/selfie2anime/0.1.0')
    .pipe(request)

    if (!response.error){
      return new Promise((resolve, reject) =>
        client.file(out).get((err, result) => err ? reject(err) : resolve(result))
      )}
    else return '-1'
}

async function handleImage(ctx){
  ctx.reply('Got your photo 👍 Doing my magic, please wait!')
  var img = ctx.update.message.photo[ctx.update.message.photo.length-1]
  var link = await ctx.telegram.getFileLink(img.file_id)
  ctx.session.link = link;
    
  const animeImage = await selfie2anime(link, ctx)
  try {
    if (animeImage == '-1') {ctx.reply('Something went wrong!')} 
    else {
      await ctx.replyWithChatAction('upload_photo')
      await ctx.replyWithPhoto({ source: animeImage, filename: "anime.jpg" })
    }
  }
  catch(error){
    console.log(error)
  }
}

const limitConfig = {
  window: 1000 * 60 * 60,
  limit: 120,  
  keyGenerator: function (ctx) {
    return ctx.chat.id
  },
  onLimitExceeded: (ctx, next) => ctx.reply('😭 Rate limit exceeded: 20 photo per 60 minutes')
}

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(ratelimit(limitConfig))
bot.use(session())

bot.start((ctx) => ctx.reply('Welcome to selfie2anime bot! Send me your selfie and I will show you how you would`ve looked as an anime character! Works on girls only.' ))
bot.help((ctx) => ctx.reply('Send me our selfie and I will show you how you would`ve looked as an anime character! Please place your face in the center of the photo for best results!'))
bot.on('photo', async (ctx) => {
  handleImage(ctx)
})

console.log('lauching')
bot.launch()

