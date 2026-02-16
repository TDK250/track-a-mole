"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { useAppStore, type AppState } from "@/store/appStore";
import * as THREE from "three";
import { useMemo } from "react";

export default function MoleMarkers() {
    const gender = useAppStore((state: AppState) => state.gender);
    const selectedMoleId = useAppStore((state: AppState) => state.selectedMoleId);
    const setSelectedMoleId = useAppStore((state: AppState) => state.setSelectedMoleId);
    const tempMolePosition = useAppStore((state: AppState) => state.tempMolePosition);
    const accentColor = useAppStore((state: AppState) => state.accentColor);

    const filterCondition = useAppStore((state: AppState) => state.filterCondition);

    // Fetch only moles for the current gender
    const allMoles = useLiveQuery(() =>
        db.moles.where('gender').equals(gender).toArray(),
        [gender]
    );

    const filteredMoles = (allMoles || []).filter(mole =>
        filterCondition === 'all' || (mole.type || 'mole') === filterCondition
    );


    const tempMoleNormal = useAppStore((state: AppState) => state.tempMoleNormal);
    const tempMoleCount = useAppStore((state: AppState) => state.tempMoleCount);
    const tempMoleSpread = useAppStore((state: AppState) => state.tempMoleSpread);

    const renderCluster = (position: [number, number, number], normalArr: [number, number, number] | undefined, count: number | 'several', isSelected: boolean, isPreview: boolean = false, spread: number = 1.0) => {
        if (count === 'several') {
            const baseRadius = 0.012 * spread;
            return (
                <group position={position}>
                    <mesh>
                        <sphereGeometry args={[isPreview ? 0.008 : 0.007, 16, 16]} />
                        <meshStandardMaterial
                            color={isPreview ? accentColor : (isSelected ? accentColor : "#45271d")}
                            emissive={isSelected || isPreview ? accentColor : "#000"}
                            emissiveIntensity={isSelected ? 0.6 : (isPreview ? 0.4 : 0)}
                            transparent
                            opacity={isPreview ? 0.4 : 0.8}
                        />
                    </mesh>
                    {[0, 1, 2].map((i) => (
                        <mesh key={i} position={[
                            Math.cos(i * 2.1) * baseRadius,
                            Math.sin(i * 2.1) * baseRadius,
                            0
                        ]}>
                            <sphereGeometry args={[0.003, 8, 8]} />
                            <meshStandardMaterial
                                color={isPreview ? accentColor : (isSelected ? accentColor : "#45271d")}
                                emissive={isSelected || isPreview ? accentColor : "#000"}
                                emissiveIntensity={isSelected ? 0.4 : (isPreview ? 0.2 : 0)}
                                transparent={isPreview}
                                opacity={isPreview ? 0.6 : 1}
                            />
                        </mesh>
                    ))}
                </group>
            );
        }

        const numericCount = typeof count === 'number' ? count : 1;
        if (numericCount <= 1 && !isPreview) return null; // Should be handled by single mole renderer

        const normal = normalArr ? new THREE.Vector3(...normalArr) : new THREE.Vector3(0, 0, 1);
        const tangent = new THREE.Vector3();
        const bitangent = new THREE.Vector3();

        if (Math.abs(normal.x) > Math.abs(normal.y)) {
            tangent.set(normal.z, 0, -normal.x).normalize();
        } else {
            tangent.set(0, normal.z, -normal.y).normalize();
        }
        bitangent.crossVectors(normal, tangent);

        return (
            <group position={position}>
                {Array.from({ length: numericCount }).map((_, i) => {
                    // More natural distribution: jittered phyllotaxis or similar
                    const angle = i * 137.5 * (Math.PI / 180); // Golden angle
                    const radius = 0.004 * Math.sqrt(i + 1) * spread; // Spread out

                    const offset = new THREE.Vector3()
                        .addScaledVector(tangent, Math.cos(angle) * radius)
                        .addScaledVector(bitangent, Math.sin(angle) * radius);

                    return (
                        <mesh
                            key={i}
                            position={[offset.x, offset.y, offset.z]}
                        >
                            <sphereGeometry args={[isPreview ? 0.004 : 0.0035, 12, 12]} />
                            <meshStandardMaterial
                                color={isPreview ? accentColor : (isSelected ? accentColor : "#45271d")}
                                emissive={isSelected || isPreview ? accentColor : "#000"}
                                emissiveIntensity={isSelected ? 0.5 : (isPreview ? 0.3 : 0)}
                                transparent={isPreview}
                                opacity={isPreview ? 0.6 : 1}
                            />
                        </mesh>
                    );
                })}
            </group>
        );
    };

    if (!allMoles) return null;

    return (
        <>
            {filteredMoles.map((mole: any) => {
                const isSelected = selectedMoleId === mole.id;
                const count = mole.count || 1;

                if (count === 'several' || (typeof count === 'number' && count > 1)) {
                    return (
                        <group key={mole.id} onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMoleId(mole.id ?? null);
                        }}>
                            {renderCluster(mole.position, mole.normal, count, isSelected, false, mole.spread)}
                        </group>
                    );
                }

                // Default Single Mole
                return (
                    <mesh
                        key={mole.id}
                        position={mole.position}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMoleId(mole.id ?? null);
                        }}
                    >
                        <sphereGeometry args={[0.005, 16, 16]} />
                        <meshStandardMaterial
                            color={isSelected ? accentColor : "#45271d"}
                            emissive={isSelected ? accentColor : "#000"}
                            emissiveIntensity={isSelected ? 0.5 : 0}
                        />
                    </mesh>
                )
            })}

            {/* Preview Marker for New Mole */}
            {tempMolePosition && (
                <group>
                    {tempMoleCount === 1 ? (
                        <mesh position={tempMolePosition}>
                            <sphereGeometry args={[0.006, 16, 16]} />
                            <meshStandardMaterial color={accentColor} transparent opacity={0.6} />
                        </mesh>
                    ) : (
                        renderCluster(tempMolePosition, tempMoleNormal || undefined, tempMoleCount, false, true, tempMoleSpread)
                    )}
                </group>
            )}
        </>
    );
}
