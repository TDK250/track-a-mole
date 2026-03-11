
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Suspense } from "react";
import BodyModel from "./BodyModel";
import Loader from "./Loader";
import { useAppStore, type AppState } from "@/store/appStore";
import CameraController from "./CameraController";
import ScreenshotManager from "./ScreenshotManager";

export default function ThreeScene() {
    const gender = useAppStore((state: AppState) => state.gender);
    const theme = useAppStore((state: AppState) => state.theme);

    return (
        <div id="canvas-container" className="bg-slate-50 dark:bg-slate-950 transition-colors duration-300" style={{ backgroundColor: theme === 'dark' ? '#020617' : '#f8fafc' }}>
            <Canvas key={gender} shadows={false} dpr={[1, 1.5]}>
                {/* Camera positioned closer for larger figure */}
                <PerspectiveCamera makeDefault position={[0, 1.0, 2.8]} fov={60} />
                <OrbitControls
                    enablePan={false} // Controlled by CameraController
                    minDistance={0.5}
                    maxDistance={8}
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI}
                    target={[0, 1.0, 0]} // Center on torso
                    makeDefault
                />

                <CameraController />
                <ScreenshotManager />

                <ambientLight intensity={theme === 'light' ? 0.9 : 0.7} />
                <directionalLight position={[5, 5, 5]} intensity={theme === 'light' ? 1.8 : 1.5} />
                <directionalLight position={[-3, 2, -3]} intensity={theme === 'light' ? 0.7 : 0.5} />

                <Suspense fallback={<Loader />}>
                    <BodyModel />
                </Suspense>
            </Canvas>
        </div>
    );
}
