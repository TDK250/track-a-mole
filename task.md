# Mole Tracker App Tasks

- [ ] **Project Setup**
    - [ ] Initialize Next.js project with Tailwind CSS
    - [ ] Initialize Capacitor for Native iOS/Android wrapping
    - [ ] Install dependencies (three, @react-three/fiber, @react-three/drei, dexie, zustand, framer-motion)
    - [ ] Configure `manifest.json` for PWA installation features

- [ ] **3D Body Interface**
    - [ ] Set up Three.js Canvas with Mobile touch controls
    - [ ] Implement Gender Selection state
    - [ ] **[Input]** Check for/Load `male.glb` and `female.glb`
    - [ ] Implement "Fallback Mannequins" (Male/Female versions)
    - [ ] Implement Raycasting for "Mole Placement"
    - [ ] Render "Mole Markers" on the 3D body

- [ ] **Mole Management System**
    - [ ] Design Data Model (Mole: ID, 3D Position, Label; Entry: Date, Photo, Size, Notes)
    - [ ] Implement Store (Zustand or Context + IndexedDB for persistence)
    - [ ] Create UI for "Add New Mole" flow
    - [ ] Create UI for "Mole Detail" view (Graph sizes, view history)

- [ ] **Camera & AR Features**
    - [ ] Implement Camera View using `getUserMedia`
    - [ ] Add "Reference Object" Overlay (e.g., a circle of known size) for "AR Sizing"
    - [ ] Storage logic for images (store as Base64 in IDB for MVP, though heavy)

- [ ] **Analysis & Reminders**
    - [ ] Implement "Check Up" Reminder logic (simple frequency setting)
    - [ ] Create "Screening" Mockup (Visual feedback on mole danger signs - ABCDE rule)
    - [ ] Add Disclaimer Modal (Not medical advice)

Most of this is done - list to be updated
