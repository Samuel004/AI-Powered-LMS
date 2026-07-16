import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Loader, Sparkles, RotateCw } from 'lucide-react';
import api from '../api/client';

export const AIFlashcardsPage = ({ lessonId, courseId }) => {
  const [flashcards, setFlashcards] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const generateFlashcards = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.post('/api/ai/generate-flashcards', {
        lessonId,
        courseId,
      });
      setFlashcards(response.data.flashcards);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate flashcards');
    } finally {
      setLoading(false);
    }
  };

  if (!flashcards) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              AI Flashcards
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

          <Button
            onClick={generateFlashcards}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Generating Flashcards...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Flashcards
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const card = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <CardTitle>AI Flashcards</CardTitle>
            <Badge>
              {currentIndex + 1} / {flashcards.length}
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Flashcard */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 cursor-pointer flex items-center justify-center p-8 transition-transform hover:shadow-lg"
          >
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4 uppercase tracking-wide">
                {isFlipped ? 'Answer' : 'Question'}
              </p>
              <p className="text-2xl font-bold text-gray-900 leading-relaxed">
                {isFlipped ? card.answer : card.question}
              </p>
              <p className="text-xs text-gray-500 mt-6">Click to flip</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex(currentIndex - 1);
                  setIsFlipped(false);
                }
              }}
              disabled={currentIndex === 0}
              className="flex-1"
            >
              Previous
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className="flex-1"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Restart
            </Button>

            <Button
              onClick={() => {
                if (currentIndex < flashcards.length - 1) {
                  setCurrentIndex(currentIndex + 1);
                  setIsFlipped(false);
                }
              }}
              disabled={currentIndex === flashcards.length - 1}
              className="flex-1"
            >
              Next
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-gray-100 rounded">
              <p className="text-xs text-gray-600">Current</p>
              <p className="font-bold text-lg">{currentIndex + 1}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded">
              <p className="text-xs text-gray-600">Total</p>
              <p className="font-bold text-lg">{flashcards.length}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded">
              <p className="text-xs text-gray-600">Progress</p>
              <p className="font-bold text-lg">{Math.round(progress)}%</p>
            </div>
          </div>

          {/* Action */}
          <Button
            variant="outline"
            onClick={() => setFlashcards(null)}
            className="w-full"
          >
            Generate New Set
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
