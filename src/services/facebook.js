// ==========================================
// Facebook Graph API Service
// with Local File Upload Support
// ==========================================

const FB_GRAPH = 'https://graph.facebook.com/v19.0';
const FB_VIDEO = 'https://graph-video.facebook.com/v19.0';

class FacebookService {

  // ---- PAGE DISCOVERY ----

  async getMyPages(userToken) {
    const res = await fetch(
      `${FB_GRAPH}/me/accounts?fields=id,name,access_token,picture.width(100),fan_count,category&limit=100&access_token=${userToken}`
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return (data.data || []).map(p => ({
      id: p.id,
      name: p.name,
      accessToken: p.access_token,
      picture: p.picture?.data?.url || '',
      fans: p.fan_count || 0,
      category: p.category || ''
    }));
  }

  async getPageInfo(pageId, token) {
    const res = await fetch(
      `${FB_GRAPH}/${pageId}?fields=id,name,picture.width(100),fan_count,category&access_token=${token}`
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return { id: data.id, name: data.name, picture: data.picture?.data?.url || '', fans: data.fan_count || 0, category: data.category || '' };
  }

  async validateToken(token) {
    try {
      const res = await fetch(`${FB_GRAPH}/me?access_token=${token}`);
      const data = await res.json();
      if (data.error) return { valid: false, error: data.error.message };
      return { valid: true, name: data.name, id: data.id };
    } catch (e) { return { valid: false, error: e.message }; }
  }

  // ---- TEXT POST ----
  async postText(pageId, token, message) {
    const res = await fetch(`${FB_GRAPH}/${pageId}/feed`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, access_token: token })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return { success: true, postId: data.id };
  }

  // ---- PHOTO BY URL ----
  async postPhotoByUrl(pageId, token, message, url) {
    const res = await fetch(`${FB_GRAPH}/${pageId}/photos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, url, access_token: token })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return { success: true, postId: data.id };
  }

  // ---- PHOTO BY LOCAL FILE ----
  async postPhotoByFile(pageId, token, message, file) {
    const fd = new FormData();
    fd.append('source', file);
    fd.append('message', message);
    fd.append('access_token', token);
    const res = await fetch(`${FB_GRAPH}/${pageId}/photos`, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return { success: true, postId: data.id };
  }

  // ---- PHOTO BY BASE64 (stored from upload) ----
  async postPhotoByBase64(pageId, token, message, base64, mime, name) {
    const blob = this._b64toBlob(base64, mime);
    const file = new File([blob], name, { type: mime });
    return this.postPhotoByFile(pageId, token, message, file);
  }

  // ---- VIDEO BY URL ----
  async postVideoByUrl(pageId, token, desc, url) {
    const res = await fetch(`${FB_VIDEO}/${pageId}/videos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc, file_url: url, access_token: token })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return { success: true, postId: data.id };
  }

  // ---- VIDEO BY LOCAL FILE ----
  async postVideoByFile(pageId, token, desc, file) {
    const fd = new FormData();
    fd.append('source', file);
    fd.append('description', desc);
    fd.append('access_token', token);
    const res = await fetch(`${FB_VIDEO}/${pageId}/videos`, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return { success: true, postId: data.id };
  }

  // ---- VIDEO BY BASE64 ----
  async postVideoByBase64(pageId, token, desc, base64, mime, name) {
    const blob = this._b64toBlob(base64, mime);
    const file = new File([blob], name, { type: mime });
    return this.postVideoByFile(pageId, token, desc, file);
  }

  // ---- SMART POST: auto-detect source ----
  // mediaItem: { source:'url'|'file'|'base64', url?, file?, base64?, mimeType?, fileName?, isVideo }
  async smartPost(pageId, token, caption, mediaItem) {
    if (!mediaItem) return this.postText(pageId, token, caption);

    const { source, url, file, base64, mimeType, fileName, isVideo } = mediaItem;

    if (source === 'url' && url) {
      return isVideo
        ? this.postVideoByUrl(pageId, token, caption, url)
        : this.postPhotoByUrl(pageId, token, caption, url);
    }
    if (source === 'file' && file) {
      return isVideo
        ? this.postVideoByFile(pageId, token, caption, file)
        : this.postPhotoByFile(pageId, token, caption, file);
    }
    if (source === 'base64' && base64) {
      return isVideo
        ? this.postVideoByBase64(pageId, token, caption, base64, mimeType, fileName)
        : this.postPhotoByBase64(pageId, token, caption, base64, mimeType, fileName);
    }

    return this.postText(pageId, token, caption);
  }

  // ---- BULK POST ----
  async bulkPost({ posts, delayMs = 30000, onProgress, onComplete, shouldStop }) {
    const results = [];
    for (let i = 0; i < posts.length; i++) {
      if (shouldStop && shouldStop()) break;
      let result;
      try {
        result = await this.smartPost(posts[i].pageId, posts[i].pageToken, posts[i].caption, posts[i].media);
      } catch (e) {
        result = { success: false, error: e.message };
      }
      results.push(result);
      if (onProgress) onProgress(i + 1, posts.length, result);
      if (i < posts.length - 1 && !(shouldStop && shouldStop())) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
    if (onComplete) onComplete(results);
    return results;
  }

  _b64toBlob(b64, mime) {
    const bytes = atob(b64);
    const arr = [];
    for (let i = 0; i < bytes.length; i += 512) {
      const slice = bytes.slice(i, i + 512);
      const nums = new Array(slice.length);
      for (let j = 0; j < slice.length; j++) nums[j] = slice.charCodeAt(j);
      arr.push(new Uint8Array(nums));
    }
    return new Blob(arr, { type: mime });
  }
}

export const facebookAPI = new FacebookService();
export default FacebookService;
