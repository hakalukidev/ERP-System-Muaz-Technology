import { ReportData } from '@/types/report';

export function exportPDF(data: ReportData) {
  console.log('Exporting PDF:', data);
  alert('PDF export functionality - implement with library like jsPDF or react-pdf');
  // jsPDF ব্যবহার করে PDF জেনারেট করুন
  // বা react-pdf ব্যবহার করুন
}

export function exportExcel(data: ReportData) {
  console.log('Exporting Excel:', data);
  alert('Excel export functionality - implement with library like xlsx');
  // xlsx লাইব্রেরি ব্যবহার করে Excel জেনারেট করুন
}