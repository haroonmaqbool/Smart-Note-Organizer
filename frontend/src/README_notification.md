# NoteNest Enhanced Notification System

The NoteNest app includes a comprehensive notification system that provides two types of notifications:

1. **Toast Notifications** - Temporary messages that appear briefly and fade away
2. **Persistent Notifications** - Stored notifications visible in the notification dropdown panel

## Features

- **Toast notifications** appear at the top right and automatically disappear after 4 seconds
- **Badge counter** on the bell icon shows the number of unread notifications
- **Notification dropdown** displaying notification history with timestamps
- Different notification types: success, error, info, warning
- Category-specific icons (note, flashcard, system)
- Relative time display ("just now", "5 minutes ago", etc.)
- Unread indicators and animations
- Light/dark mode compatible

## How to Use Notifications

The notification system uses React Context to make it available throughout the app:

### 1. Import the Hook

```tsx
import { useNotification } from '../components/Layout';
```

### 2. Access Notification Functions and State

```tsx
function YourComponent() {
  // Get notification context
  const { 
    showNotification,  // Function to show a notification
    notifications,     // Array of all notifications
    unreadCount,       // Number of unread notifications
    markAllAsRead      // Function to mark all as read
  } = useNotification();
  
  // Function to handle saving a note
  const handleSaveNote = () => {
    // Your save logic here...
    
    // Then show a success notification
    showNotification('Note saved successfully', 'success', 'note');
  };
  
  // Function to handle generating flashcards
  const handleGenerateFlashcards = () => {
    // Your flashcard generation logic...
    
    // Then show a success notification
    showNotification('Flashcards generated successfully', 'success', 'flashcard');
  };
  
  return (
    <div>
      {/* Your component JSX */}
    </div>
  );
}
```

### 3. Available Notification Types:

- `success` - For successful operations (green)
- `error` - For errors or failures (red)
- `warning` - For warnings (amber/orange)
- `info` - For informational messages (blue)

### 4. Available Notification Categories:

- `note` - For note-related actions (shows note icon)
- `flashcard` - For flashcard-related actions (shows flashcard icon)
- `system` - For system messages (shows bell icon)

### Example Usage:

```tsx
// Basic usage
showNotification('Operation completed successfully', 'success');

// With category
showNotification('Note saved successfully', 'success', 'note');
showNotification('Flashcards generated successfully', 'success', 'flashcard');

// Error message
showNotification('Unable to save changes. Please try again.', 'error');

// Warning
showNotification('You have unsaved changes', 'warning');

// Info
showNotification('Synchronizing your notes...', 'info');
```

## Notification Object Structure

Each notification in the system has the following structure:

```typescript
interface NotificationItem {
  id: string;              // Unique identifier
  message: string;         // The notification message
  type: 'success' | 'error' | 'info' | 'warning';  // Type of notification
  timestamp: Date;         // When the notification was created
  read: boolean;           // Whether it's been read
  category?: 'note' | 'flashcard' | 'system';  // Category for icon selection
}
```

## Implementation Details

The notification system is implemented in `Layout.tsx` and uses:

- React Context for global state management
- Custom hook for easy access throughout the app
- MUI components: Badge, Menu, Snackbar, Alert
- Smooth animations with CSS keyframes
- Relative time formatting
- Icon mapping based on notification category
- User-friendly empty state
- Accessibility considerations (ARIA attributes, keyboard navigation)

For any additional features or modifications, please modify the notification system in `Layout.tsx`.

## Demo & Testing

- **Left-click** the bell icon to see your notifications. When the notification panel opens, all notifications are marked as read.
- **Right-click** the bell icon to open a test menu that allows you to add different types of notifications.

The system comes with a few demo notifications to showcase the functionality. In a real app, notifications would be triggered by actual user actions like saving notes or generating flashcards. 