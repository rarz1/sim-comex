"use client";

import { useCallback, useMemo } from "react";
import { useAppTexts } from "@/hooks/useData";
import { defaultTexts } from "@/lib/appTexts";

export function useAppText() {
    const { data: overrides } = useAppTexts();

    const overrideMap = useMemo(() => {
        const map = new Map<string, string>();
        if (overrides) {
            overrides.forEach((item: any) => map.set(item.id, item.value));
        }
        return map;
    }, [overrides]);

    /**
     * Translation function
     * Memoized with useCallback to ensure it's stable across renders
     * @param key The key in the dictionary
     * @param defaultValue The default hardcoded text
     */
    const t = useCallback((key: string, defaultValue?: string): string => {
        // 1. Check override from DB
        if (overrideMap.has(key)) {
            return overrideMap.get(key)!;
        }

        // 2. Fallback to default dictionary if defaultValue is missing
        if (!defaultValue && defaultTexts[key]) {
            return defaultTexts[key];
        }

        // 3. Fallback to provided defaultValue or key name
        return defaultValue || defaultTexts[key] || key;
    }, [overrideMap]);

    return { t, loading: overrides === undefined };
}
