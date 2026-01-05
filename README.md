# Track-A-Mole  Mole Tracker

**Track-A-Mole** is a modern dermatology companion designed to help users monitor skin health by mapping moles onto a detailed 3D human model. It provides a secure, local-first experience for tracking changes over time.

## 🚀 Key Features

- **3D Interactive Mapping**: Place and view moles on a realistic 3D body scene.
- **Photo Logs**: Capture and securely store photos of individual moles for history tracking.
- **Personal Privacy**: All data is stored locally in your browser/device database (Dexie.js).
- **Mobile First**: Built for cross-platform availability on iOS, Android, and web.

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **3D Engine**: Three.js with @react-three/fiber & @react-three/drei
- **Database**: Dexie.js (IndexedDB)
- **Native Bridge**: Capacitor
- **Styling**: TailwindCSS
- **State Management**: Zustand

## 📦 Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/TDK250/track-a-mole.git
   cd track-a-mole
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

### Mobile Development

To build for mobile platforms:

- **Sync with native projects**: `npm run cap-sync`
- **Open Android Studio**: `npm run mobile-android`
- **Open Xcode**: `npm run mobile-ios`

## 🌐 Deployment

This project is automatically deployed to GitHub Pages via GitHub Actions when pushing to the `main` branch.

## ⚖️ Disclaimer

Track-A-Mole is for personal tracking and educational purposes only. It is **NOT** a medical diagnostic tool and should not be used as a substitute for professional medical advice or diagnosis.

## 📄 License

This project is licensed under the ISC License.
