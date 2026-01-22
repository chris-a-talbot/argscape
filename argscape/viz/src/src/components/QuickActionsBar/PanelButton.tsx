import { clsx } from 'clsx'

interface PanelButtonProps {
  icon: React.ReactNode
  label: string
  shortcut: string
  isActive: boolean
  onClick: () => void
}

export function PanelButton({ icon, label, shortcut, isActive, onClick }: PanelButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex flex-col items-center justify-center p-2 rounded-lg transition-all',
        'hover:bg-white/10',
        isActive && 'bg-white/20'
      )}
      title={`${label} (${shortcut})`}
    >
      <div className="w-5 h-5">{icon}</div>
      <span className="text-[10px] mt-1 opacity-70">{shortcut}</span>
    </button>
  )
}
