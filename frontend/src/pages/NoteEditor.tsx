import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Chip,
  Stack,
} from '@mui/material';
import { Upload as UploadIcon, Save as SaveIcon } from '@mui/icons-material';
import { createRoot } from 'react-dom/client';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';

const NoteEditor: React.FC = () => {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  React.useEffect(() => {
    const editor = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions: [
          basicSetup,
          markdown(),
          oneDark,
        ],
      }),
      parent: document.getElementById('editor')!,
    });

    return () => {
      editor.destroy();
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // TODO: Implement file processing logic
    console.log('File uploaded:', file.name);
  };

  const handleAddTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Note Editor
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Tags
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                />
              ))}
            </Stack>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                label="Add Tag"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button variant="outlined" onClick={handleAddTag}>
                Add
              </Button>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
            >
              Upload File
              <input
                type="file"
                hidden
                accept=".txt,.md,.pdf"
                onChange={handleFileUpload}
              />
            </Button>
          </Box>

          <Box
            id="editor"
            sx={{
              border: '1px solid #ccc',
              borderRadius: 1,
              height: '400px',
              overflow: 'auto',
            }}
          />

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => {
                // TODO: Implement save functionality
                console.log('Saving note...');
              }}
            >
              Save Note
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NoteEditor; 