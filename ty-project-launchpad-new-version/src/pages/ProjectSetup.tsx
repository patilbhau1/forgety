import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Lightbulb, FileText, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useDropzone } from "react-dropzone";

const ProjectSetup = () => {
  const [activeTab, setActiveTab] = useState<"upload" | "generate">("upload");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
      toast({
        title: "File uploaded",
        description: `${file.name} uploaded successfully`,
      });
    } else {
      toast({
        title: "Error",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  });

  const handleSynopsisUpload = async () => {
    if (!uploadedFile) {
      toast({
        title: "Error",
        description: "Please upload your synopsis PDF",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const token = localStorage.getItem("tyforge_token");
      
      // First create a project entry
      const projectResponse = await fetch("http://localhost:8000/api/create-project-idea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: "User Provided Project",
          description: "Project with user-provided synopsis",
          idea_generated: false,
        }),
      });

      if (!projectResponse.ok) throw new Error("Failed to create project");
      
      const projectData = await projectResponse.json();
      
      // Upload the synopsis file
      const formData = new FormData();
      formData.append("file", uploadedFile);
      
      const uploadResponse = await fetch(
        `http://localhost:8000/api/upload-synopsis/${projectData.project_id}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) throw new Error("Failed to upload synopsis");
      
      toast({
        title: "Success",
        description: "Synopsis uploaded successfully! Redirecting to dashboard...",
      });
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIdeaGeneration = async () => {
    if (!projectTitle || !projectDescription) {
      toast({
        title: "Error",
        description: "Please provide both project title and description",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const token = localStorage.getItem("tyforge_token");
      
      const response = await fetch("http://localhost:8000/api/create-project-idea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: projectTitle,
          description: projectDescription,
          idea_generated: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to create project idea");
      
      toast({
        title: "Success",
        description: "Project idea created! You can now request admin help for synopsis.",
      });
      
      // Redirect to admin request page or dashboard
      navigate("/request-admin-help");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestAdminHelp = () => {
    navigate("/request-admin-help");
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Set Up Your Project
            </h1>
            <p className="text-xl text-gray-600">
              You can either upload your existing project synopsis or let us help you generate a new project idea
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-lg">
              <button
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === "upload"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setActiveTab("upload")}
              >
                <Upload className="inline-block w-4 h-4 mr-2" />
                Upload Synopsis
              </button>
              <button
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === "generate"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setActiveTab("generate")}
              >
                <Lightbulb className="inline-block w-4 h-4 mr-2" />
                Generate Idea
              </button>
            </div>
          </div>

          {activeTab === "upload" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Upload Your Synopsis</CardTitle>
                <CardDescription>
                  Already have a project synopsis? Upload it here and we'll review it for approval.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                    isDragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <input {...getInputProps()} />
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {isDragActive ? "Drop your PDF here" : "Drag & drop your synopsis PDF here"}
                  </p>
                  <p className="text-gray-600">
                    or click to browse and select your file
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Only PDF files are accepted (max 10MB)
                  </p>
                </div>

                {uploadedFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">{uploadedFile.name}</span>
                      <span className="text-green-600 ml-2">({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/select-plan")}
                    disabled={isProcessing}
                  >
                    Back to Plans
                  </Button>
                  <Button
                    onClick={handleSynopsisUpload}
                    disabled={isProcessing || !uploadedFile}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        Upload Synopsis
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Generate New Project Idea</CardTitle>
                <CardDescription>
                  Don't have a project idea? Let us help you create one based on your interests and requirements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter your project title or area of interest"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Project Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your project idea, requirements, or what you want to achieve..."
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={6}
                    className="text-base"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Lightbulb className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Need help with your idea?</h4>
                      <p className="text-blue-800 text-sm">
                        Our AI-powered system can help generate project ideas based on your interests. 
                        After submitting your basic idea, you can request expert consultation for synopsis development.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/select-plan")}
                    disabled={isProcessing}
                  >
                    Back to Plans
                  </Button>
                  <div className="space-x-3">
                    <Button
                      variant="secondary"
                      onClick={handleRequestAdminHelp}
                      disabled={isProcessing}
                    >
                      Request Admin Help
                    </Button>
                    <Button
                      onClick={handleIdeaGeneration}
                      disabled={isProcessing || !projectTitle || !projectDescription}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Generate Idea
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProjectSetup;