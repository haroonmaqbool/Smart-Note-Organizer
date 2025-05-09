import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  IconButton,
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags: string[];
}

const Flashcards: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Mock flashcards data
  const flashcards: Flashcard[] = [
    {
      id: '1',
      front: 'What is the capital of France?',
      back: 'Paris',
      tags: ['geography', 'capitals'],
    },
    {
      id: '2',
      front: 'What is the chemical symbol for gold?',
      back: 'Au',
      tags: ['chemistry', 'elements'],
    },
  ];

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleExport = () => {
    // TODO: Implement export to Anki format
    const ankiFormat = flashcards.map(card => ({
      front: card.front,
      back: card.back,
      tags: card.tags.join(' '),
    }));

    const blob = new Blob([JSON.stringify(ankiFormat, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flashcards.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Flashcards</Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          Export to Anki
        </Button>
      </Box>

      {flashcards.length > 0 ? (
        <Card
          sx={{
            minHeight: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            perspective: '1000px',
          }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <CardContent>
            <Typography
              variant="h5"
              align="center"
              sx={{
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
                transition: 'transform 0.6s',
                transformStyle: 'preserve-3d',
              }}
            >
              {isFlipped
                ? flashcards[currentIndex].back
                : flashcards[currentIndex].front}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Typography color="text.secondary" align="center">
          No flashcards available. Create some notes first!
        </Typography>
      )}

      {flashcards.length > 0 && (
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          sx={{ mt: 3 }}
        >
          <IconButton
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <PrevIcon />
          </IconButton>
          <Typography variant="body1" sx={{ alignSelf: 'center' }}>
            {currentIndex + 1} / {flashcards.length}
          </Typography>
          <IconButton
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
          >
            <NextIcon />
          </IconButton>
        </Stack>
      )}
    </Box>
  );
};

export default Flashcards; 