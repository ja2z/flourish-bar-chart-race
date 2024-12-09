import { useMemo, useEffect } from "react";
import FlourishComponent from "./components/FlourishComponent";
import "./App.css";
import { 
  client, 
  useConfig, 
  useElementColumns, 
  useElementData, 
  useVariable 
} from "@sigmacomputing/plugin";
import { debugService, LogLevel } from "./debug";
import { FlourishDataPoint, HeaderDataPoint, BaseDataPoint } from "./types";

debugService.configure(LogLevel.DEBUG);

client.config.configureEditorPanel([
  { name: "sourceData", type: "element" },
  { name: "label", type: "column", source: "sourceData", allowMultiple: false },
  { name: "date", type: "column", source: "sourceData", allowMultiple: false },
  { name: "value", type: "column", source: "sourceData", allowMultiple: false },
  { name: "apiKey", type: "text", secure: true },
  { name: "fillOpacity", type: "variable" },
]);

interface DataPoint {
  label: string;
  date: number;
  value: number;
}

interface GroupedData {
  [label: string]: {
    [date: string]: number;
  };
}

function App() {
  const config = useConfig();
  const sourceData = useElementData(config.sourceData);
  const columnInfo = useElementColumns(config.sourceData);
  const apiKey = config.apiKey;
  const fillOpacity = (useVariable(config.fillOpacity)[0]?.defaultValue as { value?: number })?.value ?? 1;

  debugService.debug("Config:", config);
  debugService.debug("columnInfo:", columnInfo);
  debugService.debug("sourceData:", sourceData);
  
  // Debug initial state
  useEffect(() => {
    debugService.debug("Data State:", {
      hasSourceData: !!sourceData,
      columnNames: sourceData ? Object.keys(sourceData) : 'no data',
      configState: {
        sourceData: config.sourceData,
        label: config.label,
        date: config.date,
        value: config.value
      }
    });
  }, [sourceData, config]);

  const flourishData = useMemo(() => {
    // Guard clause for source data
    if (!sourceData) {
      debugService.warn('Source data is null/undefined');
      return [] as FlourishDataPoint[];
    }

    // Verify we have data arrays
    const labelData = sourceData[config.label];
    const dateData = sourceData[config.date];
    const valueData = sourceData[config.value];

    debugService.debug('Data arrays:', {
      labelPresent: !!labelData,
      datePresent: !!dateData,
      valuePresent: !!valueData,
      labelLength: labelData?.length,
      dateLength: dateData?.length,
      valueLength: valueData?.length
    });

    if (!labelData || !dateData || !valueData) {
      debugService.warn('Missing required data arrays');
      return [] as FlourishDataPoint[];
    }

    try {
      // Safe transformation functions with error checking
      const transformToDataPoints = (): DataPoint[] => {
        const length = labelData.length;
        return Array.from({ length }, (_, i) => {
          try {
            return {
              label: String(labelData[i] ?? ''),
              date: Number(dateData[i] ?? 0),
              value: Number(valueData[i] ?? 0)
            };
          } catch (err) {
            debugService.error('Error transforming data point', { index: i, error: err });
            return { label: '', date: 0, value: 0 };
          }
        });
      };

      const groupDataByLabel = (dataPoints: DataPoint[]): GroupedData => {
        return dataPoints.reduce((acc, { label, date, value }) => {
          if (!acc[label]) acc[label] = {};
          acc[label][date] = value;
          return acc;
        }, {} as GroupedData);
      };

      const createFlourishData = (groupedData: GroupedData): FlourishDataPoint[] => {
        const uniqueDates = Array.from(
          new Set(
            Object.values(groupedData)
              .flatMap(dateValues => Object.keys(dateValues))
          )
        ).sort();

        const headerRow: HeaderDataPoint = [
          "Asset Name",
          ...uniqueDates
        ];

        const dataRows: BaseDataPoint[] = Object.entries(groupedData).map(([label, dateValues]) => [
          label,
          ...uniqueDates.map(date => dateValues[date] ?? 0)
        ]);

        return [headerRow, ...dataRows];
      };

      // Execute transformation pipeline with debugging
      const dataPoints = transformToDataPoints();
      debugService.debug('Data points created:', dataPoints.length);

      const groupedData = groupDataByLabel(dataPoints);
      debugService.debug('Grouped data created:', Object.keys(groupedData).length);

      const finalData = createFlourishData(groupedData);
      debugService.debug('Final data created:', finalData.length);

      return finalData;
    } catch (error) {
      debugService.error('Error in data transformation:', error);
      return [] as FlourishDataPoint[];
    }
  }, [sourceData, config]);

  // Debug final state
  useEffect(() => {
    debugService.debug("Final State:", {
      hasFlourishData: flourishData.length > 0,
      flourishDataLength: flourishData.length,
      sampleData: flourishData.slice(0, 2)
    });
  }, [flourishData]);

  debugService.debug("flourishData", flourishData);
  
  return (
    <FlourishComponent 
      flourishData={flourishData} 
      apiKey={apiKey}
      title="Flourish Visualization" 
      fillOpacity={fillOpacity} 
      loadingDelay={100}
    />
  );
}

export default App;