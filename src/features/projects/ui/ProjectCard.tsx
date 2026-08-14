import type { Project } from '@/entities/project';
import { t } from '@/shared/lib/i18n';

import { projectAddress } from '../model/projectFormat';

interface ProjectCardProps {
  project: Project;
  onOpen: (projectId: string) => void;
  meta?: { label: string; value: string };
}

export function ProjectCard({ project, onOpen, meta }: ProjectCardProps) {
  const address = projectAddress(project);

  return (
    <article
      onClick={() => onOpen(project.id)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="relative h-44 shrink-0 overflow-hidden bg-content-bg">
        {project.projectImageUrl ? (
          <img
            src={project.projectImageUrl}
            alt={project.projectName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-light">
            <span className="font-display text-4xl font-semibold text-primary/60">
              {project.projectName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-2xs font-bold uppercase tracking-[1px] text-primary/60">
          {t('projects.card.code')}: {project.projectCode?.trim() || t('projects.card.noCode')}
        </p>

        <h3 className="heading-entity mt-1 line-clamp-2">{project.projectName}</h3>

        <div className="mt-2 flex items-start gap-1.5 text-xs text-text-muted">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="line-clamp-1">{address ?? t('projects.card.noAddress')}</span>
        </div>

        {meta && (
          <div className="mt-3 flex items-center justify-between gap-3 text-xs">
            <span className="text-text-placeholder">{meta.label}</span>
            <span className="font-semibold text-text">{meta.value}</span>
          </div>
        )}

        <div className="mt-auto flex justify-end border-t border-card-border/60 pt-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(project.id);
            }}
            className="flex items-center gap-1.5 rounded-[var(--radius-button)] border border-primary px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary-ghost"
          >
            {t('projects.card.open')}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
