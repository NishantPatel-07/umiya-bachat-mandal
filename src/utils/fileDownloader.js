import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Saves a blob/buffer as a file and shares/downloads it based on the platform.
 * 
 * @param {Blob} blob - The file content blob
 * @param {string} fileName - The suggested file name
 */
export const saveAndShareFile = async (blob, fileName) => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Convert Blob to Base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          if (typeof result === 'string') {
            // Extrapolate the base64 part
            const base64 = result.split(',')[1];
            resolve(base64);
          } else {
            reject(new Error('FileReader result is not a string'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });

      // Write to Cache directory (no storage permissions required)
      const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache
      });

      // Share the file
      await Share.share({
        title: fileName,
        text: `Exported ${fileName}`,
        url: writeResult.uri,
        dialogTitle: `Share or save ${fileName}`
      });
    } catch (error) {
      console.error('Failed to save and share file on native platform:', error);
      alert('Error saving file on mobile: ' + (error.message || error));
    }
  } else {
    // Web fallback
    try {
      if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: fileName.endsWith('.xlsx') ? 'Excel File' : fileName.endsWith('.pdf') ? 'PDF File' : 'JSON File',
            accept: fileName.endsWith('.xlsx')
              ? { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
              : fileName.endsWith('.pdf')
              ? { 'application/pdf': ['.pdf'] }
              : { 'application/json': ['.json'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Web download error, retrying standard method:', err);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    }
  }
};
