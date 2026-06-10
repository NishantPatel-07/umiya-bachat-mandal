import React from 'react';
import { useStore } from '../../store';
import * as XLSX from 'xlsx';
import { generateLedger } from '../../utils/generateLedger';

const Reports = () => {
  const { db, updateDb } = useStore();

  const handleDownloadReport = async () => {
    const buffer = await generateLedger(db);
    const fileName = `Umiya_Bachat_Ledger_${new Date().getFullYear()}.xlsx`;
    
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    try {
      // Try File System Access API first
      if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'Excel File',
            accept: {'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']}
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        alert('File saved successfully!');
      } else {
        // Fallback to browser download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    }
  };

  return (
    <div>
      <h2>Reports & Exports</h2>
      <div className="card text-center py-8">
        <h1 className="header-om mb-2">ॐ શ્રી શુણ શ્રી પા શ્રી શુણ ॐ</h1>
        <h3 className="mb-4">શ્રી ગણેશાય નમઃ</h3>
        <p className="font-bold text-lg mb-8">શ્રી ઉમિયા બચત મંડળ, અમદાવાદ.</p>
        
        <button onClick={handleDownloadReport} className="btn-success" style={{ width: '100%', maxWidth: '300px' }}>
          Download Monthly Ledger (Excel)
        </button>
      </div>

      <div className="card mt-4">
        <h3>File Storage Settings</h3>
        <p className="text-sm text-muted mb-4">On supported devices, Excel files will be saved directly to the folder you choose.</p>
        <button className="btn-secondary w-full" onClick={async () => {
          try {
            const dirHandle = await window.showDirectoryPicker();
            // Just request permission for future use
            alert(`Selected folder: ${dirHandle.name}`);
          } catch(e) {
            console.log("Directory picker cancelled or unsupported");
          }
        }}>
          Choose Default Save Folder
        </button>
      </div>
    </div>
  );
};

export default Reports;
