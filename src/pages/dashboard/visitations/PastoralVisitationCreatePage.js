import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { usersApi, visitationsApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import TextArea from '../../../components/ui/TextArea';
import { useI18n } from '../../../i18n/i18n';

function toDateTimeInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toIsoDateTime(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export default function PastoralVisitationCreatePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    houseName: '',
    durationMinutes: '10',
    visitedAt: toDateTimeInputValue(),
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [houseNameDropdownOpen, setHouseNameDropdownOpen] = useState(false);
  const houseNameInputRef = useRef(null);

  const { data: houseNamesRes } = useQuery({
    queryKey: ['users', 'house-names'],
    queryFn: async () => {
      const res = await usersApi.getHouseNames();
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60000,
  });
  const houseNames = Array.isArray(houseNamesRes) ? houseNamesRes : [];

  const createMutation = useMutation({
    mutationFn: (payload) => visitationsApi.create(payload),
    onSuccess: (res) => {
      const created = res?.data?.data;
      toast.success(t('visitations.create.successCreated'));
      queryClient.invalidateQueries({ queryKey: ['visitations', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['visitations', 'analytics'] });
      if (created?.id) {
        navigate(`/dashboard/visitations/${created.id}`);
        return;
      }
      navigate('/dashboard/visitations');
    },
    onError: (err) => {
      toast.error(normalizeApiError(err).message);
    },
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.houseName.trim()) nextErrors.houseName = t('visitations.create.errors.houseNameRequired');
    if (!form.visitedAt) nextErrors.visitedAt = t('visitations.create.errors.visitedAtRequired');
    const duration = parseInt(form.durationMinutes, 10);
    if (!Number.isFinite(duration) || duration < 1) {
      nextErrors.durationMinutes = t('visitations.create.errors.durationInvalid');
    }
    return nextErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    createMutation.mutate({
      houseName: form.houseName.trim(),
      durationMinutes: parseInt(form.durationMinutes, 10),
      visitedAt: toIsoDateTime(form.visitedAt),
      ...(form.notes.trim() && { notes: form.notes.trim() }),
    });
  };

  return (
    <div className="animate-fade-in">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('visitations.list.page'), href: '/dashboard/visitations' },
          { label: t('visitations.create.page') },
        ]}
      />

      <Card className="max-w-3xl">
        <CardHeader
          title={t('visitations.create.title')}
          subtitle={t('visitations.create.subtitle')}
        />

        <form onSubmit={handleSubmit}>
          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-base mb-1.5">
              {t('visitations.create.houseName')}
              <span className="text-danger ml-1">*</span>
            </label>
            <input
              ref={houseNameInputRef}
              type="text"
              value={form.houseName}
              onChange={(e) => {
                updateField('houseName', e.target.value);
                setHouseNameDropdownOpen(true);
              }}
              onFocus={() => setHouseNameDropdownOpen(true)}
              onBlur={() => setTimeout(() => setHouseNameDropdownOpen(false), 200)}
              placeholder={t('visitations.create.houseNamePlaceholder')}
              className={`input-base w-full ${errors.houseName ? 'border-danger focus:border-danger focus:ring-danger' : ''}`}
            />
            {errors.houseName && <p className="text-xs text-danger mt-1">{errors.houseName}</p>}
            {houseNameDropdownOpen && houseNames.length > 0 && (
              <ul
                className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-md border border-border shadow-lg py-1"
                style={{ backgroundColor: 'var(--color-surface, #ffffff)' }}
                role="listbox"
              >
                {houseNames
                  .filter(
                    (name) =>
                      !form.houseName || name.toLowerCase().includes(form.houseName.trim().toLowerCase())
                  )
                  .slice(0, 20)
                  .map((name) => (
                    <li
                      key={name}
                      role="option"
                      aria-selected={form.houseName === name}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-muted focus:bg-muted hover:text-white"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        updateField('houseName', name);
                        setHouseNameDropdownOpen(false);
                      }}
                    >
                      {name}
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('visitations.create.visitedAt')}
              required
              type="datetime-local"
              dir="ltr"
              className="text-left"
              value={form.visitedAt}
              onChange={(e) => updateField('visitedAt', e.target.value)}
              error={errors.visitedAt}
            />
            <Input
              label={t('visitations.create.durationMinutes')}
              type="number"
              min="1"
              required
              value={form.durationMinutes}
              onChange={(e) => updateField('durationMinutes', e.target.value)}
              error={errors.durationMinutes}
            />
          </div>

          <TextArea
            label={t('visitations.create.notes')}
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder={t('visitations.create.notesPlaceholder')}
          />

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => navigate('/dashboard/visitations')}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" icon={Save} loading={createMutation.isPending}>
              {t('visitations.create.createAction')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
