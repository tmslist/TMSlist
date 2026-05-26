'use client';
import { useState, useCallback } from 'react';

export function useExportPDF() {
  const [exporting, setExporting] = useState(false);

  const exportPDF = useCallback(async (elementId: string, filename = 'analytics-report.pdf') => {
    setExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const element = document.getElementById(elementId);
      if (!element) throw new Error('Element not found');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0D1117',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      if (pdfHeight > pdf.internal.pageSize.getHeight()) {
        let heightLeft = pdfHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
        while (heightLeft > 0) {
          position -= pdf.internal.pageSize.getHeight();
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pdf.internal.pageSize.getHeight();
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(filename);
    } catch (err) {
      console.error('PDF export failed:', err);
      throw err;
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportPDF, exporting };
}
