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
                {/* 
                   Using a slightly higher FOV and moving the camera further back (position Z: 5)
                   ensures that the model stays in frame even on narrow or wide viewports.
                */}
                <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={45} />
                <OrbitControls
                    enablePan={false} // Disable pan for better touch control on mobile
                    minDistance={0.5}
                    maxDistance={8}
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI}
                    target={[0, 0.3, 0]}
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
