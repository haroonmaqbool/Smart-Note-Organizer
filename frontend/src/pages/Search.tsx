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
  Tooltip,
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Note as NoteIcon, 
  QuizOutlined as FlashcardIcon,
  Clear as ClearIcon,
  Title as TitleIcon,
  Tag as TagIcon,
} from '@mui/icons-material';
import { SearchResultItem } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

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
  const { state } = useApp();
  const { flashcards, notes } = state;
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for search query in URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryParam = searchParams.get('q');
    
    if (queryParam) {
      setSearchQuery(queryParam);
      performLocalSearch(queryParam);
    }
  }, [location.search]);

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Perform search when query changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        performLocalSearch(searchQuery);
        
        // Update URL with search query without reloading the page
        const url = new URL(window.location.href);
        url.searchParams.set('q', searchQuery);
        window.history.pushState({}, '', url.toString());
      } else {
        setResults([]);
        
        // Remove query parameter from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('q');
        window.history.pushState({}, '', url.toString());
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, flashcards, notes]);

  // Local search function
  const performLocalSearch = (query: string) => {
    setIsLoading(true);
    
    try {
      const searchResults: SearchResultItem[] = [];
      const queryLower = query.toLowerCase();
      
      // Search through flashcards
      flashcards.forEach(card => {
        const titleMatch = card.front.toLowerCase().includes(queryLower);
        const contentMatch = card.back.toLowerCase().includes(queryLower);
        const tagMatch = card.tags.some(tag => tag.toLowerCase().includes(queryLower));
        
        if (titleMatch || contentMatch || tagMatch) {
          searchResults.push({
            id: card.id,
            title: card.front,
            question: card.front,
            answer: card.back,
            tags: card.tags,
            type: 'flashcard',
            matchScore: calculateMatchScore(card.front, card.back, card.tags, queryLower),
            match_info: {
              title_match: titleMatch,
              tag_match: tagMatch
            }
          });
        }
      });
      
      // Search through notes
      notes.forEach(note => {
        const titleMatch = note.title.toLowerCase().includes(queryLower);
        const contentMatch = note.content.toLowerCase().includes(queryLower);
        const tagMatch = note.tags.some(tag => tag.toLowerCase().includes(queryLower));
        
        if (titleMatch || contentMatch || tagMatch) {
          searchResults.push({
            id: note.id,
            title: note.title,
            summary: note.summary || extractSummary(note.content),
            tags: note.tags,
            type: 'note',
            matchScore: calculateMatchScore(note.title, note.content, note.tags, queryLower),
            match_info: {
              title_match: titleMatch,
              tag_match: tagMatch
            }
          });
        }
      });
      
      // Sort results by match score (descending)
      searchResults.sort((a, b) => b.matchScore - a.matchScore);
      
      setResults(searchResults);
    } catch (error) {
      console.error('Local search error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate match score for sorting results
  const calculateMatchScore = (title: string, content: string, tags: string[], query: string): number => {
    let score = 0;
    
    // Title match (highest priority)
    if (title.toLowerCase() === query) {
      score += 10; // Exact title match
    } else if (title.toLowerCase().includes(query)) {
      score += 5; // Partial title match
    }
    
    // Content match
    if (content.toLowerCase().includes(query)) {
      score += 3;
    }
    
    // Tag match
    for (const tag of tags) {
      if (tag.toLowerCase() === query) {
        score += 4; // Exact tag match
      } else if (tag.toLowerCase().includes(query)) {
        score += 2; // Partial tag match
      }
    }
    
    return score;
  };

  // Helper function to extract a summary from note content (stripping HTML)
  const extractSummary = (content: string): string => {
    // Remove HTML tags
    const plainText = content.replace(/<[^>]*>/g, '');
    // Return first 100 characters
    return plainText.substring(0, 100) + (plainText.length > 100 ? '...' : '');
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
        Search Notes & Flashcards
      </Typography>

      <Paper elevation={3} sx={{ mb: 3, p: 1 }}>
        <TextField
          fullWidth
          placeholder="Search your notes and flashcards by title, content, or tags..."
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
                <IconButton onClick={handleClearSearch} edge="end" size="small" aria-label="Clear search">
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
            : 'Start typing to search your notes and flashcards by title, content, or tags.'}
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
                    {result.match_info && (
                      <Box component="span" ml={1}>
                        {result.match_info.title_match && (
                          <Tooltip title="Title match">
                            <TitleIcon 
                              fontSize="small" 
                              color="primary" 
                              sx={{ verticalAlign: 'middle', ml: 0.5 }}
                            />
                          </Tooltip>
                        )}
                        {result.match_info.tag_match && (
                          <Tooltip title="Tag match">
                            <TagIcon 
                              fontSize="small" 
                              color="secondary" 
                              sx={{ verticalAlign: 'middle', ml: 0.5 }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    )}
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
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                    {result.tags.map((tag, i) => (
                      <Chip 
                        key={i} 
                        label={tag} 
                        size="small" 
                        color="default" 
                        variant="outlined"
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