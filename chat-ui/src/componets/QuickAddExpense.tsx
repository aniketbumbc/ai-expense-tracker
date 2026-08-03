import { useState } from 'react'
import { Plus } from 'lucide-react'

type Props = {
  onSubmit: (userInput: string) => void
}

export function QuickAddExpense({ onSubmit }: Props) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const expenseText = input.trim()
    if (expenseText) {
      onSubmit(`Add an expense: ${expenseText}`)
      setInput('')
    }
  }

  return (
    <div className="w-full max-w-2xl px-4 mb-4">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 bg-muted/40 rounded-2xl border border-border focus-within:border-purple-500 transition-all px-4 py-3">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-linear-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
            <Plus className="w-4.5 h-4.5 text-white" />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add an expense, e.g. Coffee $5.50"
            className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium bg-linear-to-br from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white">
            Add
          </button>
        </div>
      </form>
    </div>
  )
}
