import React from 'react'

const LoadingIndicator = ({ type = 'default', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }
  
  const dotSize = sizeClasses[size] || sizeClasses.md

  if (type === 'typing') {
    return (
      <div className="bg-hover-bg rounded-2xl rounded-bl-sm px-4 py-3 inline-block">
        <div className="flex gap-1.5">
          <div className={`${dotSize} bg-text-secondary rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
          <div className={`${dotSize} bg-text-secondary rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
          <div className={`${dotSize} bg-text-secondary rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )
  }

  if (type === 'spinner') {
    return (
      <div className="inline-block">
        <div className={`${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'} border-2 border-accent border-t-transparent rounded-full animate-spin`} />
      </div>
    )
  }

  if (type === 'dots') {
    return (
      <div className="flex gap-1">
        <div className={`${dotSize} bg-accent rounded-full animate-pulse`} />
        <div className={`${dotSize} bg-accent rounded-full animate-pulse delay-150`} />
        <div className={`${dotSize} bg-accent rounded-full animate-pulse delay-300`} />
      </div>
    )
  }

  
  return (
    <div className="flex items-center gap-2 text-text-secondary">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm">AI is thinking...</span>
    </div>
  )
}

export default LoadingIndicator