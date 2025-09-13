import base64
from openai import OpenAI

from dotenv import load_dotenv
load_dotenv()
from vector_utils import imageurl_to_b64, query_text
import os

client = OpenAI(api_key=os.getenv("OPENAI_KEY"))
gemini = OpenAI(
    api_key=os.getenv("GEMINI_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

def gen_showcase_image(prompt, ref_images: list[str]): # list of shopify image URLs
    ref_images_b64 = [{"type": "input_image", "image_url": imageurl_to_b64(url)} for url in ref_images]
    response = client.responses.create(
        model="gpt-4o",
        input=[
            {"role": "user", 
             "content": [
                 {"type": "input_text", "text": prompt}
                ] + ref_images_b64
            }
        ],
        tools=[{"type": "image_generation"}],
    )


    image_generation_calls = [
        output
        for output in response.output
        if output.type == "image_generation_call"
    ]

    image_data = [output.result for output in image_generation_calls]

    if image_data:
        return image_data[0] #b64 string of generated image
    else:
        raise ValueError("No image generated. " + str(response))

def gen_showcase_image_from_products(prompt, products: list[dict], max_images=5):
    image_urls = [p["image"] for p in products if p.get("image")]
    return gen_showcase_image(prompt, image_urls[:max_images])

def choose_best_products(query: str, top_k=5): 
    res = query_text(query, 8)
    
    # Extract product metadata from vector search results
    candidate_products = []
    for match in res.matches:
        candidate_products.append({
            "title": match.metadata.get("title", ""),
            "vendor": match.metadata.get("vendor", ""),
            "body_html": match.metadata.get("body_html", ""),
            "image": match.metadata.get("imageURL", ""),
            "score": match.score
        })
    
    # Create prompt for Gemini to choose best products
    products_info = "\n".join([
        f"Product {i+1}: {p['title']} by {p['vendor']} (Score: {p['score']:.3f})"
        for i, p in enumerate(candidate_products)
    ])
    
    prompt = f"""
    Given this user query: "{query}"
    
    Here are the candidate products found:
    {products_info}

    Please select 3-6 products that best match the user's query. 
    Consider synergy, aesthetics, and how well they fit the query.
    
    End your response with Ans; the product numbers (1, 2, 3, etc.) separated by commas and nothing else. 
    The response is parsed with response_text.split("Ans;")[-1].split(",") and will break if the format is not followed.
    Example response: 
    *Thinking work...*

    Ans; 1, 3, 5
    """
    
    gemini_response = gemini.chat.completions.create(
        model="gemini-2.0-flash-exp",
        messages=[{"role": "user", "content": prompt}]
    )

    print("Gemini response:", gemini_response.choices[0].message.content.strip())
    
    # Parse the response to get selected product indices
    selected_indices = []
    try:
        response_text = gemini_response.choices[0].message.content.strip()
        indices = [int(x.strip()) - 1 for x in response_text.split("Ans;")[-1].split(",")]
        selected_indices = [i for i in indices if 0 <= i < len(candidate_products)]
    except (ValueError, IndexError):
        # Fallback to top products by score if parsing fails
        print("Failed to parse Gemini response, falling back to top products.")
        selected_indices = list(range(3))

    
    # Return the selected products
    return [candidate_products[i] for i in selected_indices[:top_k]]

def create_showcase(query: str):
    chosen_products = choose_best_products(query, 5)
    print(len(chosen_products))
    prompt = """Put the attached products in a minimalistic, aesthetic, 3d product showcase. 
    Match the environment to the theme of the products. Make sure the lighting and colors complement the products.
    Pay attention to the arrangement of the products, spacing, and overall composition to create a visually appealing scene."""
    res = gen_showcase_image_from_products(prompt, chosen_products)

    with open("showcase_image.png", "wb") as f:
        f.write(base64.b64decode(res))

    print("done")

create_showcase("performative matcha feminine male aesthetic")