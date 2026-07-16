import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Video, Calendar, Users, PlayCircle, Clock } from 'lucide-react';
import api from '../api/client-fixed';

export function LiveClassesPage() {
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, active

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  const fetchLiveClasses = async () => {
    try {
      setLoading(true);
      const [upcomingRes, activeRes] = await Promise.all([
        api.get('/live/upcoming'),
        api.get('/live/active'),
      ]);
      setUpcomingClasses(upcomingRes.data || []);
      setActiveSessions(activeRes.data || []);
    } catch (error) {
      console.error('Failed to fetch live classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (sessionId) => {
    try {
      await api.post(`/live/${sessionId}/join`);
      window.location.href = `/live/${sessionId}`;
    } catch (error) {
      alert('Failed to join class');
    }
  };

  const displayedClasses =
    filter === 'active'
      ? activeSessions
      : filter === 'upcoming'
      ? upcomingClasses
      : [...activeSessions, ...upcomingClasses];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Video className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">Live Classes</h1>
            </div>
            <p className="text-lg text-gray-600">Join live sessions with instructors</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              All Classes
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                filter === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <PlayCircle className="w-4 h-4 inline mr-2" />
              Live Now
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                filter === 'upcoming'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Upcoming
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading live classes...</p>
            </div>
          ) : displayedClasses.length === 0 ? (
            <Card className="text-center py-12">
              <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No live classes available at the moment</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedClasses.map((session) => (
                <Card key={session._id} className="hover:shadow-lg transition overflow-hidden">
                  {/* Status Badge */}
                  <div className="mb-4">
                    {session.status === 'active' ? (
                      <Badge variant="destructive" className="inline-flex items-center gap-1">
                        <PlayCircle className="w-3 h-3" />
                        LIVE NOW
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Scheduled
                      </Badge>
                    )}
                  </div>

                  {/* Course & Instructor Info */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{session.courseId?.title || 'Live Session'}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Instructor: {session.instructorId?.name || 'Instructor'}
                  </p>

                  {/* Session Details */}
                  <div className="space-y-2 mb-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(session.scheduledAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(session.scheduledAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{session.participants?.length || 0} participants</span>
                    </div>
                  </div>

                  {/* Description */}
                  {session.description && (
                    <p className="text-sm text-gray-600 mb-6 line-clamp-2">{session.description}</p>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={() => handleJoinClass(session._id)}
                    className="w-full"
                    variant={session.status === 'active' ? 'default' : 'outline'}
                  >
                    {session.status === 'active' ? 'Join Now' : 'View Details'}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
