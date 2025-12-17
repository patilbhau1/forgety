import  { useState, useEffect } from 'react';
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Settings,
  Calendar,
  Edit3,
  Upload,
  Download,
  Book,
  Video,
  Package
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

const API_BASE = "https://newtyforge.onrender.com/api";

// Helper: Get JWT token from localStorage
const getToken = () => localStorage.getItem("token");

// Helper: API call with auth
const apiCall = async (endpoint: string, options: any = {}) => {
  const token = getToken();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
};

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    phone: "",
    joinedDate: ""
  });
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [synopsisFile, setSynopsisFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get current user
        const userData = await apiCall("/me");
        console.log("Dashboard user loaded:", userData);
        setUser(userData);
        setUserProfile({
          name: userData.name || "User",
          email: userData.email || "",
          phone: userData.phone || "+91 ",
          joinedDate: new Date(userData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        });

        // Fetch user orders
        const ordersData = await apiCall("/orders");
        console.log("Orders loaded:", ordersData);
        setOrders(ordersData);

        // Fetch user projects
        const projectsData = await apiCall("/projects");
        console.log("Projects loaded:", projectsData);
        setProjects(projectsData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        // Redirect to login if not authenticated
        window.location.href = "/login";
      }
    };

    fetchUser();
  }, []);

  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSynopsisUpload = async () => {
    if (!synopsisFile || !user) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", synopsisFile);

      const token = getToken();
      const res = await fetch(`${API_BASE}/synopsis/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const result = await res.json();

      alert('Synopsis uploaded successfully! Admin will review it soon.');
      setSynopsisFile(null);
    } catch (error) {
      alert('Error uploading synopsis: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleProjectDownload = async (projectId: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('projects')
        .download(`project_${projectId}.zip`);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_${projectId}.zip`;
      a.click();
    } catch (error) {
      alert('Error downloading project: ' + (error as Error).message);
    }
  };

  const handleBlackBookDownload = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/blackbook/download`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Download failed");
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'BlackBook.pdf';
      a.click();
    } catch (error) {
      alert('Error downloading black book: ' + (error as Error).message);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/update-profile`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userProfile.name,
          phone: userProfile.phone
        }),
      });

      if (!response.ok) throw new Error("Failed to update profile");
      
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {/* Profile Header - BIG AND CLEAR */}
        <div className="text-center mb-10">
          <div className="w-32 h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <UserIcon className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{userProfile.name}</h1>
          <p className="text-lg text-gray-600">{userProfile.email}</p>
          <p className="text-sm text-gray-500 mt-1">Member since {userProfile.joinedDate}</p>
        </div>

        {/* Profile Information */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              {isEditing ? 'Save' : 'Edit'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={userProfile.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <p className="text-gray-900 p-2 bg-gray-50 rounded">
                      {userProfile.email}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={userProfile.phone}
                      onChange={handleInputChange}
                      placeholder="+91 9876543210"
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <UserIcon className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{userProfile.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{userProfile.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{userProfile.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Member since</p>
                    <p className="font-medium">{userProfile.joinedDate}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Orders */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>My Orders</CardTitle>
            <CardDescription>Your order history and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No orders yet. Place your first order to get started!</p>
              ) : (
                orders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <h4 className="font-medium">Order #{order.id.slice(0, 8)}</h4>
                      <p className="text-sm text-gray-600">{order.service_type || 'Project Service'} • ₹{order.amount} • {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Projects */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>My Projects</CardTitle>
            <CardDescription>Your project history and downloads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No projects yet. Upload a synopsis to get started!</p>
              ) : (
                projects.map((project: any) => (
                  <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <h4 className="font-medium">{project.name || 'Unnamed Project'}</h4>
                      <p className="text-sm text-gray-600">{project.type || 'Software'} • {new Date(project.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                      {project.status === 'Approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProjectDownload(project.id)}
                          className="flex items-center gap-1"
                        >
                          <Download size={14} />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Actions - BIG AND CLEAR */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Profile Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Upload Synopsis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Your Synopsis (PDF)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSynopsisFile(e.target.files?.[0] || null)}
                    className="flex-1 text-sm border rounded-lg px-3 py-2"
                  />
                  <Button
                    size="default"
                    onClick={handleSynopsisUpload}
                    disabled={!synopsisFile || isUploading}
                    className="flex items-center gap-2"
                  >
                    <Upload size={16} />
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>

              {/* My Orders */}
              <Button variant="outline" className="h-auto p-6 flex-col">
                <Package className="w-8 h-8 mb-3" />
                <span className="font-medium">My Orders</span>
                <Badge variant="secondary" className="mt-2">{orders.length}</Badge>
              </Button>

              {/* Black Book */}
              <Button 
                variant="outline" 
                className="h-auto p-6 flex-col"
                onClick={handleBlackBookDownload}
              >
                <Book className="w-8 h-8 mb-3" />
                <span className="font-medium">Black Book</span>
              </Button>

              {/* One-on-One Meet */}
              <Button 
                variant="outline" 
                className="h-auto p-6 flex-col"
                onClick={async () => {
                  try {
                    await apiCall("/meetings/book", { method: "POST" });
                    alert("Meeting booked successfully!");
                  } catch (error) {
                    alert("Failed to book meeting");
                  }
                }}
              >
                <Video className="w-8 h-8 mb-3" />
                <span className="font-medium">Book Meet</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      
      {/* Bottom spacing for better UX */}
      <div className="h-16 sm:h-20"></div>
    </div>
  );
};

export default Dashboard;