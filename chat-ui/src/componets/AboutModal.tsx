import { useEffect } from 'react'
import {
  X,
  Zap,
  MessageCircle,
  Sparkles,
  PieChart,
  Download,
} from 'lucide-react'

type Props = {
  onClose: () => void
  onGetStarted: () => void
}

const steps = [
  {
    icon: MessageCircle,
    title: 'Just chat about your spending',
    description:
      'Tell it what you spent, like texting a friend: "Spent $42 on lunch with the team." No forms, no spreadsheets.',
  },
  {
    icon: Sparkles,
    title: 'It organizes everything for you',
    description:
      'Every expense is automatically sorted into the right category — nothing to file, nothing to remember.',
  },
  {
    icon: PieChart,
    title: 'Ask anything, anytime',
    description:
      '"How much did I spend on travel this month?" Get a clear answer in seconds, whenever you need it.',
  },
  {
    icon: Download,
    title: 'Clean books, always ready',
    description:
      'Export a tidy summary whenever you need it — for taxes, reports, or just peace of mind.',
  },
]

export function AboutModal({ onClose, onGetStarted }: Props) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="About Ledger"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <div className="relative rounded-t-2xl bg-linear-to-br from-purple-600 via-pink-600 to-orange-500 p-8 text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full p-1.5 text-white/80 hover:bg-white/15 hover:text-white transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Zap className="h-5 w-5 fill-white text-white" />
            </div>
            <span className="text-lg font-bold">Ledger</span>
          </div>
          <h2 className="mt-6 max-w-md text-3xl font-extrabold leading-tight">
            Your expenses, tracked as easily as a conversation.
          </h2>
          <p className="mt-3 max-w-md text-white/80">
            Ledger is an AI expense tracker built for anyone who'd rather chat
            than fill out forms.
          </p>
        </div>

        <div className="p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            How it works
          </h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {steps.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex flex-col gap-3 rounded-xl border border-border bg-background p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-purple-500 via-pink-500 to-orange-500 text-white shadow-md">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {title}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-border bg-background p-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="font-serif text-xl text-foreground">
                Ready to get started?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                It takes less than a minute to create your free account.
              </p>
            </div>
            <button
              type="button"
              onClick={onGetStarted}
              className="w-full shrink-0 rounded-xl bg-linear-to-br from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 cursor-pointer transition-all px-6 py-3 text-sm font-semibold text-white shadow-xl hover:shadow-purple-500/50 sm:w-auto">
              Create your free account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
