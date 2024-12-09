// Base type for dynamic array of strings or numbers
export type DynamicRow = (string | number)[];

// Header row must contain at least one element (label) and all strings
export type HeaderDataPoint = [string, ...string[]];

// Data row must contain at least one element (label string) followed by numbers
export type BaseDataPoint = [string, ...number[]];

// Union type for all possible row types
export type FlourishDataPoint = HeaderDataPoint | BaseDataPoint;

// Type guard to check if a row is a header row
export function isHeaderRow(row: FlourishDataPoint): row is HeaderDataPoint {
    return row.every(item => typeof item === 'string');
}