export interface ContentfulPage {
  title: string; slug: string; headline: string; body: string; cta: string; imageRef: string; locale: string;
}

export interface ContentfulResponse {
  page_id: string; published_url: string; status: "published" | "draft";
}

export async function publishToContentful(page: ContentfulPage): Promise<ContentfulResponse> {
  const token = process.env.CONTENTFUL_CMA_TOKEN;
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const env = process.env.CONTENTFUL_ENVIRONMENT ?? "master";

  if (!token || !spaceId) {
    return {
      page_id: `stub_contentful_${page.slug}_${Date.now()}`,
      published_url: `https://www.hilti.com/${page.locale}/campaigns/${page.slug}`,
      status: "published",
    };
  }

  const res = await fetch(
    `https://api.contentful.com/spaces/${spaceId}/environments/${env}/entries`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/vnd.contentful.management.v1+json",
      },
      body: JSON.stringify({
        fields: {
          title: { "en-US": page.title },
          headline: { "en-US": page.headline },
          body: { "en-US": page.body },
          cta: { "en-US": page.cta },
          imageRef: { "en-US": page.imageRef },
        },
      }),
    },
  );
  const json = await res.json();
  return { page_id: json.sys.id, published_url: `https://www.hilti.com/${page.locale}/campaigns/${page.slug}`, status: "published" };
}
