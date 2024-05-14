import { useState } from "react";
import * as FileSaver from "file-saver";
import * as Excel from "exceljs";
import { Button, message } from "antd";


const blobType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";

/**
 * This Can be used anytime we need to export data to excel.
 * Preferably used when we request the data from the server and then export it
 * @param {fileName} File Name of the excel file
 * @param {sheets} Array of objects with the following structure keys
 * { sheetName, data, columns }
 */
export async function exportToExcel({
    fileName="export",
    sheets=[],
}) {
    try {
        const workbook = new Excel.Workbook();
        sheets.forEach((sheet, i) => {
            const sheetName = sheet.sheetName || `Sheet${i+1}`;
            const ws = workbook.addWorksheet(sheetName, {
                pageSetup: {
                    horizontalCentered: true,
                    verticalCentered: true,
                },
            });

            ws.columns = sheet.columns.map(c => {
                return {
                    header: c.title,
                    key: c.dataIndex,
                    width: 20,
                }
            });
            ws.getRow(1).font = { bold: true };

            sheet.data.forEach((d, i) => {
                ws.addRow({
                    ...d,
                });
            });
        })

        await workbook.xlsx.writeBuffer().then(data => {
            const blob = new Blob([data], { type: blobType });
            FileSaver.saveAs(
                blob,
                `${fileName}.xlsx`
            );
        });
    } catch (error) {
        message.error('Error exporting to Excel');
        console.log(error);
    }
}

/**
 * This calls exportToExcel function bu provides the loading and disabled props for button.
 * Preferably used when we already have the data and columns
 */
export const ExportToExcelButton = ({
    fileName="export",
    sheets=[],

    buttonName="Export to Excel",
    buttonProps={},
    buttonDisabled=false,
    buttonLoading=false,
}) => {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        await exportToExcel({
            fileName,
            sheets,
        });
        setLoading(false);
    }

    return (
        <Button
            type='primary'
            onClick={handleExport}
            loading={loading || buttonLoading}
            disabled={loading || buttonDisabled}
            {...buttonProps}
        >
            {buttonName}
        </Button>
    )
}

export async function exportAsFile ({
    fileName="export",
    text="",
    extension="csv",
}) {
    const extMap = {
        txt: "text/plain",
        csv: "text/csv",
    }
    if (!extMap[extension]) {
        message.error('Invalid extension');
        return;
    }

    try {
        const blob = new Blob([text], { type: `${extMap[extension]};charset=utf-8` });
        FileSaver.saveAs(
            blob,
            `${fileName}.${extension}`
        );
    } catch (error) {
        message.error('Error exporting file');
        console.log(error);
    }
}

// Create a hook for exporting data to excel
// export function useExportToExcel({
//     data=[],
//     columns=[],
//     fileName="export",
//     sheetName="Sheet1",
// }) {
//     const [loading, setLoading] = useState(false);

//     const handleExport = (exportData=data) => {
//         setLoading(true);
//         try {
//             const workbook = new Excel.Workbook();
//             const ws = workbook.addWorksheet(sheetName, {
//                 pageSetup: {
//                     horizontalCentered: true,
//                     verticalCentered: true,
//                 },
//             });


//             // Map the columns from the table to the excel sheet
//             ws.columns = columns.map(c => {
//                 return {
//                     header: c.title,
//                     key: c.dataIndex,
//                     width: 20,
//                 }
//             });
//             ws.getRow(1).font = { bold: true };

//             // Add the data to the excel sheet
//             exportData.forEach((d, i) => {
//                 ws.addRow({
//                     ...d,
//                 });
//             });


//             workbook.xlsx.writeBuffer().then(data => {
//                 const blob = new Blob([data], { type: blobType });
//                 FileSaver.saveAs(
//                     blob,
//                     `${fileName}.xlsx`
//                 );
//                 setLoading(false);

//             });
//         } catch (error) {
//             message.error('Error exporting data');
//             console.log(error);
//             setLoading(false);
//         }

//     }

//     return [
//         handleExport,
//         loading,
//     ]
// }
