import type { Project } from '@/entities/project';

export function projectAddress(project: Project): string | null {
  return project.location?.address?.trim() || project.contactAddress?.trim() || null;
}
