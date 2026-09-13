import { useId, useState } from 'react'
import { Plus, X } from '@phosphor-icons/react'

/** A chip/tag input: type a value, press Enter (or blur) to add it as a removable chip. */
export function ChipInput({
  label,
  placeholder,
  values,
  onAdd,
  onRemove,
}: {
  label: string
  placeholder: string
  values: string[]
  onAdd: (value: string) => void
  onRemove: (index: number) => void
}) {
  const [draft, setDraft] = useState('')
  const inputId = useId()

  function submit() {
    const trimmed = draft.trim()
    if (trimmed) {
      onAdd(trimmed)
      setDraft('')
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2 p-3 bg-surface-container-low rounded-xl">
        {values.map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="px-3 py-1 rounded-full bg-surface-container-lowest shadow-sm text-sm flex items-center gap-1.5 break-all"
          >
            {v}
            <button type="button" onClick={() => onRemove(i)} className="hover:text-error shrink-0">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
          onBlur={submit}
          placeholder={placeholder}
          className="bg-transparent border-none outline-none text-sm text-on-surface placeholder:text-on-surface-variant px-2 py-1 min-w-[160px] flex-1"
        />
      </div>
    </div>
  )
}

/** A single-line input paired with an explicit "Add" button, for pasting one URL at a time. */
export function UrlAddField({
  label,
  placeholder,
  onAdd,
}: {
  label: string
  placeholder: string
  onAdd: (value: string) => void
}) {
  const [value, setValue] = useState('')
  const inputId = useId()

  function submit() {
    const trimmed = value.trim()
    if (trimmed) {
      onAdd(trimmed)
      setValue('')
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
        />
        <button
          type="button"
          onClick={submit}
          className="flex items-center gap-1 bg-surface-container-low border border-sand-stone px-4 rounded-lg text-sm text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <Plus size={14} />
          Add
        </button>
      </div>
    </div>
  )
}

export function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`w-11 h-6 rounded-full relative p-0.5 transition-colors focus:outline-none ${checked ? 'bg-savanna-green' : 'bg-sand-stone'}`}
    >
      <span
        className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}
