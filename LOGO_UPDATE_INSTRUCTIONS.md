# Brain Network Logo Update Instructions

This guide will help you replace the current NoteNest logo with the new brain network logo. The new logo will combine the brain graphic and text into a single image, as requested.

## Option 1: Using the HTML Generator Tool

The easiest way to create and use the new logo:

1. Open the `brain_logo_combined.html` file in your web browser:
   - Right-click the file in your file explorer
   - Select "Open with" and choose your browser

2. In the opened page, you'll see two logo options:
   - **Standard Logo (400x400)**: For general use
   - **Sidebar Logo with Text (280x180)**: Optimized for the sidebar

3. Click the "Download" button for the logo you want to use

4. Copy the downloaded logo file:
   - Locate the downloaded `logo.jpeg` file in your Downloads folder
   - Copy this file to your project's `frontend/public` directory, overwriting the existing file

5. Refresh your application to see the new logo

## Option 2: Using the Logo Files Directly

If you already have the `logo.jpeg` file:

1. Make a backup of your current logo:
   ```
   copy frontend\public\logo.jpeg frontend\public\logo.jpeg.backup
   ```

2. Replace the logo file:
   - Copy your new logo file to `frontend\public\logo.jpeg`

3. Refresh your application

## Updating the Layout Component

The logo code in your Layout.tsx file has already been updated to display the combined logo image without separate text elements. If you need to make further adjustments:

```jsx
// Inside Layout.tsx
<Box
  sx={{
    width: sidebarCollapsed ? '50px' : '200px',
    height: sidebarCollapsed ? '50px' : '140px', 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    padding: sidebarCollapsed ? 1 : 2,
    mb: 1
  }}
  onClick={handleLogoClick}
>
  <img 
    src="/logo.jpeg" 
    alt="NoteNest Logo" 
    style={{ 
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      transition: 'all 0.3s ease'
    }} 
  />
</Box>
```

## Troubleshooting

If the new logo doesn't appear:
- Make sure the file is named exactly `logo.jpeg`
- Try clearing your browser cache
- Check that the file path in Layout.tsx is correct for your project
- Verify that the image file was properly saved and isn't corrupted