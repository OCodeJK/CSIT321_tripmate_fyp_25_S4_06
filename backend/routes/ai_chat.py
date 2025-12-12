from flask import Blueprint, request, jsonify
import os

ai_bp = Blueprint("ai_bp", __name__)

# Try to import OpenAI, but make it optional
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

@ai_bp.route("/chat", methods=["POST"])
def chat():
    # Check if user is premium
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    payload = verify_token(token)
    if not payload:
        return jsonify({"error": "Invalid token"}), 401
    
    if not payload.get("is_premium"):
        return jsonify({"error": "AI chat is only available for premium users"}), 403

    data = request.get_json()
    message = data.get("message", "")
    locations = data.get("locations", [])
    photos = data.get("photos", {})

    if not message:
        return jsonify({"error": "Message is required"}), 400

    # Build context about the trip
    location_names = [loc.get("name", "Unknown") for loc in locations if loc.get("name")]
    photo_count = sum(len(photos_list) for photos_list in photos.values())
    
    context = f"The user has visited these locations: {', '.join(location_names) if location_names else 'No locations specified'}."
    if photo_count > 0:
        context += f" They have uploaded {photo_count} photos from their trip."

    # If OpenAI is available and API key is set, use it
    if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY"):
        try:
            client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            
            prompt = f"""You are a helpful travel assistant. The user is asking about their trip.
            
{context}

Answer their question in a friendly, informative way. If you don't have specific information about a location, provide general helpful information.

User question: {message}"""

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful travel assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            return jsonify({
                "response": response.choices[0].message.content
            }), 200
        except Exception as e:
            print(f"OpenAI error: {e}")
            # Fall through to default response
    
    # Default response if OpenAI is not available
    default_responses = {
        "what": f"Based on your trip, you visited: {', '.join(location_names) if location_names else 'No locations specified'}. ",
        "where": f"You visited: {', '.join(location_names) if location_names else 'No locations specified'}. ",
        "when": "I don't have specific timing information about your trip. ",
        "how": f"Your trip included {len(location_names)} location(s). ",
    }
    
    message_lower = message.lower()
    response_text = "I can help answer questions about your trip! "
    
    for key, value in default_responses.items():
        if key in message_lower:
            response_text = value
            break
    
    response_text += f"You have {photo_count} photo(s) from your journey. "
    response_text += "For more detailed information, please configure OpenAI API key in your environment variables."
    
    return jsonify({"response": response_text}), 200

