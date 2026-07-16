import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Progress } from '../components/Progress';
import api from '../api/client';

export const EnrolledStudentsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseRes = await api.get(`/api/courses/${courseId}`);
        setCourse(courseRes.data.course);

        const enrollmentsRes = await api.get(`/api/instructor/course/${courseId}/students`);
        setEnrollments(enrollmentsRes.data.enrollments || []);
      } catch (err) {
        setError('Failed to load enrolled students');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{course?.title}</h1>
              <p className="text-gray-600 mt-2">Enrolled Students</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/instructor')}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Total Enrolled</p>
              <p className="text-3xl font-bold">{enrollments.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Avg. Progress</p>
              <p className="text-3xl font-bold">
                {enrollments.length > 0
                  ? Math.round(
                      enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) /
                        enrollments.length
                    )
                  : 0}
                %
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold">
                {enrollments.filter((e) => e.progress === 100).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        {enrollments.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Progress</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Enrolled Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {enrollments.map((enrollment) => {
                  const student = enrollment.student || {};
                  const progress = enrollment.progress || 0;
                  const status = progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started';

                  return (
                    <tr key={enrollment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {student.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.email || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="w-32">
                          <Progress value={progress} />
                          <p className="text-xs text-gray-600 mt-1">{progress}%</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            status === 'completed'
                              ? 'default'
                              : status === 'in-progress'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {status === 'completed' && '✓ Completed'}
                          {status === 'in-progress' && '⏳ In Progress'}
                          {status === 'not-started' && 'Not Started'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-600 text-lg">No students enrolled yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Share your course to start getting students
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
