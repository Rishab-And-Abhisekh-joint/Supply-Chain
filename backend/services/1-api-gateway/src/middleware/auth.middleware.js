const admin = require('firebase-admin');

// IMPORTANT: You must provide your service account key to the gateway.
// In a real production environment, this would be done via environment variables
// or a secret manager, NOT by committing the file.
const serviceAccount = require('../config/serviceAccountKey.json'); // Assumes key is in src/config

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
  if (error.code !== 'app/duplicate-app') {
    console.error('Firebase Admin SDK initialization error:', error);
  }
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(403).json({ message: 'Forbidden: Invalid token' });
  }
}

module.exports = authMiddleware; 