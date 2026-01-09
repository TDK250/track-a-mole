
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Suspense } from "react";
import BodyModel from "./BodyModel";
import Loader from "./Loader";
import { useAppStore, type AppState } from "@/store/appStore";
import CameraController from "./CameraController";

export default function ThreeScene() {
    const gender = useAppStore((state: AppState) => state.gender);

    return (
        <div id="canvas-container" className="bg-[#020617]">
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

                <ambientLight intensity={0.7} />
                <directionalLight position={[5, 5, 5]} intensity={1.5} />
                <directionalLight position={[-3, 2, -3]} intensity={0.5} />

                <Suspense fallback={<Loader />}>
                    <BodyModel />
                </Suspense>
            </Canvas>
        </div>
    );
}
