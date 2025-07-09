'use client';

import { Calendar, RefreshCcw } from 'lucide-react';
import { useCallback, useState } from 'react';

import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface DashboardStats {
  totalAppointments: number;
  confirmedAppointments: number;
  totalUsers: number;
  pendingAppointments: number;
}

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    confirmedAppointments: 0,
    totalUsers: 0,
    pendingAppointments: 0
  });

  const handleRefresh = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/dashboard');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/appointments/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search');
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <ThemeToggle />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-4 mb-4">
          <Input
            placeholder="Search appointments..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="max-w-xs"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCcw className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}