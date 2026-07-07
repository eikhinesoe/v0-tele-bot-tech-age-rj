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

// ✅ FREE MODELS - tries each one until one works
const FREE_MODELS = [
  "openai/gpt-3.5-turbo",
  "meta-llama/llama-3.1-8b-instruct",
  "google/gemma-2-9b-it",
  "mistralai/mistral-7b-instruct",
  "meta-llama/llama-3.1-8b-instruct:free",
  "google/gemma-3-12b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "qwen/qwen3-8b:free",
]

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

// ✅ OPENROUTER AI FUNCTION WITH FALLBACK
async function getAIResponse(prompt: string): Promise<string> {
  for (const model of FREE_MODELS) {
    try {
      console.log(`🚀 Trying model: ${model}`)

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://vercel.com",
            "X-Title": "Telegram AI Bot",
          },
          body: JSON.stringify({
            model: model,
            messages: [
  {
    role: "system",
    content:
      "You are a Japanese educational assistant for students. Explain everything in simple Japanese with examples.",
  },
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

      console.log(`📡 ${model} Status: ${response.status}`)

      // If rate limited, try next model
      if (response.status === 429) {
        console.log(`⏭️ ${model} rate limited, trying next...`)
        continue
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ ${model} error:`, response.status, errorText)
        continue
      }

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content

      if (!text) {
        console.log(`⚠️ ${model} returned empty, trying next...`)
        continue
      }

      console.log(`✅ Success with: ${model}`)
      return text

    } catch (error) {
      console.error(`❌ ${model} failed:`, error)
      continue
    }
  }

  // All models failed
  return "⚠️ All AI models are busy right now. Please try again in a minute."
}

// ✅ TELEGRAM WEBHOOK
export async function POST(request: NextRequest) {
  try {
    console.log("🔥 OPENROUTER DEPLOYMENT ACTIVE")

    // ❌ CHECK ENV VARIABLES
    if (!TELEGRAM_BOT_TOKEN || !OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "Missing environment variables" },
        { status: 500 }
      )
    }

    // ✅ GET TELEGRAM DATA
    const body: TelegramMessage = await request.json()

    // Ignore non-text messages
    if (!body.message?.text || !body.message?.chat?.id) {
      return NextResponse.json({ ok: true })
    }

    const chatId = body.message.chat.id
    const userMessage = body.message.text
    const userName = body.message.from?.first_name || "User"

    // ✅ START COMMAND
    if (userMessage === "/start") {
      await sendTelegramMessage(
        chatId,
        `Hello ${userName}!\n\nI'm your AI assistant powered by OpenRouter AI 🚀\n\nSend me any message and I'll help you.`
      )
      return NextResponse.json({ ok: true })
    }

    // ✅ GET AI RESPONSE
    const aiResponse = await getAIResponse(userMessage)

    // ✅ SEND TO TELEGRAM
    await sendTelegramMessage(chatId, aiResponse)

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error("❌ Webhook Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ✅ HEALTH CHECK
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Telegram OpenRouter Bot is running 🚀",
  })
}
