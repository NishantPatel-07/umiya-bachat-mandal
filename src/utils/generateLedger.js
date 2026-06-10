import ExcelJS from 'exceljs';

export const generateLedger = async (db, targetMonth = null) => {
  const monthStr = targetMonth || new Date().toISOString().slice(0, 7); // YYYY-MM
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Umiya_Bachat', {
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });

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
  sheet.getCell('A3').value = monthStr;
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

  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 30;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 12;
  sheet.getColumn(5).width = 18;
  sheet.getColumn(6).width = 14;
  sheet.getColumn(7).width = 14;
  sheet.getColumn(8).width = 16;
  sheet.getColumn(9).width = 16;

  let shareSub1 = 0, shareValSub1 = 0;
  let shareSub2 = 0, shareValSub2 = 0;

  // Render members 1 to 50
  for (let i = 0; i < 50; i++) {
    const member = db.members.find(m => m.num === i + 1) || { num: i + 1, name: '', shares: 0 };
    
    // Find active loan for this member (or a loan that has a repayment in the target month)
    const activeLoan = db.loans.find(l => 
      String(l.memberId) === String(member.id) && 
      (l.status === 'Active' || db.repayments.some(r => {
        if (String(r.loanId) !== String(l.id)) return false;
        const m = r.month || r.date || '';
        const rMonth = typeof m === 'string' ? m.slice(0, 7) : '';
        return rMonth === monthStr;
      }))
    );
    
    let loanEmi = '';
    let lumpInterest = '';
    let instNo10 = '';
    let instNo20 = '';
    
    if (activeLoan) {
      if (activeLoan.type === 'FLAT_EMI') {
        // Dynamic installment tracking with robust stringified comparison and month fallback
        const repayments = db.repayments
          .filter(r => String(r.loanId) === String(activeLoan.id))
          .map(r => {
            const m = r.month || r.date || '';
            return {
              ...r,
              month: typeof m === 'string' ? m.slice(0, 7) : ''
            };
          });
        
        const hasPaidThisMonth = repayments.some(r => r.month === monthStr);
        if (hasPaidThisMonth) {
          loanEmi = activeLoan.emi; // ONLY set EMI if a repayment exists for this month!
          // The installment number is simply the count of repayments made up to and including the current month
          const repaymentsUpToMonth = repayments.filter(r => r.month <= monthStr);
          const instNo = repaymentsUpToMonth.length;
          if (activeLoan.duration <= 10) {
            instNo10 = instNo;
          } else {
            instNo20 = instNo;
          }
        }
      } else if (activeLoan.type === 'INTEREST_ONLY') {
        // Dynamic installment tracking to check if paid this month
        const repayments = db.repayments
          .filter(r => String(r.loanId) === String(activeLoan.id))
          .map(r => {
            const m = r.month || r.date || '';
            return {
              ...r,
              month: typeof m === 'string' ? m.slice(0, 7) : ''
            };
          });
        const currentMonthRepaymentIndex = repayments.findIndex(r => r.month === monthStr);
        if (currentMonthRepaymentIndex !== -1) {
          // Safe computation: use emi (which stores monthly interest) or calculate from amount * rate
          lumpInterest = activeLoan.emi || (activeLoan.amount * (activeLoan.rate || 0)) / 100;
        }
        loanEmi = ''; // Column E remains empty for interest-only loans
      }
    }

    const expectedSharePaid = member.shares * (db.settings.shareVal || 500);
    const totalExpected = (expectedSharePaid || 0) + (Number(loanEmi) || 0) + (Number(lumpInterest) || 0);

    // Check if the admin marked the member as paid (share payment exists for this month)
    const hasPaidShare = db.payments.some(
      p => String(p.memberId) === String(member.id) && p.month === monthStr
    );
    const totalColumnVal = hasPaidShare ? totalExpected : '';

    const rowData = [
      member.num,
      member.name,
      member.shares || '',
      expectedSharePaid || '',
      loanEmi,
      instNo10, // Dynamic Installment No/10
      instNo20, // Dynamic Installment No/20
      lumpInterest,
      totalColumnVal || ''
    ];

    const row = sheet.addRow(rowData);
    row.eachCell((cell) => { cell.border = borderAll; cell.alignment = { vertical: 'middle' }; });
    sheet.getCell(`A${row.number}`).alignment = { horizontal: 'center' };
    sheet.getCell(`C${row.number}`).alignment = { horizontal: 'center' };
    sheet.getCell(`D${row.number}`).alignment = { horizontal: 'right' };

    if (i < 30) {
      shareSub1 += member.shares || 0;
      shareValSub1 += expectedSharePaid || 0;
    } else {
      shareSub2 += member.shares || 0;
      shareValSub2 += expectedSharePaid || 0;
    }

    // Insert subtotal rows at correct points
    if (i === 29) {
      const sub1Row = sheet.addRow(['', '', shareSub1, shareValSub1, '', '', '', '', '']);
      sub1Row.eachCell((cell) => { cell.border = borderAll; cell.font = { bold: true }; });
      sheet.getCell(`C${sub1Row.number}`).alignment = { horizontal: 'center' };
      sheet.getCell(`D${sub1Row.number}`).alignment = { horizontal: 'right' };
    }
    if (i === 49) {
      const sub2Row = sheet.addRow(['', '', shareSub2, shareValSub2, '', '', '', '', '']);
      sub2Row.eachCell((cell) => { cell.border = borderAll; cell.font = { bold: true }; });
      sheet.getCell(`C${sub2Row.number}`).alignment = { horizontal: 'center' };
      sheet.getCell(`D${sub2Row.number}`).alignment = { horizontal: 'right' };
      
      const grandTotalRow = sheet.addRow(['', '', shareSub1 + shareSub2, shareValSub1 + shareValSub2, '', '', '', '', '']);
      grandTotalRow.eachCell((cell) => { cell.border = borderAll; cell.font = { bold: true }; });
      sheet.getCell(`C${grandTotalRow.number}`).alignment = { horizontal: 'center' };
      sheet.getCell(`D${grandTotalRow.number}`).alignment = { horizontal: 'right' };
    }
  }

  sheet.addRow([]);

  // Bottom Summary Table
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

  sheet.addRow([]);

  // Loan Details Table (DYNAMIC)
  const loanHeaderRow = sheet.addRow(['સભ્ય નં', 'લોન ફાળવેલ નામ', 'ફોર્મ નં', 'લોન ની રકમ', 'હપ્તા ની મુદત', 'વ્યાજ પેટે', '', '', '']);
  sheet.mergeCells(`B${loanHeaderRow.number}:C${loanHeaderRow.number}`);
  sheet.mergeCells(`D${loanHeaderRow.number}:E${loanHeaderRow.number}`);
  sheet.mergeCells(`F${loanHeaderRow.number}:G${loanHeaderRow.number}`);
  sheet.mergeCells(`H${loanHeaderRow.number}:I${loanHeaderRow.number}`);
  loanHeaderRow.getCell(1).value = 'સભ્ય નં';
  loanHeaderRow.getCell(2).value = 'લોન ફાળવેલ નામ';
  loanHeaderRow.getCell(4).value = 'ફોર્મ નં';
  loanHeaderRow.getCell(6).value = 'લોન ની રકમ';
  loanHeaderRow.getCell(8).value = 'હપ્તા ની મુદત / વ્યાજ પેટે';
  
  loanHeaderRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderAll;
  });

  const activeLoans = db.loans.filter(l => l.status === 'Active');
  
  if (activeLoans.length === 0) {
    // Add 5 empty rows if no loans
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
      lRow.height = 30;
    }
  } else {
    // Add active loan rows
    activeLoans.forEach(loan => {
      const mem = db.members.find(m => m.id === loan.memberId);
      const valDurationOrInterest = loan.type === 'FLAT_EMI' ? `${loan.duration} months` : `${loan.rate}% Interest`;
      
      const lRow = sheet.addRow([mem ? mem.num : '', mem ? mem.name : '', loan.id || '', loan.amount, '', valDurationOrInterest, '', '', '']);
      sheet.mergeCells(`B${lRow.number}:C${lRow.number}`);
      sheet.mergeCells(`D${lRow.number}:E${lRow.number}`);
      sheet.mergeCells(`F${lRow.number}:G${lRow.number}`);
      sheet.mergeCells(`H${lRow.number}:I${lRow.number}`);
      
      lRow.getCell(1).value = mem ? mem.num : '';
      lRow.getCell(2).value = mem ? mem.name : '';
      lRow.getCell(4).value = loan.id || '';
      lRow.getCell(6).value = loan.amount || '';
      lRow.getCell(8).value = valDurationOrInterest;

      lRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = borderAll;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      lRow.height = 30;
    });
  }

  // Generate buffer for browser download
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};
