import React from 'react'

type EmptyStateProps = {
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="glass-card flex flex-col items-center justify-center text-center px-6 py-16 sm:py-20">
      <p className="text-lg sm:text-xl font-semibold text-white">{title}</p>
      {description && <p className="mt-2 max-w-md text-sm text-gray-400">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
