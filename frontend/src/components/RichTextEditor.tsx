import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Paper,
  Button,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  alpha,
  useTheme,
  Snackbar,
  Alert,
  Collapse,
  TextField,
  Menu,
  MenuItem
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatQuote,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  CloudUpload,
  Check,
  ExpandMore,
  ExpandLess,
  Title,
  FormatUnderlined,
  FormatClear,
  InsertLink,
  Image,
  FormatListNumbered,
  Code,
  FormatSize,
  TextIncrease,
  TextDecrease,
  ColorLens
} from '@mui/icons-material';
import Tesseract from 'tesseract.js';
import './RichTextEditor.css';

interface RichTextEditorProps {
  initialContent?: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContent = '',
  onChange,
  placeholder = 'Start typing...',
  minHeight = 150
}) => {
  const theme = useTheme();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [notification, setNotification] = useState({ 
    open: false, 
    message: '', 
    severity: 'info' as 'success' | 'error' | 'info' | 'warning' 
  });
  const [showPreview, setShowPreview] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const [expandedToolbar, setExpandedToolbar] = useState(false);
  const [editorContent, setEditorContent] = useState(initialContent);
  
  // Link dialog states
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkSelection, setLinkSelection] = useState<Range | null>(null);
  
  // Heading menu state
  const [headingMenuAnchor, setHeadingMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Color selection menu
  const [colorMenuAnchor, setColorMenuAnchor] = useState<null | HTMLElement>(null);
  const colors = ['#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff', '#ffffff'];
  
  // Initialize editor with initial content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent;
      setEditorContent(initialContent);
    }
  }, [initialContent]);

  // Track selection changes to update format buttons
  useEffect(() => {
    const updateActiveFormats = () => {
      const formats: string[] = [];
      
      if (document.queryCommandState('bold')) formats.push('bold');
      if (document.queryCommandState('italic')) formats.push('italic');
      if (document.queryCommandState('underline')) formats.push('underline');
      if (document.queryCommandState('insertUnorderedList')) formats.push('list');
      if (document.queryCommandState('insertOrderedList')) formats.push('ordered-list');
      if (document.queryCommandState('formatBlock') && document.queryCommandValue('formatBlock') === 'blockquote') {
        formats.push('quote');
      }
      
      // Check for headings
      const formatBlock = document.queryCommandValue('formatBlock');
      if (formatBlock.match(/h[1-6]/i)) {
        formats.push(formatBlock.toLowerCase());
      }
      
      // Check alignment
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const parentElement = selection.getRangeAt(0).commonAncestorContainer as HTMLElement;
        const computedStyle = window.getComputedStyle(
          parentElement.nodeType === 3 ? parentElement.parentElement as HTMLElement : parentElement
        );
        
        const textAlign = computedStyle.textAlign;
        if (textAlign === 'center') formats.push('center');
        else if (textAlign === 'right') formats.push('right');
        else formats.push('left'); // Default
      }
      
      setActiveFormats(formats);
    };

    document.addEventListener('selectionchange', updateActiveFormats);
    return () => document.removeEventListener('selectionchange', updateActiveFormats);
  }, []);

  // Handle content changes and propagate to parent
  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setEditorContent(newContent);
      onChange(newContent);
    }
  };

  // Execute formatting commands
  const execFormatCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleContentChange();
    
    // Focus back to the editor
    if (editorRef.current) {
      editorRef.current.focus();
    }
    
    // Update active formats immediately after command
    const formats = [...activeFormats];
    switch (command) {
      case 'bold':
        if (formats.includes('bold')) formats.splice(formats.indexOf('bold'), 1);
        else formats.push('bold');
        break;
      case 'italic':
        if (formats.includes('italic')) formats.splice(formats.indexOf('italic'), 1);
        else formats.push('italic');
        break;
      case 'underline':
        if (formats.includes('underline')) formats.splice(formats.indexOf('underline'), 1);
        else formats.push('underline');
        break;
      case 'insertUnorderedList':
        if (formats.includes('list')) formats.splice(formats.indexOf('list'), 1);
        else formats.push('list');
        break;
      case 'insertOrderedList':
        if (formats.includes('ordered-list')) formats.splice(formats.indexOf('ordered-list'), 1);
        else formats.push('ordered-list');
        break;
      case 'formatBlock':
        if (value === 'blockquote' && formats.includes('quote')) {
          formats.splice(formats.indexOf('quote'), 1);
          document.execCommand('formatBlock', false, 'p');
        } else if (value === 'blockquote') {
          formats.push('quote');
        } else if (value.match(/h[1-6]/i)) {
          // Remove existing heading formats
          formats.forEach((format, index) => {
            if (format.match(/h[1-6]/i)) {
              formats.splice(index, 1);
            }
          });
          formats.push(value.toLowerCase());
        }
        break;
    }
    setActiveFormats(formats);
  };

  // Apply text alignment
  const applyAlignment = (alignment: 'left' | 'center' | 'right') => {
    const newFormats = activeFormats.filter(f => !['left', 'center', 'right'].includes(f));
    newFormats.push(alignment);
    setActiveFormats(newFormats);
    
    document.execCommand('justifyLeft', false, '');
    if (alignment === 'center') document.execCommand('justifyCenter', false, '');
    if (alignment === 'right') document.execCommand('justifyRight', false, '');
    
    handleContentChange();
  };

  // Apply text color
  const applyTextColor = (color: string) => {
    document.execCommand('foreColor', false, color);
    handleContentChange();
    setColorMenuAnchor(null);
  };

  // Insert link
  const openLinkDialog = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setLinkSelection(selection.getRangeAt(0).cloneRange());
      setLinkText(selection.toString());
      setLinkDialogOpen(true);
    } else {
      setNotification({
        open: true,
        message: 'Please select some text first',
        severity: 'warning'
      });
    }
  };

  const insertLink = () => {
    if (linkSelection && linkUrl) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(linkSelection);
        document.execCommand('createLink', false, linkUrl);
        handleContentChange();
      }
    }
    setLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
    setLinkSelection(null);
  };

  // Apply heading
  const applyHeading = (level: number | null) => {
    if (level === null) {
      document.execCommand('formatBlock', false, 'p');
    } else {
      document.execCommand('formatBlock', false, `h${level}`);
    }
    handleContentChange();
    setHeadingMenuAnchor(null);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle tab key to indent
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
      handleContentChange();
      return;
    }
    
    // Support common keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execFormatCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execFormatCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execFormatCommand('underline');
          break;
      }
    }
  };

  // OCR Image/PDF processing
  const processImageOrPdf = async (file: File) => {
    setIsProcessing(true);
    setOcrProgress(0);
    
    try {
      // For simplicity, only using Tesseract for images
      // A real implementation would use PDF.js for PDFs first
      
      Tesseract.recognize(file, 'eng', {
        logger: (data) => {
          if (data.status === 'recognizing text') {
            setOcrProgress(Math.round(data.progress * 100));
          }
        }
      }).then(result => {
        setPreviewText(result.data.text);
        setShowPreview(true);
        setIsProcessing(false);
      }).catch(error => {
        console.error('OCR processing error:', error);
        setNotification({
          open: true,
          message: 'Error processing the file. Please try again.',
          severity: 'error'
        });
        setIsProcessing(false);
      });
    } catch (error) {
      console.error('Error processing file:', error);
      setNotification({
        open: true,
        message: 'Error processing the file. Please try again.',
        severity: 'error'
      });
      setIsProcessing(false);
    }
  };

  // Handle file upload for OCR
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setNotification({
        open: true,
        message: 'Only JPG, PNG, and PDF files are supported.',
        severity: 'warning'
      });
      return;
    }
    
    processImageOrPdf(file);
  };

  // Insert OCR text into editor
  const insertOcrText = () => {
    if (editorRef.current && previewText) {
      // Clean and format the OCR text
      const formattedText = previewText
        .split('\n\n')
        .map(paragraph => `<p>${paragraph.replace(/\n/g, ' ')}</p>`)
        .join('');
      
      // Insert at cursor position if possible, otherwise append
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formattedText;
        
        const fragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild);
        }
        
        range.insertNode(fragment);
      } else {
        // Append to end if no selection
        editorRef.current.innerHTML += formattedText;
      }
      
      handleContentChange();
      setShowPreview(false);
      setPreviewText('');
    }
  };

  // Handle image insertion
  const handleInsertImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setNotification({
        open: true,
        message: 'Please select an image file',
        severity: 'warning'
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && editorRef.current) {
        const imgHtml = `<img src="${e.target.result}" alt="Inserted image" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
        
        // Insert at selection if possible
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = imgHtml;
          
          const fragment = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }
          
          range.insertNode(fragment);
        } else {
          // Append to end
          editorRef.current.innerHTML += imgHtml;
        }
        
        handleContentChange();
      }
    };
    reader.readAsDataURL(file);
  };

  // Clear formatting
  const clearFormatting = () => {
    document.execCommand('removeFormat', false, '');
    document.execCommand('unlink', false, '');
    handleContentChange();
  };

  // Adjust font size
  const adjustFontSize = (increase: boolean) => {
    const sizeMap: Record<string, string> = {
      '1': '10px',
      '2': '13px',
      '3': '16px',
      '4': '18px',
      '5': '24px',
      '6': '32px',
      '7': '48px'
    };
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      const currentSize = window.getComputedStyle(range.commonAncestorContainer as Element).fontSize;
      const currentSizeNum = parseInt(currentSize);
      
      span.style.fontSize = `${increase ? currentSizeNum + 2 : Math.max(10, currentSizeNum - 2)}px`;
      
      range.surroundContents(span);
      handleContentChange();
    }
  };

  // Insert code block
  const insertCodeBlock = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      
      pre.style.backgroundColor = alpha(theme.palette.primary.main, 0.1);
      pre.style.padding = '8px';
      pre.style.borderRadius = '4px';
      pre.style.fontFamily = 'monospace';
      pre.style.overflowX = 'auto';
      
      if (range.toString()) {
        code.textContent = range.toString();
        pre.appendChild(code);
        range.deleteContents();
        range.insertNode(pre);
      } else {
        code.textContent = 'Your code here';
        pre.appendChild(code);
        range.insertNode(pre);
      }
      
      handleContentChange();
    }
  };

  return (
    <Box 
      sx={{ 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 0.5,
          borderRadius: 0,
          borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.05)}`,
          backgroundColor: alpha(theme.palette.primary.main, 0.03),
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
          {/* Heading Menu Button */}
          <Tooltip title="Text Style">
            <IconButton 
              size="small" 
              onClick={(e) => setHeadingMenuAnchor(e.currentTarget)}
              sx={{ color: theme.palette.text.secondary }}
            >
              <FormatSize fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {/* Heading Menu */}
          <Menu
            anchorEl={headingMenuAnchor}
            open={Boolean(headingMenuAnchor)}
            onClose={() => setHeadingMenuAnchor(null)}
          >
            <MenuItem onClick={() => applyHeading(null)}>
              <Typography variant="body1">Normal Text</Typography>
            </MenuItem>
            <MenuItem onClick={() => applyHeading(1)}>
              <Typography variant="h6">Heading 1</Typography>
            </MenuItem>
            <MenuItem onClick={() => applyHeading(2)}>
              <Typography variant="subtitle1">Heading 2</Typography>
            </MenuItem>
            <MenuItem onClick={() => applyHeading(3)}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Heading 3</Typography>
            </MenuItem>
          </Menu>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          
          {/* Basic Formatting */}
          <Tooltip title="Bold (Ctrl+B)">
            <IconButton 
              size="small" 
              onClick={() => execFormatCommand('bold')}
              className={activeFormats.includes('bold') ? 'active-format' : ''}
              sx={{
                color: activeFormats.includes('bold') 
                  ? theme.palette.primary.main 
                  : theme.palette.text.secondary,
                '&.active-format': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <FormatBold fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Italic (Ctrl+I)">
            <IconButton 
              size="small" 
              onClick={() => execFormatCommand('italic')}
              className={activeFormats.includes('italic') ? 'active-format' : ''}
              sx={{
                color: activeFormats.includes('italic') 
                  ? theme.palette.primary.main 
                  : theme.palette.text.secondary,
                '&.active-format': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <FormatItalic fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Underline (Ctrl+U)">
            <IconButton 
              size="small" 
              onClick={() => execFormatCommand('underline')}
              className={activeFormats.includes('underline') ? 'active-format' : ''}
              sx={{
                color: activeFormats.includes('underline') 
                  ? theme.palette.primary.main 
                  : theme.palette.text.secondary,
                '&.active-format': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <FormatUnderlined fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Text Color">
            <IconButton 
              size="small" 
              onClick={(e) => setColorMenuAnchor(e.currentTarget)}
              sx={{ color: theme.palette.text.secondary }}
            >
              <ColorLens fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {/* Color Menu */}
          <Menu
            anchorEl={colorMenuAnchor}
            open={Boolean(colorMenuAnchor)}
            onClose={() => setColorMenuAnchor(null)}
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1, width: 150 }}>
              {colors.map((color) => (
                <Box 
                  key={color}
                  onClick={() => applyTextColor(color)}
                  sx={{
                    width: 24,
                    height: 24,
                    backgroundColor: color,
                    cursor: 'pointer',
                    border: `1px solid ${alpha(theme.palette.common.black, 0.2)}`,
                    '&:hover': {
                      boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
                    }
                  }}
                />
              ))}
            </Box>
          </Menu>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          
          <Tooltip title="Bullet List">
            <IconButton 
              size="small" 
              onClick={() => execFormatCommand('insertUnorderedList')}
              className={activeFormats.includes('list') ? 'active-format' : ''}
              sx={{
                color: activeFormats.includes('list') 
                  ? theme.palette.primary.main 
                  : theme.palette.text.secondary,
                '&.active-format': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <FormatListBulleted fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Numbered List">
            <IconButton 
              size="small" 
              onClick={() => execFormatCommand('insertOrderedList')}
              className={activeFormats.includes('ordered-list') ? 'active-format' : ''}
              sx={{
                color: activeFormats.includes('ordered-list') 
                  ? theme.palette.primary.main 
                  : theme.palette.text.secondary,
                '&.active-format': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <FormatListNumbered fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Blockquote">
            <IconButton 
              size="small" 
              onClick={() => execFormatCommand('formatBlock', 'blockquote')}
              className={activeFormats.includes('quote') ? 'active-format' : ''}
              sx={{
                color: activeFormats.includes('quote') 
                  ? theme.palette.primary.main 
                  : theme.palette.text.secondary,
                '&.active-format': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <FormatQuote fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Code">
            <IconButton 
              size="small" 
              onClick={insertCodeBlock}
              sx={{ color: theme.palette.text.secondary }}
            >
              <Code fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          
          {/* Alignment Options */}
          <Tooltip title="Align Left">
            <IconButton 
              size="small" 
              onClick={() => applyAlignment('left')}
              className={activeFormats.includes('left') ? 'active-format' : ''}
              sx={{
                color: activeFormats.includes('left') 
                  ? theme.palette.primary.main 
                  : theme.palette.text.secondary,
                '&.active-format': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <FormatAlignLeft fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Align Center">
            <IconButton 
              size="small" 
              onClick={() => applyAlignment('center')}
              className={activeFormats.includes('center') ? 'active-format' : ''}
              sx={{
                color: activeFormats.includes('center') 
                  ? theme.palette.primary.main 
                  : theme.palette.text.secondary,
                '&.active-format': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <FormatAlignCenter fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Align Right">
            <IconButton 
              size="small" 
              onClick={() => applyAlignment('right')}
              className={activeFormats.includes('right') ? 'active-format' : ''}
              sx={{
                color: activeFormats.includes('right') 
                  ? theme.palette.primary.main 
                  : theme.palette.text.secondary,
                '&.active-format': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <FormatAlignRight fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          
          {/* Link Button */}
          <Tooltip title="Insert Link (Ctrl+K)">
            <IconButton 
              size="small" 
              onClick={openLinkDialog}
              sx={{ color: theme.palette.text.secondary }}
            >
              <InsertLink fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {/* Image Button */}
          <Tooltip title="Insert Image">
            <IconButton 
              size="small" 
              onClick={() => imageInputRef.current?.click()}
              sx={{ color: theme.palette.text.secondary }}
            >
              <Image fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleInsertImage}
          />
          
          {/* OCR Button */}
          <Tooltip title="Extract text from image/PDF">
            <IconButton 
              size="small" 
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                color: isProcessing 
                  ? theme.palette.action.disabled 
                  : theme.palette.text.secondary,
              }}
            >
              {isProcessing ? (
                <CircularProgress size={18} />
              ) : (
                <CloudUpload fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            disabled={isProcessing}
          />
          
          {/* Expand/collapse toolbar button */}
          <Box sx={{ ml: 'auto' }}>
            <IconButton 
              size="small" 
              onClick={() => setExpandedToolbar(!expandedToolbar)}
              sx={{ color: theme.palette.text.secondary }}
            >
              {expandedToolbar ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </IconButton>
          </Box>
        </Box>
        
        {/* Expanded toolbar section */}
        <Collapse in={expandedToolbar}>
          <Box sx={{ pt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Tooltip title="Increase Text Size">
                <IconButton 
                  size="small" 
                  onClick={() => adjustFontSize(true)}
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <TextIncrease fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Decrease Text Size">
                <IconButton 
                  size="small" 
                  onClick={() => adjustFontSize(false)}
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <TextDecrease fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Clear Formatting">
                <IconButton 
                  size="small" 
                  onClick={clearFormatting}
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <FormatClear fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Typography variant="caption" color="text.secondary">
              {isProcessing ? `OCR Processing: ${ocrProgress}%` : 'Use Tab/Shift+Tab for list indentation'}
            </Typography>
          </Box>
        </Collapse>
      </Paper>
      
      {/* Editable Content Area */}
      <Box
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleContentChange}
        onKeyDown={handleKeyDown}
        onBlur={handleContentChange}
        sx={{
          p: 2,
          minHeight: minHeight,
          outline: 'none',
          overflowY: 'auto',
          flex: 1,
          '&:focus': {
            boxShadow: `inset 0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
          },
          '&:empty:before': {
            content: `"${placeholder}"`,
            color: alpha(theme.palette.text.primary, 0.4),
            pointerEvents: 'none',
          },
          '& blockquote': {
            borderLeft: `4px solid ${alpha(theme.palette.primary.main, 0.5)}`,
            margin: '0.5em 0',
            padding: '0.5em 1em',
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          },
          '& ul, & ol': {
            paddingLeft: '1.5em',
          },
          '& h1': {
            fontSize: '1.6em',
            margin: '0.5em 0',
          },
          '& h2': {
            fontSize: '1.4em',
            margin: '0.5em 0',
          },
          '& h3': {
            fontSize: '1.2em',
            margin: '0.5em 0',
          },
          '& code': {
            fontFamily: 'monospace',
            backgroundColor: alpha(theme.palette.grey[300], 0.5),
            padding: '0 0.2em',
            borderRadius: '3px',
          },
          '& a': {
            color: theme.palette.primary.main,
            textDecoration: 'underline',
          },
        }}
      />
      
      {/* OCR Preview Dialog */}
      <Dialog 
        open={showPreview} 
        onClose={() => setShowPreview(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          OCR Result Preview
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            variant="outlined"
            placeholder="OCR text will appear here"
            sx={{ my: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            You can edit the text before inserting it into the editor.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Check />}
            onClick={insertOcrText}
          >
            Insert Text
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Link Dialog */}
      <Dialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Insert Link</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Link Text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            disabled={linkText !== ''}
            margin="normal"
          />
          <TextField
            fullWidth
            label="URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={insertLink}
            disabled={!linkUrl}
          >
            Insert
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RichTextEditor; 