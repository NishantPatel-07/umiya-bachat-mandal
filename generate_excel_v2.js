import ExcelJS from 'exceljs';
import { initialMembers } from './src/data/initialMembers.js';

async function generateExcel() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Umiya_Bachat', {
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });

  // Common Border Style
  const borderAll = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  // Header
  sheet.mergeCells('A1:I1');
  sheet.getCell('A1').value = 'શ્રી શુભ               શ્રી ગણેશાય નમઃ               શ્રી લાભ';
  sheet.getCell('A1').alignment = { horizontal: 'center' };
  sheet.getCell('A1').font = { bold: true, size: 14 };

  sheet.mergeCells('A2:I2');
  sheet.getCell('A2').value = 'શ્રી ઉમિયા બચત મંડળ, અમદાવાદ';
  sheet.getCell('A2').alignment = { horizontal: 'center' };
  sheet.getCell('A2').font = { bold: true, size: 16 };
  sheet.getCell('A2').border = borderAll;

  sheet.mergeCells('A3:I3');
  sheet.getCell('A3').value = '૨૦૨૬';
  sheet.getCell('A3').alignment = { horizontal: 'right' };
  sheet.getCell('A3').font = { bold: true };

  // Main Table Header
  const headers = ['ક્રમ', 'સભ્ય નું નામ', 'શેર સંખ્યા', 'શેર હપ્તો', 'પરત ધિરાણ હપ્તો', 'હપ્તા ક્રમ/૧૦', 'હપ્તા ક્રમ/૨૦', 'ઉચ્ચક વ્યાજ', 'કુલ રકમ'];
  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = borderAll;
  });

  // Column Widths
  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 30;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 12;
  sheet.getColumn(5).width = 18;
  sheet.getColumn(6).width = 14;
  sheet.getColumn(7).width = 14;
  sheet.getColumn(8).width = 16;
  sheet.getColumn(9).width = 16;

  let shareSub1 = 0;
  let shareValSub1 = 0;
  let shareSub2 = 0;
  let shareValSub2 = 0;

  // Data Rows 1-30
  for (let i = 0; i < 30; i++) {
    const member = initialMembers[i];
    const row = sheet.addRow([
      member.num, member.name, member.shares, member.shares * 500, '', '', '', '', ''
    ]);
    row.eachCell((cell) => { cell.border = borderAll; cell.alignment = { vertical: 'middle' }; });
    sheet.getCell(`A${row.number}`).alignment = { horizontal: 'center' };
    sheet.getCell(`C${row.number}`).alignment = { horizontal: 'center' };
    sheet.getCell(`D${row.number}`).alignment = { horizontal: 'right' };
    shareSub1 += member.shares;
    shareValSub1 += member.shares * 500;
  }

  // Subtotal 1
  const sub1Row = sheet.addRow(['', '', shareSub1, shareValSub1, '', '', '', '', '']);
  sub1Row.eachCell((cell) => { cell.border = borderAll; cell.font = { bold: true }; });
  sheet.getCell(`C${sub1Row.number}`).alignment = { horizontal: 'center' };
  sheet.getCell(`D${sub1Row.number}`).alignment = { horizontal: 'right' };

  // Data Rows 31-50
  for (let i = 30; i < 50; i++) {
    const member = initialMembers[i];
    const row = sheet.addRow([
      member.num, member.name, member.shares, member.shares * 500, '', '', '', '', ''
    ]);
    row.eachCell((cell) => { cell.border = borderAll; cell.alignment = { vertical: 'middle' }; });
    sheet.getCell(`A${row.number}`).alignment = { horizontal: 'center' };
    sheet.getCell(`C${row.number}`).alignment = { horizontal: 'center' };
    sheet.getCell(`D${row.number}`).alignment = { horizontal: 'right' };
    shareSub2 += member.shares;
    shareValSub2 += member.shares * 500;
  }

  // Subtotal 2
  const sub2Row = sheet.addRow(['', '', shareSub2, shareValSub2, '', '', '', '', '']);
  sub2Row.eachCell((cell) => { cell.border = borderAll; cell.font = { bold: true }; });
  sheet.getCell(`C${sub2Row.number}`).alignment = { horizontal: 'center' };
  sheet.getCell(`D${sub2Row.number}`).alignment = { horizontal: 'right' };

  // Grand Total
  const grandTotalRow = sheet.addRow(['', '', shareSub1 + shareSub2, shareValSub1 + shareValSub2, '', '', '', '', '']);
  grandTotalRow.eachCell((cell) => { cell.border = borderAll; cell.font = { bold: true }; });
  sheet.getCell(`C${grandTotalRow.number}`).alignment = { horizontal: 'center' };
  sheet.getCell(`D${grandTotalRow.number}`).alignment = { horizontal: 'right' };

  // Empty Spacer
  sheet.addRow([]);

  // Bottom Section Part 1 - Summary Table
  const rStart = sheet.rowCount + 1;
  sheet.addRow(['જ', '', '', 'ઉ', '', '', '', '', '']);
  sheet.addRow(['', 'શ્રી પુરાંત', '', '', 'લોન ધિરાણ પેટે', '', '', '', '']);
  sheet.addRow(['', 'શેર ફાળો', '', '', 'ખર્ચ ખાતે', '', '', '', '']);
  sheet.addRow(['', 'પરત લોન હપ્તો', '', '', 'બંધ સિલક', '', '', '', '']);
  sheet.addRow(['', 'વ્યાજ પેટે', '', '', '', '', '', '', '']);
  sheet.addRow(['', 'ઉચ્ચક લોન વ્યાજ', '________', '', 'કુલ', '', '', '', '']);
  sheet.addRow(['', 'લોન પરત સ. નં.', '', '', '', '', '', '', '']);
  sheet.addRow(['', 'લોન પરત સ. નં.', '________', '', 'બંધ સિલક', '', '', '', '']);
  sheet.addRow(['', 'કુલ', '', '', '', '', '', '', '']);
  const rEnd = sheet.rowCount;

  for (let r = rStart; r <= rEnd; r++) {
    sheet.getCell(`A${r}`).alignment = { horizontal: 'center' };
    sheet.getCell(`D${r}`).alignment = { horizontal: 'center' };
    sheet.getCell(`B${r}`).font = { bold: true };
    sheet.getCell(`E${r}`).font = { bold: true };
  }

  // Empty Spacer
  sheet.addRow([]);

  // Bottom Section Part 2 - LOAN DETAILS TABLE (The missing part)
  const loanHeaderRow = sheet.addRow(['સભ્ય નં', 'લોન ફાળવેલ નામ', 'ફોર્મ નં', 'લોન ની રકમ', 'હપ્તા ની મુદત', 'વ્યાજ પેટે', '', '', '']);
  
  // Merge extra columns if needed for loan details (so it takes up the whole width nicely)
  sheet.mergeCells(`B${loanHeaderRow.number}:C${loanHeaderRow.number}`);
  sheet.mergeCells(`D${loanHeaderRow.number}:E${loanHeaderRow.number}`);
  sheet.mergeCells(`F${loanHeaderRow.number}:G${loanHeaderRow.number}`);
  sheet.mergeCells(`H${loanHeaderRow.number}:I${loanHeaderRow.number}`);
  
  loanHeaderRow.getCell(1).value = 'સભ્ય નં';
  loanHeaderRow.getCell(2).value = 'લોન ફાળવેલ નામ';
  loanHeaderRow.getCell(4).value = 'ફોર્મ નં';
  loanHeaderRow.getCell(6).value = 'લોન ની રકમ';
  loanHeaderRow.getCell(8).value = 'હપ્તા ની મુદત / વ્યાજ પેટે'; // merged for space
  
  loanHeaderRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderAll;
  });

  // Add 5 empty rows for manual loan entry
  for (let i = 0; i < 5; i++) {
    const lRow = sheet.addRow(['', '', '', '', '', '', '', '', '']);
    sheet.mergeCells(`B${lRow.number}:C${lRow.number}`);
    sheet.mergeCells(`D${lRow.number}:E${lRow.number}`);
    sheet.mergeCells(`F${lRow.number}:G${lRow.number}`);
    sheet.mergeCells(`H${lRow.number}:I${lRow.number}`);
    lRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = borderAll;
      cell.alignment = { vertical: 'middle' };
    });
    // Set row height for better writing space
    lRow.height = 30; 
  }

  await workbook.xlsx.writeFile('Umiya_Bachat_Mandal_v2.xlsx');
  console.log('Excel Formated with ExcelJS Successfully!');
}

generateExcel().catch(console.error);
