import {
  getDoc,
  getDocFromCache,
  type DocumentReference,
  type DocumentSnapshot,
} from 'firebase/firestore';

export async function cachedDocument(reference: DocumentReference): Promise<DocumentSnapshot> {
  try {
    return await getDocFromCache(reference);
  } catch {
    return getDoc(reference);
  }
}
