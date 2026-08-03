import { useState, useRef, useEffect } from 'react'

type Props = {
  onSubmit: (userInput: string) => void
}

export function ChatInput({ onSubmit }: Props) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const userInput = input.trim()
    if (userInput) {
      onSubmit(userInput)
      setInput('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const userInput = input.trim()

      onSubmit(userInput)
      setInput('')

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  return (
    <div className="bg-background backdrop-blur-xl w-full">
      <div className="w-full max-w-5xl mx-auto p-2 mb-2 box">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-end gap-3 bg-card rounded-3xl border border-border focus-within:border-purple-500 transition-all shadow-2xl dark:shadow-black/40">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              disabled={false}
              rows={1}
              className="flex-1  text-foreground placeholder-muted-foreground px-6 py-6 resize-none focus:outline-none max-h-48 overflow-y-auto disabled:opacity-50 text-base"
            />
            <button
              type="submit"
              disabled={false}
              className="shrink-0 m-2.5 p-3.5 rounded-2xl bg-linear-to-br from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-purple-500/50 disabled:hover:shadow-none hover:scale-105 active:scale-95">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}