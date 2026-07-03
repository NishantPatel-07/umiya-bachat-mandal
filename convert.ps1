$excelFile = "c:\Users\Nishant\Desktop\umiya bachat mandal\Umiya_Bachat_Mandal.xlsx"
$pdfFile = "c:\Users\Nishant\Desktop\umiya bachat mandal\Umiya_Bachat_Mandal.pdf"
$excelFile2 = "c:\Users\Nishant\Desktop\umiya bachat mandal\Umiya_Bachat_Mandal_v2.xlsx"
$pdfFile2 = "c:\Users\Nishant\Desktop\umiya bachat mandal\Umiya_Bachat_Mandal_v2.pdf"

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    if (Test-Path $excelFile) {
        $workbook = $excel.Workbooks.Open($excelFile)
        $workbook.ExportAsFixedFormat(0, $pdfFile)
        $workbook.Close()
        Write-Host "Converted Umiya_Bachat_Mandal.xlsx to PDF"
    }

    if (Test-Path $excelFile2) {
        $workbook2 = $excel.Workbooks.Open($excelFile2)
        $workbook2.ExportAsFixedFormat(0, $pdfFile2)
        $workbook2.Close()
        Write-Host "Converted Umiya_Bachat_Mandal_v2.xlsx to PDF"
    }
} catch {
    Write-Host "Error occurred: $_"
} finally {
    if ($excel) {
        $excel.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    }
}
