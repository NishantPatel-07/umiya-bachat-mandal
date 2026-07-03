import React, { useState } from 'react';
import { useStore } from '../../store';
import { generateLedger } from '../../utils/generateLedger';
import PrintableLedger from '../../components/PrintableLedger';
import { Calendar, FileSpreadsheet, FileText } from 'lucide-react';
import { saveAndShareFile } from '../../utils/fileDownloader';

const Reports = () => {
  const { db } = useStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const handleDownloadReport = async () => {
    const buffer = await generateLedger(db, selectedMonth);
    const fileName = `Umiya_Bachat_Ledger_${selectedMonth}.xlsx`;
    
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    await saveAndShareFile(blob, fileName);
  };

  const handleDownloadPdf = () => {
    window.dispatchEvent(new CustomEvent('generate-pdf-ledger', { detail: { month: selectedMonth } }));
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <h2 className="mb-4">Reports & Exports</h2>
      
      <div className="card mb-6" style={{ background: 'var(--primary-light)', border: '1px solid #fde047', padding: '1.5rem' }}>
        <h3 style={{ color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} /> Select Ledger Period
        </h3>
        <p className="text-sm text-muted mb-4">
          Choose the specific month for which you want to generate the Excel or PDF financial reports.
        </p>
        <div style={{ maxWidth: '280px' }}>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)} 
            style={{ background: '#fff' }}
          />
        </div>
      </div>

      <div className="card text-center py-8">
        <h1 className="header-om mb-2">ॐ શ્રી શુણ શ્રી પા શ્રી શુણ ॐ</h1>
        <h3 className="mb-4">શ્રી ગણેશાય નમઃ</h3>
        <p className="font-bold text-lg mb-4">શ્રી ઉમિયા બચત મંડળ, અમદાવાદ.</p>
        <div className="badge badge-primary mb-8" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
          Ledger Month: {selectedMonth}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={handleDownloadReport} 
            className="btn-success" 
            style={{ 
              width: '100%', 
              maxWidth: '320px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              fontWeight: '600'
            }}
          >
            <FileSpreadsheet size={18} /> Download Excel Ledger
          </button>
          
          <button 
            onClick={handleDownloadPdf} 
            className="btn-primary" 
            style={{ 
              width: '100%', 
              maxWidth: '320px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              fontWeight: '600'
            }}
          >
            <FileText size={18} /> Download PDF Ledger
          </button>
        </div>
      </div>
      
      <PrintableLedger />
    </div>
  );
};

export default Reports;
