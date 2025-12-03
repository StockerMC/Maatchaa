from google import genai
import traceback
import os
import json
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_KEY"))

#video_url = "https://www.youtube.com/shorts/-yuNUX3GSl8"
# TODO INCLUDE INFO ABOUT THE COMPANY / SHOPIFY VENDOR

async def parse_video(video_url: str):
    try:
        if not video_url:
            return {"error": "video_url is required"}, 400

        # Check if mock mode is enabled
        use_mock = os.getenv("USE_MOCK_YOUTUBE", "false").lower() == "true"

        if use_mock:
            # Return mock analysis for testing
            mock_analysis = {
                "title_summary": "Product review and unboxing video",
                "objects_actions": ["product showcase", "unboxing", "hands-on review"],
                "aesthetic": "bright, clean, professional, modern",
                "tone_vibe": "enthusiastic, informative, friendly",
                "potential_categories": ["tech", "lifestyle", "reviews", "unboxing"]
            }
            return {"output": json.dumps(mock_analysis)}, 200

        response = client.models.generate_content(
            # model='models/gemini-2.5-flash',
            model='models/gemini-2.0-flash',
            contents=genai.types.Content(
                parts=[
                    genai.types.Part(
                        file_data=genai.types.FileData(file_uri=video_url)
                    ),
                    # TODO INCLUDE INFO ABOUT THE COMPANY / SHOPIFY VENDOR
                    genai.types.Part(text='''You are analyzing a short-form video for brand sponsorship matching. 
                        Summarize the video with the following outputs in JSON format:

                        {
                        "title_summary": "short descriptive title of what happens in the video",
                        "objects_actions": ["list of main objects/products/brands seen", "list of key actions shown"],
                        "aesthetic": "describe the visual style in 5-10 words (e.g., bright, dark, colorful, minimalist, emo, college, vintage, study, etc.)",
                        "tone_vibe": "describe the tone in 5-10 words (e.g., funny, educational, edgy, relaxing)",
                        "potential_categories": ["fitness", "beauty", "gaming", "food", "tech", ...],
                        }

                        Keep responses concise and focused on the actual video content, not speculation. Do not hallucinate.
                        ''')
                ]
            )
        )
        print(response)
        if (
            response.candidates
            and response.candidates[0].content
            and response.candidates[0].content.parts
        ):
            output_text = response.candidates[0].content.parts[0].text
            return {"output": output_text}, 200
        else:
            return {"error": "No valid response from model"}, 500

    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}, 500
