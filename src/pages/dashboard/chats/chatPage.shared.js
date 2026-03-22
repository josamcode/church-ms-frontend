import Button from '../../../components/ui/Button';
import { X } from 'lucide-react';

export const EMPTY_GROUP_FORM = {
  title: '',
  description: '',
  allowMemberMessages: true,
  memberIds: [],
};

export const EMPTY_BROADCAST_FORM = {
  template: '',
  audience: {
    all: false,
    userIds: [],
    roles: [],
    ageGroups: [],
    tags: [],
    diseases: [],
    genders: [],
    familyNames: [],
    houseNames: [],
    includeSelf: false,
    includeLocked: false,
    includeUsersWithoutLogin: false,
  },
};

export function formatThreadTimestamp(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const sameDay = now.toDateString() === date.toDateString();

  return sameDay
    ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date)
    : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

export function getInitials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function appendUniqueMessage(messages = [], nextMessage) {
  if (!nextMessage?.id) return messages;
  if (messages.some((message) => message.id === nextMessage.id)) return messages;

  return [...messages, nextMessage].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );
}

export function Avatar({ name, avatarUrl, size = 'md' }) {
  const sizeClasses = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-14 w-14 text-base',
  };

  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name || ''}
      className={`${sizeClasses[size]} rounded-2xl border border-border object-cover`}
    />
  ) : (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-2xl border border-border bg-primary/10 font-semibold text-primary`}
    >
      {getInitials(name) || '?'}
    </div>
  );
}

export function UserSelectionList({ users, selectedIds, onToggle, actionLabel }) {
  if (!users.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface-alt/40 p-4 text-sm text-muted">
        No users found.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((user) => {
        const isSelected = selectedIds.includes(user.id);
        return (
          <div
            key={user.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-surface-alt/30 p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={user.fullName} avatarUrl={user.avatar?.url} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-heading">{user.fullName}</p>
                <p className="truncate text-xs text-muted">{user.phonePrimary || user.role || ''}</p>
              </div>
            </div>
            <Button
              type="button"
              variant={isSelected ? 'ghost' : 'outline'}
              size="sm"
              onClick={() => onToggle(user)}
            >
              {isSelected ? 'Remove' : actionLabel}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

export function SelectedUsersChips({ users, onRemove, removableIds = null }) {
  if (!users.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {users.map((member) => {
        const canRemove = !removableIds || removableIds.includes(member.id);

        return (
          <span
            key={member.id}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-alt/40 px-3 py-1 text-sm text-heading"
          >
            {member.fullName}
            {canRemove ? (
              <button
                type="button"
                onClick={() => onRemove(member)}
                className="rounded-full text-muted transition-colors hover:text-danger"
                aria-label={`Remove ${member.fullName}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

export function MultiSelectField({ label, value, options, onChange, hint }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium text-base">{label}</label>
      <select
        multiple
        value={value}
        onChange={(event) => {
          onChange(Array.from(event.target.selectedOptions).map((option) => option.value));
        }}
        className="input-base min-h-[130px]"
      >
        {options.map((option) => {
          const normalized = typeof option === 'string' ? { value: option, label: option } : option;
          return (
            <option key={normalized.value} value={normalized.value}>
              {normalized.label}
            </option>
          );
        })}
      </select>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
