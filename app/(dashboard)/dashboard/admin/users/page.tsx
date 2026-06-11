"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { UserManager } from "@/components/admin/UserManager";

export default function AdminUsersPage() {
    return (
        <RoleGuard allowedRoles={['admin']}>
            <div className="p-6">
                <UserManager />
            </div>
        </RoleGuard>
    );
}
