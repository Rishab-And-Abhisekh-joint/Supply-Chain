# Security Notice: serviceAccountKey.json

- DO NOT COMMIT your real Firebase service account key to a public repository.
- To generate a key: Go to Firebase Project Settings → Service accounts → Generate new private key.
- Place the downloaded JSON as `serviceAccountKey.json` in this directory for local development.
- Ensure this file is included in your `.gitignore` file. 