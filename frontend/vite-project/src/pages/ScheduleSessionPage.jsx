import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Label } from '../components/Label';
import { Calendar, Clock, BookOpen, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../api/client-fixed';

export function ScheduleSessionPage() {
  const { register, handleSubmit, reset } = useForm();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [scheduledSessions, setScheduledSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    fetchCoursesAndSessions();
  }, []);

  const fetchCoursesAndSessions = async () => {
    try {
      const [coursesRes, sessionsRes] = await Promise.all([
        api.get('/courses'),
        api.get('/live/instructor/upcoming'),
      ]);
      setCourses(coursesRes.data || []);
      setScheduledSessions(sessionsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const onSubmit = async (data) => {
    if (!selectedCourse) {
      alert('Please select a course');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(`/live/${selectedCourse}/schedule`, {
        title: data.title || `Live Session - ${new Date().toLocaleDateString()}`,
        description: data.description,
        scheduledAt: new Date(data.date + 'T' + data.time),
      });

      alert('Session scheduled successfully!');
      reset();
      setSelectedCourse('');
      setScheduledSessions([...scheduledSessions, response.data]);
    } catch (error) {
      alert('Failed to schedule session: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      await api.delete(`/live/${sessionId}`);
      setScheduledSessions(scheduledSessions.filter((s) => s._id !== sessionId));
      alert('Session deleted successfully');
    } catch (error) {
      alert('Failed to delete session');
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">Schedule Live Session</h1>
            </div>
            <p className="text-lg text-gray-600">Create a new live class for your students</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Schedule Form */}
            <div className="lg:col-span-2">
              <Card className="p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Course Selection */}
                  <div>
                    <Label>Select Course *</Label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">-- Choose a course --</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <Label>Session Title</Label>
                    <Input
                      {...register('title')}
                      placeholder="e.g., React Advanced Patterns"
                      type="text"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label>Description</Label>
                    <textarea
                      {...register('description')}
                      placeholder="What will you be teaching in this session?"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="4"
                    />
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date *</Label>
                      <Input
                        {...register('date', { required: true })}
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label>Time *</Label>
                      <Input
                        {...register('time', { required: true })}
                        type="time"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Scheduling...' : 'Schedule Session'}
                  </Button>
                </form>
              </Card>
            </div>

            {/* Scheduled Sessions Sidebar */}
            <div>
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold">Your Sessions</h2>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {scheduledSessions.length === 0 ? (
                    <p className="text-sm text-gray-600">No sessions scheduled yet</p>
                  ) : (
                    scheduledSessions.map((session) => (
                      <div key={session._id} className="border border-gray-200 rounded-lg p-3">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {session.title || session.courseId?.title}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-600 mt-2">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(session.scheduledAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleDeleteSession(session._id)}
                            className="flex-1 px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-3 h-3 inline mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
