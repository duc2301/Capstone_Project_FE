declare namespace Autodesk {
  namespace Viewing {
    type TokenCallback = (token: string, expiresInSeconds: number) => void;

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
      start(url?: string, options?: ViewerConfig): number;
      finish(): void;
      resize(): void;
      loadDocumentNode(
        doc: Document,
        node: BubbleNode,
        options?: ViewerConfig,
      ): Promise<Model>;
      loadExtension(extensionId: string, options?: ViewerConfig): Promise<unknown>;
    }

    class GuiViewer3D extends Viewer3D {}
  }
}

interface Window {
  Autodesk?: typeof Autodesk;
}
