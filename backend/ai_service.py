from groq import AsyncGroq
import os
from typing import AsyncGenerator, List, Dict
import json

class AIService:
    def __init__(self):
        self.client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
        # Read model from environment variable with fallback to WORKING model
        self.model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        
    async def stream_response(self, messages: List[Dict]) -> AsyncGenerator[str, None]:
        try:
            formatted_messages = []
            for msg in messages:
                formatted_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
            
            system_prompt = {
                "role": "system",
                "content": "You are NEURA CHAT, a helpful, friendly, and knowledgeable AI assistant. Provide clear, accurate, and concise responses. Be conversational but professional."
            }
            formatted_messages.insert(0, system_prompt)
            
            print(f"Using Groq model: {self.model}")  # Debug log
            
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=formatted_messages,
                temperature=0.7,
                max_tokens=2048,
                top_p=1,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            print(f"Groq API Error: {e}")  # Debug log
            error_message = f"I apologize, but I encountered an error: {str(e)}. Please try again."
            for char in error_message:
                yield char