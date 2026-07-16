import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Loader, Sparkles } from 'lucide-react';
import api from '../api/client';

export const AINotesPanel = ({ lessonId, courseId }) => {
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateNotes = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.post('/api/ai/generate-notes', {
        lessonId,
        courseId,
      });
      setNotes(response.data.notes);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate notes');
    } finally {
      setLoading(false);
    }
  };

  const downloadNotes = () => {
    if (!notes) return;
    const element = document.createElement('a');
    const file = new Blob([notes.summary + '\n\n' + notes.keyPoints.join('\n')], {
      type: 'text/plain',
    });
    element.href = URL.createObjectURL(file);
    element.download = `notes-${lessonId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Notes Generator
            </CardTitle>
            <Badge>AI</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {!notes ? (
            <Button
              onClick={generateNotes}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Generating Notes...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Notes
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{notes.summary}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Key Points</h3>
                <ul className="space-y-2">
                  {notes.keyPoints?.map((point, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {notes.revisionNotes && (
                <div>
                  <h3 className="font-semibold mb-2">Revision Notes</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{notes.revisionNotes}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={downloadNotes}
                  className="flex-1"
                >
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setNotes(null)}
                  className="flex-1"
                >
                  Generate Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
