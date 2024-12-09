import React, { useEffect, useRef, useState, useCallback } from 'react';
import { debugService, LogLevel } from "../debug";
import { FlourishDataPoint, isHeaderRow } from "../types";

debugService.configure(LogLevel.DEBUG);

interface FlourishProps {
  flourishData: FlourishDataPoint[];
  apiKey: string;
  title?: string;
  template?: string;
  version?: string;
  fillOpacity?: number;
  loadingDelay?: number;
}

interface FlourishOptions {
  template: string;
  version: string;
  container: HTMLElement;
  api_key: string;
  bindings: {
    data: {
      values: number[];
      label: number;
    };
  };
  data: {
    data: FlourishDataPoint[];
  };
  state: {
    fill_opacity: number;
    layout: {
      title: string;
    };
  };
}

declare global {
  interface Window {
    Flourish: {
      Live: new (options: FlourishOptions) => any;
    };
  }
}

const CONSTANTS = {
  CDN_URL: "https://cdn.flourish.rocks/flourish-live-v4.0.0.min.js",
  INITIALIZATION_DELAY: 50,
  MAX_RETRIES: 3,
  RETRY_DELAY: 500,
  DATA_INDICES: {
    LABEL: 0,
    VALUES_START: 1, // All columns after label are values
  } as const
} as const;

const FlourishComponent: React.FC<FlourishProps> = ({
  flourishData,
  title = "Flourish Visualization",
  apiKey,
  template = "@flourish/bar-chart-race",
  version = "4",
  fillOpacity = 0.7,
  loadingDelay = CONSTANTS.INITIALIZATION_DELAY
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualizationRef = useRef<any>(null);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);
  const isInitializedRef = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const validateData = useCallback((data: FlourishDataPoint[]): boolean => {
    if (data.length === 0) return false;
    
    if (!isHeaderRow(data[0])) {
      debugService.warn('First row is not a header row');
      return false;
    }

    if (data.length < 2) {
      debugService.warn('No data rows found');
      return false;
    }

    return true;
  }, []);

  const createOptions = useCallback(() => {
    if (!validateData(flourishData)) {
      debugService.warn('Invalid data structure');
      return null;
    }

    if (!containerRef.current) {
      return null;
    }
    
    // Calculate value indices (all columns after label)
    const valueIndices = Array.from(
      { length: flourishData[0].length - CONSTANTS.DATA_INDICES.VALUES_START },
      (_, i) => i + CONSTANTS.DATA_INDICES.VALUES_START
    );

    return {
      template,
      version,
      container: containerRef.current,
      api_key: apiKey,
      bindings: {
        data: {
          values: valueIndices,
          label: CONSTANTS.DATA_INDICES.LABEL
        }
      },
      data: {
        data: flourishData
      },
      state: {
        fill_opacity: fillOpacity,        
        layout: {
          title
        }
      }
    };
  }, [flourishData, fillOpacity, title, apiKey, template, version, validateData]);

  debugService.debug("Create Options:", createOptions());
  const loadFlourishScript = useCallback(async (): Promise<void> => {
    if (window.Flourish) {
      setIsScriptLoaded(true);
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = CONSTANTS.CDN_URL;
      script.async = true;
      script.onload = () => {
        setIsScriptLoaded(true);
        resolve();
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }, []);

  const initializeVisualization = useCallback(async () => {
    if (isInitializedRef.current || initializationPromiseRef.current) {
      return initializationPromiseRef.current;
    }

    if (!containerRef.current || !flourishData.length || !window.Flourish) {
      return;
    }

    initializationPromiseRef.current = (async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, loadingDelay));
        
        if (!containerRef.current) return;

        const options = createOptions();
        if (!options) {
          throw new Error('Invalid data structure');
        }

        visualizationRef.current = new window.Flourish.Live(options);
        isInitializedRef.current = true;
      } catch (error) {
        console.error("Error initializing Flourish visualization:", error);
        isInitializedRef.current = false;
        initializationPromiseRef.current = null;
      }
    })();

    return initializationPromiseRef.current;
  }, [createOptions, flourishData.length, loadingDelay]);

  const updateVisualization = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      if (!visualizationRef.current || !flourishData.length || !containerRef.current) {
        return;
      }

      try {
        const options = createOptions();
        if (!options) {
          throw new Error('Invalid data structure');
        }
        visualizationRef.current.update(options);
      } catch (error) {
        console.error("Error updating Flourish visualization:", error);
        isInitializedRef.current = false;
        visualizationRef.current?.destroy?.();
        visualizationRef.current = null;
        initializeVisualization();
      }
    }, 50);
  }, [createOptions, flourishData.length, initializeVisualization]);

  // Script loading effect
  useEffect(() => {
    if (!isScriptLoaded) {
      loadFlourishScript();
    }
  }, [isScriptLoaded, loadFlourishScript]);

  // Visualization lifecycle effect
  useEffect(() => {
    if (!isScriptLoaded) return;

    if (!isInitializedRef.current) {
      initializeVisualization();
    } else {
      updateVisualization();
    }

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      if (visualizationRef.current?.destroy) {
        visualizationRef.current.destroy();
        visualizationRef.current = null;
        isInitializedRef.current = false;
        initializationPromiseRef.current = null;
      }
    };
  }, [isScriptLoaded, initializeVisualization, updateVisualization]);

  return <div ref={containerRef} style={{ minHeight: '100px' }} />;
};

export default FlourishComponent;