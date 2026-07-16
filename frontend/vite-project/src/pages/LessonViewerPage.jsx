import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonById, getLessonsByCourse, markLessonComplete } from '../api/endpoints';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Progress } from '../components/Progress';
import { AINotesPanel } from '../components/AINotesPanel';
import { ChevronLeft, ChevronRight, CheckCircle, Sparkles } from 'lucide-react';

export const LessonViewerPage = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [marking, setMarking] = useState(false);
  const [activeTab, setActiveTab] = useState('content');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const lessonRes = await getLessonById(lessonId);
        setLesson(lessonRes.data.lesson);

        const lessonsRes = await getLessonsByCourse(courseId);
        setLessons(lessonsRes.data.lessons || []);
      } catch (error) {
        console.error('Failed to fetch lesson:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lessonId, courseId]);

  const handleMarkComplete = async () => {
    try {
      setMarking(true);
      await markLessonComplete(courseId, lessonId);
      setCompleted(true);
    } catch (error) {
      console.error('Failed to mark lesson complete:', error);
    } finally {
      setMarking(false);
    }
  };

  const currentLessonIndex = lessons.findIndex((l) => l._id === lessonId);
  const nextLesson = lessons[currentLessonIndex + 1];
  const prevLesson = lessons[currentLessonIndex - 1];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading lesson...</div>;
  }

  if (!lesson) {
    return <div className="flex items-center justify-center min-h-screen">Lesson not found</div>;
  }

  const progress = ((currentLessonIndex + 1) / lessons.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <button onClick={() => navigate(`/courses/${courseId}`)} className="text-blue-600 hover:underline">
            Back to course
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">{lesson.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Video Player */}
            <Card className="mb-6">
              <div className="w-full bg-gray-900 aspect-video rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 fill-white" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="font-semibold">Video Player</p>
                  <p className="text-sm text-gray-400">
                    {lesson.videoUrl || 'Video URL: ' + lesson.videoUrl}
                  </p>
                </div>
              </div>
            </Card>

            {/* Lesson Title & Details */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{lesson.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-2">{lesson.duration} minutes</p>
                  </div>
                  {completed && (
                    <Badge className="bg-green-100 text-green-900">
                      <CheckCircle className="w-4 h-4 mr-1 inline" /> Completed
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!completed && (
                  <Button
                    onClick={handleMarkComplete}
                    disabled={marking}
                    className="w-full mb-4"
                  >
                    {marking ? 'Marking...' : 'Mark as Complete'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            <div className="mb-6">
              <div className="flex gap-2 mb-4 border-b">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'content'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Resources
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'notes'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  AI Notes
                </button>
              </div>

              {activeTab === 'content' && lesson.resources && lesson.resources.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {lesson.resources.map((resource, idx) => (
                        <a
                          key={idx}
                          href={resource}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-2 bg-gray-100 hover:bg-blue-100 rounded text-blue-600 text-sm"
                        >
                          📄 Resource {idx + 1}
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'notes' && (
                <AINotesPanel lessonId={lessonId} courseId={courseId} />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Progress */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="mb-2" />
                <p className="text-sm text-gray-600">
                  Lesson {currentLessonIndex + 1} of {lessons.length}
                </p>
              </CardContent>
            </Card>

            {/* Lesson List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lessons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lessons.map((l, idx) => (
                    <button
                      key={l._id}
                      onClick={() => navigate(`/courses/${courseId}/lessons/${l._id}`)}
                      className={`w-full text-left p-2 rounded transition-colors text-sm ${
                        l._id === lessonId
                          ? 'bg-blue-100 text-blue-900 font-semibold'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="text-xs">{idx + 1}.</span> {l.title}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => navigate(`/courses/${courseId}/lessons/${prevLesson._id}`)}
            disabled={!prevLesson}
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Previous Lesson
          </Button>
          <Button
            onClick={() => navigate(`/courses/${courseId}/lessons/${nextLesson._id}`)}
            disabled={!nextLesson}
          >
            Next Lesson <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
