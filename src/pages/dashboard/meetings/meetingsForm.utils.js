export const DAY_OPTIONS = [
  { value: 'Sunday', label: 'Sunday' },
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Saturday', label: 'Saturday' },
];

export const ACTIVITY_OPTIONS = [
  { value: 'trip', label: 'Trip' },
  { value: 'conference', label: 'Conference' },
  { value: 'activity', label: 'Activity' },
  { value: 'other', label: 'Other' },
];

export function toLocalDateTimeInput(isoValue) {
  if (!isoValue) return '';
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function toIsoDateTime(localValue) {
  if (!localValue) return null;
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function uniqueCsv(value) {
  return [...new Set(String(value || '').split(',').map((entry) => entry.trim()).filter(Boolean))];
}

export function toSelectUser(userLike, fallbackName = '') {
  if (!userLike) return null;
  const id = userLike.id || userLike._id;
  if (!id) return null;
  return {
    _id: id,
    fullName: userLike.fullName || fallbackName || '---',
    phonePrimary: userLike.phonePrimary || '',
  };
}

export function toPersonPayload(selectedUser, manualName) {
  const name = String(manualName || '').trim();
  if (selectedUser?._id) {
    return {
      userId: selectedUser._id,
      name: name || selectedUser.fullName,
    };
  }
  if (!name) return null;
  return { name };
}

export function mapSectorToForm(sector) {
  return {
    name: sector?.name || '',
    avatar: sector?.avatar?.url
      ? {
          url: sector.avatar.url,
          publicId: sector?.avatar?.publicId || '',
        }
      : null,
    avatarRemoved: false,
    notes: sector?.notes || '',
    officials: (sector?.officials || []).map((official) => ({
      user: toSelectUser(official.user, official.name),
      name: official.name || '',
      title: official.title || '',
      notes: official.notes || '',
    })),
  };
}

export function buildSectorPayload(form) {
  const avatarUrl = String(form?.avatar?.url || form?.avatarUrl || '').trim();
  const avatarPublicId = String(form?.avatar?.publicId || form?.avatarPublicId || '').trim();

  return {
    name: String(form.name || '').trim(),
    ...(form.avatarRemoved ? { avatar: null } : {}),
    ...(avatarUrl && {
      avatar: {
        url: avatarUrl,
        ...(avatarPublicId && {
          publicId: avatarPublicId,
        }),
      },
    }),
    ...(String(form.notes || '').trim() && { notes: String(form.notes || '').trim() }),
    officials: (form.officials || [])
      .map((official) => {
        const person = toPersonPayload(official.user, official.name);
        if (!person) return null;
        return {
          ...person,
          ...(String(official.title || '').trim() && { title: String(official.title || '').trim() }),
          ...(String(official.notes || '').trim() && { notes: String(official.notes || '').trim() }),
        };
      })
      .filter(Boolean),
  };
}

export function mapMeetingToForm(meeting) {
  return {
    sectorId: meeting?.sector?.id || '',
    name: meeting?.name || '',
    day: meeting?.day || 'Sunday',
    time: meeting?.time || '18:00',
    avatar: meeting?.avatar?.url
      ? {
          url: meeting.avatar.url,
          publicId: meeting?.avatar?.publicId || '',
        }
      : null,
    avatarRemoved: false,
    serviceSecretaryUser: toSelectUser(meeting?.serviceSecretary?.user, meeting?.serviceSecretary?.name),
    serviceSecretaryName: meeting?.serviceSecretary?.name || '',
    assistantSecretaries: (meeting?.assistantSecretaries || []).map((assistant) => ({
      user: toSelectUser(assistant?.user, assistant?.name),
      name: assistant?.name || '',
    })),
    servedUsers: (meeting?.servedUsers || []).map((user) => toSelectUser(user)).filter(Boolean),
    groupsCsv: (meeting?.groups || []).join(', '),
    servants: (meeting?.servants || []).map((servant) => ({
      user: toSelectUser(servant?.user, servant?.name),
      name: servant?.name || '',
      responsibility: servant?.responsibility || '',
      groupsManagedCsv: (servant?.groupsManaged || []).join(', '),
      servedUsers: (servant?.servedUsers || []).map((user) => toSelectUser(user)).filter(Boolean),
      servedUserIdsCsv: (servant?.servedUsers || []).map((user) => user.id).join(', '),
      notes: servant?.notes || '',
    })),
    committees: (meeting?.committees || []).map((committee) => ({
      name: committee?.name || '',
      members: (committee?.members || []).map((user) => toSelectUser(user)).filter(Boolean),
      memberUserIdsCsv: (committee?.members || []).map((user) => user.id).join(', '),
      memberNamesCsv: (committee?.memberNames || []).join(', '),
      detailsText:
        committee?.details && typeof committee.details === 'object'
          ? JSON.stringify(committee.details)
          : String(committee?.details || ''),
      notes: committee?.notes || '',
    })),
    activities: (meeting?.activities || []).map((activity) => ({
      name: activity?.name || '',
      type: activity?.type || 'activity',
      scheduledAt: toLocalDateTimeInput(activity?.scheduledAt),
      notes: activity?.notes || '',
    })),
    notes: meeting?.notes || '',
  };
}

export function buildMeetingPayload(form, options = {}) {
  const includeServants = options.includeServants !== false;
  const includeCommittees = options.includeCommittees !== false;
  const includeActivities = options.includeActivities !== false;

  const serviceSecretary = toPersonPayload(form.serviceSecretaryUser, form.serviceSecretaryName);
  const avatarUrl = String(form?.avatar?.url || form?.avatarUrl || '').trim();
  const avatarPublicId = String(form?.avatar?.publicId || form?.avatarPublicId || '').trim();

  const payload = {
    sectorId: form.sectorId,
    name: String(form.name || '').trim(),
    day: form.day,
    time: form.time,
    ...(form.avatarRemoved ? { avatar: null } : {}),
    ...(avatarUrl && {
      avatar: {
        url: avatarUrl,
        ...(avatarPublicId && {
          publicId: avatarPublicId,
        }),
      },
    }),
    ...(serviceSecretary && { serviceSecretary }),
    assistantSecretaries: (form.assistantSecretaries || [])
      .map((assistant) => toPersonPayload(assistant.user, assistant.name))
      .filter(Boolean),
    servedUserIds: (form.servedUsers || []).map((user) => user?._id).filter(Boolean),
    groups: uniqueCsv(form.groupsCsv),
    ...(String(form.notes || '').trim() && { notes: String(form.notes || '').trim() }),
  };

  if (includeServants) {
    payload.servants = (form.servants || [])
      .map((servant) => {
        const person = toPersonPayload(servant.user, servant.name);
        if (!person) return null;
        return {
          ...person,
          ...(String(servant.responsibility || '').trim() && {
            responsibility: String(servant.responsibility || '').trim(),
          }),
          groupsManaged: uniqueCsv(servant.groupsManagedCsv),
          servedUserIds:
            (servant.servedUsers || []).length > 0
              ? (servant.servedUsers || []).map((user) => user?._id).filter(Boolean)
              : uniqueCsv(servant.servedUserIdsCsv),
          ...(String(servant.notes || '').trim() && { notes: String(servant.notes || '').trim() }),
        };
      })
      .filter(Boolean);
  }

  if (includeCommittees) {
    payload.committees = (form.committees || [])
      .filter((committee) => String(committee.name || '').trim())
      .map((committee) => {
        let details = {};
        if (String(committee.detailsText || '').trim()) {
          try {
            details = JSON.parse(String(committee.detailsText || '').trim());
          } catch {
            details = { text: String(committee.detailsText || '').trim() };
          }
        }

        return {
          name: String(committee.name || '').trim(),
          memberUserIds:
            (committee.members || []).length > 0
              ? (committee.members || []).map((user) => user?._id).filter(Boolean)
              : uniqueCsv(committee.memberUserIdsCsv),
          memberNames: uniqueCsv(committee.memberNamesCsv),
          details,
          ...(String(committee.notes || '').trim() && { notes: String(committee.notes || '').trim() }),
        };
      });
  }

  if (includeActivities) {
    payload.activities = (form.activities || [])
      .filter((activity) => String(activity.name || '').trim())
      .map((activity) => ({
        name: String(activity.name || '').trim(),
        type: activity.type || 'other',
        ...(toIsoDateTime(activity.scheduledAt) && { scheduledAt: toIsoDateTime(activity.scheduledAt) }),
        ...(String(activity.notes || '').trim() && { notes: String(activity.notes || '').trim() }),
      }));
  }

  return payload;
}
