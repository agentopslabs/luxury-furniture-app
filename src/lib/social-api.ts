/**
 * Direct Social Media API — Facebook & Instagram Graph API
 * All calls run client-side using stored access tokens.
 */

const GRAPH = "https://graph.facebook.com/v19.0";
const CONNECTIONS_KEY = "lf_social_connections";

// ─── Connection storage ───────────────────────────────────────────────────────

export interface SocialConnection {
  token: string;
  pageId?: string;
  igUserId?: string;
  name?: string;
  picture?: string;
  platform: "facebook" | "instagram" | "linkedin" | "twitter";
}

export function getConnections(): Record<string, SocialConnection> {
  try { return JSON.parse(localStorage.getItem(CONNECTIONS_KEY) || "{}"); } catch { return {}; }
}

export function saveConnection(platform: string, conn: SocialConnection) {
  const all = getConnections();
  all[platform] = conn;
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(all));
}

export function removeConnection(platform: string) {
  const all = getConnections();
  delete all[platform];
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(all));
}

// ─── Facebook ─────────────────────────────────────────────────────────────────

export async function verifyFacebookToken(token: string, pageId: string) {
  const r = await fetch(`${GRAPH}/${pageId}?fields=id,name,picture&access_token=${token}`);
  if (!r.ok) throw new Error("Invalid token or Page ID");
  return await r.json();
}

export async function postToFacebook(token: string, pageId: string, caption: string, imageUrl?: string) {
  if (imageUrl) {
    const r = await fetch(`${GRAPH}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: imageUrl, caption, access_token: token }),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || "Facebook post failed"); }
    return await r.json();
  } else {
    const r = await fetch(`${GRAPH}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: caption, access_token: token }),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || "Facebook post failed"); }
    return await r.json();
  }
}

export async function getFacebookPosts(token: string, pageId: string) {
  const r = await fetch(`${GRAPH}/${pageId}/posts?fields=id,message,story,created_time,full_picture,likes.summary(true),comments.summary(true),shares&limit=20&access_token=${token}`);
  if (!r.ok) return [];
  const d = await r.json();
  return (d.data || []).map((p: any) => ({
    id: p.id, caption: p.message || p.story || "",
    media: p.full_picture ? [{ url: p.full_picture, type: "photo" }] : [],
    channels: ["facebook"], status: "published", type: "Post",
    scheduledDate: p.created_time,
    likes: p.likes?.summary?.total_count || 0,
    comments: p.comments?.summary?.total_count || 0,
    shares: p.shares?.count || 0,
  }));
}

export async function getFacebookComments(token: string, pageId: string) {
  const posts = await getFacebookPosts(token, pageId);
  const comments: any[] = [];
  for (const post of posts.slice(0, 5)) {
    const r = await fetch(`${GRAPH}/${post.id}/comments?fields=id,message,from,created_time,like_count&access_token=${token}`);
    if (!r.ok) continue;
    const d = await r.json();
    for (const c of (d.data || [])) {
      comments.push({ ...c, postCaption: post.caption, platform: "facebook" });
    }
  }
  return comments;
}

export async function getFacebookInsights(token: string, pageId: string) {
  const r = await fetch(`${GRAPH}/${pageId}/insights?metric=page_impressions,page_reach,page_fans,page_engaged_users&period=day&access_token=${token}`);
  if (!r.ok) return null;
  const d = await r.json();
  const result: Record<string, number> = {};
  for (const m of (d.data || [])) {
    result[m.name] = m.values?.[m.values.length - 1]?.value || 0;
  }
  return result;
}

// ─── Instagram ────────────────────────────────────────────────────────────────

export async function verifyInstagramToken(token: string, igUserId: string) {
  const r = await fetch(`${GRAPH}/${igUserId}?fields=id,name,username,profile_picture_url&access_token=${token}`);
  if (!r.ok) throw new Error("Invalid token or Instagram User ID");
  return await r.json();
}

export async function postToInstagram(token: string, igUserId: string, caption: string, imageUrl?: string, videoUrl?: string, isReel?: boolean) {
  let containerId: string;

  if (videoUrl || isReel) {
    const r = await fetch(`${GRAPH}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: isReel ? "REELS" : "VIDEO",
        video_url: videoUrl || imageUrl,
        caption, access_token: token,
      }),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || "Instagram video upload failed"); }
    const d = await r.json();
    containerId = d.id;
  } else if (imageUrl) {
    const r = await fetch(`${GRAPH}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || "Instagram image upload failed"); }
    const d = await r.json();
    containerId = d.id;
  } else {
    throw new Error("Instagram requires an image or video URL");
  }

  const pub = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: containerId, access_token: token }),
  });
  if (!pub.ok) { const e = await pub.json(); throw new Error(e.error?.message || "Instagram publish failed"); }
  return await pub.json();
}

export async function getInstagramPosts(token: string, igUserId: string) {
  const r = await fetch(`${GRAPH}/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count&limit=20&access_token=${token}`);
  if (!r.ok) return [];
  const d = await r.json();
  return (d.data || []).map((p: any) => ({
    id: p.id, caption: p.caption || "",
    media: (p.media_url || p.thumbnail_url) ? [{ url: p.media_url || p.thumbnail_url, type: p.media_type === "VIDEO" ? "video" : "photo" }] : [],
    channels: ["instagram"], status: "published",
    type: p.media_type === "REELS" ? "Reel" : p.media_type === "VIDEO" ? "Video" : "Post",
    scheduledDate: p.timestamp,
    likes: p.like_count || 0, comments: p.comments_count || 0,
  }));
}

export async function getInstagramComments(token: string, igUserId: string) {
  const posts = await getInstagramPosts(token, igUserId);
  const comments: any[] = [];
  for (const post of posts.slice(0, 5)) {
    const r = await fetch(`${GRAPH}/${post.id}/comments?fields=id,text,username,timestamp,like_count&access_token=${token}`);
    if (!r.ok) continue;
    const d = await r.json();
    for (const c of (d.data || [])) {
      comments.push({ ...c, message: c.text, from: { name: c.username }, postCaption: post.caption, platform: "instagram" });
    }
  }
  return comments;
}

export async function getInstagramInsights(token: string, igUserId: string) {
  const r = await fetch(`${GRAPH}/${igUserId}/insights?metric=impressions,reach,profile_views,follower_count&period=day&access_token=${token}`);
  if (!r.ok) return null;
  const d = await r.json();
  const result: Record<string, number> = {};
  for (const m of (d.data || [])) {
    result[m.name] = m.values?.[m.values.length - 1]?.value || 0;
  }
  return result;
}

// ─── Combined helpers ─────────────────────────────────────────────────────────

export async function getAllPosts(connections: Record<string, SocialConnection>) {
  const all: any[] = [];
  const fb = connections.facebook;
  const ig = connections.instagram;
  if (fb?.token && fb?.pageId) {
    const posts = await getFacebookPosts(fb.token, fb.pageId).catch(() => []);
    all.push(...posts);
  }
  if (ig?.token && ig?.igUserId) {
    const posts = await getInstagramPosts(ig.token, ig.igUserId).catch(() => []);
    all.push(...posts);
  }
  return all.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
}

export async function getAllComments(connections: Record<string, SocialConnection>) {
  const all: any[] = [];
  const fb = connections.facebook;
  const ig = connections.instagram;
  if (fb?.token && fb?.pageId) {
    const c = await getFacebookComments(fb.token, fb.pageId).catch(() => []);
    all.push(...c);
  }
  if (ig?.token && ig?.igUserId) {
    const c = await getInstagramComments(ig.token, ig.igUserId).catch(() => []);
    all.push(...c);
  }
  return all;
}

export async function getAllInsights(connections: Record<string, SocialConnection>) {
  const fb = connections.facebook;
  const ig = connections.instagram;
  const fbStats = fb?.token && fb?.pageId ? await getFacebookInsights(fb.token, fb.pageId).catch(() => null) : null;
  const igStats = ig?.token && ig?.igUserId ? await getInstagramInsights(ig.token, ig.igUserId).catch(() => null) : null;
  return { facebook: fbStats, instagram: igStats };
}
