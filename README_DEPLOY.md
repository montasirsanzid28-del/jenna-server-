# Jenna Ortega Fan Server Website

A vibrant, modern Discord fan server website with real-time server statistics and interactive features.

## 🚀 Features

### Frontend Features
- **Real-time Discord Stats**: Live member count, online users, and server information
- **Interactive Gallery**: Fan art upload and display system with filtering
- **Jenna Image Collection**: Auto-collected images with categorization
- **Channel Browser**: Organized view of Discord server channels
- **Event Calendar**: Upcoming events and activities
- **Responsive Design**: Mobile-friendly with modern animations
- **Dark/Light Theme**: User preference with automatic detection

### Backend Features
- **Discord API Integration**: Real-time server statistics
- **File Upload System**: Gallery image management with moderation
- **Admin Panel**: Complete server management interface
- **Caching System**: Optimized performance with intelligent caching
- **Security**: Input validation and directory traversal protection

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.8+
- Discord Bot Token
- Discord Server ID (Guild ID)

### 1. Environment Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd website

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Discord Bot Setup

1. **Create a Discord Bot**:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Add a bot to your application
   - Copy the bot token

2. **Invite Bot to Server**:
   - Use OAuth2 URL generator
   - Select `bot` scope
   - Required permissions: `View Channels`, `Read Messages/View Channels`, `View Guild Insights`

3. **Get Server ID**:
   - Enable Developer Mode in Discord
   - Right-click your server → Copy ID

### 3. Configuration

Create a `.env` file in the project root:

```env
DISCORD_BOT_TOKEN=your_bot_token_here
GUILD_ID=your_server_id_here
```

### 4. Run the Server

```bash
# Development server
python dev.py

# Or with environment variables
DISCORD_BOT_TOKEN=your_token GUILD_ID=your_id python dev.py
```

The server will start on `http://localhost:8000`

### 5. Production Deployment

#### Using Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

CMD ["python", "dev.py"]
```

#### Using Heroku

1. Create `Procfile`:
```
web: python dev.py
```

2. Deploy to Heroku with environment variables set

#### Using Railway/Render

1. Connect your GitHub repository
2. Set environment variables in the dashboard
3. Deploy automatically

## 📁 Project Structure

```
website/
├── dev.py              # Main backend server
├── requirements.txt    # Python dependencies
├── index.html          # Homepage
├── style.css           # Enhanced CSS styles
├── script.js           # Frontend JavaScript
├── about.html          # About page
├── rules.html          # Server rules
├── gallery.html        # Fan gallery
├── jenna.html          # Jenna images
├── channels.html       # Channel browser
├── events.html         # Events page
├── admin.html          # Admin panel
├── assets/             # Static assets
│   ├── server_banner.gif
│   ├── server_pfp.gif
│   └── jenna/
└── uploads/            # User uploads
    ├── pending/        # Pending moderation
    └── approved/       # Approved images
```

## 🔌 API Endpoints

### Public Endpoints
- `GET /api/invite` - Server statistics
- `GET /api/channels` - Channel list
- `GET /api/moderators` - Moderator information
- `GET /api/gallery` - Gallery images
- `GET /api/jenna` - Jenna images
- `POST /api/join` - Record join event
- `POST /api/upload` - Upload gallery image

### Admin Endpoints
- `GET /api/admin/uploads` - Pending uploads
- `POST /api/admin/approve` - Approve upload
- `POST /api/admin/reject` - Reject upload
- `POST /api/admin/set_asset` - Set site assets
- `POST /api/admin/add_jenna` - Add Jenna image
- `POST /api/admin/collect_jenna_images` - Collect images
- `POST /api/admin/channels` - Manage channels

## 🎨 Customization

### Colors and Theme
Edit `style.css` variables:
```css
:root {
  --color-pink: #ff6b9d;
  --color-purple: #a07cff;
  --color-blue: #4da6ff;
  /* ... more colors */
}
```

### Channel Configuration
Edit `dev.py` DEFAULT_CHANNELS array to customize channel list.

### Gallery Images
Replace images in `assets/jenna/` directory or modify the image URLs in the backend.

## 🔒 Security Notes

- Always use environment variables for sensitive data
- The bot requires minimal permissions
- File uploads are stored in a secure directory structure
- Input validation prevents directory traversal attacks

## 🐛 Troubleshooting

### Bot Not Responding
- Check bot token and guild ID
- Verify bot permissions in Discord
- Check server logs for errors

### Images Not Loading
- Ensure upload directories exist
- Check file permissions
- Verify image URLs in the database

### Caching Issues
- Clear browser cache
- Restart the server to clear in-memory cache
- Check cache expiration times in `dev.py`

## 📊 Performance

- **Caching**: API responses cached for optimal performance
- **Async**: Non-blocking I/O for better concurrency
- **Compression**: Static files served efficiently
- **CDN**: Consider using CDN for static assets in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Support

For issues and questions:
- Create a GitHub issue
- Check the troubleshooting section
- Review Discord bot permissions

---

**Note**: This website is fan-made and not affiliated with Jenna Ortega or her representatives.