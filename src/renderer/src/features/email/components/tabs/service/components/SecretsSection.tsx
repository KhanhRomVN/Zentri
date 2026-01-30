import { Plus, Lock, Trash2 } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';

interface SecretsSectionProps {
  secrets: any[];
  initialSecrets: any[];
  deletedSecrets: string[];
  onSecretClick: (id: string) => void;
  onAddClick: () => void;
  selectedSecretId: string | null;
}

export const SecretsSection = ({
  secrets,
  initialSecrets,
  deletedSecrets,
  onSecretClick,
  onAddClick,
  selectedSecretId,
}: SecretsSectionProps) => {
  const allSecretsToShow = [
    ...secrets,
    ...initialSecrets
      .filter((is) => deletedSecrets.includes(is.id))
      .map((is) => ({ ...is, status: 'deleted' })),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
        <span className="text-base font-semibold tracking-tight">Secrets & Keys</span>
        <button
          onClick={onAddClick}
          className="text-xs font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Secret
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allSecretsToShow.map((secret) => {
          const isDeleted = 'status' in secret && secret.status === 'deleted';
          const initialSecret = initialSecrets.find((is) => is.id === secret.id);
          const isAdded = !initialSecret;
          const isModified =
            initialSecret &&
            (secret.key !== initialSecret.key || secret.value !== initialSecret.value);

          return (
            <div
              key={secret.id}
              onClick={() => !isDeleted && onSecretClick(secret.id)}
              className={cn(
                'group relative flex items-center gap-4 py-3 px-4 rounded-xl border transition-all',
                !isDeleted
                  ? 'cursor-pointer border-border hover:border-primary/40'
                  : 'cursor-not-allowed border-red-500 border-dashed bg-red-500/5 opacity-60',
                'bg-card shadow-sm',
                selectedSecretId === secret.id && 'ring-2 ring-primary border-primary',
                isAdded && 'border-green-500 border-dashed',
                isModified && !isDeleted && 'border-yellow-500 border-dashed',
              )}
            >
              <div className="w-12 h-12 flex items-center justify-center shrink-0 bg-amber-500/10 rounded-xl text-amber-500">
                <Lock className="w-6 h-6" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <h3 className="font-medium text-sm text-foreground truncate">{secret.key}</h3>
                <p className="text-xs text-muted-foreground font-mono truncate opacity-80">
                  {secret.value}
                </p>
              </div>
              {secret.active && !isDeleted && (
                <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500" />
              )}
              {isDeleted && (
                <div className="absolute top-3 right-3 text-red-500">
                  <Trash2 className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
