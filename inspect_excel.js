import XLSX from 'xlsx';
import path from 'path';
import os from 'os';

const downloadsDir = path.join(os.homedir(), 'Downloads');
const files = [
  'Paypal Pantry.xlsx',
  'Revolut Pantry.xlsx',
  'UFA Pantries.xlsx'
];

files.forEach(fileName => {
  const filePath = path.join(downloadsDir, fileName);
  console.log(`\n========================================`);
  console.log(`Inspecting file: ${fileName}`);
  try {
    const workbook = XLSX.readFile(filePath);
    console.log(`Sheets in workbook:`, workbook.SheetNames);
    
    // Inspect the first sheet
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`Total rows in '${firstSheetName}': ${data.length}`);
    if (data.length > 0) {
      console.log(`Headers/Keys:`, Object.keys(data[0]));
      console.log(`First 2 rows:`);
      console.log(JSON.stringify(data.slice(0, 2), null, 2));
    }
  } catch (error) {
    console.error(`Error reading ${fileName}:`, error.message);
  }
});
