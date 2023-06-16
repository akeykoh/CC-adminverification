const admin = require("firebase-admin");
const functions = require("firebase-functions");
const express = require("express");
const serviceAccount = require('./trashcare-387803-firebase-adminsdk-hi4at-f6df30114e');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();

app.use(express.json());

app.put('/verification', async (req, res) => {
  try {
    // TrashId
    const trashId = req.headers.trashid;

    const verificationAction = req.body.action;

    // Mengecek apakah ada trashId yang sama dengan trashId header
    const trashQuery = admin.firestore().collection('trashdispose').where('trashId', '==', trashId);
    const trashSnapshot = await trashQuery.get();

    if (trashSnapshot.empty) {
      return res.status(404).json({ error: 'Submission trash tidak dapat ditemukan' });
    }

    // Update status submission user dalam collection trashdispose Firestore
    const trashDoc = trashSnapshot.docs[0];
    const trashRef = admin.firestore().collection('trashdispose').doc(trashDoc.id);

    const currentStatus = trashDoc.data().status;
    if (currentStatus === 'Verified' || currentStatus === 'Rejected') {
      return res.status(400).json({ error: 'Status submission sudah tidak bisa diubah' });
    }

    let status;

    if (verificationAction === 'Tolak') {
      // Jika admin memiliki "Tolak", maka status diupdate menjadi "Rejected"
      status = 'Rejected';
    } else if (verificationAction === 'Verify') {
      // Jika admin memiliki "Verify", maka status diupdate menjadi "Verified"
      status = 'Verified';
    } else {
      return res.status(400).json({ error: 'Action verification tidak valid' });
    }

    await trashRef.update({ status });

    res.json({ message: 'Status submission berhasil diperbaharui' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Terdapat masalah dalam mengupdate status submission' });
  }
});

exports.apiadminverification = functions.https.onRequest(app);

// Tes di local
// app.listen(3000, () => {
//   console.log('Server berjalan pada port 3000');
// });