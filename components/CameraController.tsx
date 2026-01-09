import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/appStore";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";

export default function CameraController() {
    const { camera, controls, size } = useThree();
    const selectedMoleId = useAppStore((state) => state.selectedMoleId);
    const cameraResetTrigger = useAppStore((state) => state.cameraResetTrigger);
    const isMenuOpen = useAppStore((state) => state.isMenuOpen);
    const modelCenter = useAppStore((state) => state.modelCenter);
    const modelHeight = useAppStore((state) => state.modelHeight);

    const selectedMole = useLiveQuery(
        () => (selectedMoleId ? db.moles.get(selectedMoleId) : undefined),
        [selectedMoleId]
    );

    const targetPosition = useRef(new THREE.Vector3(0, 1.0, 0));
    const targetCameraPosition = useRef(new THREE.Vector3(0, 1.0, 4));

    const isFocusing = useRef(false);

    // Initial setup and interaction listener
    useEffect(() => {
        const orbitControls = controls as unknown as OrbitControls;
        if (!orbitControls) return;

        const onStart = () => {
            isFocusing.current = false;
        };

        orbitControls.addEventListener("start", onStart);

        // Ensure panning is enabled and axis is locked to screen space for intuitive move
        orbitControls.enablePan = true;
        orbitControls.screenSpacePanning = true;
        orbitControls.panSpeed = 1.2;

        return () => {
            orbitControls.removeEventListener("start", onStart);
        };
    }, [controls]);

    // Handle Framing Logic
    useEffect(() => {
        const orbitControls = controls as unknown as OrbitControls;
        if (!orbitControls) return;

        // Clear any old view offsets that might still be active from previous implementation
        (camera as THREE.PerspectiveCamera).clearViewOffset();
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

        if (selectedMole && selectedMole.position) {
            // MOLE FOCUS MODE
            const [x, y, z] = selectedMole.position;
            targetPosition.current.set(x, y, z);

            const molePos = new THREE.Vector3(x, y, z);

            // PRIORITY: Use surface normal for "head-on" view
            let viewDir = new THREE.Vector3();
            if (selectedMole.normal) {
                viewDir.set(...selectedMole.normal);
            } else {
                // Fallback for old data or missing normals
                const baseCenter = new THREE.Vector3(...modelCenter);
                viewDir.subVectors(molePos, baseCenter);
                viewDir.y = 0; // Keep horizontal
            }

            viewDir.normalize();
            if (viewDir.lengthSq() < 0.001) viewDir.set(0, 0, 1);

            // Position camera closer (1.2 units) for detail
            const camPos = molePos.clone().add(viewDir.multiplyScalar(1.2));
            targetCameraPosition.current.copy(camPos);

            isFocusing.current = true;
        } else {
            // FULL BODY / RESET MODE
            const baseCenter = new THREE.Vector3(...modelCenter);

            // Calculate vertical shift to center the model in the visible top area
            const panelSizeRatio = isMenuOpen ? 320 / size.height : 0.15;
            const verticalShift = panelSizeRatio * 0.8;

            const visualCenter = baseCenter.clone();
            visualCenter.y += verticalShift;

            targetPosition.current.copy(visualCenter);

            // Calculate ideal distance to fit head-to-toe
            const fovRad = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
            const availableHeightRatio = 1 - panelSizeRatio;

            const margin = 1.1;
            let idealDistance = (modelHeight * margin) / (2 * Math.tan(fovRad / 2));
            idealDistance = idealDistance / availableHeightRatio;

            // CRITICAL FIX: To prevent compounding tilt, we MUST use a horizontal direction vector
            // Calculate direction from baseCenter (not visualCenter) to camera
            const direction = new THREE.Vector3().subVectors(camera.position, baseCenter);
            direction.y = 0; // NEUTRALIZE VERTICAL TILT
            direction.normalize();
            if (direction.lengthSq() < 0.001) direction.set(0, 0, 1);

            // Place camera at horizontal idealDistance away from visualCenter
            const newCamPos = visualCenter.clone().add(direction.multiplyScalar(idealDistance));
            targetCameraPosition.current.copy(newCamPos);

            isFocusing.current = true;
        }
    }, [selectedMole, cameraResetTrigger, isMenuOpen, modelCenter, modelHeight, camera, size.height, size.width, controls]);

    useFrame((state, delta) => {
        const orbitControls = controls as unknown as OrbitControls;
        if (!orbitControls) return;

        const step = 3.0 * delta;

        if (isFocusing.current) {
            orbitControls.target.lerp(targetPosition.current, step);
            state.camera.position.lerp(targetCameraPosition.current, step);

            const dist = state.camera.position.distanceTo(targetCameraPosition.current);
            const targetDist = orbitControls.target.distanceTo(targetPosition.current);

            if (dist < 0.01 && targetDist < 0.01) {
                isFocusing.current = false;
            }
        }

        orbitControls.update();
    });

    return null;
}
