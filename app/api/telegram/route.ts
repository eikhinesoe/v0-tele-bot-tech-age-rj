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
      text: text,
      parse_mode: "Markdown",
    }),
  })
}

async function getGeminiResponse(prompt: string): Promise<string> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
            maxOutputTokens: 1024,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      throw new Error("No response from Gemini")
    }

    return generatedText
  } catch (error) {
    console.error("Gemini error:", error)
    return "Sorry, I encountered an error processing your request. Please try again."
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!TELEGRAM_BOT_TOKEN || !GEMINI_API_KEY) {
      console.error("Missing environment variables")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const body: TelegramMessage = await request.json()
    
    if (!body.message?.text || !body.message?.chat?.id) {
      return NextResponse.json({ ok: true })
    }

    const chatId = body.message.chat.id
    const userMessage = body.message.text
    const userName = body.message.from?.first_name || "User"

    // Handle /start command
    if (userMessage === "/start") {
      await sendTelegramMessage(
        chatId,
        `Hello ${userName}! 👋\n\nI'm your AI assistant powered by Gemini. Send me any message and I'll help you!\n\nYou can ask me:\n• Questions on any topic\n• Help with writing or coding\n• Creative ideas and suggestions\n• And much more!`
      )
      return NextResponse.json({ ok: true })
    }

    // Get AI response
    const aiResponse = await getGeminiResponse(userMessage)
    await sendTelegramMessage(chatId, aiResponse)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Telegram webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: "Telegram bot webhook is running",
    message: "Send POST requests to this endpoint from Telegram"
  })
}
