"use client";

import { useGLTF } from "@react-three/drei";
import { useAppStore, type AppState } from "@/store/appStore";
import { useLayoutEffect } from "react";
import * as THREE from "three";
import MoleMarkers from "./MoleMarkers";
import { getAssetPath } from "@/utils/paths";

export default function BodyModel() {
    const gender = useAppStore((state: AppState) => state.gender);
    const isAddingMole = useAppStore((state: AppState) => state.isAddingMole);

    // Loading the specific model based on gender
    const modelPath = gender === "male" ? getAssetPath("/models/male.glb") : getAssetPath("/models/female.glb");
    const { scene } = useGLTF(modelPath);

    useLayoutEffect(() => {
        if (scene) {
            // Compute bounding box for scaling
            const box = new THREE.Box3().setFromObject(scene);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);

            // Debug logging
            console.log('Model dimensions:', size);
            console.log('Model center:', center);

            // Calculate scale to fit nicely in view
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetScale = 1.5 / maxDim;

            console.log('Target scale:', targetScale);

            // Apply scale directly to scene
            scene.scale.setScalar(targetScale);

            // Center the model
            scene.position.set(-center.x * targetScale, -center.y * targetScale, -center.z * targetScale);

            console.log('Applied scale:', scene.scale);
            console.log('Applied position:', scene.position);
        }
    }, [scene]);

    const handleBodyClick = (e: any) => {
        e.stopPropagation();
        if (!isAddingMole) return;

        const { point } = e;
        // The point is in world space, which is what we want for markers
        useAppStore.getState().setTempMolePosition([point.x, point.y, point.z]);
    };

    return (
        <group key={gender}>
            <primitive
                object={scene}
                onClick={handleBodyClick}
            />
            <MoleMarkers />
        </group>
    );
}

// Preload models for smoothness
useGLTF.preload(getAssetPath("/models/male.glb"));
useGLTF.preload(getAssetPath("/models/female.glb"));
