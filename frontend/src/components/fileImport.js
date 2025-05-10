// Process the file upload and import
const handleFileImportProcess = async (file, setIsProcessing, setNotification, editorRef, handleContentChange) => {
  const acceptedTypes = [
    'application/pdf', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  
  if (!acceptedTypes.includes(file.type)) {
    setNotification({
      open: true,
      message: 'Unsupported file type. Please upload PDF, Word, PowerPoint, or image files.',
      severity: 'warning'
    });
    return;
  }
  
  // Check file size - limit to 10MB
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    setNotification({
      open: true,
      message: 'File is too large. Maximum size is 10MB.',
      severity: 'warning'
    });
    return;
  }
  
  setIsProcessing(true);
  console.log(`Uploading file: ${file.name} (${file.size} bytes, type: ${file.type})`);
  
  // Create FormData for file upload
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/import/', {
      method: 'POST',
      body: formData,
    });
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Error parsing response JSON:', parseError);
      throw new Error('Invalid server response format');
    }
    
    if (!response.ok) {
      const errorMessage = data.error || `Server returned ${response.status}: ${response.statusText}`;
      console.error('Import error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // Check if data has text property
    if (!data.text) {
      console.error('Import response missing text property:', data);
      throw new Error('Server returned an invalid response format');
    }
    
    // Insert content into editor
    if (editorRef.current && data.text) {
      const importHeader = `<p><strong>Imported from:</strong> ${data.filename}</p>`;
      const importContent = data.text
        .split('\n\n')
        .map((paragraph) => `<p>${paragraph.replace(/\n/g, ' ')}</p>`)
        .join('');
      
      // Insert at cursor position if possible, otherwise append
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = importHeader + importContent;
        
        const fragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild);
        }
        
        range.insertNode(fragment);
      } else {
        // Append to end if no selection
        editorRef.current.innerHTML += importHeader + importContent;
      }
      
      handleContentChange();
    }
    
    setNotification({
      open: true,
      message: 'File imported successfully',
      severity: 'success'
    });
    
  } catch (error) {
    console.error('Error importing file:', error);
    
    // Extract the error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error importing the file. Please try again.';
      
    setNotification({
      open: true,
      message: errorMessage,
      severity: 'error'
    });
  } finally {
    setIsProcessing(false);
  }
}; 