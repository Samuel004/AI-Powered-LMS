import React, { useState, useEffect } from 'react';
import { getStudentDashboard, getStudentStats } from '../api/endpoints';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card';
import { Progress } from '../components/Progress';
import { Badge } from '../components/Badge';
import { BookOpen, Target, TrendingUp, Clock } from 'lucide-react';

export const StudentDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashData, statsData] = await Promise.all([
          getStudentDashboard(),
          getStudentStats(),
        ]);
        setDashboard(dashData.data);
        setStats(statsData.data);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading dashboard...</div>;
  }

  const stats_cards = [
    {
      icon: BookOpen,
      label: 'Enrolled Courses',
      value: stats?.enrolledCourses || 0,
    },
    {
      icon: Target,
      label: 'In Progress',
      value: stats?.inProgress || 0,
    },
    {
      icon: TrendingUp,
      label: 'Completed',
      value: stats?.completed || 0,
    },
    {
      icon: Clock,
      label: 'Hours Learned',
      value: stats?.hoursLearned || 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome to Your Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats_cards.map((stat, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className="w-8 h-8 text-blue-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enrolled Courses */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dashboard?.enrolledCourses?.length > 0 ? (
              dashboard.enrolledCourses.map((course) => (
                <Card key={course._id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription>By {course.instructor?.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-gray-600">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {course.completedLessons?.length || 0} of {course.totalLessons || 0} lessons completed
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-gray-600 col-span-2">No courses enrolled yet. Browse courses to get started!</p>
            )}
          </div>
        </div>

        {/* Completed Courses */}
        {dashboard?.completedCourses?.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Completed Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dashboard.completedCourses.map((course) => (
                <Card key={course._id} className="border-green-200 bg-green-50">
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{course.title}</h3>
                      <p className="text-sm text-gray-600">Completed on {course.completedAt?.split('T')[0]}</p>
                    </div>
                    <Badge variant="secondary">Completed</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
