"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Tooltip,
  Legend,
} from "recharts";
import {
  Download,
  FileText,
  TrendingUp,
  Users,
  Target,
  Award,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipProps } from "recharts";

interface AttendanceTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: {
    value: number;
    name: string;
    payload: {
      department: string;
      attendance: number;
    };
  }[];
  label?: string;
}

// Mock data generators with realistic variations
const generatePerformanceByDepartment = (quarter: string) => {
  const baseData = [
    {
      department: "Engineering",
      q1Score: 8.4,
      q2Score: 8.6,
      q3Score: 8.8,
      q1Employees: 42,
      q2Employees: 45,
      q3Employees: 47,
    },
    {
      department: "Sales",
      q1Score: 8.0,
      q2Score: 8.3,
      q3Score: 8.5,
      q1Employees: 30,
      q2Employees: 32,
      q3Employees: 34,
    },
    {
      department: "Marketing",
      q1Score: 7.8,
      q2Score: 8.0,
      q3Score: 8.2,
      q1Employees: 25,
      q2Employees: 28,
      q3Employees: 30,
    },
    {
      department: "HR",
      q1Score: 8.2,
      q2Score: 8.4,
      q3Score: 8.6,
      q1Employees: 14,
      q2Employees: 15,
      q3Employees: 16,
    },
    {
      department: "Finance",
      q1Score: 7.9,
      q2Score: 8.1,
      q3Score: 8.3,
      q1Employees: 11,
      q2Employees: 12,
      q3Employees: 13,
    },
    {
      department: "Operations",
      q1Score: 7.7,
      q2Score: 7.9,
      q3Score: 8.1,
      q1Employees: 18,
      q2Employees: 20,
      q3Employees: 22,
    },
  ];

  return baseData.map((dept) => ({
    department: dept.department,
    avgScore:
      quarter === "q1-2024"
        ? dept.q1Score
        : quarter === "q2-2024"
        ? dept.q2Score
        : dept.q3Score,
    employees:
      quarter === "q1-2024"
        ? dept.q1Employees
        : quarter === "q2-2024"
        ? dept.q2Employees
        : dept.q3Employees,
  }));
};

const generateGoalCompletionData = (quarter: string) => {
  if (quarter === "q1-2024") {
    return [
      { name: "Completed", value: 55, color: "#10B981" },
      { name: "In Progress", value: 35, color: "#3B82F6" },
      { name: "Not Started", value: 10, color: "#6B7280" },
    ];
  } else if (quarter === "q2-2024") {
    return [
      { name: "Completed", value: 65, color: "#10B981" },
      { name: "In Progress", value: 28, color: "#3B82F6" },
      { name: "Not Started", value: 7, color: "#6B7280" },
    ];
  } else {
    return [
      { name: "Completed", value: 70, color: "#10B981" },
      { name: "In Progress", value: 25, color: "#3B82F6" },
      { name: "Not Started", value: 5, color: "#6B7280" },
    ];
  }
};

const generatePerformanceTrend = (quarter: string) => {
  if (quarter === "q1-2024") {
    return [
      { month: "Jan", score: 8.0 },
      { month: "Feb", score: 8.1 },
      { month: "Mar", score: 8.2 },
    ];
  } else if (quarter === "q2-2024") {
    return [
      { month: "Apr", score: 8.3 },
      { month: "May", score: 8.2 },
      { month: "Jun", score: 8.4 },
    ];
  } else {
    return [
      { month: "Jul", score: 8.5 },
      { month: "Aug", score: 8.6 },
      { month: "Sep", score: 8.7 },
    ];
  }
};

const generateTopPerformers = (quarter: string) => {
  if (quarter === "q1-2024") {
    return [
      { name: "Sarah Johnson", department: "Engineering", score: 9.1 },
      { name: "Michael Chen", department: "Sales", score: 8.9 },
      { name: "Emily Davis", department: "Marketing", score: 8.7 },
      { name: "David Wilson", department: "Engineering", score: 8.6 },
      { name: "Lisa Anderson", department: "HR", score: 8.5 },
    ];
  } else if (quarter === "q2-2024") {
    return [
      { name: "Sarah Johnson", department: "Engineering", score: 9.3 },
      { name: "Michael Chen", department: "Sales", score: 9.1 },
      { name: "Robert Taylor", department: "Operations", score: 8.9 },
      { name: "Emily Davis", department: "Marketing", score: 8.8 },
      { name: "David Wilson", department: "Engineering", score: 8.7 },
    ];
  } else {
    return [
      { name: "Sarah Johnson", department: "Engineering", score: 9.4 },
      { name: "Michael Chen", department: "Sales", score: 9.2 },
      { name: "Jennifer Lee", department: "Finance", score: 9.0 },
      { name: "Robert Taylor", department: "Operations", score: 8.9 },
      { name: "Emily Davis", department: "Marketing", score: 8.8 },
    ];
  }
};

const generateAttendanceData = (quarter: string) => {
  if (quarter === "q1-2024") {
    return [
      { department: "Engineering", attendance: 95.2 },
      { department: "Sales", attendance: 93.5 },
      { department: "Marketing", attendance: 91.8 },
      { department: "HR", attendance: 97.1 },
      { department: "Finance", attendance: 94.3 },
      { department: "Operations", attendance: 92.7 },
    ];
  } else if (quarter === "q2-2024") {
    return [
      { department: "Engineering", attendance: 96.1 },
      { department: "Sales", attendance: 94.3 },
      { department: "Marketing", attendance: 92.5 },
      { department: "HR", attendance: 97.8 },
      { department: "Finance", attendance: 95.0 },
      { department: "Operations", attendance: 93.4 },
    ];
  } else {
    return [
      { department: "Engineering", attendance: 96.8 },
      { department: "Sales", attendance: 95.0 },
      { department: "Marketing", attendance: 93.2 },
      { department: "HR", attendance: 98.3 },
      { department: "Finance", attendance: 95.7 },
      { department: "Operations", attendance: 94.1 },
    ];
  }
};

const generateReportStats = (quarter: string) => {
  if (quarter === "q1-2024") {
    return {
      totalEmployees: 140,
      avgPerformance: 8.1,
      goalCompletion: 55,
      avgAttendance: 94.1,
    };
  } else if (quarter === "q2-2024") {
    return {
      totalEmployees: 152,
      avgPerformance: 8.3,
      goalCompletion: 65,
      avgAttendance: 95.0,
    };
  } else {
    return {
      totalEmployees: 162,
      avgPerformance: 8.5,
      goalCompletion: 70,
      avgAttendance: 95.8,
    };
  }
};

export default function ReportsPage() {
  const [selectedQuarter, setSelectedQuarter] = useState("q2-2024");

  const handleDownloadReport = (reportType: string) => {
    console.log(`Downloading ${reportType} report for ${selectedQuarter}...`);
  };

  // Generate data based on selected quarter
  const performanceByDepartment =
    generatePerformanceByDepartment(selectedQuarter);
  const goalCompletionData = generateGoalCompletionData(selectedQuarter);
  const performanceTrend = generatePerformanceTrend(selectedQuarter);
  const topPerformers = generateTopPerformers(selectedQuarter);
  const attendanceData = generateAttendanceData(selectedQuarter);
  const reportStats = generateReportStats(selectedQuarter);

  const AttendanceTooltip = ({
    active,
    payload,
    label,
  }: AttendanceTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-4 border rounded-lg shadow-sm bg-blue-500 text-white">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            <span>Attendance: </span>
            <span className="font-medium">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Comprehensive insights into team performance and productivity
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="q1-2024">Q1 2024</SelectItem>
              <SelectItem value="q2-2024">Q2 2024</SelectItem>
              <SelectItem value="q3-2024">Q3 2024</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => handleDownloadReport("comprehensive")}
            className="shrink-0"
            disabled
          >
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
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {reportStats.totalEmployees}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedQuarter === "q1-2024"
                ? "+6% from last quarter"
                : selectedQuarter === "q2-2024"
                ? "+9% from last quarter"
                : "+7% from last quarter"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Avg Performance
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {reportStats.avgPerformance}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedQuarter === "q1-2024"
                ? "+0.2 from last quarter"
                : selectedQuarter === "q2-2024"
                ? "+0.2 from last quarter"
                : "+0.2 from last quarter"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Goal Completion
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {reportStats.goalCompletion}%
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedQuarter === "q1-2024"
                ? "+7% from last quarter"
                : selectedQuarter === "q2-2024"
                ? "+10% from last quarter"
                : "+5% from last quarter"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Avg Attendance
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {reportStats.avgAttendance}%
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedQuarter === "q1-2024"
                ? "+0.8% from last quarter"
                : selectedQuarter === "q2-2024"
                ? "+0.9% from last quarter"
                : "+0.8% from last quarter"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Performance by Department */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              Performance by Department
            </CardTitle>
            <CardDescription className="text-sm">
              Average performance scores across departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* <ChartContainer> */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceByDepartment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis domain={[7.5, 9]} />
                  <Tooltip />
                  <Bar
                    dataKey="avgScore"
                    fill="#2A6EF4"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* </ChartContainer> */}
          </CardContent>
        </Card>

        {/* Goal Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              Goal Completion Rate
            </CardTitle>
            <CardDescription className="text-sm">
              Overall goal completion status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* <ChartContainer> */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={goalCompletionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    // label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    label={({ name, percent = 0 }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {goalCompletionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* </ChartContainer> */}
          </CardContent>
        </Card>

        {/* Performance Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              Performance Trend
            </CardTitle>
            <CardDescription className="text-sm">
              Monthly performance trend over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* <ChartContainer> */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[7.8, 8.8]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* </ChartContainer> */}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Top Performers</CardTitle>
            <CardDescription className="text-sm">
              Highest rated employees this quarter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div
                key={performer.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {performer.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {performer.department}
                    </p>
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
          <CardTitle className="text-lg sm:text-xl">
            Attendance by Department
          </CardTitle>
          <CardDescription className="text-sm">
            Department-wise attendance rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* <ChartContainer> */}
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={attendanceData}
                layout="vertical"
                margin={{ left: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[90, 100]} />
                <YAxis dataKey="department" type="category" width={100} />
                <Tooltip content={<AttendanceTooltip />} />
                <Bar
                  dataKey="attendance"
                  fill="#2A6EF4"
                  // radius={[0, 4, 4, 0]}
                  // name="Attendance"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* </ChartContainer> */}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Quick Reports</CardTitle>
          <CardDescription className="text-sm">
            Generate and download specific reports
          </CardDescription>
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
  );
}
