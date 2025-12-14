import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText } from "lucide-react";
import { useEffect, useState } from "react";

const API_BASE = "https://newtyforge.onrender.com/api";
const getToken = () => localStorage.getItem("tyforge_token");

const Synopsis = () => {
  const [files, setFiles] = useState([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch(`${API_BASE}/synopsis`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setFiles(data);
      } catch (error) {
        alert("Failed to load synopsis");
      }
    };
    fetchFiles();
  }, []);

  const handleUpload = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const res = await fetch(`${API_BASE}/synopsis/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      alert("Uploaded successfully");
      setUploadFile(null);
      // Refresh
      const newRes = await fetch(`${API_BASE}/synopsis`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setFiles(await newRes.json());
    } catch (error) {
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">My Synopsis</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload New Synopsis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="flex-1 text-sm border rounded-lg px-3 py-2"
              />
              <Button onClick={handleUpload} disabled={!uploadFile || isUploading}>
                <Upload size={16} className="mr-2" />
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Previous Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No uploads yet.</p>
            ) : (
              <div className="space-y-3">
                {files.map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{file.original_name}</p>
                        <p className="text-sm text-gray-600">{new Date(file.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge className={file.status === "Approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                      {file.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Synopsis;