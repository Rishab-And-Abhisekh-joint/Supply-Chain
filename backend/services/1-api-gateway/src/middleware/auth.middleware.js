const admin = require('firebase-admin');

// Initialize Firebase from environment variable instead of file
const firebaseCredentials = process.env.FIREBASE_SERVICE_ACCOUNT;

if (firebaseCredentials) {
  try {
    const serviceAccount = JSON.parse(firebaseCredentials);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    if (error.code !== 'app/duplicate-app') {
      console.error('Firebase Admin SDK initialization error:', error);
    }
  }
} else {
  console.warn('FIREBASE_SERVICE_ACCOUNT not set - authentication will fail');
}

async function authMiddleware(req, res, next) {
  // Check if Firebase is initialized
  if (admin.apps.length === 0) {
    return res.status(500).json({ message: 'Authentication service not configured' });
  }

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
