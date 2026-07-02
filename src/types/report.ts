export interface ReportData {
  id: string;
  title: string;
  generatedAt: Date;
  summary: {
    total: number;
    count: number;
    average: number;
  };
  items: Array<{
    label: string;
    value: number;
    percentage?: number;
  }>;
  chartData?: any;
}