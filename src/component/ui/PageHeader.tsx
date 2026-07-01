import React from 'react'

type PageHeaderProps = {
  title: string
  subtitle?: string
  action?: React.ReactNode
  centered?: boolean
}

export default function PageHeader({ title, subtitle, action, centered }: PageHeaderProps) {
  return (
    <div
      className={`mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${
        centered ? 'text-center sm:text-left' : ''
      }`}
    >
      <div className={centered ? 'mx-auto sm:mx-0' : ''}>
        <h1 className="section-title">{title}</h1>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
