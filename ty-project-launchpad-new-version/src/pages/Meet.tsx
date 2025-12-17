import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar } from "lucide-react";
import { useEffect, useState } from "react";

import { getApiBase } from "@/lib/env";
const API_BASE = getApiBase();
const getToken = () => localStorage.getItem("token");

const Meet = () => {
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await fetch(`${API_BASE}/meetings`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setMeetings(data);
      } catch (error) {
        alert("Failed to load meetings");
      }
    };
    fetchMeetings();
  }, []);

  const handleBook = async () => {
    try {
      const res = await fetch(`${API_BASE}/meetings/book`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Booking failed");
      alert("Meeting booked successfully!");
      // Refresh
      const newRes = await fetch(`${API_BASE}/meetings`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setMeetings(await newRes.json());
    } catch (error) {
      alert("Booking failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Video className="w-6 h-6 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">One-on-One Meet</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Book New Meeting</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">Schedule a one-on-one session with our team.</p>
            <Button onClick={handleBook}>
              <Calendar size={16} className="mr-2" />
              Book Meeting
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            {meetings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No meetings scheduled.</p>
            ) : (
              <div className="space-y-3">
                {meetings.map((meet: any) => (
                  <div key={meet.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">One-on-One Session</p>
                      <p className="text-sm text-gray-600">{new Date(meet.scheduled_at).toLocaleString()}</p>
                    </div>
                    <Badge className={meet.status === "Scheduled" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                      {meet.status}
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

export default Meet;