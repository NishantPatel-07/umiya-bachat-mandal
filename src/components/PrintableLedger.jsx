import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import html2pdf from 'html2pdf.js';
import { saveAndShareFile } from '../utils/fileDownloader';

const PrintableLedger = () => {
  const { db } = useStore();
  const [generating, setGenerating] = useState(false);
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7));
  const containerRef = useRef(null);

  useEffect(() => {
    const handleGenerate = async (e) => {
      if (generating) return;
      
      const selectedMonth = e.detail?.month || new Date().toISOString().slice(0, 7);
      setTargetMonth(selectedMonth);

      setGenerating(true);
      
      setTimeout(async () => {
        const element = containerRef.current;
        const opt = {
          margin:       0,
          filename:     `Umiya_Bachat_Ledger_${selectedMonth}.pdf`,
          image:        { type: 'jpeg', quality: 1 },
          html2canvas:  { scale: 2, useCORS: true, logging: false },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak:    { mode: [] } // Disable all auto-pagebreak logic, rely strictly on geometric slicing
        };

        try {
          const blob = await html2pdf().from(element).set(opt).outputPdf('blob');
          await saveAndShareFile(blob, `Umiya_Bachat_Ledger_${selectedMonth}.pdf`);
        } catch (err) {
          console.error("PDF generation failed", err);
          alert("Failed to generate PDF. Please try again.");
        } finally {
          setGenerating(false);
        }
      }, 100);
    };

    window.addEventListener('generate-pdf-ledger', handleGenerate);
    return () => window.removeEventListener('generate-pdf-ledger', handleGenerate);
  }, [generating, db]);

  const getMemberRowData = (member) => {
    const monthStr = targetMonth;
    
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
          loanEmi = activeLoan.emi; 
          const repaymentsUpToMonth = repayments.filter(r => r.month <= monthStr);
          const instNo = repaymentsUpToMonth.length;
          if (activeLoan.duration <= 10) {
            instNo10 = instNo;
          } else {
            instNo20 = instNo;
          }
        }
      } else if (activeLoan.type === 'INTEREST_ONLY') {
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
          lumpInterest = activeLoan.emi || (activeLoan.amount * (activeLoan.rate || 0)) / 100;
        }
        loanEmi = ''; 
      }
    }

    const shareAmount = member.shares * (db.settings.monthly || db.settings.shareVal || 500);
    const totalExpected = (shareAmount || 0) + (Number(loanEmi) || 0) + (Number(lumpInterest) || 0);

    const hasPaidShare = db.payments.some(
      p => String(p.memberId) === String(member.id) && p.month === monthStr
    );
    // Show total if share is paid OR if there's any loan payment this month
    const hasAnyPayment = hasPaidShare || loanEmi !== '' || lumpInterest !== '';
    const totalColumnVal = hasAnyPayment ? totalExpected : '';

    return {
      num: member.num,
      name: member.name,
      shares: member.shares || '',
      shareVal: hasPaidShare ? shareAmount : '',
      loanEmi,
      instNo10,
      instNo20,
      lumpInterest,
      totalColumnVal: totalColumnVal || ''
    };
  };

  const thStyle = { border: '1px solid #000', padding: '4px 2px', fontSize: '12px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fff', verticalAlign: 'middle', height: '24px' };
  const tdStyle = { border: '1px solid #000', padding: '4px 2px', fontSize: '12px', textAlign: 'center', verticalAlign: 'middle', height: '24px' };
  const tdLeftStyle = { ...tdStyle, textAlign: 'left', paddingLeft: '4px' };
  const tdRightStyle = { ...tdStyle, textAlign: 'right', paddingRight: '4px' };

  const colWidths = ['5%', '24%', '6%', '10%', '13%', '7%', '7%', '13%', '15%'];

  const TableHeader = () => (
    <thead>
      <tr>
        <th style={{...thStyle, width: colWidths[0]}}>ક્રમ</th>
        <th style={{...thStyle, width: colWidths[1]}}>સભ્ય નું નામ</th>
        <th style={{...thStyle, width: colWidths[2]}}>શેર<br/>સંખ્યા</th>
        <th style={{...thStyle, width: colWidths[3]}}>શેર હપ્તો</th>
        <th style={{...thStyle, width: colWidths[4]}}>પરત ધિરાણ હપ્તો</th>
        <th style={{...thStyle, width: colWidths[5]}}>હપ્તા<br/>ક્રમ/૧૦</th>
        <th style={{...thStyle, width: colWidths[6]}}>હપ્તા<br/>ક્રમ/૨૦</th>
        <th style={{...thStyle, width: colWidths[7]}}>ઉચ્ચક વ્યાજ</th>
        <th style={{...thStyle, width: colWidths[8]}}>કુલ રકમ</th>
      </tr>
    </thead>
  );

  let shareSub1 = 0, shareValSub1 = 0;
  let shareSub2 = 0, shareValSub2 = 0;

  const rows1 = [];
  const rows2 = [];

  for (let i = 0; i < 50; i++) {
    const member = db.members.find(m => m.num === i + 1) || { num: i + 1, name: '', shares: 0, id: `empty-${i}` };
    const rowData = getMemberRowData(member);
    
    const rowHtml = (
      <tr key={i}>
        <td style={tdStyle}>{rowData.num}</td>
        <td style={tdLeftStyle}>{rowData.name}</td>
        <td style={tdStyle}>{rowData.shares}</td>
        <td style={tdRightStyle}>{rowData.shareVal}</td>
        <td style={tdStyle}>{rowData.loanEmi}</td>
        <td style={tdStyle}>{rowData.instNo10}</td>
        <td style={tdStyle}>{rowData.instNo20}</td>
        <td style={tdStyle}>{rowData.lumpInterest}</td>
        <td style={tdStyle}>{rowData.totalColumnVal}</td>
      </tr>
    );

    if (i < 30) {
      shareSub1 += Number(rowData.shares) || 0;
      shareValSub1 += Number(rowData.shareVal) || 0;
      rows1.push(rowHtml);
    } else {
      shareSub2 += Number(rowData.shares) || 0;
      shareValSub2 += Number(rowData.shareVal) || 0;
      rows2.push(rowHtml);
    }
  }

  // Strict exact dimension containers for geometric slicing
  const pageStyle = {
    width: '210mm',
    height: '297mm', // Exactly 1 A4 page height
    padding: '10mm',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    color: 'black',
    fontFamily: 'sans-serif',
    overflow: 'hidden' // Ensures absolutely zero pixel overflow
  };

  return (
    <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -1 }}>
      {generating && <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px' }}>Generating PDF...</div>
      </div>}
      
      <div ref={containerRef} style={{ width: '210mm' }}>
        
        {/* PAGE 1 */}
        <div style={pageStyle}>
          <div style={{ border: '1px solid #000', padding: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>ॐ</div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>શ્રી શુભ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; શ્રી ગણેશાય નમઃ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; શ્રી લાભ</div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>ॐ</div>
            </div>
            <div style={{ border: '2px solid #000', textAlign: 'center', padding: '4px', fontWeight: 'bold', fontSize: '18px', marginBottom: '4px' }}>
              શ્રી ઉમિયા બચત મંડળ, અમદાવાદ
            </div>
            <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '12px', paddingRight: '8px' }}>
              {targetMonth}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginTop: '8px' }}>
            <TableHeader />
            <tbody>
              {rows1}
              <tr style={{ fontWeight: 'bold' }}>
                <td style={tdStyle} colSpan={2}></td>
                <td style={tdStyle}>{shareSub1}</td>
                <td style={tdRightStyle}>{shareValSub1}</td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* PAGE 2 */}
        <div style={pageStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginBottom: '8px' }}>
            <TableHeader />
            <tbody>
              {rows2}
              <tr style={{ fontWeight: 'bold' }}>
                <td style={tdStyle} colSpan={2}></td>
                <td style={tdStyle}>{shareSub2}</td>
                <td style={tdRightStyle}>{shareValSub2}</td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
              </tr>
              <tr style={{ fontWeight: 'bold' }}>
                <td style={tdStyle} colSpan={2}></td>
                <td style={tdStyle}>{shareSub1 + shareSub2}</td>
                <td style={tdRightStyle}>{shareValSub1 + shareValSub2}</td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
              </tr>
            </tbody>
          </table>

          {/* Bottom Summary Table */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <div style={{ width: '48%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={{ fontWeight: 'bold', width: '10%', height: '22px' }}>જ</td><td style={{width: '45%'}}></td><td style={{width: '45%'}}></td></tr>
                  <tr><td></td><td style={{ fontWeight: 'bold', height: '22px' }}>શ્રી પુરાંત</td><td></td></tr>
                  <tr><td></td><td style={{ fontWeight: 'bold', height: '22px' }}>શેર ફાળો</td><td></td></tr>
                  <tr><td></td><td style={{ fontWeight: 'bold', height: '22px' }}>પરત લોન હપ્તો</td><td></td></tr>
                  <tr><td></td><td style={{ fontWeight: 'bold', height: '22px' }}>વ્યાજ પેટે</td><td></td></tr>
                  <tr><td></td><td style={{ fontWeight: 'bold', height: '22px' }}>ઉચ્ચક લોન વ્યાજ</td><td style={{ borderBottom: '1px solid #000' }}></td></tr>
                  <tr><td></td><td style={{ fontWeight: 'bold', height: '22px' }}>લોન પરત સ. નં.</td><td></td></tr>
                  <tr><td></td><td style={{ fontWeight: 'bold', height: '22px' }}>લોન પરત સ. નં.</td><td style={{ borderBottom: '1px solid #000' }}></td></tr>
                  <tr><td></td><td style={{ fontWeight: 'bold', height: '22px' }}>કુલ</td><td></td></tr>
                </tbody>
              </table>
            </div>
            <div style={{ width: '48%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={{ fontWeight: 'bold', width: '10%', height: '22px' }}>ઉ</td><td style={{width: '45%'}}></td><td style={{width: '45%'}}></td></tr>
                  <tr><td></td><td style={{ height: '22px' }}>લોન ધિરાણ પેટે</td><td></td></tr>
                  <tr><td></td><td style={{ height: '22px' }}>ખર્ચ ખાતે</td><td></td></tr>
                  <tr><td></td><td style={{ height: '22px' }}>બંધ સિલક</td><td></td></tr>
                  <tr><td></td><td style={{ height: '22px' }}></td><td></td></tr>
                  <tr><td></td><td style={{ fontWeight: 'bold', height: '22px' }}>કુલ</td><td style={{ borderBottom: '1px solid #000' }}></td></tr>
                  <tr><td></td><td style={{ height: '22px' }}></td><td></td></tr>
                  <tr><td></td><td style={{ height: '22px' }}>બંધ સિલક</td><td style={{ borderBottom: '1px solid #000' }}></td></tr>
                  <tr><td></td><td style={{ height: '22px' }}></td><td></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Loan Details Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{...tdStyle, width: '15%', height: '22px'}}>સભ્ય નં</th>
                <th style={{...tdStyle, width: '35%', height: '22px'}}>લોન ફાળવેલ નામ</th>
                <th style={{...tdStyle, width: '15%', height: '22px'}}>ફોર્મ નં</th>
                <th style={{...tdStyle, width: '15%', height: '22px'}}>લોન ની રકમ</th>
                <th style={{...tdStyle, width: '20%', height: '22px'}}>હપ્તા ની મુદત / વ્યાજ પેટે</th>
              </tr>
            </thead>
            <tbody>
              {db.loans.filter(l => l.status === 'Active').length === 0 ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={`empty-loan-${i}`}>
                    <td style={{...tdStyle, height: '22px'}}></td>
                    <td style={{...tdStyle, height: '22px'}}></td>
                    <td style={{...tdStyle, height: '22px'}}></td>
                    <td style={{...tdStyle, height: '22px'}}></td>
                    <td style={{...tdStyle, height: '22px'}}></td>
                  </tr>
                ))
              ) : (
                db.loans.filter(l => l.status === 'Active').slice(0, 4).map(loan => {
                  const mem = db.members.find(m => m.id === loan.memberId);
                  const valDurationOrInterest = loan.type === 'FLAT_EMI' ? `${loan.duration} months` : `${loan.rate}% Int`;
                  return (
                    <tr key={loan.id}>
                      <td style={{...tdStyle, height: '22px'}}>{mem?.num}</td>
                      <td style={{...tdStyle, height: '22px'}}>{mem?.name}</td>
                      <td style={{...tdStyle, height: '22px'}}>{loan.id}</td>
                      <td style={{...tdStyle, height: '22px'}}>{loan.amount}</td>
                      <td style={{...tdStyle, height: '22px'}}>{valDurationOrInterest}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default PrintableLedger;
