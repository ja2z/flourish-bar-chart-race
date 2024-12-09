export type DynamicRow = (string | number)[];
export type HeaderDataPoint = [string, ...string[]];
export type BaseDataPoint = [string, ...number[]];
export type FlourishDataPoint = HeaderDataPoint | BaseDataPoint;
export declare function isHeaderRow(row: FlourishDataPoint): row is HeaderDataPoint;
