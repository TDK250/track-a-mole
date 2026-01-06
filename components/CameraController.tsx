import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/appStore";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";

export default function CameraController() {
    const { camera, controls } = useThree();
    const selectedMoleId = useAppStore((state) => state.selectedMoleId);
    const selectedMole = useLiveQuery(
        () => (selectedMoleId ? db.moles.get(selectedMoleId) : undefined),
        [selectedMoleId]
    );

    const targetPosition = useRef(new THREE.Vector3(0, 0.3, 0)); // Default target
    const targetCameraPosition = useRef(new THREE.Vector3(0, 0, 4)); // Default camera pos

    useEffect(() => {
        if (selectedMole && selectedMole.position) {
            // If mole is selected, focus on it
            const [x, y, z] = selectedMole.position;
            targetPosition.current.set(x, y, z);

            // Calculate camera position: 
            // Move camera slightly back and up from the mole normal direction? 
            // Or just keep current rotation but zoom in?
            // Simple approach: Zoom in towards the mole from current angle?
            // Better: Fixed distance from mole, standard angle?
            // Let's try: Position camera at reasonable distance Z offset relative to mole height?

            // Actually, preserving the user's rotation angle but centering on the mole is nice.
            // But user asked to "rotate the body", implying camera moves around to see it.
            // Since we don't know the normal of the body surface here cheaply, 
            // maybe we just focus (lookAt) the mole and zoom in a bit, letting user rotate?
            // OR: Try to move camera to a fixed offset (e.g. Z+1.5) from mole.

            // Let's modify TARGET to be the mole.
            // And animate camera to be closer.

            // Just updating targetPosition here, let useFrame handle animation
        } else {
            // Reset to full body view
            targetPosition.current.set(0, 0.3, 0);
            targetCameraPosition.current.set(0, 0, 4);
        }
    }, [selectedMole]);

    useFrame((state, delta) => {
        const orbitControls = controls as unknown as OrbitControls;
        if (!orbitControls) return;

        // Smoothly interpolate target
        const step = 4 * delta; // Speed

        orbitControls.target.lerp(targetPosition.current, step);

        // If we want to animate camera position too (for zoom/reset):
        if (!selectedMoleId) {
            // On reset only, pull camera back. 
            // When focusing, we might not want to force camera POS, just TARGET?
            // But if user is zoomed way out, we want to zoom in.
            state.camera.position.lerp(targetCameraPosition.current, step);
        } else {
            // When focusing a mole, maybe ensure we are within a certain distance?
            // calculate distance from camera to target
            const dist = state.camera.position.distanceTo(targetPosition.current);
            if (dist > 2.5) {
                // Zoom in if too far
                const dir = new THREE.Vector3().subVectors(state.camera.position, targetPosition.current).normalize();
                const newPos = targetPosition.current.clone().add(dir.multiplyScalar(2));
                state.camera.position.lerp(newPos, step);
            }
        }

        orbitControls.update();
    });

    return null;
}
