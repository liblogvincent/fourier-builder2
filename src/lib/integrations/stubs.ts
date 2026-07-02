import type { AdVariant } from "@/types";

// --- Meta Ads API stub ---
export interface MetaAdsCreateAdResponse {
  ad_id: string;
  status: "ACTIVE" | "PAUSED" | "PENDING_REVIEW";
  preview_url: string;
}
export function metaCreateAdStub(variant: AdVariant): MetaAdsCreateAdResponse {
  return {
    ad_id: `stub_meta_${variant.id}_${Date.now()}`,
    status: "ACTIVE",
    preview_url: `https://www.facebook.com/ads/archive/preview/${variant.id}`,
  };
}

// --- Google Ads API stub ---
export interface GoogleAdsCreateCampaignResponse {
  campaign_id: string;
  status: "ENABLED" | "PAUSED";
}
export function googleCreateCampaignStub(name: string): GoogleAdsCreateCampaignResponse {
  return { campaign_id: `stub_google_${name}_${Date.now()}`, status: "ENABLED" };
}

// --- LinkedIn Ads API stub ---
export interface LinkedInCreateCampaignResponse {
  campaign_id: string;
  status: "ACTIVE" | "DRAFT";
}
export function linkedinCreateCampaignStub(name: string): LinkedInCreateCampaignResponse {
  return { campaign_id: `stub_linkedin_${name}_${Date.now()}`, status: "ACTIVE" };
}

// --- Adobe Firefly stub ---
export interface FireflyGenerateImageResponse {
  image_url: string; width: number; height: number;
}
export function fireflyGenerateImageStub(prompt: string, width = 1080, height = 1080): FireflyGenerateImageResponse {
  return {
    image_url: `https://placehold.co/${width}x${height}/D2051E/FFFFFF?text=${encodeURIComponent(prompt.slice(0, 20))}`,
    width, height,
  };
}

// --- Sprinklr stub ---
export interface SprinklrUploadResponse {
  post_ids: string[]; status: "scheduled" | "draft";
}
export function sprinklrUploadStub(count: number): SprinklrUploadResponse {
  return {
    post_ids: Array.from({ length: count }, (_, i) => `stub_sprinklr_post_${i}_${Date.now()}`),
    status: "scheduled",
  };
}

// --- Transperfect stub ---
export interface TransperfectTranslationResponse {
  job_id: string; status: "in_progress" | "complete"; source_locale: string; target_locales: string[];
}
export function transperfectTranslateStub(source: string, targets: string[]): TransperfectTranslationResponse {
  return { job_id: `stub_transperfect_${Date.now()}`, status: "in_progress", source_locale: source, target_locales: targets };
}

// --- Power BI stub ---
export interface PowerBICampaignPerformance {
  campaign_id: string; ctr: number; roas: number; cpa: number; impressions: number; clicks: number; conversions: number; spend: number; revenue: number;
}
export function powerBIPerformanceStub(campaignId: string): PowerBICampaignPerformance {
  return {
    campaign_id: campaignId, ctr: 0.0284, roas: 4.35, cpa: 42.5,
    impressions: 142_000, clicks: 4_032, conversions: 186, spend: 7_900, revenue: 34_365,
  };
}
