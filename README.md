# Track-A-Mole

Track-A-Mole is a skin health monitoring application that allows users to map moles onto a 3D human model. It is designed for local-first data storage and cross-platform use.

## Features

- 3D Interactive Mapping: Place and view markers on a realistic 3D model.
- Photo Logs: Store photos of individual moles to monitor changes over time.
- Secure Data Portability: Export encrypted backups (.tam) with AES-GCM password protection.
- Smart Reminders: Reliable "Nth Day of Month" notifications to stay on top of checks.
- Data Privacy: Local-first architecture ensures health data never leaves the device.
- Cross-Platform: Compatible with iOS, Android, and Web browsers.

## Technical Stack

- Framework: Next.js (App Router)
- 3D Engine: Three.js (@react-three/fiber)
- Database: Dexie.js
- Native Bridge: Capacitor
- Styling: TailwindCSS
- State Management: Zustand

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
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

To synchronize the web build with native projects:

- Sync with native projects: `npm run cap-sync`
- Open Android Studio: `npm run mobile-android`
- Open Xcode: `npm run mobile-ios`

## Deployment

The project is configured for automated deployment to GitHub Pages via GitHub Actions on every push to the main branch.

## Disclaimer

Track-A-Mole is for personal tracking and educational purposes only. It is not a medical diagnostic tool and should not be used as a substitute for professional medical advice, diagnosis, or treatment.

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0). See the LICENSE file for details.
