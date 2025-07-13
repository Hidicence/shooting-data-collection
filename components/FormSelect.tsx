'use client'

import { forwardRef } from 'react'
import { AlertCircle, ChevronDown } from 'lucide-react'

interface FormSelectProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: Array<{ value: string; label: string }>
  error?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ 
    label, 
    name, 
    value, 
    onChange, 
    options,
    error, 
    placeholder, 
    required = false, 
    disabled = false,
    className = ''
  }, ref) => {
    return (
      <div className={`space-y-2 ${className}`}>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="relative">
          <select
            ref={ref}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={`
              w-full px-4 py-3 text-base
              border border-gray-300 dark:border-gray-600
              rounded-lg 
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
              transition-colors duration-200
              appearance-none
              ${error ? 'border-red-500 focus:ring-red-500' : ''}
              touch-manipulation
            `}
            style={{
              fontSize: '16px', // 防止 iOS Safari 縮放
            }}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>
          
          {error && (
            <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
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

FormSelect.displayName = 'FormSelect'

export default FormSelect 