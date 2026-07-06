declare namespace Autodesk {
  namespace Viewing {
    type TokenCallback = (token: string, expiresInSeconds: number) => void;
    const FINAL_FRAME_RENDERED_CHANGED_EVENT: string;
    interface ViewerEvent {
      value: { finalFrame?: boolean;[key: string]: unknown };
      [key: string]: unknown;
    }
    type ViewerEventListener = (event: ViewerEvent) => void;

    interface InitializerOptions {
      env: string;
      api: string;
      getAccessToken: (onTokenReady: TokenCallback) => void;
      language?: string;
    }

    interface ViewerConfig {
      extensions?: string[];
      [key: string]: unknown;
    }

    type Model = Record<string, unknown>;

    type DocumentLoadSuccess = (doc: Document) => void;
    type DocumentLoadError = (
      errorCode: number,
      errorMsg: string,
      messages?: unknown,
    ) => void;

    function Initializer(
      options: InitializerOptions,
      onSuccess: () => void,
    ): void;
    function shutdown(): void;

    class BubbleNode {
      getDefaultGeometry(): BubbleNode;
      data: Record<string, unknown>;
    }

    class Document {
      static load(
        documentId: string,
        onSuccess: DocumentLoadSuccess,
        onError: DocumentLoadError,
      ): void;
      getRoot(): BubbleNode;
    }

    class Viewer3D {
      constructor(container: HTMLElement, config?: ViewerConfig);
      container: HTMLElement;
      start(url?: string, options?: ViewerConfig): number;
      finish(): void;
      resize(): void;
      loadDocumentNode(
        doc: Document,
        node: BubbleNode,
        options?: ViewerConfig,
      ): Promise<Model>;
      loadExtension(extensionId: string, options?: ViewerConfig): Promise<unknown>;
      getExtension(extensionId: string): unknown;
      getState(filter?: Record<string, unknown>): Record<string, unknown>;
      restoreState(state: Record<string, unknown>, filter?: Record<string, unknown>, immediate?: boolean): boolean;
      getScreenShot(width: number, height: number, callback: (result: Blob | string) => void): void;
      addEventListener(type: string, listener: ViewerEventListener): void;
      removeEventListener(type: string, listener: ViewerEventListener): void;
      setNavigationLock(locked: boolean): void;
    }

    class GuiViewer3D extends Viewer3D { }
  }
}

interface Window {
  Autodesk?: typeof Autodesk;
}
