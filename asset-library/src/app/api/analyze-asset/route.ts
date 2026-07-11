import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { imageUrl } = await req.json();

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Return only 3 short, comma-separated tags for this image, nothing else." },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    const tags = response.choices[0].message.content;
    return NextResponse.json({ tags });
  } catch (error) {
    return NextResponse.json({ error: 'AI failed to tag' }, { status: 500 });
  }
}