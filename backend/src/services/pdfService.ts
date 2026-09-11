import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface ChallanPDFData {
  challanNumber: string;
  createdDate: Date;
  status: string;
  createdBy: string;
  totalQuantity: number;
  totalAmount: number;
  notes?: string | null;
  customer: {
    customerName: string;
    businessName: string;
    mobileNumber: string;
    email: string;
    gstNumber?: string | null;
    address: string;
  };
  items: Array<{
    productName: string;
    productSku: string;
    category: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
}

export const generateChallanPDF = (challan: ChallanPDFData, res: Response): void => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="Challan_${challan.challanNumber}.pdf"`
  );

  doc.pipe(res);

  // Header / Branding
  doc.rect(0, 0, doc.page.width, 10).fill('#2563EB'); // Blue top banner

  doc.fillColor('#1E293B').fontSize(22).font('Helvetica-Bold').text('MINI ERP & CRM', 50, 40);
  doc.fillColor('#64748B').fontSize(9).font('Helvetica').text('Wholesale & Distribution Operations Portal', 50, 68);
  doc.text('102 Logistics Park, Warehouse Corridor, Tech Hub', 50, 80);
  doc.text('Email: operations@minierp.local | Tel: +91 98765 43210', 50, 92);

  // Document Title & Meta Box
  const statusColor = challan.status === 'Confirmed' ? '#16A34A' : challan.status === 'Cancelled' ? '#DC2626' : '#EAB308';
  
  doc.roundedRect(360, 40, 185, 80, 4).lineWidth(1).strokeColor('#E2E8F0').stroke();
  doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text('SALES CHALLAN', 370, 48);
  doc.fillColor('#475569').fontSize(9).font('Helvetica').text(`Challan No: ${challan.challanNumber}`, 370, 66);
  doc.text(`Date: ${new Date(challan.createdDate).toLocaleDateString('en-GB')}`, 370, 80);
  doc.text(`Created By: ${challan.createdBy}`, 370, 94);
  
  // Status Badge
  doc.fillColor(statusColor).fontSize(10).font('Helvetica-Bold').text(`STATUS: ${challan.status.toUpperCase()}`, 370, 106);

  // Horizontal divider
  doc.moveTo(50, 135).lineTo(545, 135).lineWidth(1).strokeColor('#CBD5E1').stroke();

  // Customer Info Box
  doc.fillColor('#1E293B').fontSize(11).font('Helvetica-Bold').text('BILLED & DISPATCHED TO:', 50, 145);
  doc.fontSize(10).font('Helvetica-Bold').text(challan.customer.businessName, 50, 160);
  doc.font('Helvetica').fillColor('#475569');
  doc.text(`Contact: ${challan.customer.customerName}`, 50, 173);
  doc.text(`Phone: ${challan.customer.mobileNumber} | Email: ${challan.customer.email}`, 50, 185);
  doc.text(`Address: ${challan.customer.address}`, 50, 197);
  if (challan.customer.gstNumber) {
    doc.text(`GSTIN: ${challan.customer.gstNumber}`, 50, 209);
  }

  // Items Table Header
  const tableTop = 235;
  doc.rect(50, tableTop, 495, 24).fill('#F1F5F9');
  doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
  doc.text('#', 58, tableTop + 7);
  doc.text('Product Description / SKU', 85, tableTop + 7);
  doc.text('Category', 280, tableTop + 7);
  doc.text('Unit Price', 360, tableTop + 7, { width: 50, align: 'right' });
  doc.text('Qty', 425, tableTop + 7, { width: 40, align: 'right' });
  doc.text('Subtotal', 475, tableTop + 7, { width: 65, align: 'right' });

  // Items Rows
  let y = tableTop + 24;
  doc.font('Helvetica').fontSize(9);

  challan.items.forEach((item, index) => {
    const rowColor = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    doc.rect(50, y, 495, 24).fill(rowColor);

    doc.fillColor('#0F172A');
    doc.text(String(index + 1), 58, y + 7);
    doc.text(`${item.productName} (${item.productSku})`, 85, y + 7, { width: 190, ellipsis: true });
    doc.fillColor('#64748B').text(item.category, 280, y + 7);
    doc.fillColor('#0F172A').text(`₹${item.unitPrice.toFixed(2)}`, 360, y + 7, { width: 50, align: 'right' });
    doc.text(String(item.quantity), 425, y + 7, { width: 40, align: 'right' });
    doc.font('Helvetica-Bold').text(`₹${item.subtotal.toFixed(2)}`, 475, y + 7, { width: 65, align: 'right' });
    doc.font('Helvetica');

    y += 24;
  });

  // Table bottom border
  doc.moveTo(50, y).lineTo(545, y).lineWidth(1).strokeColor('#E2E8F0').stroke();

  // Summary box
  y += 15;
  doc.rect(340, y, 205, 55).fill('#F8FAFC');
  doc.rect(340, y, 205, 55).lineWidth(1).strokeColor('#E2E8F0').stroke();

  doc.fillColor('#475569').fontSize(9).font('Helvetica');
  doc.text('Total Items Quantity:', 350, y + 10);
  doc.text(`${challan.totalQuantity} units`, 470, y + 10, { width: 65, align: 'right' });

  doc.text('Total Invoice Value:', 350, y + 30);
  doc.fillColor('#1E3A8A').fontSize(12).font('Helvetica-Bold');
  doc.text(`₹${challan.totalAmount.toFixed(2)}`, 450, y + 28, { width: 85, align: 'right' });

  // Notes
  if (challan.notes) {
    doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('Notes & Remarks:', 50, y + 10);
    doc.font('Helvetica').text(challan.notes, 50, y + 25, { width: 270 });
  }

  // Footer & Signatures
  const footerY = 720;
  doc.moveTo(50, footerY).lineTo(545, footerY).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
  
  doc.fillColor('#475569').fontSize(8).font('Helvetica');
  doc.text('Authorized Signatory', 430, footerY + 45);
  doc.moveTo(410, footerY + 40).lineTo(530, footerY + 40).lineWidth(0.5).strokeColor('#94A3B8').stroke();

  doc.text('Terms & Conditions:', 50, footerY + 15);
  doc.text('1. Goods once dispatched are subject to inspection within 48 hours.', 50, footerY + 27);
  doc.text('2. This is a computer-generated challan/invoice document.', 50, footerY + 37);

  doc.end();
};
