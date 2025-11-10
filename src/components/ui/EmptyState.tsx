import { Plus } from 'lucide-react';
export default function EmptyState({ title, description, action }: { title: string; description?: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border p-8 text-center">
      <h3 className="text-lg font-medium">{title}</h3>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      {action ? (
        <button onClick={action.onClick} className="mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2">
          <Plus size={16} /> {action.label}
        </button>
      ) : null}
    </div>
  );
}
