import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInstructorDashboard, getInstructorStats } from '../api/endpoints';
import { Card, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Users, BookOpen, Plus, Settings, BarChart3, Calendar } from 'lucide-react';

export const InstructorDashboard = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashData, statsData] = await Promise.all([
          getInstructorDashboard(),
          getInstructorStats(),
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

  const courses = dashboard?.courses || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your courses and students</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Courses</p>
                  <p className="text-3xl font-bold mt-1">{stats?.totalCourses || 0}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold mt-1">{stats?.totalStudents || 0}</p>
                </div>
                <Users className="w-8 h-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-3xl font-bold mt-1">${stats?.revenue || 0}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                  <p className="text-3xl font-bold mt-1">{stats?.avgRating || '4.5'}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-yellow-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex gap-3">
                      <Button
                        onClick={() => navigate('/instructor/create-course')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Create New Course
                      </Button>
                      <Button
                        onClick={() => navigate('/instructor/live')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Calendar className="w-4 h-4 mr-2" /> Schedule Live Session
                      </Button>
                    </div>
        </div>

        {/* Courses */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Courses</h2>

          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course._id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="h-32 bg-gradient-to-r from-blue-400 to-indigo-600" />
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    <div className="flex gap-2 mb-4 text-xs">
                      <Badge variant="secondary">{course.category}</Badge>
                      {course.price === 0 && <Badge>Free</Badge>}
                      {course.price > 0 && <Badge>${course.price}</Badge>}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <div className="p-2 bg-gray-100 rounded">
                        <p className="text-gray-600">Lessons</p>
                        <p className="font-bold">{course.lessons?.length || 0}</p>
                      </div>
                      <div className="p-2 bg-gray-100 rounded">
                        <p className="text-gray-600">Students</p>
                        <p className="font-bold">{course.enrollments?.length || 0}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/instructor/course/${course._id}/lessons`)}
                        className="w-full"
                      >
                        <Settings className="w-4 h-4 mr-1" /> Manage Lessons
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/instructor/course/${course._id}/students`)}
                        className="w-full"
                      >
                        <Users className="w-4 h-4 mr-1" /> View Students
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-600 mb-6">Create your first course to start teaching</p>
                <Button onClick={() => navigate('/instructor/create-course')}>
                  <Plus className="w-4 h-4 mr-2" /> Create Course
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
