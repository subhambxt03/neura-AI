from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update, func 
from typing import List, Optional
import json
import os
import random
import string
from datetime import datetime, timedelta
from dotenv import load_dotenv
from contextlib import asynccontextmanager

load_dotenv()

from database import get_db, init_db, close_db
from models import User, Conversation, Message, UserSession, Feedback, PasswordReset
from schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    ConversationResponse, MessageResponse, MessageCreate,
    ChangePasswordRequest, FeedbackRequest, ConversationCreate,
    ForgotPasswordRequest, VerifyOTPRequest, ResetPasswordRequest
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    decode_token, get_current_user, get_current_user_optional
)
from ai_service import AIService
from file_processor import extract_text_from_file

# ==================== LIFESPAN FOR PRODUCTION ====================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up NEURA CHAT API...")
    await init_db()
    print("Database initialized successfully")
    yield
    # Shutdown
    print("Shutting down...")
    await close_db()
    print("Database connections closed")

# ==================== APP INITIALIZATION ====================
app = FastAPI(
    title="NEURA CHAT API", 
    version="1.0.0",
    description="NEURA Chat Application Backend API",
    lifespan=lifespan
)

# ==================== CORS CONFIGURATION FOR RENDER ====================
# Get allowed origins from environment variable
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "*")
if ALLOWED_ORIGINS == "*":
    ALLOWED_ORIGINS_LIST = ["*"]
else:
    ALLOWED_ORIGINS_LIST = [origin.strip() for origin in ALLOWED_ORIGINS.split(",")]

# Configure CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["Content-Length", "Content-Type"],
    max_age=3600,
)

# Add a preflight handler for all routes
@app.options("/{rest_of_path:path}")
async def preflight_handler():
    return {"message": "OK"}

# Initialize AI Service
ai_service = AIService()

# Helper function to generate OTP
def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

# Helper function to send email (placeholder - implement with actual email service)
async def send_otp_email(email: str, otp: str):
    # TODO: Implement actual email sending (SendGrid, AWS SES, etc.)
    print(f"Sending OTP {otp} to {email}")
    # For now, just log it
    return True

# ==================== TEST ENDPOINTS ====================

@app.get("/")
async def root():
    return {"message": "NEURA CHAT API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/test-cors")
async def test_cors():
    """Test endpoint to verify CORS is working"""
    return {"message": "CORS is working! You can make requests from your frontend."}

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post("/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        password=hashed_password
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Create token
    token = create_access_token(
        data={"sub": str(new_user.id), "email": new_user.email}
    )
    
    # Store session
    session = UserSession(user_id=new_user.id, token=token)
    db.add(session)
    await db.commit()
    
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=new_user.id,
            name=new_user.name,
            email=new_user.email,
            phone=new_user.phone
        )
    )

@app.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    # Find user
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    
    # Store session
    session = UserSession(user_id=user.id, token=token)
    db.add(session)
    await db.commit()
    
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            phone=user.phone
        )
    )

@app.post("/auth/logout")
async def logout(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    await db.execute(
        delete(UserSession).where(UserSession.user_id == current_user.id)
    )
    await db.commit()
    return {"message": "Logged out successfully"}

@app.post("/auth/validate")
async def validate_token(current_user: User = Depends(get_current_user)):
    """Validate if token is still valid"""
    return {"valid": True, "user_id": current_user.id, "email": current_user.email}

# ==================== FORGOT PASSWORD ENDPOINTS ====================

@app.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Send OTP to user's email for password reset"""
    # Check if user exists
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        # For security, don't reveal if email exists
        return {"message": "If your email is registered, you will receive an OTP"}
    
    # Generate OTP
    otp = generate_otp()
    
    # Delete any existing OTP for this user
    await db.execute(
        delete(PasswordReset).where(PasswordReset.email == request.email)
    )
    
    # Store OTP in database
    reset_record = PasswordReset(
        email=request.email,
        otp=otp,
        expires_at=datetime.now() + timedelta(minutes=10)
    )
    db.add(reset_record)
    await db.commit()
    
    # Send OTP via email
    await send_otp_email(request.email, otp)
    
    return {"message": "OTP sent to your email"}

@app.post("/auth/verify-otp")
async def verify_otp(request: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    """Verify OTP"""
    # Find valid OTP
    result = await db.execute(
        select(PasswordReset).where(
            PasswordReset.email == request.email,
            PasswordReset.otp == request.otp,
            PasswordReset.expires_at > datetime.now()
        )
    )
    reset_record = result.scalar_one_or_none()
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Mark as verified (optional)
    reset_record.is_verified = True
    await db.commit()
    
    return {"message": "OTP verified successfully"}

@app.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using verified OTP"""
    # Find verified OTP
    result = await db.execute(
        select(PasswordReset).where(
            PasswordReset.email == request.email,
            PasswordReset.otp == request.otp,
            PasswordReset.expires_at > datetime.now(),
            PasswordReset.is_verified == True
        )
    )
    reset_record = result.scalar_one_or_none()
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Update user's password
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.password = get_password_hash(request.new_password)
    
    # Delete used reset record
    await db.delete(reset_record)
    
    # Delete all sessions for this user (force re-login)
    await db.execute(
        delete(UserSession).where(UserSession.user_id == user.id)
    )
    
    await db.commit()
    
    return {"message": "Password reset successfully"}

# ==================== USER ENDPOINTS ====================

@app.get("/user/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone
    )

@app.put("/user/profile")
async def update_profile(
    name: str = None,
    email: str = None,
    phone: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if name:
        current_user.name = name
    if email:
        # Check if email is taken
        result = await db.execute(
            select(User).where(User.email == email, User.id != current_user.id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already taken")
        current_user.email = email
    if phone:
        current_user.phone = phone
    
    await db.commit()
    return {"message": "Profile updated successfully"}

@app.put("/user/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(request.old_password, current_user.password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    current_user.password = get_password_hash(request.new_password)
    await db.commit()
    return {"message": "Password changed successfully"}

@app.delete("/user/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await db.delete(current_user)
    await db.commit()
    return {"message": "Account deleted successfully"}

# ==================== CHAT ENDPOINTS ====================

@app.post("/chat/new", response_model=ConversationResponse)
async def create_conversation(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_conversation = Conversation(user_id=current_user.id, title="New Conversation")
    db.add(new_conversation)
    await db.commit()
    await db.refresh(new_conversation)
    
    return ConversationResponse(
        id=new_conversation.id,
        title=new_conversation.title,
        created_at=new_conversation.created_at,
        is_archived=new_conversation.is_archived
    )

@app.get("/chat/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    include_archived: bool = False
):
    query = select(Conversation).where(
        Conversation.user_id == current_user.id
    )
    
    if not include_archived:
        query = query.where(Conversation.is_archived == False)
    
    query = query.order_by(Conversation.created_at.desc())
    result = await db.execute(query)
    conversations = result.scalars().all()
    
    return [
        ConversationResponse(
            id=c.id,
            title=c.title,
            created_at=c.created_at,
            is_archived=c.is_archived
        ) for c in conversations
    ]

@app.get("/chat/messages/{conversation_id}")
async def get_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify conversation belongs to user
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get messages
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()
    
    return [
        MessageResponse(
            id=m.id,
            role=m.role,
            content=m.content,
            created_at=m.created_at
        ) for m in messages
    ]

@app.post("/chat/send")
async def send_message(
    message_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    conversation_id = message_data.get("conversation_id")
    user_message = message_data.get("message")
    file_content = message_data.get("file_content")
    
    # Create or get conversation
    if conversation_id:
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id
            )
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(user_id=current_user.id, title="New Conversation")
        db.add(conversation)
        await db.flush()
    
    # Combine user message with file content
    full_message = user_message
    if file_content:
        full_message = f"{user_message}\n\n[File Content]:\n{file_content}"
    
    # Save user message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=full_message
    )
    db.add(user_msg)
    await db.flush()
    
    # Get conversation history
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
    )
    history = result.scalars().all()
    
    # Format messages for AI
    messages = []
    for msg in history:
        messages.append({
            "role": msg.role,
            "content": msg.content
        })
    
    # Update title if it's the first message
    if conversation.title == "New Conversation":
        conversation.title = user_message[:50] + ("..." if len(user_message) > 50 else "")
        await db.commit()
    
    # Stream response
    async def generate():
        full_response = ""
        try:
            async for chunk in ai_service.stream_response(messages):
                full_response += chunk
                yield f"data: {json.dumps({'content': chunk, 'done': False})}\n\n"
            
            # Save AI response
            ai_msg = Message(
                conversation_id=conversation.id,
                role="assistant",
                content=full_response
            )
            db.add(ai_msg)
            await db.commit()
            
            yield f"data: {json.dumps({'done': True, 'message_id': ai_msg.id, 'conversation_id': conversation.id})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@app.delete("/chat/{conversation_id}")
async def delete_chat(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    await db.delete(conversation)
    await db.commit()
    return {"message": "Chat deleted successfully"}

@app.put("/chat/{conversation_id}/archive")
async def archive_chat(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation.is_archived = not conversation.is_archived
    await db.commit()
    return {"message": f"Chat {'archived' if conversation.is_archived else 'unarchived'} successfully"}

@app.post("/chat/regenerate/{message_id}")
async def regenerate_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get the message to regenerate
    result = await db.execute(
        select(Message).where(Message.id == message_id)
    )
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Verify ownership through conversation
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == message.conversation_id,
            Conversation.user_id == current_user.id
        )
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete the message and all later messages
    await db.execute(
        delete(Message).where(
            Message.conversation_id == message.conversation_id,
            Message.created_at >= message.created_at
        )
    )
    await db.commit()
    
    # Get remaining history
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
    )
    history = result.scalars().all()
    
    messages = [{"role": msg.role, "content": msg.content} for msg in history]
    
    async def generate():
        full_response = ""
        try:
            async for chunk in ai_service.stream_response(messages):
                full_response += chunk
                yield f"data: {json.dumps({'content': chunk, 'done': False})}\n\n"
            
            # Save new AI response
            ai_msg = Message(
                conversation_id=conversation.id,
                role="assistant",
                content=full_response
            )
            db.add(ai_msg)
            await db.commit()
            
            yield f"data: {json.dumps({'done': True, 'message_id': ai_msg.id})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

# ==================== FILE UPLOAD ENDPOINTS ====================

@app.post("/file/upload")
async def upload_file(file: UploadFile = File(...)):
    # Check file size (10MB limit)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    # Extract text based on file type
    file_extension = file.filename.split('.')[-1].lower()
    extracted_text = extract_text_from_file(content, file_extension)
    
    # Limit extracted text
    if len(extracted_text) > 10000:
        extracted_text = extracted_text[:10000] + "... (truncated)"
    
    return {"content": extracted_text, "filename": file.filename}

# ==================== FEEDBACK ENDPOINTS ====================

@app.post("/feedback")
async def submit_feedback(
    feedback_data: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify message belongs to user
    result = await db.execute(
        select(Message).where(Message.id == feedback_data.message_id)
    )
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check if feedback already exists
    result = await db.execute(
        select(Feedback).where(Feedback.message_id == feedback_data.message_id)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        existing.feedback_type = feedback_data.feedback_type
    else:
        feedback = Feedback(
            message_id=feedback_data.message_id,
            feedback_type=feedback_data.feedback_type
        )
        db.add(feedback)
    
    await db.commit()
    return {"message": "Feedback submitted successfully"}

@app.get("/feedback/stats")
async def get_feedback_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get feedback statistics for user's messages
    result = await db.execute(
        select(Feedback.feedback_type, func.count(Feedback.id))
        .join(Message)
        .join(Conversation)
        .where(Conversation.user_id == current_user.id)
        .group_by(Feedback.feedback_type)
    )
    stats = result.all()
    
    return {
        "positive": sum(count for type, count in stats if type == "positive"),
        "negative": sum(count for type, count in stats if type == "negative")
    }

# ==================== ADDITIONAL UTILITY ENDPOINTS ====================

@app.get("/metrics")
async def get_metrics(current_user: User = Depends(get_current_user)):
    """Get user metrics (conversations count, messages count, etc.)"""
    return {
        "user_id": current_user.id,
        "message": "Metrics endpoint - implement as needed"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=False,
        workers=int(os.getenv("WORKERS", 1))
    )