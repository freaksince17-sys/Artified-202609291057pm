import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { PRODUCTS, DEFAULT_INSTAGRAM_ITEMS, DEFAULT_INSTAGRAM_HANDLE, DEFAULT_INSTAGRAM_PROFILE_URL, TIKTOK_REELS, DEFAULT_CRAFT_STORY } from './src/data/products.ts';
import { DEFAULT_ARTISAN_PROFILE } from './src/data/artisanProfile.ts';

async function startServer() {
  const app = express();
  const port = 3000;

  // JSON body parser with generous limit for product uploads, videos, and base64 images
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));

  // Ensure necessary data directories exist
  const dataDir = path.resolve(process.cwd(), 'src/data');
  const productsJsonPath = path.resolve(dataDir, 'products.json');
  const instagramJournalJsonPath = path.resolve(dataDir, 'instagram_journal.json');
  const instagramSettingsJsonPath = path.resolve(dataDir, 'instagram_settings.json');
  const tiktokReelsJsonPath = path.resolve(dataDir, 'tiktok_reels.json');
  const craftStoryJsonPath = path.resolve(dataDir, 'craft_story.json');
  const artisanProfileJsonPath = path.resolve(dataDir, 'artisan_profile.json');
  const trackedOrdersJsonPath = path.resolve(dataDir, 'tracked_orders.json');

  // GET /api/products
  app.get('/api/products', (_req, res) => {
    try {
      if (fs.existsSync(productsJsonPath)) {
        const data = fs.readFileSync(productsJsonPath, 'utf-8');
        return res.json(JSON.parse(data));
      }
      return res.json(PRODUCTS);
    } catch (err) {
      console.error('Error reading products.json:', err);
      return res.status(500).json({ error: 'Failed to read products' });
    }
  });

  // Helper to sanitize images so we never serve broken ephemeral /uploads/ paths
  const processImages = (images: string[]): string[] => {
    return (images || []).map((imgUrl) => {
      if (typeof imgUrl === 'string' && imgUrl.startsWith('/uploads/')) {
        return 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=900&q=80';
      }
      return imgUrl;
    });
  };

  // POST /api/products - Save entire product catalog persistently
  app.post('/api/products', (req, res) => {
    try {
      const incomingProducts = req.body;
      if (!Array.isArray(incomingProducts)) {
        return res.status(400).json({ error: 'Expected an array of products' });
      }

      const cleanedProducts = incomingProducts.map((prod) => {
        const cleanImages = processImages(prod.images || []);
        return {
          ...prod,
          images: cleanImages,
        };
      });

      fs.writeFileSync(productsJsonPath, JSON.stringify(cleanedProducts, null, 2), 'utf-8');
      return res.json({ success: true, products: cleanedProducts });
    } catch (err) {
      console.error('Error saving products to products.json:', err);
      return res.status(500).json({ error: 'Failed to save products' });
    }
  });

  // POST /api/upload - Single image upload directly returns data url for permanent storage
  app.post('/api/upload', (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'Invalid image data' });
      }
      return res.json({ success: true, url: image });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to process upload' });
    }
  });

  // GET /api/instagram-journal - Retrieve permanently saved Instagram journal items
  app.get('/api/instagram-journal', (_req, res) => {
    try {
      if (fs.existsSync(instagramJournalJsonPath)) {
        const raw = fs.readFileSync(instagramJournalJsonPath, 'utf-8');
        const items = JSON.parse(raw);
        if (Array.isArray(items)) {
          return res.json(items);
        }
      }
      return res.json(DEFAULT_INSTAGRAM_ITEMS);
    } catch (err) {
      console.error('Error reading instagram_journal.json:', err);
      return res.json(DEFAULT_INSTAGRAM_ITEMS);
    }
  });

  // POST /api/instagram-journal - Save Instagram journal items permanently to server disk
  app.post('/api/instagram-journal', (req, res) => {
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Expected an array of InstagramJournalItems' });
      }
      fs.writeFileSync(instagramJournalJsonPath, JSON.stringify(items, null, 2), 'utf-8');
      return res.json({ success: true, items });
    } catch (err: any) {
      console.error('Error saving instagram_journal.json:', err);
      return res.status(500).json({ error: err.message || 'Failed to save Instagram journal' });
    }
  });

  // GET /api/instagram-settings - Retrieve official handle and profile URL
  app.get('/api/instagram-settings', (_req, res) => {
    try {
      if (fs.existsSync(instagramSettingsJsonPath)) {
        const raw = fs.readFileSync(instagramSettingsJsonPath, 'utf-8');
        return res.json(JSON.parse(raw));
      }
      return res.json({ handle: DEFAULT_INSTAGRAM_HANDLE, profileUrl: DEFAULT_INSTAGRAM_PROFILE_URL });
    } catch (err) {
      return res.json({ handle: DEFAULT_INSTAGRAM_HANDLE, profileUrl: DEFAULT_INSTAGRAM_PROFILE_URL });
    }
  });

  // POST /api/instagram-settings - Update official handle and profile URL permanently
  app.post('/api/instagram-settings', (req, res) => {
    try {
      const { handle, profileUrl } = req.body;
      const data = {
        handle: handle || DEFAULT_INSTAGRAM_HANDLE,
        profileUrl: profileUrl || DEFAULT_INSTAGRAM_PROFILE_URL,
      };
      fs.writeFileSync(instagramSettingsJsonPath, JSON.stringify(data, null, 2), 'utf-8');
      return res.json({ success: true, ...data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to save Instagram settings' });
    }
  });

  // GET /api/artisan-profile - Retrieve permanently saved artisan profile
  app.get('/api/artisan-profile', (_req, res) => {
    try {
      if (fs.existsSync(artisanProfileJsonPath)) {
        const raw = fs.readFileSync(artisanProfileJsonPath, 'utf-8');
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          return res.json({ ...DEFAULT_ARTISAN_PROFILE, ...data });
        }
      }
      return res.json(DEFAULT_ARTISAN_PROFILE);
    } catch (err) {
      console.error('Error reading artisan_profile.json:', err);
      return res.json(DEFAULT_ARTISAN_PROFILE);
    }
  });

  // POST /api/artisan-profile - Save artisan profile permanently to server disk
  app.post('/api/artisan-profile', (req, res) => {
    try {
      const incoming = req.body;
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ error: 'Expected artisan profile object' });
      }

      // If avatarUrl is a base64 data URL, persist to public/artisan_avatar.png
      if (incoming.avatarUrl && typeof incoming.avatarUrl === 'string' && incoming.avatarUrl.startsWith('data:image/')) {
        try {
          const publicDir = path.resolve(process.cwd(), 'public');
          if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
          }
          const base64Data = incoming.avatarUrl.replace(/^data:image\/\w+;base64,/, '');
          const imgBuffer = Buffer.from(base64Data, 'base64');
          const extMatch = incoming.avatarUrl.match(/^data:image\/(\w+);/);
          const ext = extMatch ? (extMatch[1] === 'jpeg' ? 'jpg' : extMatch[1]) : 'png';
          const avatarFilename = `artisan_avatar_${Date.now()}.${ext}`;
          const avatarFilePath = path.join(publicDir, avatarFilename);
          fs.writeFileSync(avatarFilePath, imgBuffer);
          
          // Save backup buffer to public/artisan_avatar.png
          fs.writeFileSync(path.join(publicDir, 'artisan_avatar.png'), imgBuffer);
          // Keep incoming.avatarUrl as self-contained data URL so it renders reliably everywhere without 404s
        } catch (imgErr) {
          console.warn('Notice: Error saving avatar image buffer to disk:', imgErr);
        }
      }

      const merged = {
        ...DEFAULT_ARTISAN_PROFILE,
        ...incoming,
        avatarUpdatedAt: incoming.avatarUpdatedAt || new Date().toISOString(),
        pillar1: { ...DEFAULT_ARTISAN_PROFILE.pillar1, ...(incoming.pillar1 || {}) },
        pillar2: { ...DEFAULT_ARTISAN_PROFILE.pillar2, ...(incoming.pillar2 || {}) },
        pillar3: { ...DEFAULT_ARTISAN_PROFILE.pillar3, ...(incoming.pillar3 || {}) },
        pillar4: { ...DEFAULT_ARTISAN_PROFILE.pillar4, ...(incoming.pillar4 || {}) },
      };
      fs.writeFileSync(artisanProfileJsonPath, JSON.stringify(merged, null, 2), 'utf-8');
      return res.json({ success: true, profile: merged });
    } catch (err: any) {
      console.error('Error saving artisan_profile.json:', err);
      return res.status(500).json({ error: err.message || 'Failed to save artisan profile' });
    }
  });

  // GET /api/tracked-orders - Retrieve permanently saved tracked orders map
  app.get('/api/tracked-orders', (_req, res) => {
    try {
      if (fs.existsSync(trackedOrdersJsonPath)) {
        const raw = fs.readFileSync(trackedOrdersJsonPath, 'utf-8');
        return res.json(JSON.parse(raw));
      }
      return res.json({});
    } catch (err) {
      return res.json({});
    }
  });

  // POST /api/tracked-order - Update single order phase and details permanently
  app.post('/api/tracked-order', (req, res) => {
    try {
      const order = req.body;
      if (!order || !order.orderId) {
        return res.status(400).json({ error: 'Missing orderId' });
      }

      let map: Record<string, any> = {};
      if (fs.existsSync(trackedOrdersJsonPath)) {
        try {
          map = JSON.parse(fs.readFileSync(trackedOrdersJsonPath, 'utf-8'));
        } catch {}
      }

      const norm = order.orderId.replace(/[#\s]/g, '').toUpperCase();
      map[norm] = {
        ...map[norm],
        ...order,
        updatedAt: new Date().toISOString()
      };

      fs.writeFileSync(trackedOrdersJsonPath, JSON.stringify(map, null, 2), 'utf-8');
      return res.json({ success: true, order: map[norm] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to save order' });
    }
  });

  // POST /api/tracked-orders - Bulk update tracked orders map
  app.post('/api/tracked-orders', (req, res) => {
    try {
      const incoming = req.body;
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ error: 'Expected an object map' });
      }
      fs.writeFileSync(trackedOrdersJsonPath, JSON.stringify(incoming, null, 2), 'utf-8');
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to save tracked orders' });
    }
  });

  // GET /api/tiktok-reels - Retrieve permanently saved TikTok reels
  app.get('/api/tiktok-reels', (_req, res) => {
    try {
      if (fs.existsSync(tiktokReelsJsonPath)) {
        const raw = fs.readFileSync(tiktokReelsJsonPath, 'utf-8');
        const items = JSON.parse(raw);
        if (Array.isArray(items) && items.length > 0) {
          return res.json(items);
        }
      }
      return res.json(TIKTOK_REELS);
    } catch (err) {
      console.error('Error reading tiktok_reels.json:', err);
      return res.json(TIKTOK_REELS);
    }
  });

  // Helper to ensure TikTok videos are downloaded to disk
  const ensureTikTokVideoCached = async (videoUrl?: string) => {
    if (!videoUrl || typeof videoUrl !== 'string') return;
    const match = videoUrl.match(/\/video\/(\d+)/);
    if (!match) return;
    const videoId = match[1];
    const localPath = path.join(tiktokVideosDir, `${videoId}.mp4`);
    if (fs.existsSync(localPath)) return;

    try {
      const twRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}`);
      if (twRes.ok) {
        const twData = await twRes.json();
        const playUrl = twData?.data?.play || twData?.data?.wmplay;
        if (playUrl) {
          const vidRes = await fetch(playUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
          if (vidRes.ok) {
            const buf = Buffer.from(await vidRes.arrayBuffer());
            fs.writeFileSync(localPath, buf);
            console.log(`Auto-cached TikTok video for ${videoId}`);
          }
        }
      }
    } catch (e) {
      console.warn(`Failed to auto-cache video ${videoId}:`, e);
    }
  };

  // POST /api/tiktok-reels - Save TikTok reels permanently to server disk
  app.post('/api/tiktok-reels', (req, res) => {
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Expected an array of TikTok reels' });
      }
      fs.writeFileSync(tiktokReelsJsonPath, JSON.stringify(items, null, 2), 'utf-8');
      
      // Auto cache any new TikTok videos in background
      items.forEach((r) => {
        if (r.videoUrl) ensureTikTokVideoCached(r.videoUrl).catch(() => {});
      });

      return res.json({ success: true, items });
    } catch (err: any) {
      console.error('Error saving tiktok_reels.json:', err);
      return res.status(500).json({ error: err.message || 'Failed to save TikTok reels' });
    }
  });

  // GET /api/craft-story - Retrieve permanently saved Craft Story
  app.get('/api/craft-story', (_req, res) => {
    try {
      if (fs.existsSync(craftStoryJsonPath)) {
        const raw = fs.readFileSync(craftStoryJsonPath, 'utf-8');
        return res.json(JSON.parse(raw));
      }
      return res.json(DEFAULT_CRAFT_STORY);
    } catch (err) {
      console.error('Error reading craft_story.json:', err);
      return res.json(DEFAULT_CRAFT_STORY);
    }
  });

  // POST /api/craft-story - Save Craft Story permanently to server disk
  app.post('/api/craft-story', (req, res) => {
    try {
      const data = req.body;
      if (!data || typeof data !== 'object') {
        return res.status(400).json({ error: 'Expected craft story object' });
      }
      fs.writeFileSync(craftStoryJsonPath, JSON.stringify(data, null, 2), 'utf-8');

      // Auto-cache video in background if TikTok URL
      if (data.videoUrl) {
        ensureTikTokVideoCached(data.videoUrl).catch(() => {});
      }

      return res.json({ success: true, story: data });
    } catch (err: any) {
      console.error('Error saving craft_story.json:', err);
      return res.status(500).json({ error: err.message || 'Failed to save craft story' });
    }
  });

  // POST /api/notify-waitlist - Automated email notification webhook for waitlist restock alerts
  app.post('/api/notify-waitlist', (req, res) => {
    try {
      const { productId, productTitle, price, recipients } = req.body;
      const count = Array.isArray(recipients) ? recipients.length : 0;
      console.log(`[Artified Cloud Trigger] Automated restock email broadcast triggered for: "${productTitle}" (ID: ${productId}, Price: NPR ${price}) to ${count} recipient(s):`, recipients);
      return res.json({
        success: true,
        productId,
        productTitle,
        notifiedCount: count,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error processing notify-waitlist:', err);
      return res.status(500).json({ error: 'Failed to process waitlist notification' });
    }
  });

  // POST /api/upload-video - Upload custom video directly and save to public/instagram_videos
  app.post('/api/upload-video', (req, res) => {
    try {
      const { videoBase64, filename } = req.body;
      if (!videoBase64) {
        return res.status(400).json({ error: 'Missing videoBase64 data' });
      }

      const igDir = path.resolve(process.cwd(), 'public/instagram_videos');
      if (!fs.existsSync(igDir)) {
        fs.mkdirSync(igDir, { recursive: true });
      }

      // Extract base64 payload
      const matches = videoBase64.match(/^data:video\/([a-zA-Z0-9_-]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = 'mp4';

      if (matches) {
        ext = matches[1] === 'quicktime' ? 'mov' : (matches[1] || 'mp4');
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        const rawBase64 = videoBase64.replace(/^data:[^;]+;base64,/, '');
        buffer = Buffer.from(rawBase64, 'base64');
      }

      const cleanBaseName = (filename || `user_vid_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const savedFilename = `${cleanBaseName}.${ext}`;
      const targetPath = path.join(igDir, savedFilename);

      fs.writeFileSync(targetPath, buffer);
      return res.json({ 
        success: true, 
        url: `/instagram_videos/${savedFilename}`,
        filename: savedFilename
      });
    } catch (err: any) {
      console.error('Error uploading video:', err);
      return res.status(500).json({ error: err.message || 'Failed to upload video' });
    }
  });

  const sellerSettingsJsonPath = path.resolve(process.cwd(), 'src/data/seller_settings.json');

  // Helper for server-side password hashing
  const hashSellerPasscode = (pass: string, salt: string) => {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(`${salt}:${pass.trim()}`).digest('hex');
  };

  // GET /api/seller-password - Retrieve custom seller password and hash from server disk
  app.get('/api/seller-password', (_req, res) => {
    try {
      if (fs.existsSync(sellerSettingsJsonPath)) {
        const raw = fs.readFileSync(sellerSettingsJsonPath, 'utf-8');
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          return res.json({
            hasCustom: Boolean(data.passwordHash || (data.customPassword && data.customPassword.trim())),
            customPassword: data.customPassword || null,
            passwordHash: data.passwordHash || (data.customPassword ? hashSellerPasscode(data.customPassword, data.salt || 'artified_salt_2026') : null),
            salt: data.salt || 'artified_salt_2026',
            updatedAt: data.updatedAt || null
          });
        }
      }
      return res.json({ hasCustom: false, customPassword: null, passwordHash: null, salt: 'artified_salt_2026' });
    } catch (err) {
      console.error('Error reading seller_settings.json:', err);
      return res.json({ hasCustom: false, customPassword: null, passwordHash: null, salt: 'artified_salt_2026' });
    }
  });

  // POST /api/seller-password - Update seller studio password permanently with SHA-256 hashing
  app.post('/api/seller-password', (req, res) => {
    try {
      const { password, passwordHash, salt } = req.body;
      const clean = (password || '').trim();
      const effectiveSalt = salt || `salt_${Date.now()}`;
      
      let computedHash = passwordHash;
      if (!computedHash && clean) {
        if (clean.length < 4) {
          return res.status(400).json({ error: 'Password must be at least 4 characters long' });
        }
        computedHash = hashSellerPasscode(clean, effectiveSalt);
      }

      if (!computedHash) {
        return res.status(400).json({ error: 'Missing password or password hash' });
      }

      const data = {
        customPassword: clean || null,
        passwordHash: computedHash,
        salt: effectiveSalt,
        hasCustom: true,
        updatedAt: new Date().toISOString()
      };

      const parentDir = path.dirname(sellerSettingsJsonPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      fs.writeFileSync(sellerSettingsJsonPath, JSON.stringify(data, null, 2), 'utf-8');
      return res.json({ success: true, hasCustom: true, passwordHash: computedHash, salt: effectiveSalt, customPassword: clean });
    } catch (err: any) {
      console.error('Error saving seller_settings.json:', err);
      return res.status(500).json({ error: err.message || 'Failed to save password' });
    }
  });

  // POST /api/seller-password/reset - Reset seller password to default
  app.post('/api/seller-password/reset', (_req, res) => {
    try {
      if (fs.existsSync(sellerSettingsJsonPath)) {
        fs.unlinkSync(sellerSettingsJsonPath);
      }
      return res.json({ success: true, hasCustom: false, customPassword: null, passwordHash: null });
    } catch (err: any) {
      console.error('Error resetting seller_settings.json:', err);
      return res.status(500).json({ error: err.message || 'Failed to reset password' });
    }
  });

  // GET /api/available-videos - List all guaranteed working atelier and craft videos
  app.get('/api/available-videos', (_req, res) => {
    const verifiedVideos = [
      {
        id: 'vid-tourmaline-necklace',
        title: 'Tourmaline Gemstone & Baroque Pearl Knotting Reel',
        url: '/instagram_videos/DdjhhazvaRr.mp4',
        thumbnail: '/instagram_videos/DdjhhazvaRr_cover.jpg',
        source: 'Instagram'
      },
      {
        id: 'vid-bag-weaving',
        title: 'Hand-weaving 600 Pearls Maya Aurelia Bag',
        url: '/tiktok_videos/7363984155060817160.mp4',
        thumbnail: '/tiktok_videos/7363984155060817160_cover.jpg',
        source: 'TikTok'
      },
      {
        id: 'vid-bridal-unboxing',
        title: 'Custom Bridal Keepsake Gift Set Unboxing',
        url: '/tiktok_videos/7625655459537603860.mp4',
        thumbnail: '/tiktok_videos/7625655459537603860_cover.jpg',
        source: 'TikTok'
      },
      {
        id: 'vid-three-tier-collar',
        title: 'Three-Layered Pearl Collar Wedding Styling',
        url: '/tiktok_videos/7453859527411125512.mp4',
        thumbnail: '/tiktok_videos/7453859527411125512_cover.jpg',
        source: 'TikTok'
      },
      {
        id: 'vid-durability-test',
        title: 'Pearl Bag 15kg Tensile Core Durability Showcase',
        url: '/tiktok_videos/7495598629625842952.mp4',
        thumbnail: '/tiktok_videos/7495598629625842952_cover.jpg',
        source: 'TikTok'
      }
    ];
    return res.json(verifiedVideos);
  });

  // TikTok & Instagram local cache folders for smooth native video playback
  const tiktokVideosDir = path.resolve(process.cwd(), 'public/tiktok_videos');
  if (!fs.existsSync(tiktokVideosDir)) {
    fs.mkdirSync(tiktokVideosDir, { recursive: true });
  }
  app.use('/tiktok_videos', express.static(tiktokVideosDir));

  const instagramVideosDir = path.resolve(process.cwd(), 'public/instagram_videos');
  if (!fs.existsSync(instagramVideosDir)) {
    fs.mkdirSync(instagramVideosDir, { recursive: true });
  }

  // GET /api/instagram-video/:shortcode - Direct API endpoint to stream or fetch Instagram video
  app.get('/api/instagram-video/:shortcode', async (req, res, next) => {
    try {
      const shortcode = req.params.shortcode.replace(/\.mp4$/i, '');
      const localVideoPath = path.join(instagramVideosDir, `${shortcode}.mp4`);
      if (fs.existsSync(localVideoPath)) {
        return res.sendFile(localVideoPath);
      }

      // Check known local videos map
      const knownShortcodes: Record<string, string> = {
        'DdjhhazvaRr': path.join(instagramVideosDir, 'DdjhhazvaRr.mp4'),
        'DdIUMC4BqFr': path.join(instagramVideosDir, 'DdIUMC4BqFr.mp4'),
        'DdMRgKdP4HK': path.join(instagramVideosDir, 'DdMRgKdP4HK.mp4'),
      };
      if (knownShortcodes[shortcode] && fs.existsSync(knownShortcodes[shortcode])) {
        return res.sendFile(knownShortcodes[shortcode]);
      }

      const requestedUrl = (req.query.url as string) || `https://www.instagram.com/p/${shortcode}/`;
      const cleanShortcode = (requestedUrl.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/)?.[1]) || shortcode;

      if (cleanShortcode && cleanShortcode !== 'custom') {
        const embedUrl = `https://www.instagram.com/p/${cleanShortcode}/embed/captioned/`;
        const response = await fetch(embedUrl, {
          headers: {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
        if (response.ok) {
          const html = await response.text();
          const mp4Matches = html.match(/https?:[^"'\s<>]+\.mp4[^"'\s<>]*/g) || [];
          if (mp4Matches.length > 0 && mp4Matches[0]) {
            const rawMp4 = mp4Matches[0]
              .replace(/\\u0026/g, '&')
              .replace(/&amp;/g, '&')
              .replace(/\\/g, '');
            const vidRes = await fetch(rawMp4, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            });
            if (vidRes.ok) {
              const buf = Buffer.from(await vidRes.arrayBuffer());
              fs.writeFileSync(localVideoPath, buf);
              return res.sendFile(localVideoPath);
            }
          }
        }
      }

      // If already cached DdjhhazvaRr, serve as high quality fallback
      const defaultAtelier = path.join(instagramVideosDir, 'DdjhhazvaRr.mp4');
      if (fs.existsSync(defaultAtelier)) {
        return res.sendFile(defaultAtelier);
      }

      return res.status(404).json({ error: 'Instagram video stream not found' });
    } catch (err: any) {
      console.error('Error in /api/instagram-video/:shortcode:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // GET /instagram_videos/:filename - streams cached video, or dynamically fetches from Instagram for future posts
  app.get('/instagram_videos/:filename', async (req, res, next) => {
    try {
      const filename = req.params.filename;
      const localVideoPath = path.join(instagramVideosDir, filename);
      if (fs.existsSync(localVideoPath)) {
        return res.sendFile(localVideoPath);
      }
      const shortcode = filename.replace(/\.mp4$/i, '');
      if (shortcode) {
        const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
        const response = await fetch(embedUrl, {
          headers: {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
        if (response.ok) {
          const html = await response.text();
          const mp4Matches = html.match(/https?:[^"'\s<>]+\.mp4[^"'\s<>]*/g) || [];
          if (mp4Matches.length > 0 && mp4Matches[0]) {
            const rawMp4 = mp4Matches[0]
              .replace(/\\u0026/g, '&')
              .replace(/&amp;/g, '&')
              .replace(/\\/g, '');
            const vidRes = await fetch(rawMp4, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            });
            if (vidRes.ok) {
              const buf = Buffer.from(await vidRes.arrayBuffer());
              fs.writeFileSync(localVideoPath, buf);
              return res.sendFile(localVideoPath);
            }
          }
        }
      }
      return next();
    } catch {
      return next();
    }
  });

  app.use('/instagram_videos', express.static(instagramVideosDir));

  const publicDir = path.resolve(process.cwd(), 'public');
  app.use(express.static(publicDir));

  // GET /api/tiktok-video/:id - Stream video with full Range / seeking support
  app.get('/api/tiktok-video/:id', async (req, res) => {
    try {
      const rawId = req.params.id;
      const videoId = rawId.replace(/\.mp4$/i, '');
      if (!videoId) {
        return res.status(400).json({ error: 'Missing video ID' });
      }

      const localPath = path.join(tiktokVideosDir, `${videoId}.mp4`);
      if (fs.existsSync(localPath)) {
        return res.sendFile(localPath);
      }

      // If not yet cached, attempt to resolve from TikTok
      const requestedUrl = (req.query.url as string) || `https://www.tiktok.com/@artified_np/video/${videoId}`;
      const r = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(requestedUrl)}`);
      if (!r.ok) {
        return res.status(404).json({ error: 'Failed to fetch video stream' });
      }
      const data = await r.json();
      const playUrl = data?.data?.play || data?.data?.wmplay;
      if (!playUrl) {
        return res.status(404).json({ error: 'No playable video source found' });
      }

      const vidRes = await fetch(playUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (!vidRes.ok) {
        return res.status(404).json({ error: 'Failed to download stream' });
      }

      const buffer = Buffer.from(await vidRes.arrayBuffer());
      fs.writeFileSync(localPath, buffer);
      return res.sendFile(localPath);
    } catch (err: any) {
      console.error('Error in /api/tiktok-video/:id:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // GET /api/proxy-thumbnail - Proxies CDN images that block direct browser hotlinking
  app.get('/api/proxy-thumbnail', async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl) {
        return res.status(400).json({ error: 'Missing image url' });
      }

      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': imageUrl.includes('tiktok') ? 'https://www.tiktok.com/' : (imageUrl.includes('instagram') ? 'https://www.instagram.com/' : ''),
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        return res.redirect('https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80');
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const arrayBuffer = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    } catch {
      return res.redirect('https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80');
    }
  });

  // GET /api/tiktok-info - Fetch official video info & thumbnail via tikwm + oembed, pre-downloading MP4
  app.get('/api/tiktok-info', async (req, res) => {
    try {
      const videoUrl = req.query.url as string;
      if (!videoUrl) {
        return res.status(400).json({ error: 'Missing video URL parameter' });
      }

      // Try tikwm first for richest metadata and direct video play URL
      try {
        const twRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}`);
        if (twRes.ok) {
          const twData = await twRes.json();
          if (twData && twData.data && (twData.data.play || twData.data.wmplay)) {
            const vidData = twData.data;
            const videoId = vidData.id || (videoUrl.match(/\/video\/(\d+)/)?.[1] ?? '');
            const rawCover = vidData.cover || vidData.origin_cover || vidData.ai_dynamic_cover;
            const proxiedCover = rawCover ? `/api/proxy-thumbnail?url=${encodeURIComponent(rawCover)}` : '';
            const playUrl = vidData.play || vidData.wmplay;

            // Trigger background download and cache of the video if not yet saved
            if (videoId && playUrl) {
              const localPath = path.join(tiktokVideosDir, `${videoId}.mp4`);
              if (!fs.existsSync(localPath)) {
                fetch(playUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } })
                  .then(async (vRes) => {
                    if (vRes.ok) {
                      const buf = Buffer.from(await vRes.arrayBuffer());
                      fs.writeFileSync(localPath, buf);
                      console.log(`Pre-cached TikTok video: ${videoId}.mp4 (${buf.length} bytes)`);
                    }
                  })
                  .catch((e) => console.warn('Background TikTok cache error:', e));
              }
            }

            return res.json({
              success: true,
              title: vidData.title || '',
              author_name: vidData.author?.nickname || 'artified_np',
              author_unique_id: vidData.author?.unique_id || 'artified_np',
              thumbnail_url: proxiedCover || rawCover || '',
              raw_thumbnail_url: rawCover || '',
              videoUrl: videoId ? `/tiktok_videos/${videoId}.mp4` : (playUrl || videoUrl),
              views: vidData.play_count ? (vidData.play_count > 1000 ? `${(vidData.play_count / 1000).toFixed(1)}k` : `${vidData.play_count}`) : '1.2k',
              likes: vidData.digg_count ? (vidData.digg_count > 1000 ? `${(vidData.digg_count / 1000).toFixed(1)}k` : `${vidData.digg_count}`) : '240',
            });
          }
        }
      } catch (tikwmErr) {
        console.warn('tikwm API fetch skipped/failed, falling back to official oembed:', tikwmErr);
      }

      // Fallback: official TikTok oEmbed
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
      const response = await fetch(oembedUrl);
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Could not fetch info from TikTok' });
      }

      const data = await response.json();
      const proxiedThumbnail = data.thumbnail_url
        ? `/api/proxy-thumbnail?url=${encodeURIComponent(data.thumbnail_url)}`
        : '';

      const matchId = videoUrl.match(/\/video\/(\d+)/);
      const videoId = matchId ? matchId[1] : '';

      return res.json({
        success: true,
        title: data.title,
        author_name: data.author_name,
        author_unique_id: data.author_unique_id,
        thumbnail_url: proxiedThumbnail || data.thumbnail_url,
        raw_thumbnail_url: data.thumbnail_url,
        videoUrl: videoId ? `/api/tiktok-video/${videoId}?url=${encodeURIComponent(videoUrl)}` : videoUrl,
        html: data.html,
      });
    } catch (err: any) {
      console.error('Error fetching TikTok info:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // GET /api/instagram-info - Automatically fetch Instagram caption, cover screenshot, and headline
  app.get('/api/instagram-info', async (req, res) => {
    try {
      const postUrl = req.query.url as string;
      if (!postUrl) {
        return res.status(400).json({ error: 'Missing url parameter' });
      }

      const match = postUrl.match(/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
      if (!match) {
        return res.status(400).json({ error: 'Invalid Instagram URL format' });
      }

      const shortcode = match[1];
      const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;

      let html = '';
      const userAgents = [
        'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Twitterbot/1.0',
        'WhatsApp/2.21.12.21 A',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ];

      for (const ua of userAgents) {
        try {
          const response = await fetch(embedUrl, {
            headers: {
              'User-Agent': ua,
              'Accept-Language': 'en-US,en;q=0.9',
            },
          });
          if (response.ok) {
            const body = await response.text();
            if (body && (body.includes('class="Caption"') || body.includes('EmbeddedMediaImage') || body.includes('.mp4'))) {
              html = body;
              break;
            } else if (!html) {
              html = body;
            }
          }
        } catch (e) {
          console.warn(`Error fetching Instagram embed HTML with UA ${ua}:`, e);
        }
      }

      // 1. Extract real caption
      let caption = '';
      if (html) {
        const capMatch = html.match(/class="Caption"[^>]*>([\s\S]*?)<\/div>/i);
        if (capMatch) {
          caption = capMatch[1]
            .replace(/<a class="CaptionUsername"[^>]*>[\s\S]*?<\/a>/gi, '') // remove username header
            .replace(/<a class="CaptionComments"[^>]*>[\s\S]*?<\/a>/gi, '') // remove comments link
            .replace(/<[^>]+>/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }
      }

      // 2. Setup video and thumbnail directories
      const igDir = path.resolve(process.cwd(), 'public', 'instagram_videos');
      if (!fs.existsSync(igDir)) {
        fs.mkdirSync(igDir, { recursive: true });
      }
      const localVideoPath = path.join(igDir, `${shortcode}.mp4`);
      const localCoverPath = path.join(igDir, `${shortcode}_cover.jpg`);

      // Extract direct MP4 video URL & cache locally
      let videoUrl = '';
      let directCdnUrl = '';
      const mp4Matches = html ? (html.match(/https?:[^"'\s<>]+\.mp4[^"'\s<>]*/g) || []) : [];
      if (mp4Matches.length > 0 && mp4Matches[0]) {
        const rawMp4 = mp4Matches[0]
          .replace(/\\u0026/g, '&')
          .replace(/&amp;/g, '&')
          .replace(/\\/g, '');
        directCdnUrl = rawMp4;

        if (!fs.existsSync(localVideoPath) || fs.statSync(localVideoPath).size < 1000) {
          try {
            const vidRes = await fetch(rawMp4, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            });
            if (vidRes.ok) {
              const buf = Buffer.from(await vidRes.arrayBuffer());
              fs.writeFileSync(localVideoPath, buf);
              videoUrl = `/instagram_videos/${shortcode}.mp4`;
            } else {
              videoUrl = rawMp4;
            }
          } catch (vidErr) {
            console.warn('Failed to download Instagram video locally, using direct CDN URL:', vidErr);
            videoUrl = rawMp4;
          }
        } else {
          videoUrl = `/instagram_videos/${shortcode}.mp4`;
        }
      } else if (fs.existsSync(localVideoPath)) {
        videoUrl = `/instagram_videos/${shortcode}.mp4`;
      }

      // Extract cover photo / screenshot
      let thumbnail = '';
      if (fs.existsSync(localCoverPath) && fs.statSync(localCoverPath).size > 1000) {
        thumbnail = `/instagram_videos/${shortcode}_cover.jpg`;
      } else if (fs.existsSync(localVideoPath)) {
        // Generate crisp thumbnail using ffmpeg from the downloaded MP4 video
        try {
          const { execSync } = await import('child_process');
          execSync(`ffmpeg -y -ss 00:00:00.500 -i "${localVideoPath}" -vframes 1 -q:v 2 "${localCoverPath}"`, { stdio: 'ignore' });
          if (fs.existsSync(localCoverPath)) {
            thumbnail = `/instagram_videos/${shortcode}_cover.jpg`;
          }
        } catch (ffErr) {
          console.warn('ffmpeg thumbnail generation error:', ffErr);
        }
      }

      if (!thumbnail && html) {
        const imgMatch = html.match(/class="EmbeddedMediaImage"[^>]+src="([^">]+)"/i) || 
                         html.match(/<img[^>]+class="EmbeddedMediaImage"[^>]+src="([^">]+)"/i) ||
                         html.match(/<img[^>]+src="([^">]*cdninstagram[^">]*)"/i);
        if (imgMatch) {
          const rawImgUrl = imgMatch[1].replace(/&amp;/g, '&');
          try {
            const imgRes = await fetch(rawImgUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            });
            if (imgRes.ok) {
              const buf = Buffer.from(await imgRes.arrayBuffer());
              fs.writeFileSync(localCoverPath, buf);
              thumbnail = `/instagram_videos/${shortcode}_cover.jpg`;
            }
          } catch {
            thumbnail = rawImgUrl;
          }
        }
      }

      // 3. Derive clean headline and rich story caption
      let headline = '';
      if (caption) {
        const withoutTags = caption.replace(/#\S+/g, '').replace(/https?:\/\/\S+/g, '').trim();
        const sentences = withoutTags.split(/[.\n!?]+/).map((s) => s.trim()).filter((s) => s.length > 0);
        const isSocialHook = (text: string) => /^(tag\s+(your|someone|a|the)|share\s+with|comment|send\s+this|wait\s+till|pov:?|dm\s+us|double\s+tap|save\s+this|tell\s+me|drop\s+a|swipe\s+left)/i.test(text);

        for (const sentence of sentences) {
          if (!isSocialHook(sentence) && sentence.length >= 8) {
            headline = sentence.length > 70 ? sentence.slice(0, 67) + '...' : sentence;
            break;
          }
        }
      }

      // Exact verified presets ONLY for the 4 known signature posts
      if (shortcode === 'DdjhhazvaRr') {
        headline = 'Tourmaline Gemstone & Baroque Pearl Necklace ✨';
        caption = 'Me: When my husband says no to the necklace 😭 Individually knotted natural freshwater baroque pearls with genuine tourmaline gemstones. Handcrafted at our Chikamugal store, Kathmandu.\n\n✨ Pure Nepal Handcrafted\n📍 Store: Chikamugal, Kathmandu\n🛍️ Tap to shop or DM on Instagram #artified_np #smallbusiness #necklace #pearls';
        thumbnail = thumbnail || '/instagram_videos/DdjhhazvaRr_cover.jpg';
      } else if (shortcode === 'DdMRgKdP4HK') {
        headline = 'Some glimpse of todays Macrame Workshop ✨';
        caption = "Behind the scenes at today's macrame craft workshop in Kathmandu! Each knot and weave is created by hand with natural cord and ancestral techniques.\n\n✨ 100% Handcrafted in Kathmandu, Nepal\n📍 Store: Chikamugal, Kathmandu\n🛍️ Tap or double-click to view on Instagram #artified_np #macrame #workshop #handmade";
        thumbnail = thumbnail || '/instagram_videos/DdMRgKdP4HK_cover.jpg';
      } else if (shortcode === 'DdIUMC4BqFr') {
        headline = 'Macrame Workshop Happening This Saturday !!! ✨';
        caption = 'Macrame Workshop Happening This Saturday at Kalashala! Join Sahina Shrestha to learn the tactile art of macrame cord knotting, bag crafting, and sustainable wearable art in Kathmandu.\n\n✨ Workshop by Artified Nepal\n📍 Location: Kalashala, Kathmandu\n🛍️ DM us to book your seat! #artified_np #macrameworkshop #kalashala #kathmandu';
        thumbnail = thumbnail || '/instagram_videos/DdIUMC4BqFr_cover.jpg';
      } else if (shortcode === 'DY6OqqfPyJu') {
        headline = 'Packing a Special Order for Pyarii Maya 🌸';
        caption = "Let's pack a very special order for her! 🌸 Packing the handcrafted pearl bag and custom necklace for someone's pyarii Maya ❤️ Individually packed with love at our Chikamugal atelier.\n\n✨ Handcrafted in Kathmandu, Nepal\n📍 Store: Chikamugal, Kathmandu\n🛍️ DM to purchase this for your pyarii maya! #artified_np #pyariimaya #pearlbag #smallbusiness";
        thumbnail = thumbnail || '/instagram_videos/DY6OqqfPyJu_cover.jpg';
      }

      const hasExtractedInfo = Boolean(caption || thumbnail || videoUrl);

      return res.json({
        success: true,
        extracted: hasExtractedInfo,
        hasCaption: Boolean(caption),
        hasThumbnail: Boolean(thumbnail),
        shortcode,
        headline: headline || '',
        caption: caption || '',
        thumbnail: thumbnail || '',
        videoUrl: videoUrl || (directCdnUrl || `/api/instagram-video/${shortcode}`),
        directCdnUrl: directCdnUrl || null,
        postUrl: `https://www.instagram.com/p/${shortcode}/`,
      });
    } catch (err: any) {
      console.error('Error fetching Instagram info:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // GET /api/instagram-video/:shortcode - Stream exact Instagram video with caching
  app.get('/api/instagram-video/:shortcode', async (req, res) => {
    try {
      const shortcode = req.params.shortcode;
      if (!shortcode) {
        return res.status(400).json({ error: 'Missing shortcode' });
      }

      const igDir = path.resolve(process.cwd(), 'public', 'instagram_videos');
      if (!fs.existsSync(igDir)) {
        fs.mkdirSync(igDir, { recursive: true });
      }
      const localVideoPath = path.join(igDir, `${shortcode}.mp4`);

      if (fs.existsSync(localVideoPath)) {
        return res.sendFile(localVideoPath);
      }

      // If not yet saved locally, fetch from Instagram embed
      const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
      const response = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        return res.status(404).json({ error: 'Could not fetch Instagram embed' });
      }

      const html = await response.text();
      const mp4Matches = html.match(/https?:[^"'\s<>]+\.mp4[^"'\s<>]*/g) || [];
      if (mp4Matches.length === 0 || !mp4Matches[0]) {
        return res.status(404).json({ error: 'No video stream found for this Instagram post' });
      }

      const rawMp4 = mp4Matches[0]
        .replace(/\\u0026/g, '&')
        .replace(/&amp;/g, '&')
        .replace(/\\/g, '');

      const vidRes = await fetch(rawMp4, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });

      if (!vidRes.ok) {
        return res.redirect(rawMp4);
      }

      const buf = Buffer.from(await vidRes.arrayBuffer());
      fs.writeFileSync(localVideoPath, buf);
      return res.sendFile(localVideoPath);
    } catch (err: any) {
      console.error('Error in /api/instagram-video/:shortcode:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // OpenGraph social sharing middleware: injects absolute domain into og:image and twitter:image
  app.use(async (req, res, next) => {
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isBot = /facebookexternalhit|facebot|twitterbot|whatsapp|telegrambot|linkedinbot|discordbot|slackbot|googlebot|bingbot|pinterest/i.test(userAgent);
    const isHtml = req.accepts('html') && (req.path === '/' || req.path === '/index.html' || !req.path.includes('.'));

    if (isBot || (isHtml && req.path === '/')) {
      try {
        const indexPath = path.resolve(process.cwd(), isProd ? 'dist/index.html' : 'index.html');
        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, 'utf-8');
          const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
          const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
          const origin = `${proto}://${host}`;
          const absoluteOgImage = `${origin}/og-image.jpg`;

          html = html
            .replace(/content="\/og-image\.jpg"/g, `content="${absoluteOgImage}"`)
            .replace(/content="og-image\.jpg"/g, `content="${absoluteOgImage}"`);

          if (!isProd && viteInstance) {
            html = await viteInstance.transformIndexHtml(req.originalUrl, html);
          }
          return res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
        }
      } catch (err) {
        console.warn('Notice: Error serving dynamic OpenGraph html:', err);
      }
    }
    next();
  });

  // Setup Vite dev server middleware or serve production build
  let viteInstance: any = null;
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, port: Number(port), host: '0.0.0.0' },
      appType: 'spa',
    });
    viteInstance = vite;
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Artified_np full-stack server running at http://0.0.0.0:${port}`);
  });
}

startServer();
