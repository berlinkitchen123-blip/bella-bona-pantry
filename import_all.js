import XLSX from 'xlsx';
import path from 'path';
import os from 'os';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';

// Initialize Firebase using the config
const firebaseConfig = {
  apiKey: "AIzaSyCZJUrbaPd06YVm4xD2iOVD89-M_rl7Ylk",
  authDomain: "bellabona-pantry.firebaseapp.com",
  databaseURL: "https://bellabona-pantry-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bellabona-pantry",
  storageBucket: "bellabona-pantry.firebasestorage.app",
  messagingSenderId: "252713383826",
  appId: "1:252713383826:web:1b24933e8f83db2ded734b"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const downloadsDir = path.join(os.homedir(), 'Downloads');

// Helper: map a category string or item name to standard categories and emojis
function mapMetadata(name, origCat) {
  const n = (name || '').toLowerCase();
  const c = (origCat || '').toLowerCase();
  
  let category = 'essentials';
  let emoji = '📦';

  if (n.includes('milk') || n.includes('yogurt') || n.includes('cheese') || n.includes('dairy') || n.includes('butter') || c.includes('dairy') || c.includes('latte')) {
    category = 'dairy';
    emoji = n.includes('cheese') ? '🧀' : n.includes('butter') ? '🧈' : '🥛';
  } else if (n.includes('bread') || n.includes('croissant') || n.includes('bakery') || n.includes('roll') || n.includes('pain') || c.includes('bakery')) {
    category = 'bakery';
    emoji = n.includes('croissant') ? '🥐' : '🍞';
  } else if (n.includes('water') || n.includes('juice') || n.includes('coffee') || n.includes('cola') || n.includes('soda') || n.includes('beer') || n.includes('drink') || n.includes('tea') || n.includes('smoothie') || n.includes('truefruit') || c.includes('drink') || c.includes('beverage')) {
    category = 'drinks';
    emoji = n.includes('coffee') ? '☕' : n.includes('water') ? '💧' : n.includes('juice') ? '🍊' : '🧃';
  } else if (n.includes('nut') || n.includes('granola') || n.includes('bar') || n.includes('snack') || n.includes('cookie') || n.includes('chocolate') || n.includes('chips') || n.includes('cracker') || c.includes('snack')) {
    category = 'snacks';
    emoji = n.includes('cookie') || n.includes('biscuit') ? '🍪' : n.includes('chocolate') ? '🍫' : '🥜';
  } else if (n.includes('banana') || n.includes('apple') || n.includes('fruit') || n.includes('veg') || n.includes('tomato') || n.includes('berry') || n.includes('grape') || c.includes('fruit') || c.includes('veg') || c.includes('salad')) {
    category = 'fruits';
    emoji = n.includes('banana') ? '🍌' : n.includes('apple') ? '🍏' : n.includes('tomato') ? '🍅' : '🍎';
  }

  return { category, emoji };
}

async function run() {
  const uniqueItems = new Map();

  // 1. Process Paypal Pantry.xlsx
  try {
    const paypalPath = path.join(downloadsDir, 'Paypal Pantry.xlsx');
    const workbook = XLSX.readFile(paypalPath);
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);
      rows.forEach(row => {
        // Skip header/empty rows
        const nameVal = row['__EMPTY'];
        if (!nameVal) return;
        const name = String(nameVal);
        if (name.startsWith('🍎') || name.startsWith('🥛') || name.startsWith('🥐') || name.startsWith('🍪') || name.startsWith('📦')) return;
        
        // Match product name, e.g. "Bananas – 36 kg" -> "Bananas"
        let cleanName = name.split('–')[0].split('-')[0].trim();
        if (cleanName && cleanName.length > 2 && !uniqueItems.has(cleanName)) {
          const unit = row['UNIT'] || 'pcs';
          const { category, emoji } = mapMetadata(cleanName, '');
          uniqueItems.set(cleanName, {
            name: cleanName,
            unit,
            category,
            emoji
          });
        }
      });
    });
    console.log(`Parsed Paypal Pantry: ${uniqueItems.size} unique items so far.`);
  } catch (err) {
    console.error(`Paypal error:`, err.message);
  }

  // 2. Process Revolut Pantry.xlsx
  try {
    const revolutPath = path.join(downloadsDir, 'Revolut Pantry.xlsx');
    const workbook = XLSX.readFile(revolutPath);
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);
      rows.forEach(row => {
        const nameVal = row['Product Name'];
        if (!nameVal || nameVal === 'Product Name') return;
        
        let cleanName = String(nameVal).trim();
        if (cleanName && cleanName.length > 2 && !uniqueItems.has(cleanName)) {
          const unit = row['Unit'] || 'pcs';
          const { category, emoji } = mapMetadata(cleanName, '');
          uniqueItems.set(cleanName, {
            name: cleanName,
            unit,
            category,
            emoji
          });
        }
      });
    });
    console.log(`Parsed Revolut Pantry: ${uniqueItems.size} unique items so far.`);
  } catch (err) {
    console.error(`Revolut error:`, err.message);
  }

  // 3. Process UFA Pantries.xlsx
  try {
    const ufaPath = path.join(downloadsDir, 'UFA Pantries.xlsx');
    const workbook = XLSX.readFile(ufaPath);
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);
      rows.forEach(row => {
        const keys = Object.keys(row);
        const catKey = keys.find(k => k.toLowerCase().includes('delivery') || k.toLowerCase().includes('pantries') || k.toLowerCase().includes('category'));
        const nameKey = '__EMPTY';
        const unitKey = '__EMPTY_3';

        const nameVal = row[nameKey];
        if (!nameVal || nameVal === 'Item') return;

        let cleanName = String(nameVal).trim();
        if (cleanName && cleanName.length > 2 && !uniqueItems.has(cleanName)) {
          const unit = row[unitKey] || 'pcs';
          const origCat = catKey ? String(row[catKey]) : '';
          const { category, emoji } = mapMetadata(cleanName, origCat);
          uniqueItems.set(cleanName, {
            name: cleanName,
            unit,
            category,
            emoji
          });
        }
      });
    });
    console.log(`Parsed UFA Pantries: Total ${uniqueItems.size} unique items.`);
  } catch (err) {
    console.error(`UFA error:`, err.message);
  }

  if (uniqueItems.size === 0) {
    console.log('No items found to import.');
    process.exit(0);
  }

  // Fetch current catalog from Firebase to avoid overwriting or duplicates
  const catalogRef = ref(db, 'catalog');
  const stockCountsRef = ref(db, 'stockCounts');
  
  let currentCatalog = [];
  try {
    const snapshot = await get(catalogRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      currentCatalog = Array.isArray(data) ? data.filter(Boolean) : Object.values(data);
    }
  } catch (err) {
    console.error('Error fetching current catalog:', err.message);
  }

  // Build a set of existing product names/IDs to prevent duplicates
  const existingNames = new Set(currentCatalog.map(item => item.name.toLowerCase()));
  const existingIds = new Set(currentCatalog.map(item => item.id));

  // Determine starting index for generated IDs
  let idCounter = 1;
  const newItems = [];
  const newStockCounts = {};

  for (const [name, item] of uniqueItems.entries()) {
    if (existingNames.has(name.toLowerCase())) continue;

    // Generate unique ID
    let itemId = `${item.category.substring(0, 2)}-${idCounter++}`;
    while (existingIds.has(itemId)) {
      itemId = `${item.category.substring(0, 2)}-${idCounter++}`;
    }

    const pantryItem = {
      id: itemId,
      name: item.name,
      category: item.category,
      unit: item.unit,
      emoji: item.emoji,
      inStock: true,
      stockCount: 50
    };

    newItems.push(pantryItem);
    newStockCounts[itemId] = 50;
  }

  console.log(`Found ${newItems.length} new items to add to the catalog.`);

  if (newItems.length > 0) {
    // Add new items to catalog and stockCounts in Firebase
    const updatedCatalog = [...currentCatalog, ...newItems];
    const catalogObj = {};
    updatedCatalog.forEach(item => { catalogObj[item.id] = item; });
    
    await set(catalogRef, catalogObj);

    // Update stock counts in Firebase
    for (const [id, count] of Object.entries(newStockCounts)) {
      await set(ref(db, `stockCounts/${id}`), count);
    }

    console.log('Successfully uploaded new items and stock counts to Firebase Realtime Database!');
  } else {
    console.log('All Excel items are already in the catalog.');
  }

  process.exit(0);
}

run();
