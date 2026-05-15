"use client"

export function SelectableInput({ value }: { value: string }) {
  return (
    <input
      readOnly
      value={value}
      className="w-64 px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs font-mono"
      onClick={(e) => (e.target as HTMLInputElement).select()}
    />
  )
}
