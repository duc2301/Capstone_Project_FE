type Viewer = Autodesk.Viewing.GuiViewer3D;

const MARKUP_EXT_ID = 'Autodesk.Viewing.MarkupsCore';
const THUMB_MAX_WIDTH = 480;
const THUMB_QUALITY = 0.7;

export interface MarkupExt {
  show(): void;
  hide(): void;
  clear(): void;
  enterEditMode(layerId?: string): void;
  leaveEditMode(): void;
  generateData(): string;
  loadMarkups(markupString: string, layerId: string): boolean;
  renderToCanvas(ctx: CanvasRenderingContext2D): void;
}

export async function loadMarkupExt(viewer: Viewer): Promise<MarkupExt> {
  const existing = viewer.getExtension(MARKUP_EXT_ID);
  if (existing) return existing as MarkupExt;
  return (await viewer.loadExtension(MARKUP_EXT_ID)) as MarkupExt;
}

export function getMarkupExt(viewer: Viewer): MarkupExt | null {
  return (viewer.getExtension(MARKUP_EXT_ID) as MarkupExt | null) ?? null;
}

export async function beginDraw(viewer: Viewer): Promise<void> {
  const ext = await loadMarkupExt(viewer);
  viewer.setNavigationLock(false);
  ext.clear();
  ext.show();
  ext.enterEditMode();
}

export function endDraw(viewer: Viewer): void {
  const ext = getMarkupExt(viewer);
  if (!ext) return;
  try {
    ext.leaveEditMode();
    ext.clear();
    ext.hide();
  } catch {
  }
}

interface BubbleLike {
  data?: { guid?: string };
  getRootNode?: () => BubbleLike;
  getDocument?: () => unknown;
  search?: (filter: Record<string, unknown>) => BubbleLike[];
}
interface ModelLike {
  getDocumentNode?: () => BubbleLike | null;
}

function getModel(viewer: Viewer): ModelLike | null {
  return (viewer as unknown as { model?: ModelLike }).model ?? null;
}

function getCurrentViewableGuid(viewer: Viewer): string | null {
  try {
    return getModel(viewer)?.getDocumentNode?.()?.data?.guid ?? null;
  } catch {
    return null;
  }
}

async function switchViewableIfNeeded(viewer: Viewer, targetGuid: string | null): Promise<void> {
  if (!targetGuid) return;
  try {
    const currentNode = getModel(viewer)?.getDocumentNode?.();
    if (!currentNode || currentNode.data?.guid === targetGuid) return;

    const root = currentNode.getRootNode?.();
    const doc = currentNode.getDocument?.();
    const target = root?.search?.({ guid: targetGuid })?.[0];
    if (!root || !doc || !target) return;

    await viewer.loadDocumentNode(
      doc as Autodesk.Viewing.Document,
      target as unknown as Autodesk.Viewing.BubbleNode,
    );
  } catch {
  }
}

export function captureViewpoint(viewer: Viewer): string {
  try {
    return JSON.stringify({ viewableGuid: getCurrentViewableGuid(viewer), camera: viewer.getState() });
  } catch {
    return '{}';
  }
}

export function captureMarkupSvg(viewer: Viewer): string {
  const ext = getMarkupExt(viewer);
  if (!ext) return '';
  try {
    ext.leaveEditMode();
  } catch {
  }
  try {
    return ext.generateData() ?? '';
  } catch {
    return '';
  }
}

export function captureThumbnail(viewer: Viewer): Promise<string> {
  return new Promise((resolve) => {
    const w = viewer.container?.clientWidth || 800;
    const h = viewer.container?.clientHeight || 600;
    const ext = getMarkupExt(viewer);

    try {
      viewer.getScreenShot(w, h, (result: Blob | string) => {
        const img = new Image();
        const objectUrl = result instanceof Blob ? URL.createObjectURL(result) : null;
        const cleanup = () => {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        };

        img.onload = () => {
          const scale = Math.min(1, THUMB_MAX_WIDTH / (img.width || THUMB_MAX_WIDTH));
          const cw = Math.max(1, Math.round((img.width || THUMB_MAX_WIDTH) * scale));
          const ch = Math.max(1, Math.round((img.height || 1) * scale));
          const canvas = document.createElement('canvas');
          canvas.width = cw;
          canvas.height = ch;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            cleanup();
            resolve('');
            return;
          }
          ctx.drawImage(img, 0, 0, cw, ch);
          if (ext && typeof ext.renderToCanvas === 'function') {
            try {
              ctx.save();
              ctx.scale(scale, scale);
              ext.renderToCanvas(ctx);
              ctx.restore();
            } catch {
            }
          }
          cleanup();
          resolve(canvas.toDataURL('image/jpeg', THUMB_QUALITY));
        };
        img.onerror = () => {
          cleanup();
          resolve('');
        };

        const src = objectUrl ?? (typeof result === 'string' ? result : '');
        if (!src) {
          cleanup();
          resolve('');
          return;
        }
        img.src = src;
      });
    } catch {
      resolve('');
    }
  });
}

function waitRestoreState(viewer: Viewer, state: Record<string, unknown>): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;
    let listener: Autodesk.Viewing.ViewerEventListener = () => { };
    const finish = () => {
      if (settled) return;
      settled = true;
      viewer.removeEventListener(Autodesk.Viewing.FINAL_FRAME_RENDERED_CHANGED_EVENT, listener);
      resolve();
    };
    listener = (event) => {
      if (event.value?.finalFrame) finish();
    };
    viewer.addEventListener(Autodesk.Viewing.FINAL_FRAME_RENDERED_CHANGED_EVENT, listener);
    try {
      viewer.restoreState(state);
    } catch {
      finish();
      return;
    }
    window.setTimeout(finish, 1500);
  });
}

export async function restoreNote(viewer: Viewer, viewpointJson: string | null, svg: string | null, layerId: string): Promise<void> {
  const ext = await loadMarkupExt(viewer);
  try {
    ext.leaveEditMode();
  } catch {
  }
  ext.clear();

  let camera: Record<string, unknown> | null = null;
  let viewableGuid: string | null = null;
  if (viewpointJson) {
    try {
      const parsed = JSON.parse(viewpointJson) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object' && 'camera' in parsed) {
        camera = (parsed.camera as Record<string, unknown>) ?? null;
        viewableGuid = (parsed.viewableGuid as string | null) ?? null;
      } else {
        camera = parsed;
      }
    } catch {
      camera = null;
    }
  }

  await switchViewableIfNeeded(viewer, viewableGuid);
  if (camera) await waitRestoreState(viewer, camera);

  if (svg) {
    ext.show();
    try {
      ext.loadMarkups(svg, layerId);
    } catch {
    }
    viewer.setNavigationLock(true);
  } else {
    ext.hide();
  }
}

export function hideMarkups(viewer: Viewer): void {
  viewer.setNavigationLock(false);
  const ext = getMarkupExt(viewer);
  if (!ext) return;
  try {
    ext.clear();
    ext.hide();
  } catch {
  }
}
