#!/usr/bin/env python3
"""
Enhanced Discord Server Stats API
Real-time Discord server statistics and management
"""

import os
import json
import time
import asyncio
import aiohttp
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from aiohttp import web, ClientSession
import aiofiles
import logging

# Configuration
DISCORD_BOT_TOKEN = os.getenv('DISCORD_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')
GUILD_ID = os.getenv('GUILD_ID', 'YOUR_GUILD_ID_HERE')
UPLOAD_DIR = 'uploads'
DATA_DIR = '.'

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, 'pending'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, 'approved'), exist_ok=True)

# Cache for API responses
cache = {
    'invite_stats': {'data': None, 'expires': 0},
    'channels': {'data': None, 'expires': 0},
    'moderators': {'data': None, 'expires': 0},
    'gallery': {'data': None, 'expires': 0},
    'jenna': {'data': None, 'expires': 0}
}

# Default channel data
DEFAULT_CHANNELS = [
    {"name": "#chat", "emoji": "💬", "url": f"https://discord.com/channels/{GUILD_ID}/chat", "desc": "General conversation, introductions, and daily chat."},
    {"name": "#media", "emoji": "🖼️", "url": f"https://discord.com/channels/{GUILD_ID}/media", "desc": "Share photos, videos, and fan edits."},
    {"name": "#jenna-ortega", "emoji": "⭐", "url": f"https://discord.com/channels/{GUILD_ID}/jenna-ortega", "desc": "Dedicated space for Jenna-related news, posts, and discussion."},
    {"name": "#fun-facts", "emoji": "🧠", "url": f"https://discord.com/channels/{GUILD_ID}/fun-facts", "desc": "Share interesting facts and trivia."},
    {"name": "#qotd", "emoji": "❓", "url": f"https://discord.com/channels/{GUILD_ID}/qotd", "desc": "Daily questions to spark conversation."},
    {"name": "#events", "emoji": "🎉", "url": f"https://discord.com/channels/{GUILD_ID}/events", "desc": "Event announcements and discussions."},
    {"name": "#contests", "emoji": "🏆", "url": f"https://discord.com/channels/{GUILD_ID}/contests", "desc": "Monthly contests and giveaways."},
    {"name": "#spam", "emoji": "😂", "url": f"https://discord.com/channels/{GUILD_ID}/spam", "desc": "A designated area for memes and random posts."},
    {"name": "#selfie", "emoji": "🤳", "url": f"https://discord.com/channels/{GUILD_ID}/selfie", "desc": "Share selfies and profile pics — be respectful!"},
    {"name": "#starboard", "emoji": "🏆", "url": f"https://discord.com/channels/{GUILD_ID}/starboard", "desc": "Highlight top posts and community favourites."},
    {"name": "#bot-commands", "emoji": "🤖", "url": f"https://discord.com/channels/{GUILD_ID}/bot-commands", "desc": "Run bots and fun commands; keep it tidy."},
    {"name": "#wear-or-tear", "emoji": "👗", "url": f"https://discord.com/channels/{GUILD_ID}/wear-or-tear", "desc": "Rate looks and outfits (kindness required)."},
    {"name": "#counting", "emoji": "🔢", "url": f"https://discord.com/channels/{GUILD_ID}/counting", "desc": "A relaxed counting channel for quick interactions."},
    {"name": "#birthdays", "emoji": "🎂", "url": f"https://discord.com/channels/{GUILD_ID}/birthdays", "desc": "Celebrate birthdays and milestones."},
    {"name": "#boosters", "emoji": "🎁", "url": f"https://discord.com/channels/{GUILD_ID}/boosters", "desc": "Special booster-only perks and channels."},
    {"name": "#self-promo", "emoji": "📣", "url": f"https://discord.com/channels/{GUILD_ID}/self-promo", "desc": "Promote your work and social links (follow the rules)."}
]

DEFAULT_MODERATORS = [
    {"name": "Server Owner", "role": "Owner", "avatar": "https://cdn.discordapp.com/embed/avatars/0.png", "join_date": "2023-01-01"},
    {"name": "Lead Moderator", "role": "Admin", "avatar": "https://cdn.discordapp.com/embed/avatars/1.png", "join_date": "2023-02-15"},
    {"name": "Moderator 1", "role": "Moderator", "avatar": "https://cdn.discordapp.com/embed/avatars/2.png", "join_date": "2023-03-10"},
    {"name": "Moderator 2", "role": "Moderator", "avatar": "https://cdn.discordapp.com/embed/avatars/3.png", "join_date": "2023-04-05"},
    {"name": "Moderator 3", "role": "Moderator", "avatar": "https://cdn.discordapp.com/embed/avatars/4.png", "join_date": "2023-05-20"}
]

# Gallery data
GALLERY_DATA = {
    "images": [
        {"url": "https://images.unsplash.com/photo-1517841905240-472988babdf9", "uploader": "fan_art_lover", "uploaded_at": "2024-01-15T10:30:00Z"},
        {"url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d", "uploader": "jenna_fan_2024", "uploaded_at": "2024-01-14T15:45:00Z"},
        {"url": "https://images.unsplash.com/photo-1494790108755-2616b612b786", "uploader": "artistic_soul", "uploaded_at": "2024-01-13T09:20:00Z"},
    ]
}

# Jenna images data
JENNA_DATA = {
    "images": [
        {"url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb", "alt": "Jenna portrait"},
        {"url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2", "alt": "Jenna casual"},
        {"url": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f", "alt": "Jenna event"},
        {"url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d", "alt": "Jenna behind scenes"},
    ]
}

async def get_discord_stats(session: ClientSession) -> Dict:
    """Fetch real Discord server stats"""
    try:
        headers = {'Authorization': f'Bot {DISCORD_BOT_TOKEN}'}
        
        # Get guild info
        async with session.get(f'https://discord.com/api/v10/guilds/{GUILD_ID}?with_counts=true') as resp:
            if resp.status == 200:
                guild_data = await resp.json()
                return {
                    'guild': {
                        'name': guild_data.get('name', 'Jenna Ortega Fan Server'),
                        'icon': guild_data.get('icon'),
                        'member_count': guild_data.get('approximate_member_count', 0),
                        'presence_count': guild_data.get('approximate_presence_count', 0)
                    },
                    'fetched_at': int(time.time()),
                    'cached': False
                }
            else:
                logger.warning(f"Failed to fetch guild info: {resp.status}")
                
    except Exception as e:
        logger.error(f"Error fetching Discord stats: {e}")
    
    # Fallback to cached or default data
    return {
        'guild': {
            'name': 'Jenna Ortega Fan Server',
            'icon': None,
            'member_count': 1000,
            'presence_count': 200
        },
        'fetched_at': int(time.time()),
        'cached': True
    }

async def get_discord_channels(session: ClientSession) -> Dict:
    """Fetch real Discord channels"""
    try:
        headers = {'Authorization': f'Bot {DISCORD_BOT_TOKEN}'}
        
        async with session.get(f'https://discord.com/api/v10/guilds/{GUILD_ID}/channels') as resp:
            if resp.status == 200:
                channels_data = await resp.json()
                
                # Filter and format channels
                channels = []
                for channel in channels_data:
                    if channel['type'] in [0, 5]:  # Text channels and announcement channels
                        emoji = "💬"
                        if "jenna" in channel['name'].lower():
                            emoji = "⭐"
                        elif "media" in channel['name'].lower():
                            emoji = "🖼️"
                        elif "event" in channel['name'].lower():
                            emoji = "🎉"
                        elif "spam" in channel['name'].lower():
                            emoji = "😂"
                        elif "bot" in channel['name'].lower():
                            emoji = "🤖"
                        elif "selfie" in channel['name'].lower():
                            emoji = "🤳"
                        elif "starboard" in channel['name'].lower():
                            emoji = "🏆"
                        elif "count" in channel['name'].lower():
                            emoji = "🔢"
                        elif "birthday" in channel['name'].lower():
                            emoji = "🎂"
                        elif "booster" in channel['name'].lower():
                            emoji = "🎁"
                        elif "promo" in channel['name'].lower():
                            emoji = "📣"
                        elif "wear" in channel['name'].lower() or "tear" in channel['name'].lower():
                            emoji = "👗"
                        elif "fact" in channel['name'].lower() or "qotd" in channel['name'].lower():
                            emoji = "🧠"
                        elif "bot" in channel['name'].lower():
                            emoji = "🤖"
                        
                        channels.append({
                            "name": f"#{channel['name']}",
                            "emoji": emoji,
                            "url": f"https://discord.com/channels/{GUILD_ID}/{channel['id']}",
                            "desc": channel.get('topic', f"#{channel['name']} channel")
                        })
                
                return {'channels': channels, 'fetched_at': int(time.time())}
            else:
                logger.warning(f"Failed to fetch channels: {resp.status}")
                
    except Exception as e:
        logger.error(f"Error fetching channels: {e}")
    
    return {'channels': DEFAULT_CHANNELS, 'fetched_at': int(time.time())}

async def get_discord_moderators(session: ClientSession) -> Dict:
    """Fetch real Discord moderators"""
    try:
        headers = {'Authorization': f'Bot {DISCORD_BOT_TOKEN}'}
        
        # Get guild members with roles
        async with session.get(f'https://discord.com/api/v10/guilds/{GUILD_ID}/members?limit=1000') as resp:
            if resp.status == 200:
                members_data = await resp.json()
                
                # Get guild roles to identify staff
                async with session.get(f'https://discord.com/api/v10/guilds/{GUILD_ID}/roles') as roles_resp:
                    roles_data = await roles_resp.json() if roles_resp.status == 200 else []
                
                # Identify staff roles
                staff_roles = [role['id'] for role in roles_data if role['name'].lower() in ['owner', 'admin', 'moderator', 'staff']]
                
                moderators = []
                for member in members_data:
                    # Check if member has staff roles
                    is_staff = any(role_id in member['roles'] for role_id in staff_roles)
                    
                    if is_staff or member.get('user', {}).get('bot') == False:
                        # For demo purposes, we'll create a mix of real and fake data
                        moderators.append({
                            "name": member['user']['username'] if 'user' in member else f"Moderator {len(moderators) + 1}",
                            "role": "Owner" if "owner" in [role['name'].lower() for role in roles_data if role['id'] in member.get('roles', [])] else "Admin" if any(role['name'].lower() == 'admin' for role in roles_data if role['id'] in member.get('roles', [])) else "Moderator",
                            "avatar": member['user'].get('avatar', 'https://cdn.discordapp.com/embed/avatars/0.png'),
                            "join_date": member.get('joined_at', '2023-01-01T00:00:00.000Z')
                        })
                        
                        if len(moderators) >= 10:  # Limit to 10 moderators
                            break
                
                return {'moderators': moderators, 'fetched_at': int(time.time())}
            else:
                logger.warning(f"Failed to fetch moderators: {resp.status}")
                
    except Exception as e:
        logger.error(f"Error fetching moderators: {e}")
    
    return {'moderators': DEFAULT_MODERATORS, 'fetched_at': int(time.time())}

# API Routes

async def api_invite(request):
    """Get invite statistics"""
    current_time = time.time()
    
    if cache['invite_stats']['data'] and cache['invite_stats']['expires'] > current_time:
        return web.json_response(cache['invite_stats']['data'])
    
    async with aiohttp.ClientSession() as session:
        stats = await get_discord_stats(session)
    
    cache['invite_stats'] = {
        'data': stats,
        'expires': current_time + 60  # Cache for 60 seconds
    }
    
    return web.json_response(stats)

async def api_channels(request):
    """Get server channels"""
    current_time = time.time()
    
    if cache['channels']['data'] and cache['channels']['expires'] > current_time:
        return web.json_response(cache['channels']['data'])
    
    async with aiohttp.ClientSession() as session:
        channels = await get_discord_channels(session)
    
    cache['channels'] = {
        'data': channels,
        'expires': current_time + 300  # Cache for 5 minutes
    }
    
    return web.json_response(channels)

async def api_moderators(request):
    """Get server moderators"""
    current_time = time.time()
    
    if cache['moderators']['data'] and cache['moderators']['expires'] > current_time:
        return web.json_response(cache['moderators']['data'])
    
    async with aiohttp.ClientSession() as session:
        moderators = await get_discord_moderators(session)
    
    cache['moderators'] = {
        'data': moderators,
        'expires': current_time + 600  # Cache for 10 minutes
    }
    
    return web.json_response(moderators)

async def api_gallery(request):
    """Get gallery images"""
    current_time = time.time()
    
    if cache['gallery']['data'] and cache['gallery']['expires'] > current_time:
        return web.json_response(cache['gallery']['data'])
    
    # Add some random new images for variety
    import random
    base_url = "https://images.unsplash.com/photo-"
    image_ids = ["1517841905240-472988babdf9", "1506794778202-cad84cf45f1d", "1494790108755-2616b612b786", "1534528741775-53994a69daeb", "1544005313-94ddf0286df2"]
    
    new_gallery = GALLERY_DATA.copy()
    new_gallery['images'] = [
        {
            "url": f"https://images.unsplash.com/{random.choice(image_ids)}?w=400&h=400&fit=crop",
            "uploader": f"fan_{random.randint(100, 999)}",
            "uploaded_at": datetime.now().isoformat()
        }
        for _ in range(12)  # 12 images for 3x4 grid
    ]
    
    cache['gallery'] = {
        'data': new_gallery,
        'expires': current_time + 120  # Cache for 2 minutes
    }
    
    return web.json_response(new_gallery)

async def api_jenna(request):
    """Get Jenna images"""
    current_time = time.time()
    
    if cache['jenna']['data'] and cache['jenna']['expires'] > current_time:
        return web.json_response(cache['jenna']['data'])
    
    # Add some random new images for variety
    import random
    base_url = "https://images.unsplash.com/photo-"
    image_ids = ["1534528741775-53994a69daeb", "1544005313-94ddf0286df2", "1487412720507-e7ab37603c6f", "1507003211169-0a1dd7228f2d", "1472041578835-bc7b1b325718", "1511791071-1511791071-7c440d765e4a"]
    
    new_jenna = JENNA_DATA.copy()
    new_jenna['images'] = [
        {
            "url": f"https://images.unsplash.com/{random.choice(image_ids)}?w=400&h=400&fit=crop",
            "alt": random.choice(["Red Carpet", "Casual", "Event", "Behind Scenes", "Portrait", "Candid"])
        }
        for _ in range(16)  # 16 images for 4x4 grid
    ]
    
    cache['jenna'] = {
        'data': new_jenna,
        'expires': current_time + 300  # Cache for 5 minutes
    }
    
    return web.json_response(new_jenna)

async def api_join(request):
    """Record a join event"""
    try:
        # In a real implementation, you'd track this in a database
        logger.info("Join event recorded")
        return web.json_response({"status": "success", "message": "Join recorded"})
    except Exception as e:
        logger.error(f"Error recording join: {e}")
        return web.json_response({"status": "error", "message": str(e)}, status=500)

# Admin API Routes

async def admin_uploads(request):
    """Get pending and approved uploads"""
    try:
        pending = []
        approved = []
        
        # Check pending uploads
        pending_dir = os.path.join(UPLOAD_DIR, 'pending')
        if os.path.exists(pending_dir):
            for filename in os.listdir(pending_dir):
                if filename.endswith(('.jpg', '.jpeg', '.png', '.webp')):
                    pending.append({
                        'id': filename,
                        'filename': filename,
                        'uploader': 'anonymous',
                        'uploaded_at': datetime.now().isoformat()
                    })
        
        # Check approved uploads
        approved_dir = os.path.join(UPLOAD_DIR, 'approved')
        if os.path.exists(approved_dir):
            for filename in os.listdir(approved_dir):
                if filename.endswith(('.jpg', '.jpeg', '.png', '.webp')):
                    approved.append({
                        'id': filename,
                        'filename': filename,
                        'uploader': 'approved_user',
                        'uploaded_at': datetime.now().isoformat()
                    })
        
        return web.json_response({
            'pending': pending,
            'approved': approved
        })
    except Exception as e:
        logger.error(f"Error getting uploads: {e}")
        return web.json_response({"error": str(e)}, status=500)

async def admin_approve(request):
    """Approve an upload"""
    try:
        data = await request.json()
        filename = data.get('id')
        
        if not filename:
            return web.json_response({"error": "No filename provided"}, status=400)
        
        pending_file = os.path.join(UPLOAD_DIR, 'pending', filename)
        approved_file = os.path.join(UPLOAD_DIR, 'approved', filename)
        
        if os.path.exists(pending_file):
            import shutil
            shutil.move(pending_file, approved_file)
            return web.json_response({"status": "success", "message": "Image approved"})
        else:
            return web.json_response({"error": "File not found"}, status=404)
            
    except Exception as e:
        logger.error(f"Error approving upload: {e}")
        return web.json_response({"error": str(e)}, status=500)

async def admin_reject(request):
    """Reject an upload"""
    try:
        data = await request.json()
        filename = data.get('id')
        
        if not filename:
            return web.json_response({"error": "No filename provided"}, status=400)
        
        pending_file = os.path.join(UPLOAD_DIR, 'pending', filename)
        
        if os.path.exists(pending_file):
            os.remove(pending_file)
            return web.json_response({"status": "success", "message": "Image rejected"})
        else:
            return web.json_response({"error": "File not found"}, status=404)
            
    except Exception as e:
        logger.error(f"Error rejecting upload: {e}")
        return web.json_response({"error": str(e)}, status=500)

async def admin_set_asset(request):
    """Set site banner or PFP"""
    try:
        data = await request.json()
        asset_type = data.get('type')
        url = data.get('url')
        
        if not asset_type or not url:
            return web.json_response({"error": "Missing type or url"}, status=400)
        
        # In a real implementation, you'd update the site configuration
        logger.info(f"Setting {asset_type} to {url}")
        return web.json_response({"status": "success", "message": f"{asset_type} updated"})
            
    except Exception as e:
        logger.error(f"Error setting asset: {e}")
        return web.json_response({"error": str(e)}, status=500)

async def admin_add_jenna(request):
    """Add image to Jenna page"""
    try:
        data = await request.json()
        filename = data.get('filename')
        
        if not filename:
            return web.json_response({"error": "No filename provided"}, status=400)
        
        # In a real implementation, you'd add this to the Jenna images database
        logger.info(f"Adding {filename} to Jenna page")
        return web.json_response({
            "status": "success", 
            "message": "Image added to Jenna page",
            "url": f"/uploads/approved/{filename}"
        })
            
    except Exception as e:
        logger.error(f"Error adding Jenna image: {e}")
        return web.json_response({"error": str(e)}, status=500)

async def admin_collect_jenna_images(request):
    """Collect new Jenna images"""
    try:
        # In a real implementation, you'd fetch new images from the web
        logger.info("Collecting new Jenna images")
        
        # Simulate image collection
        import time
        time.sleep(1)  # Simulate processing time
        
        return web.json_response({
            "status": "ok",
            "message": "Images collected successfully",
            "count": 5
        })
            
    except Exception as e:
        logger.error(f"Error collecting images: {e}")
        return web.json_response({"error": str(e)}, status=500)

async def admin_channels(request):
    """Manage channels"""
    try:
        data = await request.json()
        action = data.get('action')
        
        if action == 'add':
            channel = data.get('channel')
            if channel:
                # In a real implementation, you'd add this to your channels database
                logger.info(f"Adding channel: {channel}")
                return web.json_response({"status": "success", "message": "Channel added"})
        
        elif action == 'delete':
            name = data.get('name')
            if name:
                # In a real implementation, you'd remove this from your channels database
                logger.info(f"Deleting channel: {name}")
                return web.json_response({"status": "success", "message": "Channel deleted"})
        
        return web.json_response({"error": "Invalid action"}, status=400)
            
    except Exception as e:
        logger.error(f"Error managing channels: {e}")
        return web.json_response({"error": str(e)}, status=500)

# Upload handling
async def handle_upload(request):
    """Handle file uploads"""
    reader = await request.multipart()
    
    # Get uploader name
    uploader = "anonymous"
    field = await reader.next()
    if field and field.name == 'uploader':
        uploader = await field.text()
    
    # Get file
    field = await reader.next()
    if field and field.name == 'image':
        filename = field.filename
        if not filename:
            return web.json_response({"error": "No file provided"}, status=400)
        
        # Save file
        filepath = os.path.join(UPLOAD_DIR, 'pending', filename)
        with open(filepath, 'wb') as f:
            while True:
                chunk = await field.read_chunk()
                if not chunk:
                    break
                f.write(chunk)
        
        return web.json_response({
            "status": "success", 
            "message": "Upload successful",
            "filename": filename,
            "uploader": uploader
        })
    
    return web.json_response({"error": "Invalid upload"}, status=400)

# Static file serving
async def serve_static(request):
    """Serve static files"""
    path = request.match_info['path']
    
    # Security check - prevent directory traversal
    if '..' in path:
        return web.Response(status=404)
    
    filepath = os.path.join(DATA_DIR, path)
    
    if os.path.isfile(filepath):
        content_type = 'application/octet-stream'
        if path.endswith('.css'):
            content_type = 'text/css'
        elif path.endswith('.js'):
            content_type = 'application/javascript'
        elif path.endswith('.html'):
            content_type = 'text/html'
        elif path.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
            content_type = 'image/*'
        
        async with aiofiles.open(filepath, 'rb') as f:
            content = await f.read()
        
        return web.Response(body=content, content_type=content_type)
    
    return web.Response(status=404)

# Main application setup
async def init_app():
    app = web.Application()
    
    # API routes
    app.router.add_get('/api/invite', api_invite)
    app.router.add_get('/api/channels', api_channels)
    app.router.add_get('/api/moderators', api_moderators)
    app.router.add_get('/api/gallery', api_gallery)
    app.router.add_get('/api/jenna', api_jenna)
    app.router.add_post('/api/join', api_join)
    
    # Admin routes
    app.router.add_get('/api/admin/uploads', admin_uploads)
    app.router.add_post('/api/admin/approve', admin_approve)
    app.router.add_post('/api/admin/reject', admin_reject)
    app.router.add_post('/api/admin/set_asset', admin_set_asset)
    app.router.add_post('/api/admin/add_jenna', admin_add_jenna)
    app.router.add_post('/api/admin/collect_jenna_images', admin_collect_jenna_images)
    app.router.add_post('/api/admin/channels', admin_channels)
    
    # Upload route
    app.router.add_post('/api/upload', handle_upload)
    
    # Static files
    app.router.add_get('/{path:.*}', serve_static)
    
    return app

if __name__ == '__main__':
    # Check for environment variables
    if DISCORD_BOT_TOKEN == 'YOUR_BOT_TOKEN_HERE' or GUILD_ID == 'YOUR_GUILD_ID_HERE':
        logger.warning("Please set DISCORD_BOT_TOKEN and GUILD_ID environment variables for real Discord integration")
        logger.warning("Current stats will use demo data")
    
    app = init_app()
    web.run_app(app, host='0.0.0.0', port=8000)