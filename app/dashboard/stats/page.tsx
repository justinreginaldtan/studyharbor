// app/dashboard/stats/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabaseClient";
import { getUserStats, type UserStats } from "@/lib/analytics/queries";

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (isMounted) {
          setError("You must be logged in to view your dashboard.");
          setLoading(false);
        }
        return;
      }

      const userStats = await getUserStats(user.id);

      if (!isMounted) return;

      if (userStats.error) {
        setError(userStats.error);
      } else {
        setStats(userStats);
      }
      setLoading(false);
    };

    void fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-twilight text-parchment">
        Loading your analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-twilight text-twilight-blush">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-twilight text-text-muted">
        No stats available. Start a focus session!
      </div>
    );
  }

  // Prepare data for the chart
  const chartData = stats.sessions?.map(s => ({
    date: new Date(s.completed_at).toLocaleDateString(),
    durationMinutes: Math.round(s.duration_ms / 60000),
  })) || [];

  return (
    <div className="min-h-screen bg-twilight text-parchment p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Your Focus Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        <StatCard title="Total Sessions" value={stats.totalSessions} />
        <StatCard title="Total Minutes" value={Math.round(stats.totalMinutes)} unit="min" />
        <StatCard title="Longest Streak" value={stats.longestStreak} unit="days" />
        <StatCard title="Avg. Session Length" value={Math.round(stats.averageSessionLength)} unit="min" />
      </div>

      <div className="mt-12 max-w-6xl mx-auto bg-glass-surface border border-glass-border shadow-glass-lg rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Session History</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
              <XAxis dataKey="date" stroke="#e2e8f0" />
              <YAxis stroke="#e2e8f0" />
              <Tooltip
                contentStyle={{ backgroundColor: '#2d3748', border: 'none', borderRadius: '4px' }}
                labelStyle={{ color: '#e2e8f0' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Line type="monotone" dataKey="durationMinutes" stroke="#fbd38d" activeDot={{ r: 8 }} name="Duration (minutes)" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 bg-twilight-overlay rounded-md mt-4 flex items-center justify-center text-text-faint">
            No session data to display yet. Start a focus session!
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable component for displaying a single statistic
function StatCard({ title, value, unit = '' }: { title: string; value: number; unit?: string }) {
  return (
    <Card className="bg-glass-surface border border-glass-border shadow-glass-sm text-center">
      <CardHeader>
        <CardTitle className="text-text-muted text-sm uppercase tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-5xl font-extrabold text-twilight-ember">
          {value}
          {unit && <span className="text-2xl font-normal text-text-faint ml-2">{unit}</span>}
        </p>
      </CardContent>
    </Card>
  );
}
