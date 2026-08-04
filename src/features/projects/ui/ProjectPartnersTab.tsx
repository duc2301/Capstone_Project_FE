import { useMemo, useState } from 'react';

import type { Group } from '@/entities/group';
import { GroupMemberStatus } from '@/entities/group';
import { GroupMemberRole } from '@/entities/invitation';
import type { Organization } from '@/entities/organization';
import { Modal, PaginationBar } from '@/shared/components';
import { formatDate } from '@/shared/lib/format';
import { t } from '@/shared/lib/i18n';

const PAGE_SIZE = 8;

interface PartnerCardData {
  organization: Organization;
  groups: Group[];
  contactName: string | null;
  contactEmail: string | null;
  joinedAt: string | null;
}

const orgName = (org: Organization) => org.displayName || org.legalName;

function buildPartner(organization: Organization, allGroups: Group[]): PartnerCardData {
  const groups = allGroups.filter((g) => g.organizationId === organization.id);

  const leader = groups
    .flatMap((g) => g.members)
    .find((m) => m.role === GroupMemberRole.Leader && m.status === GroupMemberStatus.Active);

  const joinedAt = groups
    .map((g) => g.createdAt)
    .filter((d): d is string => Boolean(d))
    .sort()[0] ?? null;

  return {
    organization,
    groups,
    contactName: leader?.userName ?? null,
    contactEmail: organization.email ?? leader?.email ?? null,
    joinedAt,
  };
}

interface Props {
  partners: Organization[];
  groups: Group[];
}

export function ProjectPartnersTab({ partners, groups }: Props) {
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<PartnerCardData | null>(null);

  const cards = useMemo(
    () => partners.map((org) => buildPartner(org, groups)),
    [partners, groups],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((card) => {
      if (groupFilter !== 'all' && !card.groups.some((g) => g.id === groupFilter)) return false;
      if (!q) return true;
      const haystack = [
        orgName(card.organization),
        card.organization.taxCode,
        card.contactName ?? '',
        card.contactEmail ?? '',
        ...card.groups.map((g) => g.name),
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [cards, groupFilter, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const resetTo = (next: () => void) => {
    next();
    setPage(1);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex shrink-0 flex-col gap-4 rounded-[var(--radius-card)] border border-card-border/50 bg-card/50 p-4 backdrop-blur-[2px] sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          >
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => resetTo(() => setQuery(e.target.value))}
            placeholder={t('projectDetail.partners.searchPlaceholder')}
            className="w-full rounded-[var(--radius-card)] border border-card-border bg-card py-3 pl-12 pr-4 text-base text-text outline-none transition-all placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <select
          value={groupFilter}
          onChange={(e) => resetTo(() => setGroupFilter(e.target.value))}
          className="shrink-0 rounded-[var(--radius-card)] border border-card-border/50 bg-card px-4 py-3 text-sm font-semibold text-text-secondary outline-none transition-colors focus:border-primary"
        >
          <option value="all">{t('projectDetail.partners.allGroups')}</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-card-border bg-card/70 p-10 text-center shadow-card">
          <p className="text-sm text-text-muted">{t('projectDetail.partners.empty')}</p>
        </div>
      ) : (
        <>
          <div className="admin-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {pageItems.map((card) => (
                <PartnerCard key={card.organization.id} card={card} onDetail={() => setDetail(card)} />
              ))}
            </div>
          </div>

          <PaginationBar
            page={currentPage}
            pageCount={pageCount}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            unit={t('projectDetail.partners.showingUnit')}
            onChange={setPage}
          />
        </>
      )}

      {detail && (
        <Modal title={orgName(detail.organization)} onClose={() => setDetail(null)}>
          <PartnerDetail card={detail} />
        </Modal>
      )}
    </div>
  );
}

function PartnerCard({ card, onDetail }: { card: PartnerCardData; onDetail: () => void }) {
  const { organization, groups, contactName, contactEmail, joinedAt } = card;
  const name = orgName(organization);

  return (
    <article className="flex flex-col rounded-[var(--radius-card)] border border-card-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-card-hover">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-card-border/50 bg-surface-sand-light font-display text-xl font-semibold text-primary">
        {name.charAt(0).toUpperCase()}
      </span>

      <h3 className="heading-entity mt-6 line-clamp-2" title={name}>
        {name}
      </h3>
      <p className="mt-1 text-xs font-medium tracking-[0.6px] text-text-secondary/70">
        {joinedAt
          ? `${t('projectDetail.partners.joined')}: ${formatDate(joinedAt)}`
          : `${t('projectDetail.partners.taxCode')} ${organization.taxCode}`}
      </p>

      <div className="mt-6 space-y-3 text-base text-text-secondary">
        <InfoLine
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          text={groups.length > 0
            ? groups.map((g) => g.name).join(', ')
            : t('projectDetail.common.notUpdated')}
        />
        <InfoLine
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          }
          text={contactName ?? t('projectDetail.partners.noContact')}
        />
        <InfoLine
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22,6 12,13 2,6" />
            </svg>
          }
          text={contactEmail ?? t('projectDetail.common.notUpdated')}
        />
      </div>

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={onDetail}
          className="rounded-[var(--radius-button)] bg-primary px-7 py-2.5 text-base font-normal text-white transition-colors hover:bg-primary-hover"
        >
          {t('projectDetail.partners.detail')}
        </button>
      </div>
    </article>
  );
}

function InfoLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-text-secondary/60">{icon}</span>
      <span className="truncate" title={text}>{text}</span>
    </div>
  );
}

function PartnerDetail({ card }: { card: PartnerCardData }) {
  const { organization, groups } = card;

  return (
    <div className="space-y-6">
      <dl className="divide-y divide-card-border/60">
        <DetailRow label={t('projectDetail.partners.legalName')} value={organization.legalName} />
        <DetailRow label={t('org.taxCode')} value={organization.taxCode} />
        <DetailRow label={t('org.email')} value={organization.email} />
        <DetailRow label={t('org.phone')} value={organization.phone} />
        <DetailRow label={t('org.address')} value={organization.address} />
      </dl>

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
          {t('projectDetail.partners.groupsLabel')}
        </p>
        {groups.length === 0 ? (
          <p className="text-sm italic text-text-placeholder">{t('projectDetail.common.notUpdated')}</p>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => {
              const active = group.members
                .filter((m) => m.status === GroupMemberStatus.Active)
                .sort((a, b) => Number(b.role === GroupMemberRole.Leader) - Number(a.role === GroupMemberRole.Leader));
              return (
                <div key={group.id} className="rounded-xl border border-card-border/60 bg-input-bg/50 p-4">
                  <p className="font-heading text-sm font-semibold text-text">{group.name}</p>
                  {active.length === 0 ? (
                    <p className="mt-1.5 text-xs italic text-text-placeholder">
                      {t('projectDetail.partners.noMembers')}
                    </p>
                  ) : (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      {active.map((m) => (m.role === GroupMemberRole.Leader ? (
                        <span
                          key={m.accountId}
                          className="inline-flex items-center gap-2 rounded-full bg-primary py-1 pl-2.5 pr-1.5 text-xs font-bold text-white shadow-sm"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                            <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
                          </svg>
                          {m.userName}
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-2xs font-bold uppercase tracking-wider">
                            {t('projects.role.leader')}
                          </span>
                        </span>
                      ) : (
                        <span
                          key={m.accountId}
                          className="inline-flex items-center rounded-full border border-card-border bg-card px-3 py-1 text-xs font-medium text-text-secondary"
                        >
                          {m.userName}
                        </span>
                      )))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-xs font-bold uppercase tracking-wider text-text-muted">{label}</dt>
      <dd className="text-right text-sm text-text">
        {value?.trim() || <span className="italic text-text-placeholder">{t('projectDetail.common.notUpdated')}</span>}
      </dd>
    </div>
  );
}
