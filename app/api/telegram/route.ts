import { NextRequest, NextResponse } from "next/server"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

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

async function sendTelegramMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

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

// ✅ GEMINI FUNCTION
async function getGeminiResponse(prompt: string): Promise<string> {
  try {

    // ✅ TEMP TEST
    return "TEST NEW CODE"

    // 🔥 Gemini API request
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          },
        }),
      }
    )

    // 🚨 RATE LIMIT
    if (response.status === 429) {
      return "⏳ Too many requests right now. Please try again later."
    }

    // 🚨 DEBUGGING
    if (!response.ok) {
      const errorText = await response.text()

      console.error(
        "Gemini API FULL ERROR:",
        response.status,
        errorText
      )

      return `⚠️ Gemini Error ${response.status}`
    }

    const data = await response.json()

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return "⚠️ No response generated."
    }

    return text

  } catch (error) {
    console.error("Gemini error:", error)

    return "⚠️ Something went wrong."
  }
}

export async function POST(request: NextRequest) {
  try {

    if (!TELEGRAM_BOT_TOKEN || !GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Missing environment variables" },
        { status: 500 }
      )
    }

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
        `Hello ${userName}!\n\nI'm your AI assistant powered by Gemini.`
      )

      return NextResponse.json({ ok: true })
    }

    // 🔥 GET AI RESPONSE
    const aiResponse = await getGeminiResponse(userMessage)

    // 📩 SEND TO TELEGRAM
    await sendTelegramMessage(chatId, aiResponse)

    return NextResponse.json({ ok: true })

  } catch (error) {

    console.error("Webhook error:", error)

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
    message: "TeleBot TechAge is running",
    version: "1.0.0",
  })
}
