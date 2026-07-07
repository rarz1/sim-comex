"use client";

import { ExerciseBank } from "@/components/teacher/ExerciseBank";

export default function AdminExercisesPage() {
    return (
        <div className="h-full">
            <ExerciseBank isAdmin />
        </div>
    );
}