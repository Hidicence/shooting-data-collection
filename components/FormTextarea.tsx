'use client'

import { forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'

interface FormTextareaProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  error?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  className?: string
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ 
    label, 
    name, 
    value, 
    onChange, 
    error, 
    placeholder, 
    required = false, 
    disabled = false,
    rows = 3,
    className = ''
  }, ref) => {
    return (
      <div className={`space-y-2 ${className}`}>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="relative">
          <textarea
            ref={ref}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={`
              w-full px-4 py-3 text-base
              border border-gray-300 dark:border-gray-600
              rounded-lg 
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100
              placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
              transition-colors duration-200
              resize-vertical
              ${error ? 'border-red-500 focus:ring-red-500' : ''}
              touch-manipulation
            `}
            style={{
              fontSize: '16px', // 防止 iOS Safari 縮放
            }}
          />
          
          {error && (
            <div className="absolute right-3 top-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
            {error}
          </p>
        )}
      </div>
    )
  }
)

FormTextarea.displayName = 'FormTextarea'

export default FormTextarea 