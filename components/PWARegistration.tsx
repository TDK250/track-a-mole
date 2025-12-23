"use client";

import { useEffect } from "react";
import { defineCustomElements } from "@ionic/pwa-elements/loader";

export default function PWARegistration() {
    useEffect(() => {
        defineCustomElements(window);
    }, []);

    return null;
}
