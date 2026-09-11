import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

export default function Input({ label, id, className = '', ...props }: InputProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        className={`mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-[#1f5f3f] focus:outline-none ${className}`}
        {...props}
      />
    </div>
  )
}