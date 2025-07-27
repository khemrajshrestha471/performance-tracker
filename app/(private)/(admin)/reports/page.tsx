"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Download, FileText, TrendingUp, Users, Target, Award } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data
const performanceByDepartment = [
  { department: "Engineering", avgScore: 8.7, employees: 45 },
  { department: "Sales", avgScore: 8.3, employees: 32 },
  { department: "Marketing", avgScore: 8.1, employees: 28 },
  { department: "HR", avgScore: 8.5, employees: 15 },
  { department: "Finance", avgScore: 8.2, employees: 12 },
]

const goalCompletionData = [
  { name: "Completed", value: 68, color: "#10B981" },
  { name: "In Progress", value: 25, color: "#3B82F6" },
  { name: "Not Started", value: 7, color: "#6B7280" },
]

const performanceTrend = [
  { month: "Jan", score: 8.1 },
  { month: "Feb", score: 8.2 },
  { month: "Mar", score: 8.0 },
  { month: "Apr", score: 8.4 },
  { month: "May", score: 8.3 },
  { month: "Jun", score: 8.5 },
]

const topPerformers = [
  { name: "Sarah Johnson", department: "Engineering", score: 9.2 },
  { name: "Mike Chen", department: "Sales", score: 9.0 },
  { name: "Emily Davis", department: "Marketing", score: 8.8 },
  { name: "David Wilson", department: "Engineering", score: 8.7 },
  { name: "Lisa Anderson", department: "HR", score: 8.6 },
]

const attendanceData = [
  { department: "Engineering", attendance: 96 },
  { department: "Sales", attendance: 94 },
  { department: "Marketing", attendance: 92 },
  { department: "HR", attendance: 98 },
  { department: "Finance", attendance: 95 },
]

const reportStats = {
  totalEmployees: 132,
  avgPerformance: 8.4,
  goalCompletion: 68,
  avgAttendance: 95,
}

export default function ReportsPage() {
  const handleDownloadReport = (reportType: string) => {
    // Mock PDF download functionality
    console.log(`Downloading ${reportType} report...`)
    // In a real app, this would generate and download a PDF
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Comprehensive insights into team performance and productivity
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select defaultValue="q2-2024">
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="q1-2024">Q1 2024</SelectItem>
              <SelectItem value="q2-2024">Q2 2024</SelectItem>
              <SelectItem value="q3-2024">Q3 2024</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => handleDownloadReport("comprehensive")} className="shrink-0">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Download Report</span>
            <span className="sm:hidden">Download</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{reportStats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">+8% from last quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{reportStats.avgPerformance}</div>
            <p className="text-xs text-muted-foreground">+0.2 from last quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Goal Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{reportStats.goalCompletion}%</div>
            <p className="text-xs text-muted-foreground">+12% from last quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg Attendance</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{reportStats.avgAttendance}%</div>
            <p className="text-xs text-muted-foreground">+1% from last quarter</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Performance by Department */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Performance by Department</CardTitle>
            <CardDescription className="text-sm">Average performance scores across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                avgScore: {
                  label: "Average Score",
                  color: "#2A6EF4",
                },
              }}
              className="h-[250px] sm:h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceByDepartment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis domain={[7.5, 9]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="avgScore" fill="#2A6EF4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Goal Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Goal Completion Rate</CardTitle>
            <CardDescription className="text-sm">Overall goal completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Goals",
                },
              }}
              className="h-[250px] sm:h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={goalCompletionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {goalCompletionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-4 space-y-2">
              {goalCompletionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="font-medium shrink-0">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Performance Trend</CardTitle>
            <CardDescription className="text-sm">Monthly performance trend over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                score: {
                  label: "Performance Score",
                  color: "#10B981",
                },
              }}
              className="h-[250px] sm:h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[7.5, 9]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Top Performers</CardTitle>
            <CardDescription className="text-sm">Highest rated employees this quarter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={performer.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{performer.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{performer.department}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {performer.score}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Attendance by Department */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Attendance by Department</CardTitle>
          <CardDescription className="text-sm">Department-wise attendance rates</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              attendance: {
                label: "Attendance %",
                color: "#F59E0B",
              },
            }}
            className="h-[200px] sm:h-[250px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[90, 100]} />
                <YAxis dataKey="department" type="category" width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="attendance" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Quick Reports</CardTitle>
          <CardDescription className="text-sm">Generate and download specific reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-16 sm:h-20 flex-col gap-2 bg-transparent"
              onClick={() => handleDownloadReport("performance")}
            >
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm">Performance Report</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 sm:h-20 flex-col gap-2 bg-transparent"
              onClick={() => handleDownloadReport("goals")}
            >
              <Target className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm">Goals Report</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 sm:h-20 flex-col gap-2 bg-transparent"
              onClick={() => handleDownloadReport("attendance")}
            >
              <Award className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm">Attendance Report</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 sm:h-20 flex-col gap-2 bg-transparent"
              onClick={() => handleDownloadReport("department")}
            >
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm">Department Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
