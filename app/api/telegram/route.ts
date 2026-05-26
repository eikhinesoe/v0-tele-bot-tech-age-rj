import { NextRequest, NextResponse } from "next/server"

// ✅ ENV VARIABLES
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

// ✅ TELEGRAM MESSAGE TYPE
interface TelegramMessage {
  message?: {
    chat: {
      id: number
    }
    text?: string
    from?: {
      first_name?: string
    }
  }
}

// ✅ SEND MESSAGE TO TELEGRAM
async function sendTelegramMessage(
  chatId: number,
  text: string
) {

  const url =
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

  await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  })
}

// ✅ OPENROUTER AI FUNCTION
async function getAIResponse(
  prompt: string
): Promise<string> {

  try {

    console.log("🚀 Sending request to OpenRouter")

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "Authorization":
            `Bearer ${OPENROUTER_API_KEY}`,

          "HTTP-Referer":
            "https://vercel.com",

          "X-Title":
            "Telegram AI Bot",
        },

        body: JSON.stringify({

          // ✅ FREE MODEL
          model:
            "deepseek/deepseek-v4-flash:free",

          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],

          temperature: 0.7,
          max_tokens: 300,
        }),
      }
    )

    console.log(
      "📡 OpenRouter Status:",
      response.status
    )

    // ❌ HANDLE API ERROR
    if (!response.ok) {

      const errorText =
        await response.text()

      console.error(
        "❌ OpenRouter FULL ERROR:",
        response.status,
        errorText
      )

      return `⚠️ OpenRouter Error ${response.status}`
    }

    // ✅ PARSE RESPONSE
    const data = await response.json()

    const text =
      data.choices?.[0]?.message?.content

    if (!text) {
      return "⚠️ No AI response generated."
    }

    return text

  } catch (error) {

    console.error(
      "❌ OpenRouter Error:",
      error
    )

    return "⚠️ Something went wrong."
  }
}

// ✅ TELEGRAM WEBHOOK
export async function POST(
  request: NextRequest
) {

  try {

    console.log(
      "🔥 OPENROUTER DEPLOYMENT ACTIVE"
    )

    // ❌ CHECK ENV VARIABLES
    if (
      !TELEGRAM_BOT_TOKEN ||
      !OPENROUTER_API_KEY
    ) {

      return NextResponse.json(
        {
          error:
            "Missing environment variables",
        },
        {
          status: 500,
        }
      )
    }

    // ✅ GET TELEGRAM DATA
    const body: TelegramMessage =
      await request.json()

    // Ignore non-text messages
    if (
      !body.message?.text ||
      !body.message?.chat?.id
    ) {

      return NextResponse.json({
        ok: true,
      })
    }

    const chatId =
      body.message.chat.id

    const userMessage =
      body.message.text

    const userName =
      body.message.from?.first_name ||
      "User"

    // ✅ START COMMAND
    if (userMessage === "/start") {

      await sendTelegramMessage(
        chatId,

        `Hello ${userName}!

I'm your AI assistant powered by OpenRouter AI 🚀

Send me any message and I'll help you.`
      )

      return NextResponse.json({
        ok: true,
      })
    }

    // ✅ GET AI RESPONSE
    const aiResponse =
      await getAIResponse(userMessage)

    // ✅ SEND TO TELEGRAM
    await sendTelegramMessage(
      chatId,
      aiResponse
    )

    return NextResponse.json({
      ok: true,
    })

  } catch (error) {

    console.error(
      "❌ Webhook Error:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Internal server error",
      },
      {
        status: 500,
      }
    )
  }
}

// ✅ HEALTH CHECK
export async function GET() {

  return NextResponse.json({
    status: "ok",
    message:
      "Telegram OpenRouter Bot is running 🚀",
  })
}
