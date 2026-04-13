import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const { influencerId } = await req.json().catch(() => ({}));

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all campaigns
    const { data: campaigns, error: campError } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch applications for this influencer (if provided)
    let applicationMap: Record<string, any> = {};
    if (influencerId) {
      // Try with submission_links first, fall back without it
      let applications: any[] = [];
      const { data: appsData, error: appErr } = await supabaseAdmin
        .from("campaign_applications")
        .select("campaign_id, status, id, submission_links, rejection_reason")
        .eq("influencer_id", influencerId);

      if (appErr) {
        console.error("Applications query error:", appErr.message);
        const { data: appsBasic } = await supabaseAdmin
          .from("campaign_applications")
          .select("campaign_id, status, id")
          .eq("influencer_id", influencerId);
        applications = appsBasic || [];
      } else {
        applications = appsData || [];
      }

      for (const app of applications) {
        applicationMap[app.campaign_id] = {
          status: app.status,
          applicationId: app.id,
          submissionLinks: app.submission_links || [],
          rejectionReason: app.rejection_reason || "",
        };
      }
    }

    if (campError) {
      console.error("Campaigns error:", campError.message);
      return new Response(
        JSON.stringify({ error: campError.message }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Get brand info for all campaigns (via brand_id or brand_invitation_id)
    const brandIds = [...new Set((campaigns || []).map((c: any) => c.brand_id).filter(Boolean))];
    const invitationIds = [...new Set((campaigns || []).map((c: any) => c.brand_invitation_id).filter(Boolean))];
    let brandMap: Record<string, any> = {};

    // Look up registered brands by brand_id
    if (brandIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("brand_profiles")
        .select("brand_id, brand_name, gstin_trade_name, logo_url, instagram_username")
        .in("brand_id", brandIds);

      for (const p of profiles || []) {
        brandMap[p.brand_id] = {
          name: p.gstin_trade_name || p.brand_name || "",
          logo: p.logo_url || "",
          instagram: p.instagram_username || "",
        };
      }
    }

    // Look up brand invitations by id
    if (invitationIds.length > 0) {
      const { data: invitations } = await supabaseAdmin
        .from("brand_invitations")
        .select("id, brand_name, logo_url, instagram_username")
        .in("id", invitationIds);

      for (const inv of invitations || []) {
        if (!brandMap[inv.id]) {
          brandMap[inv.id] = {
            name: inv.brand_name || "",
            logo: inv.logo_url || "",
            instagram: inv.instagram_username || "",
          };
        }
      }
    }

    // Format campaigns for frontend
    const formatted = (campaigns || []).map((c: any) => {
      const brand = brandMap[c.brand_invitation_id] || brandMap[c.brand_id] || { name: "Unknown Brand", logo: "", instagram: "" };
      const initials = brand.name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "??";

      // Calculate days left
      let daysLeft = "";
      if (c.application_deadline) {
        const diff = Math.ceil(
          (new Date(c.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (diff > 0) daysLeft = `${diff}d`;
        else if (diff === 0) daysLeft = "Today";
        else daysLeft = "Expired";
      }

      // Format deadline
      let deadline = "No deadline";
      if (c.application_deadline) {
        deadline = new Date(c.application_deadline).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }

      // Format budget
      let budget = "On request";
      if (c.budget_per_influencer) {
        budget = `₹${Number(c.budget_per_influencer).toLocaleString("en-IN")}`;
      } else if (c.budget_total) {
        budget = `₹${Number(c.budget_total).toLocaleString("en-IN")}`;
      }

      // Format deliverables from content_types_required
      let deliverables = "Not specified";
      if (c.content_types_required && c.content_types_required.length > 0) {
        deliverables = c.content_types_required.join(" + ");
      }

      // Map status — check if influencer has applied
      const appData = applicationMap[c.campaign_id];
      const appStatus = appData?.status;
      let status = "Active";
      let applicationStatus = null;
      let applicationId = null;
      let submissionLinks: any[] = [];
      let rejectionReason = "";

      if (appStatus) {
        applicationStatus = appStatus;
        applicationId = appData.applicationId;
        submissionLinks = appData.submissionLinks || [];
        rejectionReason = appData.rejectionReason || "";

        if (appStatus === "completed") {
          status = "Completed";
        } else if (appStatus === "rejected") {
          status = "Active"; // Rejected goes back to Active (can re-apply if needed)
        } else {
          status = "Applied"; // pending, approved, submitted, accepted, payment all stay in Applied
        }
      } else if (c.status === "open" || c.status === "active") {
        status = "Active";
      } else if (c.status === "closed" || c.status === "completed") {
        status = "Completed";
      } else if (c.status === "draft") {
        status = "Active";
      } else {
        status = c.status.charAt(0).toUpperCase() + c.status.slice(1);
      }

      // Location
      const location = c.target_cities && c.target_cities.length > 0
        ? c.target_cities.join(", ")
        : "Pan India";

      // Tags from categories
      const tags = c.target_categories || [];

      // Platforms (default to instagram)
      const platforms = ["instagram"];

      return {
        id: c.campaign_id,
        initials,
        title: c.title || "Untitled Campaign",
        brandName: brand.name,
        brandLogo: brand.logo,
        status,
        tags,
        budget,
        deadline,
        daysLeft,
        deliverables,
        location,
        platforms,
        description: c.description || "",
        maxInfluencers: c.max_influencers || 0,
        campaignType: c.campaign_type || "",
        startDate: c.campaign_start_date || "",
        endDate: c.campaign_end_date || "",
        applicationStatus,
        applicationId,
        submissionLinks,
        rejectionReason,
        contentTypesRequired: c.content_types_required || [],
      };
    });

    return new Response(
      JSON.stringify({ campaigns: formatted }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
