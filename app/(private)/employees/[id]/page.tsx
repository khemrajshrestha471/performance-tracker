"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { CalendarDays, Mail, MapPin, Phone, Edit, MoreHorizontal } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Mock data for employee details
const employee = {
  id: 1,
  name: "Sarah Johnson",
  email: "sarah.johnson@acmecorp.com",
  phone: "+1 (555) 123-4567",
  department: "Engineering",
  position: "Senior Developer",
  manager: "John Smith",
  location: "San Francisco, CA",
  joinDate: "2022-03-15",
  status: "Active",
  avatar: "/placeholder.svg?height=120&width=120",
  bio: "Experienced software developer with expertise in React, Node.js, and cloud technologies. Passionate about building scalable applications and mentoring junior developers.",
}

const performanceHistory = [
  { period: "Q1 2023", score: 8.5 },
  { period: "Q2 2023", score: 8.8 },
  { period: "Q3 2023", score: 9.0 },
  { period: "Q4 2023", score: 9.2 },
  { period: "Q1 2024", score: 9.1 },
  { period: "Q2 2024", score: 9.3 },
]

const skillsData = [
  { skill: "Technical Skills", score: 95 },
  { skill: "Communication", score: 88 },
  { skill: "Leadership", score: 82 },
  { skill: "Problem Solving", score: 92 },
  { skill: "Teamwork", score: 90 },
]

const goals = [
  {
    id: 1,
    title: "Complete React Native certification",
    description: "Obtain certification in React Native development",
    progress: 75,
    deadline: "2024-08-15",
    status: "In Progress",
  },
  {
    id: 2,
    title: "Lead team project migration",
    description: "Successfully migrate legacy system to new architecture",
    progress: 100,
    deadline: "2024-06-30",
    status: "Completed",
  },
  {
    id: 3,
    title: "Mentor 2 junior developers",
    description: "Provide guidance and support to junior team members",
    progress: 60,
    deadline: "2024-12-31",
    status: "In Progress",
  },
]

const attendanceData = [
  { month: "Jan", present: 22, absent: 0 },
  { month: "Feb", present: 20, absent: 1 },
  { month: "Mar", present: 23, absent: 0 },
  { month: "Apr", present: 21, absent: 1 },
  { month: "May", present: 22, absent: 1 },
  { month: "Jun", present: 21, absent: 0 },
]

export default function EmployeeDetailPage() {
  const getStatusBadge = (status: string) => {
    if (status === "Active") return <Badge variant="default">Active</Badge>
    if (status === "On Leave") return <Badge variant="secondary">On Leave</Badge>
    return <Badge variant="destructive">Inactive</Badge>
  }

  const getGoalStatusBadge = (status: string) => {
    if (status === "Completed") return <Badge className="bg-green-100 text-green-800">Completed</Badge>
    if (status === "In Progress") return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
    return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Employee Details</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Comprehensive view of employee information and performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="sm:size-default bg-transparent">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="sm:size-default bg-transparent">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="text-xs sm:text-sm">
            Profile
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-xs sm:text-sm">
            Performance
          </TabsTrigger>
          <TabsTrigger value="goals" className="text-xs sm:text-sm">
            Goals
          </TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs sm:text-sm">
            Attendance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader className="text-center">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 mx-auto">
                  <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.name} />
                  <AvatarFallback className="text-lg">
                    {employee.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg sm:text-xl">{employee.name}</CardTitle>
                <CardDescription className="text-sm">{employee.position}</CardDescription>
                {getStatusBadge(employee.status)}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{employee.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{employee.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Joined {new Date(employee.joinDate).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Employee Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Department</h4>
                    <p className="text-sm font-medium">{employee.department}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Manager</h4>
                    <p className="text-sm font-medium">{employee.manager}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Employee ID</h4>
                    <p className="text-sm font-medium">EMP-{employee.id.toString().padStart(4, "0")}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Employment Type</h4>
                    <p className="text-sm font-medium">Full-time</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Bio</h4>
                  <p className="text-sm">{employee.bio}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Performance Trend</CardTitle>
                <CardDescription className="text-sm">Quarterly performance scores over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    score: {
                      label: "Performance Score",
                      color: "#2A6EF4",
                    },
                  }}
                  className="h-[250px] sm:h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis domain={[8, 10]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#2A6EF4"
                        strokeWidth={2}
                        dot={{ fill: "#2A6EF4" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Skills Assessment</CardTitle>
                <CardDescription className="text-sm">Current skill levels and competencies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {skillsData.map((skill) => (
                  <div key={skill.skill} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="truncate">{skill.skill}</span>
                      <span className="font-medium shrink-0">{skill.score}%</span>
                    </div>
                    <Progress value={skill.score} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Goals & Objectives</CardTitle>
              <CardDescription className="text-sm">Current and completed goals for this employee</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="font-medium">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                    {getGoalStatusBadge(goal.status)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between gap-2 text-sm text-muted-foreground">
                    <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                    <span>{goal.status}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Attendance Overview</CardTitle>
              <CardDescription className="text-sm">Monthly attendance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  present: {
                    label: "Present",
                    color: "#10B981",
                  },
                  absent: {
                    label: "Absent",
                    color: "#EF4444",
                  },
                }}
                className="h-[250px] sm:h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="present" fill="#10B981" />
                    <Bar dataKey="absent" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
