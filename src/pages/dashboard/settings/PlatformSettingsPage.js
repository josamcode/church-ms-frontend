import { useCallback, useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { platformSettingsApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import NotificationTemplateEditor from '../../../components/notifications/NotificationTemplateEditor';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import PageHeader from '../../../components/ui/PageHeader';
import Tabs from '../../../components/ui/Tabs';
import { useI18n } from '../../../i18n/i18n';

const DEFAULT_NOTIFICATION_TEMPLATES = Object.freeze({
  confessionNextSession: {
    title: {
      ar: 'موعد جلسة الاعتراف القادمة',
      en: 'موعد جلسة الاعتراف القادمة',
    },
    message: {
      ar: 'تم تحديد موعد جلسة الاعتراف القادمة بتاريخ {nextSessionAt}.',
      en: 'تم تحديد موعد جلسة الاعتراف القادمة بتاريخ {nextSessionAt}.',
    },
  },
  dashboardNotificationPublished: {
    title: {
      ar: 'إشعار جديد',
      en: 'إشعار جديد',
    },
    message: {
      ar: 'تم نشر إشعار جديد بعنوان {notificationName}.',
      en: 'تم نشر إشعار جديد بعنوان {notificationName}.',
    },
  },
  divineLiturgyExceptionalCase: {
    title: {
      ar: 'قداس استثنائي جديد',
      en: 'قداس استثنائي جديد',
    },
    message: {
      ar: 'تمت إضافة حالة قداس استثنائية بتاريخ {exceptionDate} في {startTime}.',
      en: 'تمت إضافة حالة قداس استثنائية بتاريخ {exceptionDate} في {startTime}.',
    },
  },
});

const NOTIFICATION_TEMPLATE_CONFIGS = Object.freeze([
  {
    id: 'confessionNextSession',
    tabKey: 'platformSettingsPage.notifications.tabs.confessionNextSession',
    titleKey: 'platformSettingsPage.notifications.confessionNextSession.title',
    subtitleKey: 'platformSettingsPage.notifications.confessionNextSession.subtitle',
  },
  {
    id: 'dashboardNotificationPublished',
    tabKey: 'platformSettingsPage.notifications.tabs.dashboardNotificationPublished',
    titleKey: 'platformSettingsPage.notifications.dashboardNotificationPublished.title',
    subtitleKey: 'platformSettingsPage.notifications.dashboardNotificationPublished.subtitle',
  },
  {
    id: 'divineLiturgyExceptionalCase',
    tabKey: 'platformSettingsPage.notifications.tabs.divineLiturgyExceptionalCase',
    titleKey: 'platformSettingsPage.notifications.divineLiturgyExceptionalCase.title',
    subtitleKey: 'platformSettingsPage.notifications.divineLiturgyExceptionalCase.subtitle',
  },
]);

function createDefaultForm() {
  const notificationTemplates = Object.entries(DEFAULT_NOTIFICATION_TEMPLATES).reduce(
    (accumulator, [templateKey, templateValue]) => ({
      ...accumulator,
      [templateKey]: {
        title: { ...templateValue.title },
        message: { ...templateValue.message },
      },
    }),
    {}
  );

  const availableTokens = Object.keys(DEFAULT_NOTIFICATION_TEMPLATES).reduce(
    (accumulator, templateKey) => ({
      ...accumulator,
      [templateKey]: [],
    }),
    {}
  );

  return {
    notificationTemplates,
    availableTokens,
    updatedAt: null,
  };
}

function buildHydratedForm(payload = {}) {
  const defaultForm = createDefaultForm();
  const notificationTemplates = Object.entries(DEFAULT_NOTIFICATION_TEMPLATES).reduce(
    (accumulator, [templateKey, templateDefaults]) => {
      const sourceTemplate = payload?.notificationTemplates?.[templateKey] || {};
      const titleAr = sourceTemplate?.title?.ar || templateDefaults.title.ar;
      const messageAr = sourceTemplate?.message?.ar || templateDefaults.message.ar;

      return {
        ...accumulator,
        [templateKey]: {
          title: {
            ar: titleAr,
            en: sourceTemplate?.title?.en || titleAr,
          },
          message: {
            ar: messageAr,
            en: sourceTemplate?.message?.en || messageAr,
          },
        },
      };
    },
    {}
  );

  return {
    notificationTemplates,
    availableTokens: {
      ...defaultForm.availableTokens,
      ...(payload?.availableTokens || {}),
    },
    updatedAt: payload?.updatedAt || null,
  };
}

export default function PlatformSettingsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(createDefaultForm);
  const [hydratedOnce, setHydratedOnce] = useState(false);

  const manageQuery = useQuery({
    queryKey: ['platform-settings', 'manage'],
    queryFn: async () => {
      const { data } = await platformSettingsApi.getManage();
      return data?.data || null;
    },
  });

  useEffect(() => {
    if (!manageQuery.data || hydratedOnce) return;
    setForm(buildHydratedForm(manageQuery.data));
    setHydratedOnce(true);
  }, [hydratedOnce, manageQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        notificationTemplates: form.notificationTemplates,
      };
      const { data } = await platformSettingsApi.update(payload);
      return data?.data || null;
    },
    onSuccess: (payload) => {
      const nextForm = buildHydratedForm(payload);
      setForm(nextForm);
      queryClient.setQueryData(['platform-settings', 'manage'], payload);
      toast.success(t('platformSettingsPage.messages.saved'));
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  const updateTemplateField = useCallback((templateKey, field, language, value) => {
    setForm((current) => {
      const currentTemplate = current.notificationTemplates[templateKey]
        || createDefaultForm().notificationTemplates[templateKey]
        || { title: { ar: '', en: '' }, message: { ar: '', en: '' } };
      const previousArabicValue = String(currentTemplate?.[field]?.ar || '');
      const previousEnglishValue = String(currentTemplate?.[field]?.en || '');
      const nextLocalizedField = {
        ...(currentTemplate?.[field] || { ar: '', en: '' }),
        [language]: value,
      };

      if (language === 'ar') {
        const shouldMirrorEnglish = !previousEnglishValue.trim() || previousEnglishValue === previousArabicValue;
        if (shouldMirrorEnglish) {
          nextLocalizedField.en = value;
        }
      }

      return {
        ...current,
        notificationTemplates: {
          ...current.notificationTemplates,
          [templateKey]: {
            ...currentTemplate,
            [field]: nextLocalizedField,
          },
        },
      };
    });
  }, []);

  const buildTemplateTabs = useCallback((language) => (
    NOTIFICATION_TEMPLATE_CONFIGS.map((templateConfig) => ({
      label: t(templateConfig.tabKey),
      content: (
        <NotificationTemplateEditor
          t={t}
          language={language}
          sectionTitle={t(templateConfig.titleKey)}
          sectionSubtitle={t(templateConfig.subtitleKey)}
          template={form.notificationTemplates[templateConfig.id]}
          tokenList={form.availableTokens?.[templateConfig.id] || []}
          onFieldChange={(field, currentLanguage, value) => (
            updateTemplateField(templateConfig.id, field, currentLanguage, value)
          )}
        />
      ),
    }))
  ), [form.availableTokens, form.notificationTemplates, t, updateTemplateField]);

  const languageTabs = useMemo(
    () => [
      {
        label: t('platformSettingsPage.languages.ar'),
        content: <Tabs variant="inline" tabs={buildTemplateTabs('ar')} />,
      },
      {
        label: t('platformSettingsPage.languages.en'),
        content: <Tabs variant="inline" tabs={buildTemplateTabs('en')} />,
      },
    ],
    [buildTemplateTabs, t]
  );

  const editorTabs = useMemo(
    () => [
      {
        label: t('platformSettingsPage.tabs.notifications'),
        content: <Tabs variant="inline" tabs={languageTabs} />,
      },
    ],
    [languageTabs, t]
  );

  if (manageQuery.isLoading && !hydratedOnce) {
    return (
      <div className="animate-fade-in space-y-6 pb-10">
        <Breadcrumbs
          items={[
            { label: t('shared.dashboard'), href: '/dashboard' },
            { label: t('platformSettingsPage.title') },
          ]}
        />
        <PageHeader
          title={t('platformSettingsPage.title')}
          subtitle={t('platformSettingsPage.states.loading')}
        />
      </div>
    );
  }

  return (
    <div className="min-w-0 animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('platformSettingsPage.title') },
        ]}
      />

      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={t('dashboardLayout.section.settings')}
        title={t('platformSettingsPage.title')}
        subtitle={t('platformSettingsPage.subtitle')}
        actions={(
          <Button
            icon={Save}
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {t('platformSettingsPage.actions.save')}
          </Button>
        )}
      />

      <Tabs tabs={editorTabs} framedPanel={false} bodyClassName="p-3 sm:p-4" />
    </div>
  );
}
