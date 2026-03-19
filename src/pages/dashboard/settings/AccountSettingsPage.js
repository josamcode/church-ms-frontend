import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

import { authApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import PageHeader from '../../../components/ui/PageHeader';
import Switch from '../../../components/ui/Switch';
import { useI18n } from '../../../i18n/i18n';

export default function AccountSettingsPage() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { user, loading, hydrateUser, hasPermission } = useAuth();
  const tf = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const canCreateConfessionSessions = hasPermission('CONFESSIONS_CREATE');
  const hasUserId = Boolean(user?._id || user?.id);
  const savedVisibility = user?.allowOthersToViewCreatedConfessionSessions !== false;
  const [allowOthersToViewCreatedConfessionSessions, setAllowOthersToViewCreatedConfessionSessions] =
    useState(savedVisibility);

  useEffect(() => {
    setAllowOthersToViewCreatedConfessionSessions(savedVisibility);
  }, [savedVisibility]);

  const saveMutation = useMutation({
    mutationFn: (payload) => authApi.updateMySettings(payload),
    onSuccess: async () => {
      await hydrateUser();
      queryClient.invalidateQueries({ queryKey: ['confessions', 'sessions'] });
      toast.success(tf('accountSettings.messages.saved', 'Account settings saved successfully.'));
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <Breadcrumbs
          items={[
            { label: t('shared.dashboard'), href: '/dashboard' },
            { label: tf('accountSettings.pageTitle', 'Account Settings') },
          ]}
        />
        <p className="text-sm text-muted">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: tf('accountSettings.pageTitle', 'Account Settings') },
        ]}
      />

      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={tf('dashboardLayout.section.settings', 'Settings')}
        title={tf('accountSettings.pageTitle', 'Account Settings')}
        subtitle={tf(
          'accountSettings.pageSubtitle',
          'Manage privacy and preference options for your account.'
        )}
        actions={(
          <Button
            type="button"
            size="sm"
            icon={Save}
            loading={saveMutation.isPending}
            disabled={
              allowOthersToViewCreatedConfessionSessions === savedVisibility || !hasUserId
            }
            onClick={() =>
              saveMutation.mutate({
                allowOthersToViewCreatedConfessionSessions,
              })
            }
          >
            {t('common.actions.save')}
          </Button>
        )}
      />

      <Card className="rounded-2xl">
        <CardHeader
          title={tf('accountSettings.confessions.title', 'Confession Session Privacy')}
          subtitle={tf(
            'accountSettings.confessions.subtitle',
            'Control whether other users can view confession sessions created by your account.'
          )}
        />

        <div className="rounded-2xl border border-border bg-surface-alt/40 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-heading">
                <Shield className="h-4 w-4 text-primary" />
                <span>
                  {tf(
                    'accountSettings.confessions.visibilityLabel',
                    'Allow others to view confession sessions I created'
                  )}
                </span>
              </div>
              <p className="text-sm text-muted">
                {tf(
                  'accountSettings.confessions.visibilityHelp',
                  'When disabled, other users will not see sessions recorded by your account. You will still see your own created sessions.'
                )}
              </p>
              {!canCreateConfessionSessions ? (
                <p className="text-xs text-muted">
                  {tf(
                    'accountSettings.confessions.noCreatePermission',
                    'Your account cannot create confession sessions right now, so this setting may not affect any records yet.'
                  )}
                </p>
              ) : null}
            </div>

            <Switch
              checked={allowOthersToViewCreatedConfessionSessions}
              onChange={setAllowOthersToViewCreatedConfessionSessions}
              label={allowOthersToViewCreatedConfessionSessions ? t('common.status.active') : t('common.status.inactive')}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
