import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { Users, BookOpen, BarChart3, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock data for admin dashboard
    const mockData = {
      stats: {
        totalUsers: 1234,
        totalCourses: 45,
        totalRevenue: 12500,
        pendingCourses: 3,
      },
      recentUsers: [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'student', joinedAt: '2024-01-15' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'instructor', joinedAt: '2024-01-14' },
        { id: 3, name: 'Admin User', email: 'admin@example.com', role: 'admin', joinedAt: '2024-01-13' },
      ],
      courses: [
        { id: 1, title: 'React Basics', instructor: 'John Doe', students: 120, status: 'approved' },
        { id: 2, title: 'Python Advanced', instructor: 'Jane Smith', students: 85, status: 'pending' },
        { id: 3, title: 'Web Design', instructor: 'Bob Johnson', students: 200, status: 'approved' },
      ],
    };
    setData(mockData);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-2xl font-bold">{data.stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Courses</p>
                  <p className="text-2xl font-bold">{data.stats.totalCourses}</p>
                </div>
                <BookOpen className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Revenue</p>
                  <p className="text-2xl font-bold">${data.stats.totalRevenue}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Approval</p>
                  <p className="text-2xl font-bold text-orange-600">{data.stats.pendingCourses}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Users */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>Latest registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 font-semibold">Role</th>
                      <th className="text-left py-3 px-4 font-semibold">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{user.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{user.joinedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses Management */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Courses</CardTitle>
              <CardDescription>Manage all courses and approvals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Title</th>
                      <th className="text-left py-3 px-4 font-semibold">Instructor</th>
                      <th className="text-left py-3 px-4 font-semibold">Students</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.courses.map((course) => (
                      <tr key={course.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{course.title}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{course.instructor}</td>
                        <td className="py-3 px-4 text-sm">{course.students}</td>
                        <td className="py-3 px-4">
                          <Badge variant={course.status === 'approved' ? 'secondary' : 'outline'}>
                            {course.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {course.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="default">
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive">
                                Reject
                              </Button>
                            </div>
                          )}
                          {course.status === 'approved' && (
                            <Button size="sm" variant="outline">
                              Edit
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
