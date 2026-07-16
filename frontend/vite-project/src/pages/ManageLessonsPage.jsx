import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Label } from '../components/Label';
import { Trash2, Plus, Edit, GripVertical } from 'lucide-react';
import api from '../api/client';

export const ManageLessonsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', duration: 30, videoUrl: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseRes = await api.get(`/api/courses/${courseId}`);
        setCourse(courseRes.data.course);

        const lessonsRes = await api.get(`/api/lessons/${courseId}`);
        setLessons(lessonsRes.data.lessons || []);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const handleAddLesson = async () => {
    if (!formData.title.trim()) {
      alert('Please enter lesson title');
      return;
    }

    try {
      const response = await api.post(`/api/lessons`, {
        title: formData.title,
        duration: parseInt(formData.duration),
        videoUrl: formData.videoUrl,
        course: courseId,
        order: lessons.length + 1,
      });

      setLessons([...lessons, response.data.lesson]);
      setFormData({ title: '', duration: 30, videoUrl: '' });
      setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add lesson');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;

    try {
      await api.delete(`/api/lessons/${lessonId}`);
      setLessons(lessons.filter((l) => l._id !== lessonId));
    } catch (err) {
      alert('Failed to delete lesson');
    }
  };

  const handleReorderLesson = async (lessonId, newOrder) => {
    if (newOrder < 1 || newOrder > lessons.length) return;

    try {
      await api.put(`/api/lessons/${lessonId}`, { order: newOrder });
      const updated = [...lessons];
      const oldIndex = updated.findIndex((l) => l._id === lessonId);
      const [lesson] = updated.splice(oldIndex, 1);
      updated.splice(newOrder - 1, 0, lesson);
      setLessons(updated);
    } catch (err) {
      alert('Failed to reorder lesson');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{course?.title}</h1>
              <p className="text-gray-600 mt-2">Manage course lessons</p>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/instructor/course/${courseId}/edit`)}
              >
                Edit Course
              </Button>
              <Button onClick={() => navigate('/instructor')}>Back to Dashboard</Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Add Lesson Form */}
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} className="mb-6 w-full">
            <Plus className="w-4 h-4 mr-2" /> Add New Lesson
          </Button>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add Lesson</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="lesson-title" className="block mb-2">
                    Lesson Title
                  </Label>
                  <Input
                    id="lesson-title"
                    placeholder="e.g., Introduction to Hooks"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="lesson-duration" className="block mb-2">
                    Duration (minutes)
                  </Label>
                  <Input
                    id="lesson-duration"
                    type="number"
                    placeholder="30"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="lesson-video" className="block mb-2">
                    Video URL (optional)
                  </Label>
                  <Input
                    id="lesson-video"
                    placeholder="https://example.com/video.mp4"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddLesson} className="flex-1">
                    Add Lesson
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({ title: '', duration: 30, videoUrl: '' });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lessons List */}
        <div className="space-y-3">
          {lessons.length > 0 ? (
            lessons.map((lesson, index) => (
              <Card key={lesson._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Drag Handle */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleReorderLesson(lesson._id, index)}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-200 disabled:opacity-50 rounded"
                      >
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        Lesson {index + 1}: {lesson.title}
                      </h3>
                      <p className="text-sm text-gray-600">{lesson.duration} minutes</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Navigate to edit lesson (if endpoint exists)
                          alert('Edit lesson not yet implemented');
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLesson(lesson._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600">No lessons yet. Add your first lesson to get started!</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats */}
        {lessons.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Lessons</p>
                  <p className="text-2xl font-bold">{lessons.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Duration</p>
                  <p className="text-2xl font-bold">
                    {lessons.reduce((sum, l) => sum + l.duration, 0)} min
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
