
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "@/lib/db/db";
import { useAuth } from "@/hooks/useAuth";
import { dbService } from "@/lib/services/dbService";
import { authService } from "@/lib/services/authService";

interface SyncContextType {
    isOnline: boolean;
    isSyncing: boolean;
    pendingChanges: number;
    syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType>({
    isOnline: true,
    isSyncing: false,
    pendingChanges: 0,
    syncNow: async () => { },
});

export const useSync = () => useContext(SyncContext);

export function SyncProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [isOnline, setIsOnline] = useState(true); // Default to true, check on mount
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingChanges, setPendingChanges] = useState(0);

    // Check online status
    useEffect(() => {
        if (typeof window === 'undefined') return;

        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            syncNow();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Monitor pending changes in DB
    const checkPending = async () => {
        if (!user) return;
        const pending = await db.drafts.filter(d => d.userId === user.id && d.isSynced === false).count();
        setPendingChanges(pending);
    };

    // Full Sync on Mount / Login
    useEffect(() => {
        if (!user || !isOnline) return;

        const initialSync = async () => {
            setIsSyncing(true);
            try {
                console.log("Starting initial sync from cloud...");
                await dbService.pullCatalogs();
                await dbService.pullGroups();
                await dbService.pullModules();
                await dbService.pullTemplates();
                await dbService.pullExerciseFolders();
                await dbService.pullExercises();
                await dbService.pullExerciseAssignments();
                
                console.log("Initial sync complete");
            } catch (err: any) {
                console.error("Initial sync failed detail:", err?.message || err || "Unknown error");
            } finally {
                setIsSyncing(false);
                checkPending();
            }
        };

        initialSync();
    }, [user, isOnline]);

    // Interval to check pending
    useEffect(() => {
        if (!user) return;
        checkPending(); // Initial check
        const interval = setInterval(checkPending, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, [user]);

    const syncNow = async () => {
        if (!user || !isOnline || isSyncing) return;
        if (authService.isMockEnabled()) {
            console.log("Mock mode enabled, sync aborted.");
            return;
        }

        setIsSyncing(true);
        try {
            // 1. Get all unsynced drafts for this user
            const drafts = await db.drafts.filter(d => d.userId === user.id && !d.isSynced).toArray();

            if (drafts.length === 0) {
                setIsSyncing(false);
                return;
            }

            console.log(`Syncing ${drafts.length} drafts to Supabase...`);

            // 2. Upload to Supabase
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();

            for (const draft of drafts) {
                const { error } = await supabase
                    .from('drafts')
                    .upsert({
                        document_id: draft.documentId,
                        module_id: draft.moduleId,
                        group_id: draft.groupId,
                        user_id: draft.userId,
                        content: draft.content,
                        status: draft.status,
                        last_updated: draft.lastUpdated
                    }, {
                        onConflict: 'document_id,user_id,group_id'
                    });

                if (error) {
                    console.error("Error syncing draft:", error);
                    continue;
                }

                // 3. Mark as synced locally
                if (draft.id) {
                    await db.drafts.update(draft.id, { isSynced: true });
                }
            }

            await checkPending();
            console.log("Sync complete");

        } catch (err) {
            console.error("Sync failed:", err);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <SyncContext.Provider value={{ isOnline, isSyncing, pendingChanges, syncNow }}>
            {children}
        </SyncContext.Provider>
    );
}
