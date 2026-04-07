// Seed trees collection — run with:
//   npm run seed:trees
//
// Pushes the 3 tree definitions into the top-level `trees` collection in
// Firestore.  Document IDs match treeId (e.g. "1", "2", "3").

import { db } from '../database/configFirestore.js';
import { TREES } from '../utils/mockData.js';

for (const tree of TREES) {
    await db.doc(`trees/${tree.treeId}`).set(tree);
    console.log(`✓ trees/${tree.treeId} written — ${tree.name}`);
}

console.log(`\nDone. ${TREES.length} trees pushed to Firestore.`);
