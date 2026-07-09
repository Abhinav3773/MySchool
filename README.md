# School Fee Tracker

A mobile-first, lightweight, and type-safe School Fee Tracker designed for school administrators to easily track students, add fee charges, and record payments directly from their mobile phones.

## Features

- **Dashboard**: High-level metrics showing Total Students, Total Charges, Total Paid, and Outstanding Balance with quick action shortcuts.
- **Student Directory**: List of all students with responsive layout (compact card view on mobile, table view on desktop). Search functionality by student name (case-insensitive).
- **Add / Edit Student**: Form to enroll new students or edit details of existing students (Name, Father's Name, Class, Section, Mobile, Admission Number).
- **Student Details**: Complete financial overview of a single student showing:
  - Total Charges, Total Paid, and Automatically Calculated Balance.
  - Complete Charge History (Date, Type, Description, Amount).
  - Complete Payment History (Date, Mode, Note, Amount).
- **Manage Charges**: Add charge records of various types (Monthly Fee, Books, Uniform, Admission, Transport, Exam, Other) with student selection dropdown.
- **Record Payments**: Add partial or full payments with date, payment mode (Cash, UPI, Bank Transfer, Cheque, Other), and receipt metadata.
- **HashRouter Navigation**: Fully compatible with static site hosting (like GitHub Pages).

## Technology Stack

- **Frontend**: React, Vite, TypeScript
- **Styling**: Bootstrap 5, Bootstrap Icons, Vanilla CSS
- **Database & Auth**: Firebase (Cloud Firestore & Firebase Authentication)
- **Validation**: Zod (for forms validation)

---

## Firestore Data Structure

The application communicates with three main collections under Cloud Firestore:

### `students` Collection
```json
{
  "id": "student-document-id",
  "ownerUid": "firebase-user-uid",
  "name": "Rahul Kumar",
  "nameNormalized": "RAHUL KUMAR",
  "fatherName": "Amit Kumar",
  "fatherNameNormalized": "AMIT KUMAR",
  "className": "3",
  "section": "A",
  "mobile": "9876543210",
  "mobileNormalized": "9876543210",
  "admissionNumber": "ADM001",
  "admissionNumberNormalized": "ADM001",
  "status": "active",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### `charges` Collection
```json
{
  "id": "charge-document-id",
  "ownerUid": "firebase-user-uid",
  "studentId": "student-document-id",
  "type": "BOOKS", // Supported types: MONTHLY_FEE, BOOKS, DRESS, ADMISSION, TRANSPORT, EXAM, OTHER
  "description": "Class 3 books set",
  "amountPaise": 250000, // Stored in paise (₹2,500.00)
  "chargeDate": "Timestamp",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### `payments` Collection
```json
{
  "id": "payment-document-id",
  "ownerUid": "firebase-user-uid",
  "studentId": "student-document-id",
  "amountPaise": 150000, // Stored in paise (₹1,500.00)
  "paymentDate": "Timestamp",
  "paymentMode": "CASH", // Supported modes: CASH, UPI, BANK_TRANSFER, CHEQUE, OTHER
  "note": "First payment",
  "receiptNumber": "RCPT-1720468305000",
  "createdAt": "serverTimestamp"
}
```

---

## Getting Started

### 1. Installation
Clone the repository, navigate to the folder, and run:
```bash
npm install
```

### 2. Firebase & Firestore Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new Firebase project (e.g. `school-fee-tracker`).
3. Enable **Authentication** and choose **Email/Password** sign-in provider.
4. Enable **Cloud Firestore** in test mode or production mode.
5. Create a Web App under your project settings and get the Firebase SDK configuration object.
6. Publish Firestore security rules using `firestore.rules` file:
   ```bash
   firebase deploy --only firestore:rules
   ```

### 3. Environment Variable Setup
Create a `.env` file in the project root by copying `.env.example`:
```bash
cp .env.example .env
```
Fill in the credentials from your Firebase web app configuration:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```
> [!IMPORTANT]
> The `.env` file contains sensitive information and is ignored in `.gitignore`. Never commit `.env` to GitHub.

---

## Available Scripts

### Run Locally (Development)
Starts Vite dev server on local port:
```bash
npm run dev
```

### Build for Production
Compiles TypeScript and bundles production assets using Vite:
```bash
npm run build
```

### Preview Production Build Locally
Previews the built assets in `dist/` locally:
```bash
npm run preview
```

---

## GitHub Pages Deployment

To deploy the app onto GitHub Pages:
1. Install `gh-pages` helper:
   ```bash
   npm install gh-pages --save-dev
   ```
2. Add deploy scripts to `package.json`:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
3. Run deployment command:
   ```bash
   npm run deploy
   ```

---

## > [!WARNING] Important Security Warning
Authentication is implemented for controlled administrative use. All database operations require user identity verification via Firebase Auth.
However, if you deploy this repository publicly on GitHub Pages or any other hosting service:
1. Ensure Firestore Security Rules (`firestore.rules`) are enforced to restrict access.
2. Under no circumstance use `allow read, write: if true;` rules in a production Firestore database storing real financial transactions.
3. Make sure database resources are isolated per user (`resource.data.ownerUid == request.auth.uid`) to prevent cross-tenant exposure.
