import { jsPDF } from 'jspdf';
import type { Invoice, Quote, QuoteItem, SiteSettings } from '../types.ts';

function formatCurrency(val: number): string {
  return `${val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
}

export function downloadQuotePdf(quote: Quote, items: QuoteItem[], settings: SiteSettings): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 20;

  // Header band
  doc.setFillColor(10, 10, 11);
  doc.rect(0, 0, 210, 38, 'F');
  doc.setTextColor(197, 155, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(settings.companyName || 'EVENT PRO', 16, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(settings.sloganFr || 'Vos événements, notre expertise.', 16, 25);
  doc.text(settings.address, 16, 30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('DEVIS', 194, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(quote.quoteNumber, 194, 25, { align: 'right' });
  doc.text(`Valide jusqu'au : ${quote.validUntil}`, 194, 30, { align: 'right' });

  y = 50;
  doc.setTextColor(20, 20, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CLIENT', 16, y);
  doc.text('ÉMETTEUR', 115, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(quote.clientName, 16, y);
  doc.text(settings.companyName, 115, y);
  y += 5;
  doc.text(quote.clientEmail, 16, y);
  doc.text(`${settings.phone} · ${settings.email}`, 115, y);

  y += 14;
  // Table header
  doc.setFillColor(246, 246, 244);
  doc.rect(16, y, 178, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Prestation / Désignation', 19, y + 6);
  doc.text('Qté', 120, y + 6, { align: 'right' });
  doc.text('P.U. (MAD)', 154, y + 6, { align: 'right' });
  doc.text('Total (MAD)', 191, y + 6, { align: 'right' });

  y += 13;
  doc.setFont('helvetica', 'normal');
  for (const item of items) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    const lines = doc.splitTextToSize(item.description, 92);
    doc.text(lines, 19, y);
    doc.text(String(item.quantity), 120, y, { align: 'right' });
    doc.text(formatCurrency(item.unitPriceMad), 154, y, { align: 'right' });
    doc.text(formatCurrency(item.totalMad), 191, y, { align: 'right' });
    y += Math.max(7, lines.length * 5 + 2);
    doc.setDrawColor(232, 232, 228);
    doc.line(16, y - 2, 194, y - 2);
  }

  y += 8;
  const xLabel = 132;
  const xVal = 191;

  doc.setFontSize(10);
  doc.text('Sous-total :', xLabel, y);
  doc.text(formatCurrency(quote.subtotalMad), xVal, y, { align: 'right' });
  y += 6;

  if (quote.discountMad > 0) {
    doc.text('Réduction :', xLabel, y);
    doc.text(`- ${formatCurrency(quote.discountMad)}`, xVal, y, { align: 'right' });
    y += 6;
  }

  doc.text(`TVA (${quote.vatRatePercent}%) :`, xLabel, y);
  doc.text(formatCurrency(quote.vatAmountMad), xVal, y, { align: 'right' });
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total TTC :', xLabel, y);
  doc.setTextColor(168, 130, 27);
  doc.text(formatCurrency(quote.totalTtcMad), xVal, y, { align: 'right' });

  y += 14;
  doc.setTextColor(40, 40, 45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Conditions de paiement :', 16, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  const termLines = doc.splitTextToSize(quote.paymentTerms, 178);
  doc.text(termLines, 16, y);
  y += termLines.length * 5 + 4;

  if (quote.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notes complémentaires :', 16, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(quote.notes, 178);
    doc.text(noteLines, 16, y);
  }

  doc.save(`${quote.quoteNumber}-EVENT-PRO.pdf`);
}

export function downloadInvoicePdf(
  invoice: Invoice,
  items: QuoteItem[],
  settings: SiteSettings
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 20;

  doc.setFillColor(10, 10, 11);
  doc.rect(0, 0, 210, 38, 'F');
  doc.setTextColor(197, 155, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(settings.companyName || 'EVENT PRO', 16, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(settings.address, 16, 25);
  doc.text(`${settings.phone} · ${settings.email}`, 16, 30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('FACTURE', 194, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(invoice.invoiceNumber, 194, 25, { align: 'right' });
  doc.text(`Émise le : ${invoice.issuedAt.slice(0, 10)}`, 194, 30, { align: 'right' });

  y = 50;
  doc.setTextColor(20, 20, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('FACTURÉ À', 16, y);
  doc.text('STATUT DU RÈGLEMENT', 120, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.clientName, 16, y);
  doc.text(`Statut : ${invoice.status.toUpperCase()}`, 120, y);
  y += 5;
  doc.text(invoice.clientEmail, 16, y);
  doc.text(`Réglé : ${formatCurrency(invoice.paidAmountMad)}`, 120, y);

  y += 14;
  doc.setFillColor(246, 246, 244);
  doc.rect(16, y, 178, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Désignation', 19, y + 6);
  doc.text('Qté', 120, y + 6, { align: 'right' });
  doc.text('P.U. (MAD)', 154, y + 6, { align: 'right' });
  doc.text('Total (MAD)', 191, y + 6, { align: 'right' });

  y += 13;
  doc.setFont('helvetica', 'normal');
  for (const item of items) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    const lines = doc.splitTextToSize(item.description, 92);
    doc.text(lines, 19, y);
    doc.text(String(item.quantity), 120, y, { align: 'right' });
    doc.text(formatCurrency(item.unitPriceMad), 154, y, { align: 'right' });
    doc.text(formatCurrency(item.totalMad), 191, y, { align: 'right' });
    y += Math.max(7, lines.length * 5 + 2);
  }

  y += 10;
  doc.text('Sous-total :', 132, y);
  doc.text(formatCurrency(invoice.subtotalMad), 191, y, { align: 'right' });
  y += 6;
  if (invoice.discountMad > 0) {
    doc.text('Réduction :', 132, y);
    doc.text(`- ${formatCurrency(invoice.discountMad)}`, 191, y, { align: 'right' });
    y += 6;
  }
  doc.text(`TVA (${invoice.vatRatePercent}%) :`, 132, y);
  doc.text(formatCurrency(invoice.vatAmountMad), 191, y, { align: 'right' });
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total TTC :', 132, y);
  doc.text(formatCurrency(invoice.totalTtcMad), 191, y, { align: 'right' });
  y += 7;
  doc.setFontSize(10);
  doc.text('Reste à payer :', 132, y);
  doc.setTextColor(168, 130, 27);
  doc.text(
    formatCurrency(Math.max(0, invoice.totalTtcMad - invoice.paidAmountMad)),
    191,
    y,
    { align: 'right' }
  );

  doc.save(`${invoice.invoiceNumber}-EVENT-PRO.pdf`);
}
