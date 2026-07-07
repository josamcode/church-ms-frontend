import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  ExternalLink,
  FileText,
  ImagePlus,
  Image as ImageIcon,
  MapPin,
  Save,
  Share2,
  Trash2,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { landingContentApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import PageHeader from '../../../components/ui/PageHeader';
import Select from '../../../components/ui/Select';
import SettingsLayout from '../../../components/ui/SettingsLayout';
import Switch from '../../../components/ui/Switch';
import Tabs from '../../../components/ui/Tabs';
import TextArea from '../../../components/ui/TextArea';
import { useI18n } from '../../../i18n/i18n';
import {
  buildDefaultLandingEditorState,
  buildDefaultStatSettings,
  buildLandingTextSections,
  buildDefaultSocialLinks,
  deepMerge,
  formatFieldLabel,
  getByPath,
  getDefaultLandingTextState,
  getFieldInputKind,
  getLocalizedValue,
  humanizeKey,
  setByPath,
} from '../../../utils/landingContent';

function buildHydratedForm(payload, defaultTexts) {
  return {
    texts: {
      en: deepMerge(defaultTexts.en, payload?.texts?.en || {}),
      ar: deepMerge(defaultTexts.ar, payload?.texts?.ar || {}),
    },
    stats: payload?.stats?.settings || buildDefaultStatSettings(),
    priests: Array.isArray(payload?.priests) ? payload.priests : [],
    location: {
      placeName: payload?.location?.placeName || '',
      plusCode: payload?.location?.plusCode || '',
      addressLine: payload?.location?.addressLine || '',
      mapEmbedUrl: payload?.location?.mapEmbedUrl || '',
      directionsUrl: payload?.location?.directionsUrl || '',
    },
    socialLinks: Array.isArray(payload?.socialLinks) && payload.socialLinks.length
      ? payload.socialLinks
      : buildDefaultSocialLinks(),
    heroImage: payload?.heroImage || null,
    updatedAt: payload?.updatedAt || null,
  };
}

function TextFieldControl({ label, value, onChange, fieldPath }) {
  const kind = getFieldInputKind(fieldPath, value);

  if (kind === 'textarea') {
    return (
      <TextArea
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        containerClassName="!mb-0"
      />
    );
  }

  return (
    <Input
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      containerClassName="!mb-0"
    />
  );
}

export default function LandingContentPage() {
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const defaultTexts = useMemo(() => getDefaultLandingTextState(), []);
  const [form, setForm] = useState(() => buildDefaultLandingEditorState());
  const [hydratedOnce, setHydratedOnce] = useState(false);

  const manageQuery = useQuery({
    queryKey: ['landing-content', 'manage'],
    queryFn: async () => {
      const { data } = await landingContentApi.getManage();
      return data?.data || null;
    },
  });

  useEffect(() => {
    if (!manageQuery.data || hydratedOnce) return;
    setForm(buildHydratedForm(manageQuery.data, defaultTexts));
    setHydratedOnce(true);
  }, [defaultTexts, hydratedOnce, manageQuery.data]);

  const syncFormFromPayload = (payload) => {
    setForm(buildHydratedForm(payload, defaultTexts));
    queryClient.setQueryData(['landing-content', 'manage'], payload);
    queryClient.invalidateQueries({ queryKey: ['landing-content', 'public'] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        texts: form.texts,
        stats: form.stats,
        priestEntries: (form.priests || []).map((entry) => ({
          priestUserId: entry.priestUserId,
          role: entry.role || { en: '', ar: '' },
          bio: entry.bio || { en: '', ar: '' },
          alt: entry.alt || { en: '', ar: '' },
        })),
        location: form.location,
        socialLinks: form.socialLinks,
      };

      const { data } = await landingContentApi.update(payload);
      return data?.data || null;
    },
    onSuccess: (payload) => {
      toast.success(t('landingContentPage.messages.saved'));
      if (payload) {
        syncFormFromPayload(payload);
      }
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  const uploadHeroMutation = useMutation({
    mutationFn: async (file) => {
      const { data } = await landingContentApi.uploadHeroImage(file);
      return data?.data || null;
    },
    onSuccess: (heroImage) => {
      toast.success(t('landingContentPage.messages.heroUploaded'));
      setForm((current) => ({ ...current, heroImage }));
      queryClient.invalidateQueries({ queryKey: ['landing-content', 'manage'] });
      queryClient.invalidateQueries({ queryKey: ['landing-content', 'public'] });
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  const deleteHeroMutation = useMutation({
    mutationFn: async () => {
      await landingContentApi.deleteHeroImage();
      return null;
    },
    onSuccess: () => {
      toast.success(t('landingContentPage.messages.heroDeleted'));
      setForm((current) => ({ ...current, heroImage: null }));
      queryClient.invalidateQueries({ queryKey: ['landing-content', 'manage'] });
      queryClient.invalidateQueries({ queryKey: ['landing-content', 'public'] });
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    },
  });

  const systemStatOptions = useMemo(
    () =>
      (manageQuery.data?.stats?.systemStatOptions || []).map((entry) => ({
        value: entry.key,
        label: `${entry.label} (${entry.value})`,
      })),
    [manageQuery.data?.stats?.systemStatOptions]
  );

  const sourceOptions = useMemo(
    () => [
      { value: 'system', label: t('landingContentPage.sources.system') },
      { value: 'manual', label: t('landingContentPage.sources.manual') },
    ],
    [t]
  );

  const textSections = useMemo(
    () => ({
      ar: buildLandingTextSections(form?.texts?.ar || defaultTexts.ar),
      en: buildLandingTextSections(form?.texts?.en || defaultTexts.en),
    }),
    [defaultTexts.ar, defaultTexts.en, form?.texts?.ar, form?.texts?.en]
  );

  const updateTextValue = (lang, path, value) => {
    setForm((current) => ({
      ...current,
      texts: {
        ...current.texts,
        [lang]: setByPath(current.texts?.[lang] || {}, path, value),
      },
    }));
  };

  const updatePriestLocalizedField = (priestUserId, field, lang, value) => {
    setForm((current) => ({
      ...current,
      priests: (current.priests || []).map((entry) =>
        entry.priestUserId === priestUserId
          ? {
              ...entry,
              [field]: {
                ...(entry?.[field] || { en: '', ar: '' }),
                [lang]: value,
              },
            }
          : entry
      ),
    }));
  };

  const updateStatField = (itemId, field, value) => {
    setForm((current) => ({
      ...current,
      stats: {
        ...current.stats,
        [itemId]: {
          ...(current.stats?.[itemId] || {}),
          [field]: value,
        },
      },
    }));
  };

  const updateLocationField = (field, value) => {
    setForm((current) => ({
      ...current,
      location: {
        ...current.location,
        [field]: value,
      },
    }));
  };

  const updateSocialField = (platform, field, value) => {
    setForm((current) => ({
      ...current,
      socialLinks: (current.socialLinks || []).map((entry) =>
        entry.platform === platform
          ? {
              ...entry,
              [field]: value,
            }
          : entry
      ),
    }));
  };

  const statLabelForItem = (itemId) =>
    getByPath(form?.texts?.[language], `landing.stats.items.${itemId}.label`) ||
    getByPath(form?.texts?.en, `landing.stats.items.${itemId}.label`) ||
    humanizeKey(itemId);

  const handleHeroFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('landingContentPage.messages.imageTypeError'));
      return;
    }

    await uploadHeroMutation.mutateAsync(file);
  };

  const renderPriestsEditor = (lang) => (
    <>
      {!form.priests.length ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">{t('landingContentPage.sections.priests.empty')}</p>
          <Link to="/dashboard/divine-liturgies/priests">
            <Button variant="outline">{t('landingContentPage.sections.priests.manageLink')}</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {form.priests.map((entry) => (
            <div key={entry.priestUserId} className="rounded-xl bg-surface-alt/40 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                {entry?.user?.avatar?.url ? (
                  <img
                    src={entry.user.avatar.url}
                    alt={entry.user.fullName || ''}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    {String(entry?.user?.fullName || '?').slice(0, 1)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-heading">{entry?.user?.fullName || '-'}</p>
                  {entry?.user?.phonePrimary ? (
                    <p className="text-xs text-muted direction-ltr">{entry.user.phonePrimary}</p>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label={t('landingContentPage.fields.priestRole')}
                  value={entry?.role?.[lang] || ''}
                  onChange={(event) =>
                    updatePriestLocalizedField(entry.priestUserId, 'role', lang, event.target.value)
                  }
                  containerClassName="!mb-0"
                />
                <Input
                  label={t('landingContentPage.fields.priestAlt')}
                  value={entry?.alt?.[lang] || ''}
                  onChange={(event) =>
                    updatePriestLocalizedField(entry.priestUserId, 'alt', lang, event.target.value)
                  }
                  containerClassName="!mb-0"
                />
              </div>
              <div className="mt-4">
                <TextArea
                  label={t('landingContentPage.fields.priestBio')}
                  value={entry?.bio?.[lang] || ''}
                  onChange={(event) =>
                    updatePriestLocalizedField(entry.priestUserId, 'bio', lang, event.target.value)
                  }
                  rows={4}
                  containerClassName="!mb-0"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const buildLanguageSectionTabs = (lang) =>
    (textSections?.[lang] || []).map((section) => ({
      label: section.title,
      content: (
        <div className="grid gap-4">
          {section.fields.map((field) => (
            <TextFieldControl
              key={field.path}
              label={formatFieldLabel(field.path, section.id)}
              fieldPath={field.path}
              value={getByPath(form?.texts?.[lang], field.path) || ''}
              onChange={(value) => updateTextValue(lang, field.path, value)}
            />
          ))}
        </div>
      ),
    }));

  const priestsLanguageTabs = [
    {
      label: t('landingContentPage.languages.ar'),
      content: renderPriestsEditor('ar'),
    },
    {
      label: t('landingContentPage.languages.en'),
      content: renderPriestsEditor('en'),
    },
  ];

  const textLanguageTabs = [
    {
      label: t('landingContentPage.languages.ar'),
      content: <Tabs variant="inline" tabs={buildLanguageSectionTabs('ar')} />,
    },
    {
      label: t('landingContentPage.languages.en'),
      content: <Tabs variant="inline" tabs={buildLanguageSectionTabs('en')} />,
    },
  ];

  const saveActionRow = (
    <div className="mt-6 flex border-t border-border/70 pt-5 sm:justify-end">
      <Button
        fullWidth
        className="sm:w-auto"
        icon={Save}
        loading={saveMutation.isPending}
        onClick={() => saveMutation.mutate()}
      >
        {t('landingContentPage.actions.save')}
      </Button>
    </div>
  );

  const sections = [
    {
      id: 'hero',
      label: t('landingContentPage.sections.hero.title'),
      icon: ImageIcon,
      title: t('landingContentPage.sections.hero.title'),
      description: t('landingContentPage.sections.hero.subtitle'),
      content: (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_1fr]">
            <div className="overflow-hidden rounded-2xl border border-border bg-page">
              {form.heroImage?.url ? (
                <img
                  src={form.heroImage.url}
                  alt={getLocalizedValue(
                    {
                      ar: getByPath(form?.texts?.ar, 'landing.hero.badge'),
                      en: getByPath(form?.texts?.en, 'landing.hero.badge'),
                    },
                    language
                  )}
                  className="h-64 w-full object-cover"
                />
              ) : (
                <div className="flex h-64 items-center justify-center bg-page text-sm text-muted">
                  {t('landingContentPage.hints.heroImageEmpty')}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-start gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleHeroFileChange}
              />
              <Button
                icon={ImagePlus}
                loading={uploadHeroMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {form.heroImage?.url
                  ? t('landingContentPage.actions.changeHero')
                  : t('landingContentPage.actions.uploadHero')}
              </Button>
              <Button
                variant="outline"
                icon={Trash2}
                disabled={!form.heroImage?.url}
                loading={deleteHeroMutation.isPending}
                onClick={() => deleteHeroMutation.mutate()}
              >
                {t('landingContentPage.actions.deleteHero')}
              </Button>
            </div>
          </div>
      ),
    },
    {
      id: 'stats',
      label: t('landingContentPage.sections.stats.title'),
      icon: BarChart3,
      title: t('landingContentPage.sections.stats.title'),
      description: t('landingContentPage.sections.stats.subtitle'),
      content: (
        <div>
          <div className="grid gap-4 lg:grid-cols-2">
            {Object.entries(form.stats || {}).map(([itemId, entry]) => (
              <div key={itemId} className="rounded-xl bg-surface-alt/40 p-4 sm:p-5">
                <p className="mb-4 text-sm font-semibold text-heading">{statLabelForItem(itemId)}</p>
                <div className="grid gap-4">
                  <Select
                    label={t('landingContentPage.fields.statSource')}
                    value={entry?.sourceType || 'system'}
                    options={sourceOptions}
                    onChange={(event) => updateStatField(itemId, 'sourceType', event.target.value)}
                  />
                  <Select
                    label={t('landingContentPage.fields.statMetric')}
                    value={entry?.sourceKey || 'members_total'}
                    options={systemStatOptions}
                    onChange={(event) => updateStatField(itemId, 'sourceKey', event.target.value)}
                  />
                  <Input
                    label={t('landingContentPage.fields.statManualValue')}
                    value={entry?.manualValue || ''}
                    onChange={(event) => updateStatField(itemId, 'manualValue', event.target.value)}
                    containerClassName="!mb-0"
                  />
                </div>
              </div>
            ))}
          </div>
          {saveActionRow}
        </div>
      ),
    },
    {
      id: 'location',
      label: t('landingContentPage.sections.location.title'),
      icon: MapPin,
      title: t('landingContentPage.sections.location.title'),
      description: t('landingContentPage.sections.location.subtitle'),
      content: (
        <div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label={t('landingContentPage.fields.locationPlaceName')}
              value={form.location.placeName}
              onChange={(event) => updateLocationField('placeName', event.target.value)}
              containerClassName="!mb-0"
            />
            {/* <Input
              label={t('landingContentPage.fields.locationPlusCode')}
              value={form.location.plusCode}
              onChange={(event) => updateLocationField('plusCode', event.target.value)}
              containerClassName="!mb-0"
            /> */}
            <Input
              label={t('landingContentPage.fields.locationAddressLine')}
              value={form.location.addressLine}
              onChange={(event) => updateLocationField('addressLine', event.target.value)}
              containerClassName="!mb-0"
            />
            <Input
              label={t('landingContentPage.fields.locationDirectionsUrl')}
              value={form.location.directionsUrl}
              onChange={(event) => updateLocationField('directionsUrl', event.target.value)}
              containerClassName="!mb-0"
            />
            {/* <div className="md:col-span-2">
              <Input
                label={t('landingContentPage.fields.locationMapEmbedUrl')}
                value={form.location.mapEmbedUrl}
                onChange={(event) => updateLocationField('mapEmbedUrl', event.target.value)}
                containerClassName="!mb-0"
              />
            </div> */}
          </div>
          {saveActionRow}
        </div>
      ),
    },
    {
      id: 'social',
      label: t('landingContentPage.sections.social.title'),
      icon: Share2,
      title: t('landingContentPage.sections.social.title'),
      description: t('landingContentPage.sections.social.subtitle'),
      content: (
        <div>
          <div className="grid gap-4 lg:grid-cols-2">
            {(form.socialLinks || []).map((entry) => (
              <div key={entry.platform} className="rounded-xl bg-surface-alt/40 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-heading">{humanizeKey(entry.platform)}</p>
                    <p className="text-xs text-muted">{entry.platform}</p>
                  </div>
                  <Switch
                    checked={Boolean(entry.enabled)}
                    onChange={(checked) => updateSocialField(entry.platform, 'enabled', checked)}
                    label={t('landingContentPage.fields.socialEnabled')}
                  />
                </div>
                <div className="grid gap-4">
                  <Input
                    label={t('landingContentPage.fields.socialHandle')}
                    value={entry.handle || ''}
                    onChange={(event) => updateSocialField(entry.platform, 'handle', event.target.value)}
                    containerClassName="!mb-0"
                  />
                  <Input
                    label={t('landingContentPage.fields.socialUrl')}
                    value={entry.url || ''}
                    onChange={(event) => updateSocialField(entry.platform, 'url', event.target.value)}
                    containerClassName="!mb-0"
                  />
                </div>
              </div>
            ))}
          </div>
          {saveActionRow}
        </div>
      ),
    },
    {
      id: 'priests',
      label: t('landingContentPage.sections.priests.title'),
      icon: Users,
      title: t('landingContentPage.sections.priests.title'),
      description: t('landingContentPage.sections.priests.subtitle'),
      content: (
        <div>
          <Tabs variant="inline" tabs={priestsLanguageTabs} />
          {saveActionRow}
        </div>
      ),
    },
    {
      id: 'texts',
      label: t('landingContentPage.sections.texts.title'),
      icon: FileText,
      title: t('landingContentPage.sections.texts.title'),
      description: t('landingContentPage.sections.texts.subtitle'),
      content: (
        <div>
          <Tabs variant="inline" tabs={textLanguageTabs} />
          {saveActionRow}
        </div>
      ),
    },
  ];

  if (manageQuery.isLoading && !hydratedOnce) {
    return (
      <div className="animate-fade-in space-y-6 pb-10">
        <Breadcrumbs
          items={[
            { label: t('shared.dashboard'), href: '/dashboard' },
            { label: t('dashboardLayout.menu.landingContent') },
          ]}
        />
        <PageHeader title={t('landingContentPage.title')} subtitle={t('landingContentPage.states.loading')} />
      </div>
    );
  }

  return (
    <div className="min-w-0 animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('dashboardLayout.menu.landingContent') },
        ]}
      />

      <PageHeader
        className="border-b border-border pb-6"
        title={t('landingContentPage.title')}
        subtitle={t('landingContentPage.subtitle')}
        actions={(
          <div className="flex flex-wrap gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" icon={ExternalLink}>
                {t('landingContentPage.actions.viewSite')}
              </Button>
            </a>
            <Button
              icon={Save}
              loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {t('landingContentPage.actions.save')}
            </Button>
          </div>
        )}
      />

      <SettingsLayout sections={sections} />
    </div>
  );
}
