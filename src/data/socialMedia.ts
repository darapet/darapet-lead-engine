export interface SocialPlatform {
  id: string;
  name: string;
  /** URL to the brand's official SVG logo via Simple Icons CDN */
  icon: string;
  color: string;
  domain: string;
  searchPrefix: string;
  category: 'social' | 'messaging' | 'professional' | 'creative' | 'video' | 'audio' | 'marketplace' | 'developer';
}

// Helper to get a Simple Icons CDN logo URL
// Using /ffffff (white) on dark backgrounds so they're always visible
const si = (slug: string) => `https://cdn.simpleicons.org/${slug}/ffffff`;

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  // Social
  { id: 'facebook', name: 'Facebook', icon: si('facebook'), color: '#1877F2', domain: 'facebook.com', searchPrefix: 'site:facebook.com', category: 'social' },
  { id: 'instagram', name: 'Instagram', icon: si('instagram'), color: '#E4405F', domain: 'instagram.com', searchPrefix: 'site:instagram.com', category: 'social' },
  { id: 'twitter', name: 'X / Twitter', icon: si('x'), color: '#000000', domain: 'x.com', searchPrefix: 'site:x.com OR site:twitter.com', category: 'social' },
  { id: 'threads', name: 'Threads', icon: si('threads'), color: '#000000', domain: 'threads.net', searchPrefix: 'site:threads.net', category: 'social' },
  { id: 'tiktok', name: 'TikTok', icon: si('tiktok'), color: '#FF0050', domain: 'tiktok.com', searchPrefix: 'site:tiktok.com', category: 'social' },
  { id: 'snapchat', name: 'Snapchat', icon: si('snapchat'), color: '#FFFC00', domain: 'snapchat.com', searchPrefix: 'site:snapchat.com', category: 'social' },
  { id: 'pinterest', name: 'Pinterest', icon: si('pinterest'), color: '#E60023', domain: 'pinterest.com', searchPrefix: 'site:pinterest.com', category: 'social' },
  { id: 'reddit', name: 'Reddit', icon: si('reddit'), color: '#FF4500', domain: 'reddit.com', searchPrefix: 'site:reddit.com', category: 'social' },
  { id: 'tumblr', name: 'Tumblr', icon: si('tumblr'), color: '#35465C', domain: 'tumblr.com', searchPrefix: 'site:tumblr.com', category: 'social' },
  { id: 'mastodon', name: 'Mastodon', icon: si('mastodon'), color: '#6364FF', domain: 'mastodon.social', searchPrefix: 'site:mastodon.social', category: 'social' },
  { id: 'bereal', name: 'BeReal', icon: si('bereal'), color: '#000000', domain: 'bere.al', searchPrefix: 'site:bere.al', category: 'social' },
  { id: 'vk', name: 'VKontakte', icon: si('vk'), color: '#0077FF', domain: 'vk.com', searchPrefix: 'site:vk.com', category: 'social' },

  // Messaging
  { id: 'whatsapp', name: 'WhatsApp', icon: si('whatsapp'), color: '#25D366', domain: 'wa.me', searchPrefix: 'site:wa.me', category: 'messaging' },
  { id: 'telegram', name: 'Telegram', icon: si('telegram'), color: '#26A5E4', domain: 't.me', searchPrefix: 'site:t.me', category: 'messaging' },
  { id: 'discord', name: 'Discord', icon: si('discord'), color: '#5865F2', domain: 'discord.gg', searchPrefix: 'site:discord.gg OR site:discord.com', category: 'messaging' },
  { id: 'signal', name: 'Signal', icon: si('signal'), color: '#2592E9', domain: 'signal.org', searchPrefix: 'site:signal.org', category: 'messaging' },
  { id: 'wechat', name: 'WeChat', icon: si('wechat'), color: '#07C160', domain: 'wechat.com', searchPrefix: 'site:wechat.com', category: 'messaging' },
  { id: 'viber', name: 'Viber', icon: si('viber'), color: '#7360F2', domain: 'viber.com', searchPrefix: 'site:viber.com', category: 'messaging' },
  { id: 'line', name: 'LINE', icon: si('line'), color: '#00B900', domain: 'line.me', searchPrefix: 'site:line.me', category: 'messaging' },
  { id: 'kakao', name: 'KakaoTalk', icon: si('kakaotalk'), color: '#FAE100', domain: 'kakao.com', searchPrefix: 'site:kakao.com', category: 'messaging' },

  // Professional
  { id: 'linkedin', name: 'LinkedIn', icon: si('linkedin'), color: '#0A66C2', domain: 'linkedin.com', searchPrefix: 'site:linkedin.com/in OR site:linkedin.com/company', category: 'professional' },
  { id: 'angellist', name: 'AngelList / Wellfound', icon: si('wellfound'), color: '#000000', domain: 'wellfound.com', searchPrefix: 'site:wellfound.com', category: 'professional' },
  { id: 'crunchbase', name: 'Crunchbase', icon: si('crunchbase'), color: '#0288D1', domain: 'crunchbase.com', searchPrefix: 'site:crunchbase.com', category: 'professional' },
  { id: 'producthunt', name: 'Product Hunt', icon: si('producthunt'), color: '#DA552F', domain: 'producthunt.com', searchPrefix: 'site:producthunt.com', category: 'professional' },
  { id: 'quora', name: 'Quora', icon: si('quora'), color: '#B92B27', domain: 'quora.com', searchPrefix: 'site:quora.com', category: 'professional' },

  // Creative
  { id: 'behance', name: 'Behance', icon: si('behance'), color: '#1769FF', domain: 'behance.net', searchPrefix: 'site:behance.net', category: 'creative' },
  { id: 'dribbble', name: 'Dribbble', icon: si('dribbble'), color: '#EA4C89', domain: 'dribbble.com', searchPrefix: 'site:dribbble.com', category: 'creative' },
  { id: 'deviantart', name: 'DeviantArt', icon: si('deviantart'), color: '#05CC47', domain: 'deviantart.com', searchPrefix: 'site:deviantart.com', category: 'creative' },
  { id: 'flickr', name: 'Flickr', icon: si('flickr'), color: '#FF0084', domain: 'flickr.com', searchPrefix: 'site:flickr.com', category: 'creative' },
  { id: '500px', name: '500px', icon: si('500px'), color: '#0099E5', domain: '500px.com', searchPrefix: 'site:500px.com', category: 'creative' },
  { id: 'medium', name: 'Medium', icon: si('medium'), color: '#000000', domain: 'medium.com', searchPrefix: 'site:medium.com', category: 'creative' },
  { id: 'substack', name: 'Substack', icon: si('substack'), color: '#FF6719', domain: 'substack.com', searchPrefix: 'site:substack.com', category: 'creative' },
  { id: 'wordpress', name: 'WordPress', icon: si('wordpress'), color: '#21759B', domain: 'wordpress.com', searchPrefix: 'site:wordpress.com', category: 'creative' },
  { id: 'blogger', name: 'Blogger', icon: si('blogger'), color: '#FF5722', domain: 'blogger.com', searchPrefix: 'site:blogspot.com', category: 'creative' },

  // Video
  { id: 'youtube', name: 'YouTube', icon: si('youtube'), color: '#FF0000', domain: 'youtube.com', searchPrefix: 'site:youtube.com', category: 'video' },
  { id: 'twitch', name: 'Twitch', icon: si('twitch'), color: '#9146FF', domain: 'twitch.tv', searchPrefix: 'site:twitch.tv', category: 'video' },
  { id: 'vimeo', name: 'Vimeo', icon: si('vimeo'), color: '#1AB7EA', domain: 'vimeo.com', searchPrefix: 'site:vimeo.com', category: 'video' },
  { id: 'dailymotion', name: 'Dailymotion', icon: si('dailymotion'), color: '#0066DC', domain: 'dailymotion.com', searchPrefix: 'site:dailymotion.com', category: 'video' },
  { id: 'rumble', name: 'Rumble', icon: si('rumble'), color: '#85C742', domain: 'rumble.com', searchPrefix: 'site:rumble.com', category: 'video' },

  // Audio
  { id: 'spotify', name: 'Spotify', icon: si('spotify'), color: '#1DB954', domain: 'open.spotify.com', searchPrefix: 'site:open.spotify.com/artist', category: 'audio' },
  { id: 'soundcloud', name: 'SoundCloud', icon: si('soundcloud'), color: '#FF5500', domain: 'soundcloud.com', searchPrefix: 'site:soundcloud.com', category: 'audio' },
  { id: 'bandcamp', name: 'Bandcamp', icon: si('bandcamp'), color: '#1DA0C3', domain: 'bandcamp.com', searchPrefix: 'site:bandcamp.com', category: 'audio' },
  { id: 'clubhouse', name: 'Clubhouse', icon: si('clubhouse'), color: '#F5ECD7', domain: 'joinclubhouse.com', searchPrefix: 'site:joinclubhouse.com', category: 'audio' },

  // Developer
  { id: 'github', name: 'GitHub', icon: si('github'), color: '#181717', domain: 'github.com', searchPrefix: 'site:github.com', category: 'developer' },
  { id: 'gitlab', name: 'GitLab', icon: si('gitlab'), color: '#FC6D26', domain: 'gitlab.com', searchPrefix: 'site:gitlab.com', category: 'developer' },
  { id: 'stackoverflow', name: 'Stack Overflow', icon: si('stackoverflow'), color: '#F58025', domain: 'stackoverflow.com', searchPrefix: 'site:stackoverflow.com/users', category: 'developer' },
  { id: 'hashnode', name: 'Hashnode', icon: si('hashnode'), color: '#2962FF', domain: 'hashnode.dev', searchPrefix: 'site:hashnode.dev', category: 'developer' },
  { id: 'devto', name: 'DEV Community', icon: si('devdotto'), color: '#0A0A0A', domain: 'dev.to', searchPrefix: 'site:dev.to', category: 'developer' },

  // Marketplace
  { id: 'etsy', name: 'Etsy', icon: si('etsy'), color: '#F56400', domain: 'etsy.com', searchPrefix: 'site:etsy.com/shop', category: 'marketplace' },
  { id: 'fiverr', name: 'Fiverr', icon: si('fiverr'), color: '#1DBF73', domain: 'fiverr.com', searchPrefix: 'site:fiverr.com', category: 'marketplace' },
  { id: 'upwork', name: 'Upwork', icon: si('upwork'), color: '#6FDA44', domain: 'upwork.com', searchPrefix: 'site:upwork.com/freelancers', category: 'marketplace' },
  { id: 'yelp', name: 'Yelp', icon: si('yelp'), color: '#FF1A1A', domain: 'yelp.com', searchPrefix: 'site:yelp.com/biz', category: 'marketplace' },
  { id: 'trustpilot', name: 'Trustpilot', icon: si('trustpilot'), color: '#00B67A', domain: 'trustpilot.com', searchPrefix: 'site:trustpilot.com', category: 'marketplace' },
];

export const SOCIAL_CATEGORIES = [
  { id: 'social', label: 'Social Media' },
  { id: 'messaging', label: 'Messaging' },
  { id: 'professional', label: 'Professional' },
  { id: 'creative', label: 'Creative' },
  { id: 'video', label: 'Video' },
  { id: 'audio', label: 'Audio' },
  { id: 'developer', label: 'Developer' },
  { id: 'marketplace', label: 'Marketplace' },
];

export function getPlatformById(id: string): SocialPlatform | undefined {
  return SOCIAL_PLATFORMS.find(p => p.id === id);
}
