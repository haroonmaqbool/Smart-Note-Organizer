import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Divider,
  useTheme,
  alpha,
  IconButton,
  useMediaQuery,
  Paper,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Info as InfoIcon,
  Create as CreateIcon,
  Upload as UploadIcon,
  DarkMode as DarkModeIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Draw as DrawIcon,
  Label as LabelIcon,
} from '@mui/icons-material';

interface FAQ {
  question: string;
  answer: string;
  icon: React.ReactNode;
}

interface HelpSupportPanelProps {
  open: boolean;
  onClose: () => void;
}

const HelpSupportPanel: React.FC<HelpSupportPanelProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expanded, setExpanded] = React.useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const faqItems: FAQ[] = [
    {
      question: 'What is NoteNest?',
      answer: 'NoteNest is a smart note-taking and organizing app that allows you to create, import, and manage notes easily. It supports file uploads, rich text editing, and even extracts text from PDFs, Word documents, and images.',
      icon: <InfoIcon color="primary" />,
    },
    {
      question: 'How do I create a new note?',
      answer: 'Click the "New Note" button on the top bar or sidebar. This will open the editor where you can write and format your note.',
      icon: <CreateIcon color="primary" />,
    },
    {
      question: 'Can I import files into NoteNest?',
      answer: 'Yes. Click the "Import" button to upload files in PDF, Word (.docx), PowerPoint (.pptx), or image formats (.jpg, .png). Text will be automatically extracted and added to the note editor.',
      icon: <UploadIcon color="primary" />,
    },
    {
      question: 'How do I switch between dark and light mode?',
      answer: 'Use the 🌙/☀️ icon in the top bar to toggle between dark and light themes instantly.',
      icon: <DarkModeIcon color="primary" />,
    },
    {
      question: 'Where are my notes saved?',
      answer: 'All notes are saved securely to your account and synced with the backend. They are accessible anytime after logging in.',
      icon: <SaveIcon color="primary" />,
    },
    {
      question: 'Can I edit a note after saving it?',
      answer: 'Yes, just click on any note from your list to reopen and edit it.',
      icon: <EditIcon color="primary" />,
    },
    {
      question: 'How does the global search work?',
      answer: 'The global search bar allows you to find notes by keywords from any page. Simply type a word or phrase to see matching notes.',
      icon: <SearchIcon color="primary" />,
    },
    {
      question: 'What file types are supported for import?',
      answer: 'You can import .pdf, .docx, .pptx, .jpg, .jpeg, and .png files.',
      icon: <InsertDriveFileIcon color="primary" />,
    },
    {
      question: 'Is handwriting supported in image uploads?',
      answer: 'Yes, NoteNest uses OCR to extract printed and handwritten text from images.',
      icon: <DrawIcon color="primary" />,
    },
    {
      question: 'Can I organize my notes into categories or tags?',
      answer: 'Currently, tagging and categorization may be basic or under development. Stay tuned for advanced organizing features.',
      icon: <LabelIcon color="primary" />,
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2360A5FA' fill-opacity='0.05'%3E%3Cpath d='M24.8 30.2c-5.3-5.3-5.3-13.9 0-19.2 5.3-5.3 13.9-5.3 19.2 0 5.3 5.3 5.3 13.9 0 19.2l-9.6 9.6-9.6-9.6zm40 40c-5.3-5.3-5.3-13.9 0-19.2 5.3-5.3 13.9-5.3 19.2 0 5.3 5.3 5.3 13.9 0 19.2l-9.6 9.6-9.6-9.6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
          backgroundSize: '80px 80px',
        }
      }}
    >
      <Box sx={{ 
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100px',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.2)}, ${alpha(theme.palette.secondary.dark, 0.15)})`,
          zIndex: 0,
          borderRadius: '16px 16px 0 0',
        }
      }}>
        <DialogTitle 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 3,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <QuestionAnswerIcon 
            sx={{ 
              fontSize: 28,
              color: theme.palette.primary.main,
            }} 
          />
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              fontWeight: 700,
              flexGrow: 1,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Help & Support
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      </Box>

      <DialogContent sx={{ pt: 0, px: { xs: 2, sm: 3 }, pb: 3 }}>
        <Paper
          elevation={0}
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.primary.light, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
            Welcome to NoteNest Support
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Find answers to common questions below. If you need additional help, 
            please contact us at <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>support@notenest.com</Box>
          </Typography>
        </Paper>

        <Box sx={{ mb: 3, maxHeight: '60vh', overflow: 'auto', pr: 1 }}>
          {faqItems.length > 0 ? (
            faqItems.map((faq, index) => (
              <Accordion
                key={index}
                expanded={expanded === `panel${index}`}
                onChange={handleChange(`panel${index}`)}
                sx={{
                  mb: 1.5,
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.primary.main, expanded === `panel${index}` ? 0.2 : 0.1)}`,
                  borderRadius: '8px !important',
                  '&::before': {
                    display: 'none',
                  },
                  '&.Mui-expanded': {
                    boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    backgroundImage: expanded === `panel${index}` ? 
                      `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.default, 0.9)})` : 
                      'none',
                    backdropFilter: 'blur(8px)',
                  },
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon color="primary" />}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-expanded': {
                      borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {faq.icon}
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {faq.question}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 6, 
                px: 2,
                backgroundColor: alpha(theme.palette.background.paper, 0.5),
                borderRadius: 2,
                border: `1px dashed ${alpha(theme.palette.text.secondary, 0.2)}`,
              }}
            >
              <Typography variant="body1" color="text.secondary">
                No help content available at the moment.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <Divider />
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Close
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          sx={{ 
            borderRadius: 2,
            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
          }}
          onClick={onClose}
        >
          Got It
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HelpSupportPanel; 