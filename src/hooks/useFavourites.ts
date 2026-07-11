import { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export function useFavourites() {
  const { user } = useAuth();
  const [favourites, setFavourites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setFavourites(new Set());
      return;
    }

    const favRef = ref(db, `users/${user.uid}/favourites`);
    const unsubscribe = onValue(favRef, (snapshot) => {
      const data = snapshot.val();
      if (Array.isArray(data)) {
        setFavourites(new Set(data));
      } else {
        setFavourites(new Set());
      }
    });

    return () => unsubscribe();
  }, [user]);

  const toggleFavourite = async (id: string) => {
    if (!user) return;

    const next = new Set(favourites);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    setFavourites(next);
    await set(ref(db, `users/${user.uid}/favourites`), Array.from(next));
  };

  const isFavourite = (id: string): boolean => favourites.has(id);

  return { favourites, toggleFavourite, isFavourite };
}
