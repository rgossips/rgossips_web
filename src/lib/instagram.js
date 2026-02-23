// lib/instagram.ts

export async function getInstagramReel(mediaId) {
  const token = process.env.NEXT_PUBLIC_INSTA_TOKEN;

  // We fetch the direct media_url (the mp4) and the thumbnail
  const url = `https://graph.instagram.com/${mediaId}?fields=media_url,thumbnail_url,media_type,caption&access_token=${token}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Refresh the cache every hour
    });

    const data = await response.json();

    if (data.error) {
      console.error("Meta API Error:", data.error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Fetch Error:", error);
    return null;
  }
}

// lib/instagram.ts

export async function getLatestReelIds() {
  const token = process.env.NEXT_PUBLIC_INSTA_TOKEN;
  // Fetching ID and Media_Type to ensure we only get videos
  const url = `https://graph.instagram.com/me/media?fields=id,media_type,caption&access_token=${token}`;

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (result.error) {
      console.error("Error fetching media list:", result.error.message);
      return [];
    }

    // Filter to get only Reels/Videos and return their IDs
    const reelIds = result.data
      .filter((item) => item.media_type === "VIDEO")
      .map((item) => item.id);

    return reelIds; // Returns an array of IDs like ["123456789", "987654321"]
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
}
