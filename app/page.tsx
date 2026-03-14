import { Bot, Sparkles, MessageCircle, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center gap-8">
          <div className="flex items-center gap-3">
            <Bot className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">TeleBot TechAge</h1>
          </div>
          
          <p className="text-xl text-muted-foreground max-w-2xl">
            Your AI-powered Telegram assistant built with Gemini. 
            Smart, fast, and always ready to help.
          </p>

          <div className="grid gap-6 md:grid-cols-3 mt-8 w-full max-w-4xl">
            <Card>
              <CardHeader>
                <Sparkles className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Gemini AI</CardTitle>
                <CardDescription>
                  Powered by Google&apos;s advanced Gemini AI model for intelligent responses
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MessageCircle className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Telegram Bot</CardTitle>
                <CardDescription>
                  Chat directly in Telegram - no apps to install, just start messaging
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Instant Replies</CardTitle>
                <CardDescription>
                  Get fast, helpful answers to any question, 24/7
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card className="mt-8 w-full max-w-2xl">
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent className="text-left space-y-3">
              <p><strong>1.</strong> Open Telegram and search for your bot</p>
              <p><strong>2.</strong> Send <code className="bg-muted px-2 py-1 rounded">/start</code> to begin</p>
              <p><strong>3.</strong> Ask any question and get AI-powered answers</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
