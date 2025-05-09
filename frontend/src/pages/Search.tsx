import React, { useState, useEffect } from 'react';
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
  Tab,
  Tabs,
  CircularProgress,
  IconButton,
  Paper,
  InputAdornment,
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Note as NoteIcon, 
  QuizOutlined as FlashcardIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { api, SearchResultItem } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Tab interface to enable filtering by content type
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`search-tabpanel-${index}`}
      aria-labelledby={`search-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Perform search when query changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Search function
  const performSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.globalSearch(query);
      
      if (response.error) {
        setError(response.error);
        setResults([]);
      } else if (response.data) {
        setResults(response.data.results);
      }
    } catch (err) {
      setError('Failed to perform search. Please try again later.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter results based on selected tab
  const filteredResults = results.filter(result => {
    if (tabValue === 0) return true; // All results
    if (tabValue === 1) return result.type === 'note'; // Only notes
    if (tabValue === 2) return result.type === 'flashcard'; // Only flashcards
    return false;
  });

  // Handle clearing the search
  const handleClearSearch = () => {
    setSearchQuery('');
    setResults([]);
  };

  // Handle opening a search result
  const handleOpenResult = (result: SearchResultItem) => {
    if (result.type === 'note') {
      // Navigate to note editor with the note ID
      navigate(`/editor?id=${result.id}`);
    } else if (result.type === 'flashcard') {
      // Navigate to flashcards page with the specific card
      navigate(`/flashcards?card=${result.id}`);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Global Search
      </Typography>

      <Paper elevation={3} sx={{ mb: 3, p: 1 }}>
        <TextField
          fullWidth
          placeholder="Search across notes, tags, and flashcards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton onClick={handleClearSearch} edge="end" size="small">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ 
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'background.paper'
            }
          }}
        />
      </Paper>

      {isLoading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" align="center" sx={{ my: 4 }}>
          {error}
        </Typography>
      ) : filteredResults.length > 0 ? (
        <Box>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`All (${results.length})`} />
            <Tab label={`Notes (${results.filter(r => r.type === 'note').length})`} />
            <Tab label={`Flashcards (${results.filter(r => r.type === 'flashcard').length})`} />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <ResultsList results={filteredResults} onItemClick={handleOpenResult} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <ResultsList results={filteredResults} onItemClick={handleOpenResult} />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <ResultsList results={filteredResults} onItemClick={handleOpenResult} />
          </TabPanel>
        </Box>
      ) : (
        <Typography color="text.secondary" align="center" sx={{ my: 8 }}>
          {searchQuery
            ? 'No results found. Try different keywords or check your spelling.'
            : 'Start typing to search your notes, tags, and flashcards'}
        </Typography>
      )}
    </Box>
  );
};

// Separate component for rendering search results
const ResultsList: React.FC<{
  results: SearchResultItem[];
  onItemClick: (result: SearchResultItem) => void;
}> = ({ results, onItemClick }) => {
  return (
    <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
      {results.map((result, index) => (
        <React.Fragment key={result.id}>
          <ListItem 
            alignItems="flex-start"
            sx={{ 
              cursor: 'pointer',
              '&:hover': { 
                bgcolor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
            onClick={() => onItemClick(result)}
          >
            <Box sx={{ display: 'flex', width: '100%' }}>
              <Box sx={{ pr: 2, color: 'text.secondary' }}>
                {result.type === 'note' ? <NoteIcon /> : <FlashcardIcon />}
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="subtitle1" component="div" fontWeight={500}>
                    {result.title}
                  </Typography>
                  <Chip 
                    label={result.type === 'note' ? 'Note' : 'Flashcard'} 
                    size="small" 
                    color={result.type === 'note' ? 'primary' : 'secondary'}
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                </Box>
                
                {result.type === 'note' && result.summary && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {result.summary}
                  </Typography>
                )}
                
                {result.type === 'flashcard' && result.question && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    <strong>Q:</strong> {result.question}
                  </Typography>
                )}
                
                {result.tags && result.tags.length > 0 && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                    {result.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </Box>
          </ListItem>
          {index < results.length - 1 && <Divider component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default Search; 