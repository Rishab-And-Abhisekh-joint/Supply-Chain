import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { Message } from 'firebase-admin/messaging';

@Injectable()
export class PushService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const firebaseCredentials = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT');
    
    if (!firebaseCredentials) {
      console.warn('FIREBASE_SERVICE_ACCOUNT not set - push notifications disabled');
      return;
    }

    if (admin.apps.length === 0) {
      try {
        const serviceAccount = JSON.parse(firebaseCredentials);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin SDK for FCM initialized.');
      } catch (error) {
        console.error('Failed to initialize Firebase:', error.message);
      }
    }
  }

  async send(message: Message): Promise<void> {
    if (admin.apps.length === 0) {
      console.warn('Firebase not initialized - skipping push notification');
      return;
    }
    
    try {
      await admin.messaging().send(message);
      console.log(`Push notification successfully sent.`);
    } catch (error) {
      console.error('Error sending push notification via FCM:', error);
      throw new Error('Failed to send push notification.');
    }
  }
}
