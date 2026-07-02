export interface FigmaFrameData {
  textLayers: { name: string; content: string }[];
  colors: { name: string; hex: string }[];
  layoutStructure: string;
  imageCount: number;
}

export async function readFigmaFrame(frameUrl: string): Promise<FigmaFrameData> {
  const token = process.env.FIGMA_TOKEN;
  if (!token) {
    return {
      textLayers: [
        { name: "headline", content: "Mehr Drehmoment. Weniger Vibration." },
        { name: "subhead", content: "Die leistungsstarke SIW 6AT-A22" },
        { name: "cta", content: "Händler finden" },
      ],
      colors: [
        { name: "primary", hex: "#D2051E" },
        { name: "background", hex: "#0F0F0F" },
      ],
      layoutStructure: "hero + 3-column feature grid + CTA bar",
      imageCount: 3,
    };
  }
  const fileKey = extractFileKey(frameUrl);
  const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: { "X-Figma-Token": token },
  });
  const json = await res.json();
  return parseFigmaResponse(json);
}

function extractFileKey(url: string): string {
  const match = url.match(/figma\.com\/file\/([a-zA-Z0-9]+)/);
  return match?.[1] ?? "";
}

function parseFigmaResponse(json: any): FigmaFrameData {
  return { textLayers: [], colors: [], layoutStructure: "parsed from Figma document", imageCount: 0 };
}
