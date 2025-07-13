'use client'

import { forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'

interface FormInputProps {
  label: string
  name: string
  type?: 'text' | 'number' | 'email' | 'tel' | 'date' | 'time' | 'datetime-local'
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  autoComplete?: string
  min?: string | number
  max?: string | number
  step?: string | number
  className?: string
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ 
    label, 
    name, 
    type = 'text', 
    value, 
    onChange, 
    error, 
    placeholder, 
    required = false, 
    disabled = false,
    autoComplete,
    min,
    max,
    step,
    className = ''
  }, ref) => {
    return (
      <div className={`space-y-2 ${className}`}>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="relative">
          <input
            ref={ref}
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            autoComplete={autoComplete}
            min={min}
            max={max}
            step={step}
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
              ${error ? 'border-red-500 focus:ring-red-500' : ''}
              ${type === 'number' ? 'appearance-none' : ''}
              touch-manipulation
            `}
            style={{
              fontSize: '16px', // 防止 iOS Safari 縮放
              WebkitAppearance: type === 'number' ? 'none' : undefined,
              MozAppearance: type === 'number' ? 'textfield' : undefined,
            }}
          />
          
          {error && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
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

FormInput.displayName = 'FormInput'

export default FormInput 