import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Message } from 'firebase-admin/messaging';

@Injectable()
export class PushService implements OnModuleInit {
  onModuleInit() {
    if (admin.apps.length === 0) {
      const serviceAccount = require('../config/serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK for FCM initialized.');
    }
  }

  async send(message: Message): Promise<void> {
    try {
      await admin.messaging().send(message);
      console.log(`Push notification successfully sent.`);
    } catch (error) {
      console.error('Error sending push notification via FCM:', error);
      throw new Error('Failed to send push notification.');
    }
  }
} 