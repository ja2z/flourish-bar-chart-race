interface FlourishOptions {
  template: string;
  version: string;
  container: HTMLElement | string;
  api_key: string;
  bindings: {
    data: {
      x: string;
      y: string;
      metadata: string[];
    };
  };
  data: {
    data: any[];
  };
  state: {
    layout: {
      title: string;
    };
  };
}

interface Flourish {
  Live: new (options: FlourishOptions) => any;
}

declare global {
  interface Window {
    Flourish: Flourish;
  }
}

export {}; 