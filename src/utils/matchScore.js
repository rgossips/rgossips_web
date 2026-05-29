// Category mapping: maps brand/campaign categories to influencer profile categories
const CATEGORY_MAP = {
  "Perfume": ["Beauty & Skincare", "Fashion & Lifestyle"],
  "Wellness": ["Health, Fitness & Wellness"],
  "Fashion": ["Fashion & Lifestyle"],
  "Food": ["Food & Beverage"],
  "Travel": ["Travel & Hospitality"],
  "Technology": ["Technology & Gadgets"],
  "Beauty": ["Beauty & Skincare"],
  "Fitness": ["Health, Fitness & Wellness"],
  "Lifestyle": ["Fashion & Lifestyle"],
  "Music": ["Gaming & Entertainment"],
  "Events": ["Gaming & Entertainment"],
  "Deals": ["Technology & Gadgets"],
  "Entertainment": ["Gaming & Entertainment"],
  "Health": ["Health, Fitness & Wellness"],
  "Home Decor": ["Home & Decor"],
  "Luxury": ["Fashion & Lifestyle", "Travel & Hospitality"],
  "Sustainability": ["Sustainable & Eco-conscious Living"],
  "Education": ["Education & Career"],
  "Tech": ["Technology & Gadgets"],
  "Festival": ["Fashion & Lifestyle"],
  "Gaming": ["Gaming & Entertainment"],
};

/**
 * Calculate match score between an influencer profile and a brand
 * @param {Object} profile - influencer profile from useAuth
 * @param {Object} brand - brand object with category, platforms, etc.
 * @returns {number} score 0-100
 */
export function calculateBrandMatchScore(profile, brand) {
  if (!profile) return 0;

  let score = 0;
  const userCategories = (profile.categories || []).map((c) => c.toLowerCase());
  const userServices = profile.services || [];

  // 1. Category match (40 points)
  const brandCategory = brand.category || "";
  const mappedCategories = CATEGORY_MAP[brandCategory] || [];
  const categoryMatch = mappedCategories.some((mc) =>
    userCategories.includes(mc.toLowerCase())
  ) || userCategories.some((uc) => brandCategory.toLowerCase().includes(uc.split(" ")[0].toLowerCase()));

  if (categoryMatch) score += 40;
  else score += 10; // base score

  // 2. Platform overlap (25 points)
  const brandPlatforms = (brand.platforms || []).map((p) => p.toLowerCase());
  const hasInstagram = brandPlatforms.includes("instagram") && (profile.instagram_handle || profile.instagramHandle);
  const hasPlatformOverlap = brandPlatforms.length > 0 && hasInstagram;
  if (hasPlatformOverlap) score += 25;
  else score += 5;

  // 3. Engagement/followers fit (20 points)
  const followers = profile.followers_count || profile.followersCount || 0;
  if (followers >= 10000) score += 20;
  else if (followers >= 5000) score += 15;
  else if (followers >= 1000) score += 10;
  else score += 5;

  // 4. Verified & rating bonus (15 points)
  if (brand.isVerified) score += 8;
  if (brand.rating >= 4.5) score += 7;
  else if (brand.rating >= 4.0) score += 4;

  return Math.min(score, 100);
}

// Adjacency map of "indirectly related" categories. Used for the lowest
// match tier — e.g. an Education & Career creator is a soft fit for an
// Entrepreneurship & Business campaign. Keys + values are lowercased
// canonical category names.
const RELATED_CATEGORIES = {
  "beauty & skincare": ["fashion & lifestyle", "health, fitness & wellness"],
  "fashion & lifestyle": ["beauty & skincare", "home & decor"],
  "food & beverage": ["travel & hospitality", "health, fitness & wellness"],
  "health, fitness & wellness": ["food & beverage", "beauty & skincare", "sustainable & eco-conscious living"],
  "travel & hospitality": ["food & beverage", "automobile & mobility"],
  "technology & gadgets": ["gaming & entertainment", "automobile & mobility"],
  "parenting & family": ["pet care & animals", "home & decor"],
  "home & decor": ["fashion & lifestyle", "sustainable & eco-conscious living"],
  "finance & personal finance": ["entrepreneurship & business", "education & career"],
  "education & career": ["entrepreneurship & business", "finance & personal finance"],
  "gaming & entertainment": ["technology & gadgets"],
  "automobile & mobility": ["technology & gadgets", "travel & hospitality"],
  "entrepreneurship & business": ["education & career", "finance & personal finance"],
  "sustainable & eco-conscious living": ["health, fitness & wellness", "home & decor"],
  "pet care & animals": ["parenting & family"],
};

// "₹5K-15K" / "₹3,500" / "₹2.5L" → numeric midpoint (rupees).
const parseBudgetMidpoint = (raw) => {
  if (!raw) return 0;
  const toNum = (s) => {
    if (!s) return 0;
    const cleaned = String(s).trim().toLowerCase().replace(/,/g, "").replace(/\+/g, "");
    const num = parseFloat(cleaned);
    if (!Number.isFinite(num)) return 0;
    if (cleaned.endsWith("l")) return Math.round(num * 100000);
    if (cleaned.endsWith("m")) return Math.round(num * 1000000);
    if (cleaned.endsWith("k")) return Math.round(num * 1000);
    return Math.round(num);
  };
  const parts = String(raw).replace(/₹/g, "").split(/[-–—]/);
  const lo = toNum(parts[0]);
  const hi = parts.length > 1 ? toNum(parts[1]) : lo;
  if (lo && hi) return Math.round((lo + hi) / 2);
  return lo || hi;
};

// Best category match TIER between a campaign's tags and the creator's
// categories. 3 = exact, 2 = partial (substring either way), 1 = indirect
// (related map), 0 = none. This drives both the score and the sort order
// (exact campaigns first, then partial, then indirect).
function bestCategoryTier(userCategories, tags) {
  const u = userCategories.map((c) => c.toLowerCase().trim());
  const t = tags.map((x) => String(x).toLowerCase().trim());
  if (u.length === 0 || t.length === 0) return 0;

  let best = 0;
  for (const tag of t) {
    for (const cat of u) {
      if (tag === cat) return 3; // exact — can't beat this, short-circuit
      // partial: one substring-contains the other (e.g. "beauty" ↔
      // "beauty & skincare")
      if (tag.includes(cat) || cat.includes(tag)) {
        best = Math.max(best, 2);
        continue;
      }
      // indirect: related-category adjacency in either direction
      const relOfCat = RELATED_CATEGORIES[cat] || [];
      const relOfTag = RELATED_CATEGORIES[tag] || [];
      if (relOfCat.includes(tag) || relOfTag.includes(cat)) {
        best = Math.max(best, 1);
      }
    }
  }
  return best;
}

/**
 * Recommendation fit for the influencer home "Recommended Campaigns"
 * section. Combines a tiered category match with a budget-vs-rate check.
 *
 * @returns {{ score: number, categoryTier: 0|1|2|3 }}
 *   score        — 0-100, shown as the "match %" badge.
 *   categoryTier — primary sort key (3 exact → 0 none).
 */
export function scoreCampaignForUser(profile, campaign) {
  if (!profile) return { score: 0, categoryTier: 0 };

  const userCategories = profile.categories || [];
  const tags = campaign.tags || [];
  const categoryTier = bestCategoryTier(userCategories, tags);

  // Category contributes up to 65 points, scaled by how clean the match is.
  const CATEGORY_POINTS = { 3: 65, 2: 45, 1: 28, 0: 10 };
  let score = CATEGORY_POINTS[categoryTier];

  // Budget contributes up to 35 points. We compare the campaign's budget
  // midpoint to the creator's own per-reel rate (their declared price).
  // When either side is unknown we award a neutral middle band so missing
  // data doesn't unfairly sink a category-matched campaign.
  const userRate = Number(profile?.service_rates?.reels) || 0;
  const campaignMid = parseBudgetMidpoint(campaign.budget);
  if (!userRate || !campaignMid) {
    score += 20; // neutral
  } else if (campaignMid >= userRate) {
    score += 35; // pays at or above their rate — ideal
  } else if (campaignMid >= userRate * 0.6) {
    score += 24; // within negotiating distance
  } else {
    score += 10; // well below their rate
  }

  return { score: Math.min(100, Math.round(score)), categoryTier };
}

/**
 * Calculate match score between an influencer profile and a campaign
 * @param {Object} profile - influencer profile from useAuth
 * @param {Object} campaign - campaign object with tags, platforms, etc.
 * @returns {number} score 0-100
 */
export function calculateCampaignMatchScore(profile, campaign) {
  if (!profile) return 0;

  let score = 0;
  const userCategories = (profile.categories || []).map((c) => c.toLowerCase());
  const userServices = profile.services || [];

  // 1. Tag/category overlap (40 points)
  const tags = (campaign.tags || []).map((t) => t.toLowerCase());
  let tagMatchCount = 0;

  for (const tag of tags) {
    // Direct match
    if (userCategories.some((uc) => uc.includes(tag) || tag.includes(uc.split(" ")[0].toLowerCase()))) {
      tagMatchCount++;
      continue;
    }
    // Mapped match
    const titleCase = tag.charAt(0).toUpperCase() + tag.slice(1);
    const mapped = CATEGORY_MAP[titleCase] || [];
    if (mapped.some((mc) => userCategories.includes(mc.toLowerCase()))) {
      tagMatchCount++;
    }
  }

  if (tags.length > 0) {
    const tagRatio = tagMatchCount / tags.length;
    score += Math.round(tagRatio * 40);
  } else {
    score += 10;
  }

  // 2. Platform match (25 points)
  const campaignPlatforms = (campaign.platforms || []).map((p) => p.toLowerCase());
  const hasInstagram = campaignPlatforms.includes("instagram") && (profile.instagram_handle || profile.instagramHandle);
  const hasYoutube = campaignPlatforms.includes("youtube") && userServices.includes("shorts");
  if (hasInstagram) score += 15;
  if (hasYoutube) score += 10;
  if (!hasInstagram && !hasYoutube) score += 5;

  // 3. Deliverables vs services fit (20 points)
  const deliverables = (campaign.deliverables || "").toLowerCase();
  let serviceMatchCount = 0;
  if (deliverables.includes("reel") && userServices.includes("reels")) serviceMatchCount++;
  if (deliverables.includes("stor") && userServices.includes("stories")) serviceMatchCount++;
  if (deliverables.includes("short") && userServices.includes("shorts")) serviceMatchCount++;
  if (deliverables.includes("video") && userServices.includes("ugc")) serviceMatchCount++;
  if (deliverables.includes("post") && userServices.includes("posts")) serviceMatchCount++;

  if (serviceMatchCount >= 2) score += 20;
  else if (serviceMatchCount >= 1) score += 12;
  else score += 5;

  // 4. Followers fit (15 points)
  const followers = profile.followers_count || profile.followersCount || 0;
  if (followers >= 10000) score += 15;
  else if (followers >= 5000) score += 10;
  else if (followers >= 1000) score += 7;
  else score += 3;

  return Math.min(score, 100);
}
