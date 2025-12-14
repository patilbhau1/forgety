from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from jose import JWTError, jwt
from datetime import datetime, timedelta
import uuid
from fastapi.responses import FileResponse
import os
import sqlite3
import shutil
from contextlib import contextmanager
from passlib.context import CryptContext

# Password hashing (use pbkdf2_sha256 to avoid bcrypt native dependency issues)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Ensure uploads folder
os.makedirs("uploads/synopsis", exist_ok=True)
os.makedirs("uploads/projects", exist_ok=True)
os.makedirs("uploads/blackbook", exist_ok=True)

@contextmanager
def get_db():
    conn = sqlite3.connect("tyforge.db", check_same_thread=False, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        # Users
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                phone TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                is_admin INTEGER DEFAULT 0,
                signup_step TEXT DEFAULT 'basic_info',
                selected_plan_id TEXT,
                has_synopsis INTEGER DEFAULT 0,
                needs_idea_generation INTEGER DEFAULT 0,
                onboarding_completed INTEGER DEFAULT 0
            )
        """)
        
        # Orders
        conn.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                service_type TEXT NOT NULL,
                amount INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'Pending',
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Projects
        conn.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Pending',
                file_path TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Synopsis
        conn.execute("""
            CREATE TABLE IF NOT EXISTS synopsis (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                file_name TEXT NOT NULL,
                original_name TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Pending',
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Meetings
        conn.execute("""
            CREATE TABLE IF NOT EXISTS meetings (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                scheduled_at TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Scheduled',
                notes TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Plans
        conn.execute("""
            CREATE TABLE IF NOT EXISTS plans (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                price INTEGER NOT NULL,
                features TEXT NOT NULL,
                blog_included INTEGER DEFAULT 0,
                max_projects INTEGER DEFAULT 1,
                support_level TEXT DEFAULT 'Basic',
                created_at TEXT NOT NULL
            )
        """)
        
        # Services
        conn.execute("""
            CREATE TABLE IF NOT EXISTS services (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                price INTEGER NOT NULL,
                category TEXT NOT NULL,
                is_addon INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)
        
        # User Services (many-to-many relationship)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_services (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                service_id TEXT NOT NULL,
                selected INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE CASCADE
            )
        """)
        
        # User Projects (enhanced)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_projects (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                idea_generated INTEGER DEFAULT 0,
                synopsis_file_path TEXT,
                synopsis_original_name TEXT,
                status TEXT DEFAULT 'idea_pending',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Admin Requests
        conn.execute("""
            CREATE TABLE IF NOT EXISTS admin_requests (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                request_type TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'pending',
                response TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Add indexes
        conn.execute("CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_synopsis_user_id ON synopsis(user_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_user_services_user_id ON user_services(user_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_admin_requests_user_id ON admin_requests(user_id)")
        
        # Create plans
        plans_data = [
            ("basic_plan", "Basic Plan", "Perfect for simple projects", 5000, "Synopsis writing,Basic support,1 project", 0, 1, "Basic", datetime.now().isoformat()),
            ("standard_plan", "Standard Plan", "Most popular choice", 12000, "Full project development,Standard support,3 projects,Blog included", 1, 3, "Standard", datetime.now().isoformat()),
            ("premium_plan", "Premium Plan", "Complete solution with premium features", 25000, "Complete project suite,Premium support,Unlimited projects,Blog included,Priority delivery", 1, -1, "Premium", datetime.now().isoformat())
        ]
        
        for plan in plans_data:
            existing = conn.execute("SELECT id FROM plans WHERE id = ?", (plan[0],)).fetchone()
            if not existing:
                conn.execute("""
                    INSERT INTO plans (id, name, description, price, features, blog_included, max_projects, support_level, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, plan)
        
        # Create services
        services_data = [
            ("synopsis_writing", "Synopsis Writing", "Professional synopsis writing service", 2000, "Writing", 0, datetime.now().isoformat()),
            ("project_development", "Project Development", "Complete project development", 8000, "Development", 0, datetime.now().isoformat()),
            ("blog_writing", "Blog Writing", "Technical blog writing for your project", 1500, "Content", 1, datetime.now().isoformat()),
            ("documentation", "Documentation", "Complete project documentation", 1000, "Documentation", 0, datetime.now().isoformat()),
            ("presentation", "Presentation", "Project presentation preparation", 800, "Presentation", 0, datetime.now().isoformat()),
            ("code_review", "Code Review", "Professional code review service", 1200, "Review", 0, datetime.now().isoformat())
        ]
        
        for service in services_data:
            existing = conn.execute("SELECT id FROM services WHERE id = ?", (service[0],)).fetchone()
            if not existing:
                conn.execute("""
                    INSERT INTO services (id, name, description, price, category, is_addon, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, service)
        
        # Create test user
        test_email = "test@tyforge.local"
        test_password = pwd_context.hash("test123456")
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (test_email,)).fetchone()
        if not existing:
            conn.execute("""
                INSERT INTO users (id, email, password, name, phone, created_at, is_admin, signup_step, selected_plan_id, has_synopsis, needs_idea_generation, onboarding_completed)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (str(uuid.uuid4()), test_email, test_password, "Test User", "+91 9876543210", datetime.now().isoformat(), 1, "completed", "premium_plan", 1, 0, 1))
        
        # Add test data
        user = conn.execute("SELECT id FROM users WHERE email = ?", (test_email,)).fetchone()
        if user:
            # Test order
            conn.execute("""
                INSERT OR IGNORE INTO orders (id, user_id, service_type, amount, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (str(uuid.uuid4()), user["id"], "Full Stack Project", 12000, "Completed", datetime.now().isoformat()))
            
            # Test project
            conn.execute("""
                INSERT OR IGNORE INTO projects (id, user_id, name, type, status, file_path, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (str(uuid.uuid4()), user["id"], "E-commerce Platform", "Web App", "Approved", "uploads/projects/test.zip", datetime.now().isoformat()))
            
            # Test synopsis
            conn.execute("""
                INSERT OR IGNORE INTO synopsis (id, user_id, file_name, original_name, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (str(uuid.uuid4()), user["id"], "uploads/synopsis/test.pdf", "test-synopsis.pdf", "Approved", datetime.now().isoformat()))
            
            # Test meeting
            conn.execute("""
                INSERT OR IGNORE INTO meetings (id, user_id, scheduled_at, status, notes, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (str(uuid.uuid4()), user["id"], datetime.now().isoformat(), "Scheduled", "Initial consultation", datetime.now().isoformat()))
        
        conn.commit()

def get_user_by_email(email: str):
    with get_db() as conn:
        return conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

def verify_user_password(email: str, password: str):
    user = get_user_by_email(email)
    if user and pwd_context.verify(password, user["password"]):
        return user
    return None

def get_user_orders(user_id: str):
    with get_db() as conn:
        return conn.execute("""
            SELECT id, service_type, amount, status, created_at 
            FROM orders 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        """, (user_id,)).fetchall()

def get_user_projects(user_id: str):
    with get_db() as conn:
        return conn.execute("""
            SELECT id, name, type, status, file_path, created_at 
            FROM projects 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        """, (user_id,)).fetchall()

def get_user_synopsis(user_id: str):
    with get_db() as conn:
        return conn.execute("""
            SELECT id, file_name, original_name, status, created_at 
            FROM synopsis 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        """, (user_id,)).fetchall()

def get_user_meetings(user_id: str):
    with get_db() as conn:
        return conn.execute("""
            SELECT id, scheduled_at, status, notes, created_at 
            FROM meetings 
            WHERE user_id = ? 
            ORDER BY scheduled_at DESC
        """, (user_id,)).fetchall()

def create_user(email: str, password: str, name: str, phone: str = ""):
    with get_db() as conn:
        user_id = str(uuid.uuid4())
        hashed_password = pwd_context.hash(password)
        conn.execute("""
            INSERT INTO users (id, email, password, name, phone, created_at, signup_step)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, email, hashed_password, name, phone, datetime.now().isoformat(), "plan_selection"))
        conn.commit()
        return user_id

def get_plans():
    with get_db() as conn:
        return conn.execute("""
            SELECT id, name, description, price, features, blog_included, max_projects, support_level 
            FROM plans 
            ORDER BY price ASC
        """).fetchall()

def get_services():
    with get_db() as conn:
        return conn.execute("""
            SELECT id, name, description, price, category, is_addon 
            FROM services 
            ORDER BY category, price ASC
        """).fetchall()

def update_user_plan(user_id: str, plan_id: str):
    with get_db() as conn:
        conn.execute("""
            UPDATE users 
            SET selected_plan_id = ?, signup_step = 'project_setup' 
            WHERE id = ?
        """, (plan_id, user_id))
        conn.commit()

def add_user_services(user_id: str, service_ids: list[str]):
    with get_db() as conn:
        for service_id in service_ids:
            conn.execute("""
                INSERT INTO user_services (id, user_id, service_id, created_at)
                VALUES (?, ?, ?, ?)
            """, (str(uuid.uuid4()), user_id, service_id, datetime.now().isoformat()))
        conn.commit()

def create_user_project(user_id: str, title: str, description: str, idea_generated: bool = False):
    with get_db() as conn:
        project_id = str(uuid.uuid4())
        conn.execute("""
            INSERT INTO user_projects (id, user_id, title, description, idea_generated, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (project_id, user_id, title, description, 1 if idea_generated else 0, "idea_submitted", datetime.now().isoformat(), datetime.now().isoformat()))
        conn.commit()
        return project_id

def update_user_synopsis(project_id: str, file_path: str, original_name: str):
    with get_db() as conn:
        conn.execute("""
            UPDATE user_projects 
            SET synopsis_file_path = ?, synopsis_original_name = ?, status = 'synopsis_uploaded', updated_at = ?
            WHERE id = ?
        """, (file_path, original_name, datetime.now().isoformat(), project_id))
        conn.commit()

def create_admin_request(user_id: str, request_type: str, description: str):
    with get_db() as conn:
        request_id = str(uuid.uuid4())
        conn.execute("""
            INSERT INTO admin_requests (id, user_id, request_type, description, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (request_id, user_id, request_type, description, "pending", datetime.now().isoformat(), datetime.now().isoformat()))
        conn.commit()
        return request_id

def complete_user_onboarding(user_id: str):
    with get_db() as conn:
        conn.execute("""
            UPDATE users 
            SET signup_step = 'completed', onboarding_completed = 1 
            WHERE id = ?
        """, (user_id,))
        conn.commit()

def update_user_profile(user_id: str, name: str, phone: str):
    with get_db() as conn:
        conn.execute("""
            UPDATE users 
            SET name = ?, phone = ? 
            WHERE id = ?
        """, (name, phone, user_id))
        conn.commit()

def create_synopsis(user_id: str, file_name: str, original_name: str):
    with get_db() as conn:
        synopsis_id = str(uuid.uuid4())
        conn.execute("""
            INSERT INTO synopsis (id, user_id, file_name, original_name, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (synopsis_id, user_id, file_name, original_name, "Pending", datetime.now().isoformat()))
        conn.commit()
        return synopsis_id

def create_meeting(user_id: str, scheduled_at: str, notes: str = ""):
    with get_db() as conn:
        meeting_id = str(uuid.uuid4())
        conn.execute("""
            INSERT INTO meetings (id, user_id, scheduled_at, status, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (meeting_id, user_id, scheduled_at, "Scheduled", notes, datetime.now().isoformat()))
        conn.commit()
        return meeting_id

app = FastAPI(title="TyForge Local API", version="1.0.0")

# CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Config
SECRET_KEY = "local-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# Pydantic models
class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: str
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserSignup(BaseModel):
    email: str
    password: str
    name: str
    phone: str = ""

class PlanSelection(BaseModel):
    plan_id: str
    selected_services: list[str]

class ProjectIdea(BaseModel):
    title: str
    description: str
    idea_generated: bool = False

class SynopsisUpload(BaseModel):
    project_id: str
    needs_admin_help: bool = False

class AdminRequestCreate(BaseModel):
    request_type: str
    description: str

class ProfileUpdate(BaseModel):
    name: str
    phone: str

# Utility functions
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Security
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = get_user_by_email(user_id)  # user_id is email in our system
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return dict(user)

# Routes
@app.post("/api/login", response_model=Token)
async def login(user: UserLogin):
    db_user = verify_user_password(user.email, user.password)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": db_user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "phone": current_user["phone"],
        "created_at": current_user["created_at"]
    }

@app.get("/api/orders")
async def get_orders(current_user: dict = Depends(get_current_user)):
    orders = get_user_orders(current_user["id"])
    return [{"id": o["id"], "service_type": o["service_type"], "amount": o["amount"], "status": o["status"], "created_at": o["created_at"]} for o in orders]

@app.get("/api/projects")
async def get_projects(current_user: dict = Depends(get_current_user)):
    projects = get_user_projects(current_user["id"])
    return [{"id": p["id"], "name": p["name"], "type": p["type"], "status": p["status"], "file_path": p["file_path"], "created_at": p["created_at"]} for p in projects]

@app.get("/api/synopsis")
async def get_synopsis(current_user: dict = Depends(get_current_user)):
    synopsis = get_user_synopsis(current_user["id"])
    return [{"id": s["id"], "file_name": s["file_name"], "original_name": s["original_name"], "status": s["status"], "created_at": s["created_at"]} for s in synopsis]

@app.post("/api/synopsis/upload")
async def upload_synopsis(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    # Save file
    os.makedirs("uploads/synopsis", exist_ok=True)
    file_id = str(uuid.uuid4())
    file_path = f"uploads/synopsis/{file_id}.pdf"
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    # Save to DB
    create_synopsis(current_user["id"], file_path, file.filename)
    return {"message": "Synopsis uploaded successfully", "id": file_id}

@app.get("/api/blackbook/download")
async def download_blackbook():
    # Create a dummy blackbook if not exists
    os.makedirs("uploads/blackbook", exist_ok=True)
    blackbook_path = "uploads/blackbook/blackbook.pdf"
    if not os.path.exists(blackbook_path):
        with open(blackbook_path, "wb") as f:
            f.write(b"%%PDF-1.4\n%Dummy Blackbook Content\n")
    
    return FileResponse(blackbook_path, filename="BlackBook.pdf")

@app.post("/api/meetings/book")
async def book_meeting(current_user: dict = Depends(get_current_user)):
    meeting_id = create_meeting(current_user["id"], (datetime.now() + timedelta(days=1)).isoformat(), "One-on-one meet")
    return {"message": "Meeting booked successfully", "id": meeting_id}

@app.get("/api/meetings")
async def get_meetings(current_user: dict = Depends(get_current_user)):
    meetings = get_user_meetings(current_user["id"])
    return [{"id": m["id"], "scheduled_at": m["scheduled_at"], "status": m["status"], "notes": m["notes"], "created_at": m["created_at"]} for m in meetings]

# New Signup Flow APIs
@app.post("/api/signup")
async def signup(user: UserSignup):
    # Check if user already exists
    existing_user = get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_id = create_user(user.email, user.password, user.name, user.phone)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user_id, "signup_step": "plan_selection"}

@app.get("/api/plans")
async def get_available_plans():
    plans = get_plans()
    return [{
        "id": p["id"], 
        "name": p["name"], 
        "description": p["description"], 
        "price": p["price"], 
        "features": p["features"].split(","),
        "blog_included": bool(p["blog_included"]),
        "max_projects": p["max_projects"],
        "support_level": p["support_level"]
    } for p in plans]

@app.get("/api/services")
async def get_available_services():
    services = get_services()
    return [{
        "id": s["id"], 
        "name": s["name"], 
        "description": s["description"], 
        "price": s["price"], 
        "category": s["category"],
        "is_addon": bool(s["is_addon"])
    } for s in services]

@app.post("/api/select-plan")
async def select_plan(plan_data: PlanSelection, current_user: dict = Depends(get_current_user)):
    # Update user with selected plan
    update_user_plan(current_user["id"], plan_data.plan_id)
    
    # Add selected services
    if plan_data.selected_services:
        add_user_services(current_user["id"], plan_data.selected_services)
    
    return {"message": "Plan selected successfully", "next_step": "project_setup"}

@app.post("/api/create-project-idea")
async def create_project_idea(idea: ProjectIdea, current_user: dict = Depends(get_current_user)):
    project_id = create_user_project(current_user["id"], idea.title, idea.description, idea.idea_generated)
    return {"message": "Project idea created successfully", "project_id": project_id, "next_step": "synopsis_upload"}

@app.post("/api/upload-synopsis/{project_id}")
async def upload_project_synopsis(
    project_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    # Save file
    file_id = str(uuid.uuid4())
    file_path = f"uploads/synopsis/{file_id}.pdf"
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    # Update project with synopsis
    update_user_synopsis(project_id, file_path, file.filename)
    
    # Update user status
    with get_db() as conn:
        conn.execute("UPDATE users SET has_synopsis = 1, signup_step = 'completed', onboarding_completed = 1 WHERE id = ?", (current_user["id"],))
        conn.commit()
    
    return {"message": "Synopsis uploaded successfully", "project_id": project_id}

@app.post("/api/request-admin-help")
async def request_admin_help(request: AdminRequestCreate, current_user: dict = Depends(get_current_user)):
    request_id = create_admin_request(current_user["id"], request.request_type, request.description)
    return {"message": "Admin request created successfully", "request_id": request_id}

@app.get("/api/user/signup-status")
async def get_signup_status(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        user = conn.execute("SELECT signup_step, onboarding_completed, selected_plan_id FROM users WHERE id = ?", (current_user["id"],)).fetchone()
        return {
            "signup_step": user["signup_step"],
            "onboarding_completed": bool(user["onboarding_completed"]),
            "selected_plan_id": user["selected_plan_id"]
        }

@app.post("/api/complete-onboarding")
async def complete_onboarding(current_user: dict = Depends(get_current_user)):
    complete_user_onboarding(current_user["id"])
    return {"message": "Onboarding completed successfully"}

@app.put("/api/update-profile")
async def update_profile(profile_data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    update_user_profile(current_user["id"], profile_data.name, profile_data.phone)
    return {"message": "Profile updated successfully"}

@app.get('/health')
def health_check():
    return {"message": "running backend"}

# Initialize DB
init_db()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)