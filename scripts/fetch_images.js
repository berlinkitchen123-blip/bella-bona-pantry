import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update } from 'firebase/database';


// Firebase config (same as web app)
const firebaseConfig = {
  apiKey: "AIzaSyAGoSEWebkSJcbzAFHDV0O0ZdyLyHHqhb8",
  authDomain: "bellabona-pantry.firebaseapp.com",
  databaseURL: "https://bellabona-pantry-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bellabona-pantry",
  storageBucket: "bellabona-pantry.firebasestorage.app",
  messagingSenderId: "252713383826",
  appId: "1:252713383826:web:1b24933e8f83db2ded734b"
};

// Initialize Firebase (admin style for Node)
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const API_KEY = "AIzaSyAGoSEWebkSJcbzAFHDV0O0ZdyLyHHqhb8";
const CX = "91509e1c785f240d3";
const RIGHTS_FILTER = ""; // Disabled rights filter for broader image results
const FALLBACK_PLACEHOLDER = "https://via.placeholder.com/300x200?text=No+Image";

async function fetchImageUrl(query) {
  // Primary Google Custom Search request (with optional rights filter)
  const rightsParam = RIGHTS_FILTER ? `&rights=${RIGHTS_FILTER}` : '';
  const primaryUrl = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&searchType=image&q=${encodeURIComponent(query)}&safe=high${rightsParam}`;
  try {
    const res = await fetch(primaryUrl);
    if (res.ok) {
      const data = await res.json();
      if (data?.items?.[0]?.link) return data.items[0].link;
    }
  } catch (e) {
    console.error('Primary Google fetch error for', query, e);
  }
  // Fallback without "product" suffix
  const fallbackQuery = query.replace(/\s+product$/i, '').trim();
  const fallbackUrl = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&searchType=image&q=${encodeURIComponent(fallbackQuery)}&safe=high${rightsParam}`;
  try {
    const res2 = await fetch(fallbackUrl);
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2?.items?.[0]?.link) return data2.items[0].link;
    }
  } catch (e) {
    console.error('Fallback Google fetch error for', fallbackQuery, e);
  }
  // Unsplash fallback – use Unsplash source URL directly
  const unsplashUrl = `https://source.unsplash.com/featured/300x200?${encodeURIComponent(query)}`;
  // Return the Unsplash URL (will resolve to an image when used)
  return unsplashUrl;
}

// Clean item name (remove emojis & special chars)
function cleanName(name) {
  return name.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim();
}

async function main() {
  const catalogRef = ref(db, 'catalog');
  const snapshot = await get(catalogRef);
  const catalog = snapshot.val();
  if (!catalog) {
    console.log('Catalog empty');
    return;
  }
  const updates = {};
  const entries = Object.entries(catalog);
  for (const [id, item] of entries) {
    // Always attempt to fetch an image, even if one already exists

    const clean = cleanName(item.name);
    const query = `${clean}`;
    const img = await fetchImageUrl(query);
    if (img) {
      updates[`catalog/${id}/imageUrl`] = img;
      console.log(`Found image for ${item.name}: ${img}`);
    } else {
      console.warn(`No image found for ${item.name}`);
    }
    // Throttle a bit to respect quota
    await new Promise(r => setTimeout(r, 200));
  }
  if (Object.keys(updates).length > 0) {
    await update(ref(db), updates);
    console.log('Image URLs updated in Firebase');
  } else {
    console.log('No new images to update');
  }
}

main().catch(err => console.error('Fatal error', err));
