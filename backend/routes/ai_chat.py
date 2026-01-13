from flask import Blueprint, request, jsonify
import os
import sys
from routes.auth import verify_token

ai_bp = Blueprint("ai_bp", __name__)

# Import the AI service
try:
    # Add backend directory to path to import ai_service
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    from ai_service import get_ai_service
    AI_SERVICE_AVAILABLE = True
    print("AI service imported successfully")
except Exception as e:
    print(f"Warning: Could not import AI service: {e}")
    import traceback
    traceback.print_exc()
    AI_SERVICE_AVAILABLE = False

# Try to import OpenAI, but make it optional (for fallback)
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

@ai_bp.route("/chat", methods=["POST"])
def chat():
    # Check authentication
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    payload = verify_token(token)
    if not payload:
        return jsonify({"error": "Invalid token"}), 401
    
    data = request.get_json()
    trip_id = data.get("trip_id")  # Get trip_id from request
    
    # Check AI chat limit for free users (5 questions per trip)
    if not payload.get("is_premium"):
        if not trip_id:
            return jsonify({"error": "Trip ID is required for free plan users"}), 400
        
        from db import get_db_connection
        conn = get_db_connection()
        cur = conn.cursor()
        
        try:
            # Get or create AI chat usage record for this trip
            cur.execute(
                """SELECT question_count FROM ai_chat_usage 
                   WHERE trip_id = %s AND user_id = %s""",
                (trip_id, payload["user_id"])
            )
            usage = cur.fetchone()
            
            if usage:
                question_count = usage[0]
                if question_count >= 5:
                    return jsonify({
                        "error": "AI chat limit reached",
                        "message": "Free plan allows 5 AI questions per trip. Upgrade to Premium for unlimited questions."
                    }), 403
            else:
                # Create new usage record
                cur.execute(
                    """INSERT INTO ai_chat_usage (trip_id, user_id, question_count) 
                       VALUES (%s, %s, 0)""",
                    (trip_id, payload["user_id"])
                )
                conn.commit()
                question_count = 0
            
            # Increment question count
            cur.execute(
                """UPDATE ai_chat_usage SET question_count = question_count + 1 
                   WHERE trip_id = %s AND user_id = %s""",
                (trip_id, payload["user_id"])
            )
            conn.commit()
        except Exception as e:
            print(f"Error tracking AI chat usage: {e}")
            # Continue anyway - don't block the request
        finally:
            try:
                cur.close()
                conn.close()
            except:
                pass
    message = data.get("message", "")
    locations = data.get("locations", [])
    photos = data.get("photos", {})

    if not message:
        return jsonify({"error": "Message is required"}), 400

    # Build context about the trip
    # Separate origin (first location) from destinations (rest)
    all_location_names = [loc.get("name", "Unknown") for loc in locations if loc.get("name")]
    
    # The first location is the origin, rest are destinations
    origin_name = all_location_names[0] if len(all_location_names) > 0 else None
    destination_names = all_location_names[1:] if len(all_location_names) > 1 else []
    
    # If no destinations but we have locations, treat all as potential destinations
    # (but still separate origin if there are multiple)
    if not destination_names and len(all_location_names) > 1:
        destination_names = all_location_names[1:]
    elif not destination_names and len(all_location_names) == 1:
        # Only one location - might be destination only
        destination_names = all_location_names
        origin_name = None
    
    photo_count = sum(len(photos_list) for photos_list in photos.values())
    
    # Try to use the knowledge base first
    if AI_SERVICE_AVAILABLE:
        try:
            ai_service = get_ai_service()
            
            # Check if service is properly initialized
            if ai_service.df is None or ai_service.vectorizer is None:
                print("AI service not fully initialized")
                raise Exception("AI service not ready")
            
            # Build query - use the user's message directly
            query = message.strip()
            message_lower = message.lower()
            
            # Check if user explicitly mentions a location in their query
            mentioned_locations = []
            for loc_name in all_location_names:
                if loc_name.lower() in message_lower:
                    mentioned_locations.append(loc_name)
            
            # Also check if message contains location keywords even if not in trip data
            location_keywords_in_message = []
            indonesia_keywords = ['indonesia', 'indonesian', 'bali', 'jakarta', 'yogyakarta', 'bandung', 'surabaya']
            for keyword in indonesia_keywords:
                if keyword in message_lower:
                    location_keywords_in_message.append('indonesia')
                    break
            
            # ALWAYS include destination context if available, even if user doesn't mention it
            # This makes the AI aware of the trip destination automatically
            # Also check if user mentioned Indonesia in their question
            if destination_names or location_keywords_in_message:
                # Use destination from trip if available, otherwise use location from message
                if destination_names:
                    destinations_str = ", ".join(destination_names)
                elif location_keywords_in_message:
                    destinations_str = "Indonesia"
                    destination_names = ['Indonesia']  # Set for filtering later
                else:
                    destinations_str = ", ".join(destination_names) if destination_names else ""
                
                # Check if user is asking for recommendations or places to visit
                is_recommendation_query = any(keyword in message_lower for keyword in [
                    "where should", "where to go", "where can", "where do", "where are",
                    "recommend", "suggest", "places to visit", "what to see", "what to do", 
                    "best places", "top places", "must see", "must visit", "attractions",
                    "activities", "things to do", "sights to see"
                ]) or message_lower.strip() in ["where", "where?", "where should i go", "where to go"]
                
                # Check for time/season questions
                is_time_query = any(keyword in message_lower for keyword in [
                    "best time", "when to visit", "when to go", "season", "weather", 
                    "time of year", "month", "when is", "what time"
                ])
                
                # For ANY query, automatically include destination context
                # This ensures AI knows about the trip destination even if not mentioned
                if is_time_query:
                    # For time/season questions, be very specific about the destination
                    query = (
                        f"{destinations_str} {destinations_str} {destinations_str} "
                        f"best time to visit {destinations_str} "
                        f"when to visit {destinations_str} "
                        f"season weather {destinations_str} "
                        f"time of year {destinations_str}. "
                        f"Focus ONLY on {destinations_str}. {message}"
                    )
                elif is_recommendation_query:
                    # User is asking for recommendations - focus ONLY on destinations
                    # Build a very explicit query that excludes origin and focuses on destination
                    if origin_name:
                        # Explicitly exclude origin multiple times to ensure it's filtered
                        # Repeat destinations multiple times to boost their relevance
                        query = (
                            f"{destinations_str} {destinations_str} {destinations_str} "
                            f"best places to visit attractions activities "
                            f"what to see what to do in {destinations_str} "
                            f"travel guide for {destinations_str}. "
                            f"NEVER mention {origin_name}. NEVER recommend {origin_name}. "
                            f"ONLY {destinations_str}. EXCLUDE {origin_name}. "
                            f"Focus exclusively on {destinations_str}. {message}"
                        )
                    else:
                        query = (
                            f"{destinations_str} {destinations_str} "
                            f"best places to visit attractions activities "
                            f"what to see what to do in {destinations_str} "
                            f"travel guide. {message}"
                        )
                # For non-recommendation queries, still include destination context
                else:
                    # User didn't explicitly mention location, but we know their destination
                    # Automatically add destination context so AI is aware
                    if origin_name:
                        query = (
                            f"{destinations_str} {destinations_str} "
                            f"User is traveling to {destinations_str}. "
                            f"{message} about {destinations_str}. "
                            f"Focus on {destinations_str}, not {origin_name}."
                        )
                    else:
                        query = (
                            f"{destinations_str} {destinations_str} "
                            f"User is traveling to {destinations_str}. "
                            f"{message} about {destinations_str}"
                        )
            elif mentioned_locations:
                # User explicitly mentioned a location - focus on that
                primary_location = mentioned_locations[0]
                # Check if it's the origin - if so, still focus on destinations
                if primary_location == origin_name and destination_names:
                    # User mentioned origin but we should focus on destinations
                    destinations_str = ", ".join(destination_names)
                    query = f"{message} travel guide for {destinations_str} only. Do not mention {origin_name}."
                else:
                    # User mentioned a destination - focus on that
                    query = f"{message} travel guide for {primary_location}"
            
            # Ensure query is set (safety check)
            if 'query' not in locals() or not query:
                # Fallback: build a basic query
                if destination_names:
                    destinations_str = ", ".join(destination_names)
                    query = f"{message} about {destinations_str}"
                else:
                    query = message.strip()
                print(f"Query was not set, using fallback: {query}")
            
            # Generate answer from knowledge base
            print(f"Generating answer for query: {query[:200]}...")  # Debug log
            print(f"Destinations: {destination_names}, Origin: {origin_name}")  # Debug log
            answer = ai_service.generate_answer(query, k=5)  # Get more results for better filtering
            print(f"Generated answer (first 200 chars): {answer[:200] if answer else 'None'}...")  # Debug log
            
            # Check if this was a recommendation query (needed for filtering)
            is_recommendation_query = any(keyword in message_lower for keyword in [
                "where should", "where to go", "where can", "where do", "where are",
                "recommend", "suggest", "places to visit", "what to see", "what to do", 
                "best places", "top places", "must see", "must visit", "attractions",
                "activities", "things to do", "sights to see"
            ]) or message_lower.strip() in ["where", "where?", "where should i go", "where to go"]
            
            # Check for time/season questions (needed for filtering)
            is_time_query = any(keyword in message_lower for keyword in [
                "best time", "when to visit", "when to go", "season", "weather", 
                "time of year", "month", "when is", "what time"
            ])
            
            if answer and not answer.startswith("I'm sorry") and not answer.startswith("I couldn't"):
                # For time queries with specific destinations, filter VERY aggressively
                if is_time_query and destination_names:
                    # Filter out sentences that mention other countries/regions
                    sentences = re.split(r'(?<=[.!?])\s+', answer)
                    filtered_sentences = []
                    
                    # Create a set of destination keywords (including variations)
                    destination_keywords = set()
                    for dest in destination_names:
                        dest_lower = dest.lower()
                        destination_keywords.add(dest_lower)
                        if dest_lower in ['jakarta', 'bali', 'yogyakarta', 'bandung', 'surabaya', 'medan', 'semarang', 'makassar', 'palembang', 'denpasar']:
                            destination_keywords.add('indonesia')
                        if dest_lower == 'indonesia':
                            destination_keywords.add('indonesian')
                            destination_keywords.add('bali')
                    
                    # Countries/regions to exclude (unless they're the destination)
                    excluded_regions = {
                        'new england', 'usa', 'united states', 'vermont', 'maine', 'new hampshire', 'massachusetts', 'connecticut',
                        'toronto', 'canada', 'quebec', 'quebec city',
                        'kyoto', 'japan', 'japanese', 'tokyo',
                        'prague', 'czech republic', 'czech',
                        'salzburg', 'austria', 'austrian',
                        'india', 'indian', 'taj mahal', 'agra',
                        'china', 'chinese', 'great wall',
                        'cambodia', 'cambodian', 'angkor wat', 'siem reap',
                        'myanmar', 'burmese', 'bagan',
                        'maldives', 'maldivian',
                        'thailand', 'thai', 'bangkok',
                        'vietnam', 'vietnamese',
                        'philippines', 'filipino'
                    }
                    
                    # Remove destination keywords from excluded regions
                    for dest_keyword in destination_keywords:
                        excluded_regions.discard(dest_keyword)
                    
                    for sentence in sentences:
                        sentence_lower = sentence.lower()
                        
                        # Check if sentence mentions any excluded region
                        mentions_excluded = any(excluded in sentence_lower for excluded in excluded_regions)
                        
                        # Check if sentence mentions destination
                        mentions_destination = any(dest_keyword in sentence_lower for dest_keyword in destination_keywords)
                        
                        # For time queries, ONLY keep sentences that mention the destination
                        if mentions_destination and not mentions_excluded:
                            filtered_sentences.append(sentence)
                    
                    if filtered_sentences:
                        answer = ' '.join(filtered_sentences).strip()
                    else:
                        # If all sentences were filtered, try a more specific query
                        destinations_str = ", ".join(destination_names)
                        query = f"{destinations_str} {destinations_str} best time to visit when to go season weather"
                        answer = ai_service.generate_answer(query, k=1)
                        if not answer or answer.startswith("I'm sorry") or answer.startswith("I couldn't"):
                            answer = f"Based on the knowledge base, here's information about the best time to visit {destinations_str}: {answer if answer else 'Please try rephrasing your question.'}"
                
                # For recommendation queries with specific destinations, filter aggressively
                if is_recommendation_query and destination_names:
                    # Filter out sentences that mention other countries/regions
                    sentences = re.split(r'(?<=[.!?])\s+', answer)
                    filtered_sentences = []
                    
                    # Create a set of destination keywords (including variations)
                    destination_keywords = set()
                    for dest in destination_names:
                        dest_lower = dest.lower()
                        destination_keywords.add(dest_lower)
                        # Add country name if it's a city
                        if dest_lower in ['jakarta', 'bali', 'yogyakarta', 'bandung', 'surabaya', 'medan', 'semarang', 'makassar', 'palembang', 'denpasar']:
                            destination_keywords.add('indonesia')
                        if dest_lower == 'indonesia':
                            destination_keywords.add('indonesian')
                    
                    # Countries/regions to exclude (unless they're the destination)
                    excluded_regions = {
                        'india', 'indian', 'taj mahal', 'agra',
                        'china', 'chinese', 'great wall',
                        'cambodia', 'cambodian', 'angkor wat', 'siem reap',
                        'myanmar', 'burmese', 'bagan',
                        'maldives', 'maldivian',
                        'thailand', 'thai', 'bangkok',
                        'vietnam', 'vietnamese',
                        'philippines', 'filipino',
                        'japan', 'japanese', 'tokyo',
                        'asia', 'asian'  # Exclude generic "Asia" mentions
                    }
                    
                    # Remove destination keywords from excluded regions
                    for dest_keyword in destination_keywords:
                        excluded_regions.discard(dest_keyword)
                    
                    for sentence in sentences:
                        sentence_lower = sentence.lower()
                        
                        # Check if sentence mentions any excluded region
                        mentions_excluded = any(excluded in sentence_lower for excluded in excluded_regions)
                        
                        # Check if sentence mentions destination
                        mentions_destination = any(dest_keyword in sentence_lower for dest_keyword in destination_keywords)
                        
                        # Keep sentence only if:
                        # 1. It mentions destination AND doesn't mention excluded regions, OR
                        # 2. It's a very long sentence that might be general travel advice (but still check for excluded)
                        if mentions_destination and not mentions_excluded:
                            filtered_sentences.append(sentence)
                        elif len(sentence.split()) > 30 and not mentions_excluded:
                            # Very long sentences might be general advice, but exclude if they mention other countries
                            filtered_sentences.append(sentence)
                    
                    if filtered_sentences:
                        answer = ' '.join(filtered_sentences).strip()
                    else:
                        # If all sentences were filtered, try a more specific query
                        destinations_str = ", ".join(destination_names)
                        query = f"{destinations_str} {destinations_str} best places to visit attractions activities what to see what to do"
                        answer = ai_service.generate_answer(query, k=1)
                        if not answer or answer.startswith("I'm sorry") or answer.startswith("I couldn't"):
                            answer = f"Here are some great places to visit in {destinations_str}: {answer if answer else 'Please try rephrasing your question.'}"
                
                # Filter out any mentions of the origin in recommendation answers
                if is_recommendation_query and origin_name:
                    # Remove sentences that primarily focus on the origin
                    sentences = answer.split('. ')
                    filtered_sentences = []
                    origin_lower = origin_name.lower()
                    destination_lower = [d.lower() for d in destination_names]
                    
                    for sentence in sentences:
                        sentence_lower = sentence.lower()
                        # Check if sentence mentions origin
                        mentions_origin = origin_lower in sentence_lower
                        # Check if sentence mentions any destination
                        mentions_destination = any(dest in sentence_lower for dest in destination_lower)
                        
                        # Keep sentence if:
                        # 1. It doesn't mention origin, OR
                        # 2. It mentions both origin and destination (contextual), OR
                        # 3. It's a long sentence that might be general advice
                        if not mentions_origin or (mentions_destination and len(sentence.split()) > 10) or len(sentence.split()) > 25:
                            filtered_sentences.append(sentence)
                    
                    if filtered_sentences:
                        answer = '. '.join(filtered_sentences)
                    else:
                        # If all sentences were filtered, try to get a better answer
                        # Re-query with more explicit destination focus
                        destinations_str = ", ".join(destination_names)
                        query = f"best places to visit in {destinations_str} attractions activities"
                        answer = ai_service.generate_answer(query, k=1)
                        if not answer or answer.startswith("I'm sorry") or answer.startswith("I couldn't"):
                            answer = f"Here are recommendations for {', '.join(destination_names)}: {answer}"
                
                return jsonify({"response": answer}), 200
            else:
                # If answer generation failed, try a simpler approach
                print(f"Answer generation returned: {answer}")
                # If we have destinations, try a simpler query
                if destination_names:
                    try:
                        destinations_str = ", ".join(destination_names)
                        simple_query = f"best places to visit in {destinations_str} attractions activities"
                        print(f"Retrying with simple query: {simple_query}")
                        answer = ai_service.generate_answer(simple_query, k=3)
                        if answer and not answer.startswith("I'm sorry") and not answer.startswith("I couldn't"):
                            return jsonify({"response": answer}), 200
                    except Exception as e2:
                        print(f"Retry also failed: {e2}")
                # If still no answer, raise exception to fall through
                raise Exception("Could not generate answer")
        except Exception as e:
            print(f"AI service error: {e}")
            import traceback
            traceback.print_exc()
            # If we have destinations, try one more time with a very simple query
            if destination_names:
                try:
                    destinations_str = ", ".join(destination_names)
                    very_simple_query = f"{destinations_str} travel"
                    print(f"Final retry with very simple query: {very_simple_query}")
                    answer = ai_service.generate_answer(very_simple_query, k=1)
                    if answer and not answer.startswith("I'm sorry") and not answer.startswith("I couldn't"):
                        return jsonify({"response": answer}), 200
                except Exception as e2:
                    print(f"Final retry also failed: {e2}")
            # Fall through to OpenAI or default response
    
    # Fallback to OpenAI if available
    if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY"):
        try:
            client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            
            context = f"The user has visited these locations: {', '.join(all_location_names) if all_location_names else 'No locations specified'}."
            if photo_count > 0:
                context += f" They have uploaded {photo_count} photos from their trip."
            
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
    
    # Default response if neither is available
    default_responses = {
        "what": f"Based on your trip, you visited: {', '.join(all_location_names) if all_location_names else 'No locations specified'}. ",
        "where": f"You visited: {', '.join(all_location_names) if all_location_names else 'No locations specified'}. ",
        "when": "I don't have specific timing information about your trip. ",
        "how": f"Your trip included {len(all_location_names)} location(s). ",
    }
    
    message_lower = message.lower()
    response_text = "I can help answer questions about your trip! "
    
    for key, value in default_responses.items():
        if key in message_lower:
            response_text = value
            break
    
    response_text += f"You have {photo_count} photo(s) from your journey. "
    response_text += "The AI knowledge base is being set up. Please try again in a moment."
    
    return jsonify({"response": response_text}), 200

