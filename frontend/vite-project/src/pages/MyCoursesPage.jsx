import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEnrolledCourses } from '../api/endpoints';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Progress } from '../components/Progress';
import { Clock, BookOpen } from 'lucide-react';

export const MyCoursesPage = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const res = await getEnrolledCourses();
        setEnrollments(res.data.enrollments || []);
      } catch (error) {
        console.error('Failed to fetch enrolled courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading courses...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">My Learning</h1>
        <p className="text-gray-600 mb-8">Continue learning from where you left off</p>

        {enrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => {
              const course = enrollment.course || {};
              const progress = enrollment.progress || 0;

              return (
                <Card
                  key={enrollment._id}
                  className="hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="h-32 bg-gradient-to-r from-blue-400 to-indigo-600" />
                  <CardContent className="pt-4">
                    <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold">Progress</span>
                        <span className="text-sm text-gray-600">{progress}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 mb-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {enrollment.completedLessons?.length || 0} lessons
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.lessons?.length || 0} total
                      </div>
                    </div>

                    {/* Button */}
                    <Button
                      onClick={() => {
                        const firstLesson = course.lessons?.[0];
                        if (firstLesson) {
                          navigate(`/courses/${course._id}/lessons/${firstLesson._id}`);
                        } else {
                          navigate(`/courses/${course._id}`);
                        }
                      }}
                      className="w-full"
                    >
                      {progress === 100 ? 'Review Course' : 'Continue Learning'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600 mb-6">Start learning by enrolling in a course</p>
            <Button onClick={() => navigate('/courses')}>Explore Courses</Button>
          </div>
        )}
      </div>
    </div>
  );
};
