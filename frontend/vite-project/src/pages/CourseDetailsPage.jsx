import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById, enrollCourse, getEnrolledCourses, getLessonsByCourse } from '../api/endpoints';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Progress } from '../components/Progress';
import { ChevronRight, Lock, Play } from 'lucide-react';

export const CourseDetailsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseRes = await getCourseById(courseId);
        const courseData = courseRes.data.course || courseRes.data;
        setCourse(courseData);

        // Check if enrolled
        const enrolledRes = await getEnrolledCourses();
        const enrolled =
          enrolledRes.data.enrollments?.some((e) => e.course?._id === courseId) ||
          enrolledRes.data.courses?.some((e) => e.course?._id === courseId) ||
          enrolledRes.data.courses?.some((course) => course._id === courseId);
        setIsEnrolled(!!enrolled);

        if (enrolled) {
          try {
            const lessonsRes = await getLessonsByCourse(courseId);
            setLessons(Array.isArray(lessonsRes.data) ? lessonsRes.data : lessonsRes.data?.lessons || []);
          } catch (lessonsError) {
            if (lessonsError.response?.status === 403) {
              console.warn('Protected course lessons are not available until enrollment.');
              setLessons([]);
            } else {
              console.error('Failed to fetch lessons:', lessonsError);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await enrollCourse(courseId);
      setIsEnrolled(true);
      alert('Successfully enrolled in the course!');

      try {
        const lessonsRes = await getLessonsByCourse(courseId);
        setLessons(Array.isArray(lessonsRes.data) ? lessonsRes.data : lessonsRes.data?.lessons || []);
      } catch (lessonsError) {
        console.error('Failed to fetch lessons after enrolling:', lessonsError);
      }
    } catch (error) {
      console.error('Failed to enroll:', error);
      alert('Failed to enroll. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading course...</div>;
  }

  if (!course) {
    return <div className="flex items-center justify-center min-h-screen">Course not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-r from-blue-400 to-indigo-600 h-96 rounded-lg mb-6" />
            <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
            <p className="text-lg text-gray-600 mb-6">{course.description}</p>

            <div className="flex items-center gap-4 mb-8">
              <span className="text-sm font-medium">By {course.instructor?.name || 'Instructor'}</span>
              <Badge variant="secondary">{course.category}</Badge>
              {course.price === 0 && <Badge>Free</Badge>}
            </div>

            {/* Lessons */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Lessons</h2>
              <div className="space-y-3">
                {lessons.map((lesson, index) => (
                  <Card key={lesson._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {isEnrolled ? (
                            <Play className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Lock className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{lesson.title}</h3>
                          <p className="text-sm text-gray-500">{lesson.duration} min</p>
                        </div>
                      </div>
                      {isEnrolled && (
                        <Button
                          variant="ghost"
                          onClick={() => navigate(`/courses/${courseId}/lessons/${lesson._id}`)}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="text-3xl font-bold mb-2">
                    {course.price === 0 ? 'Free' : `$${course.price}`}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    {lessons.length} lessons • {lessons.reduce((sum, l) => sum + l.duration, 0)} min total
                  </div>
                </div>

                {isEnrolled ? (
                  <div className="space-y-4">
                    <Button
                      onClick={() => navigate(`/courses/${courseId}/lessons/${lessons[0]?._id}`)}
                      disabled={!lessons.length}
                      className="w-full"
                    >
                      Continue Learning
                    </Button>
                    <div className="p-4 bg-green-50 rounded-lg text-sm">
                      <p className="font-semibold text-green-900">✓ Enrolled</p>
                      <p className="text-green-700 text-xs mt-1">Access all lessons and content</p>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </Button>
                )}

                <div className="mt-6 pt-6 border-t space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">What you'll learn</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>✓ Master core concepts</li>
                      <li>✓ Practice with real projects</li>
                      <li>✓ Get AI-generated notes</li>
                      <li>✓ Take interactive quizzes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
