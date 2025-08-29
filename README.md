# Zen Sidepanels - Second Sidebar

A sidepanels implementation for Zen Browser, aiming to replicate Opera/Vivaldi sidepanels functionality. This mod adds a toggleable second sidebar that can display web content in panels.

![Zen Sidepanels Demo](https://via.placeholder.com/800x400/2a2a2a/ffffff?text=Zen+Sidepanels+Demo)

## Features

- **Toggleable Second Sidebar**: Show/hide a secondary sidebar with web panels
- **Web Panel Management**: Load any website in the sidebar panel
- **Keyboard Shortcuts**: Quick access via Ctrl+Shift+E
- **Context Menu Integration**: Right-click menu option to toggle sidepanels
- **Responsive Design**: Adapts to different screen sizes
- **Zen Browser Integration**: Uses Zen's native styling and color variables

## Installation

This mod is designed for [Sine](https://github.com/CosmoCreeper/Sine) mod manager. Please follow these steps:

### Prerequisites

1. **Zen Browser** - Latest version
2. **Sine Mod Manager** - Download from [Sine releases](https://github.com/CosmoCreeper/Sine/releases)

### Setup Steps

1. Install Sine mod manager following their documentation
2. Open Zen Browser and go to `about:preferences#sineMods`
3. Install "Zen Sidepanels" from the mod store
4. Restart Zen Browser when prompted

> **Note**: You may need to clear your startup cache at `about:support` if Sine doesn't appear in preferences.

## Usage

### Opening the Sidebar

- **Keyboard Shortcut**: `Ctrl+Shift+E`
- **Context Menu**: Right-click on any tab and select "Toggle Sidepanels"

### Loading Web Content

1. Open the sidebar using any method above
2. Enter a URL in the input field at the top
3. Press Enter or click "Go" to load the website
4. The website will display in the sidebar panel

### Closing the Sidebar

- Click the "×" button in the sidebar header
- Use the keyboard shortcut again (`Ctrl+Shift+E`)
- Select "Toggle Sidepanels" from the context menu

## Customization

The sidebar uses Zen Browser's native CSS variables for consistent theming:

- `--zen-colors-primary` - Primary background
- `--zen-colors-secondary` - Secondary background  
- `--zen-colors-tertiary` - Header background
- `--zen-colors-border` - Border colors
- `--zen-primary-color` - Accent color

You can customize the appearance by modifying the `userChrome.css` file.

## Technical Details

- **Architecture**: Single-class implementation following Advanced-Tab-Groups pattern
- **Integration**: Uses Zen Browser's XUL/CSS system for native integration  
- **Web Rendering**: Utilizes Firefox's `browser` element for web content
- **Responsive**: CSS media queries for different screen sizes

## Compatibility

- **Zen Browser**: Latest version
- **Sine**: Compatible with current Sine mod manager
- **Platform**: Windows, macOS, Linux (wherever Zen Browser runs)

## Development

### Project Structure

```
zen-sidepanels/
├── zen-sidepanels.uc.js    # Main JavaScript implementation
├── userChrome.css          # CSS styling
├── theme.json              # Sine mod configuration
├── preferences.json        # Preference definitions
└── README.md              # This file
```

### Building

No build process required - the mod works directly with the source files.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Zen Browser and Sine
5. Submit a pull request

## Issues

If you encounter problems:

1. Check the Browser Console (Ctrl+Shift+J) for `[ZenSidepanels]` messages
2. Verify Sine is properly installed and working
3. Try restarting Zen Browser
4. Clear startup cache at `about:support`

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Zen Browser Team** - For the excellent browser
- **Sine Team** - For the mod manager system
- **Advanced Tab Groups** - For the architectural reference
- **Opera/Vivaldi** - For sidepanels inspiration