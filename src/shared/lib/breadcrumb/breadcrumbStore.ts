import { useSyncExternalStore } from 'react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

let trail: BreadcrumbItem[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function setBreadcrumbTrail(items: BreadcrumbItem[]) {
  trail = items;
  emit();
}

export function clearBreadcrumbTrail() {
  trail = [];
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return trail;
}

export function useBreadcrumbTrail() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
