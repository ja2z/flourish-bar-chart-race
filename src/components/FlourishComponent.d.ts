import React from 'react';
import { FlourishDataPoint } from "../types";
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
declare const FlourishComponent: React.FC<FlourishProps>;
export default FlourishComponent;
