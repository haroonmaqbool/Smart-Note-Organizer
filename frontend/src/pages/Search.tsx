import React, { useState } from 'react';
import {
  Box,
  TextField,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

interface SearchResult {
  id: string;
  title: string;
  summary: string;
  tags: string[];
}

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement actual search functionality
    // This is a mock implementation
    if (query.trim()) {
      setResults([
        {
          id: '1',
          title: 'Sample Note',
          summary: 'This is a sample note that matches your search query.',
          tags: ['sample', 'test'],
        },
      ]);
    } else {
      setResults([]);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Search Notes
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by title, content, or tags..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </CardContent>
      </Card>

      {results.length > 0 ? (
        <List>
          {results.map((result, index) => (
            <React.Fragment key={result.id}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={result.title}
                  secondary={
                    <Box>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        sx={{ display: 'block', mb: 1 }}
                      >
                        {result.summary}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {result.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Box>
                  }
                />
              </ListItem>
              {index < results.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography color="text.secondary" align="center">
          {searchQuery
            ? 'No results found'
            : 'Start typing to search your notes'}
        </Typography>
      )}
    </Box>
  );
};

export default Search; 