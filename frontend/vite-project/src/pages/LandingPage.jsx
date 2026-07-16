import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourses, getTopCourses } from '../api/endpoints';
import { Button } from '../components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { Sparkles, BookOpen, Users, Award } from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topCourses, setTopCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await getTopCourses();
        setTopCourses(response.data.courses?.slice(0, 3) || []);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Learn from <span className="text-blue-600">Expert Instructors</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Master new skills with AI-powered learning. Interactive lessons, personalized quizzes, and live classes.
            </p>
            <div className="flex gap-4">
              {!user ? (
                <>
                  <Button
                    size="lg"
                    onClick={() => navigate('/register')}
                  >
                    Get Started Free
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate('/login')}
                  >
                    Sign In
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => user.role === 'student' ? navigate('/dashboard') : navigate('/courses')}
                  >
                    Go to Platform
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl p-8 h-96 flex items-center justify-center">
            <div className="text-center text-white">
              <Sparkles className="w-24 h-24 mx-auto mb-4 opacity-80" />
              <p className="text-2xl font-semibold">AI-Powered Learning</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose LearnAI?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Sparkles, title: 'AI Notes', desc: 'Auto-generated study notes from lessons' },
              { icon: Award, title: 'Instant Quizzes', desc: 'AI-powered quizzes to test knowledge' },
              { icon: Users, title: 'Live Classes', desc: 'Interactive sessions with instructors' },
            ].map((feature, i) => (
              <Card key={i} className="text-center">
                <CardContent className="pt-6">
                  <feature.icon className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Courses Section */}
      {!loading && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold mb-12">Popular Courses</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {topCourses.length > 0 ? (
              topCourses.map((course) => (
                <Card
                  key={course._id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/courses/${course._id}`)}
                >
                  <div className="h-48 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-t-lg" />
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{course.title}</h3>
                      {course.price === 0 && (
                        <Badge variant="secondary">Free</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{course.description?.substring(0, 100)}...</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">by {course.instructor?.name || 'Instructor'}</span>
                      {course.price > 0 && (
                        <span className="font-bold text-blue-600">${course.price}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-600 col-span-3">No courses available yet</p>
            )}
          </div>
          <div className="text-center mt-12">
            <Button size="lg" onClick={() => navigate('/courses')}>
              Browse All Courses
            </Button>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of students learning with AI-powered education.
          </p>
          {!user && (
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => navigate('/register')}
            >
              Sign Up Now - It's Free
            </Button>
          )}
        </div>
      </section>
    </div>
  );
};
