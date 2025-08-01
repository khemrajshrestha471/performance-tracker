"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  Edit,
  MoreHorizontal,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { toast } from "sonner";

// Mock data for skills and attendance
const skillsData = [
  { skill: "Technical Skills", score: 95 },
  { skill: "Communication", score: 88 },
  { skill: "Leadership", score: 82 },
  { skill: "Problem Solving", score: 92 },
  { skill: "Teamwork", score: 90 },
];

const attendanceData = [
  { month: "Jan", present: 22, absent: 0 },
  { month: "Feb", present: 20, absent: 1 },
  { month: "Mar", present: 23, absent: 0 },
  { month: "Apr", present: 21, absent: 1 },
  { month: "May", present: 22, absent: 1 },
  { month: "Jun", present: 21, absent: 0 },
];

interface EmployeeData {
  personal_details: {
    employee_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    date_of_birth: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    current_address: string;
    permanent_address: string;
    marital_status: string;
    blood_group: string;
    created_at: string;
  };
  department_history: {
    history_id: number;
    department_name: string;
    designation: string;
    start_date: string;
    end_date: string | null;
    reporting_manager_id: string | null;
    is_active: boolean;
    salary_per_month_npr: string;
    created_at: string;
  }[];
  performance_history: {
    performance_id: number;
    employee_id: string;
    employee_name: string;
    review_date: string;
    reviewer_id: string;
    reviewer_name: string | null;
    performance_score: string;
    key_strengths: string;
    areas_for_improvement: string;
    goals_achieved: string;
    next_period_goals: string;
    feedback: string;
    promotion_eligible: boolean;
    bonus_awarded: string;
    created_at: string;
  }[];
}

interface Goal {
  id: number;
  title: string;
  description: string;
  progress: number;
  deadline: string;
  status: "Completed" | "In Progress" | "Not Started";
}

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await fetch(`/api/get-all-records-of-employee/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch employee data");
        }
        const data = await response.json();
        if (data.success) {
          setEmployee(data.data);
          // Process goals from performance history
          if (
            data.data.performance_history &&
            data.data.performance_history.length > 0
          ) {
            const latestPerformance = data.data.performance_history[0];
            const processedGoals = processGoals(
              latestPerformance.goals_achieved,
              latestPerformance.next_period_goals
            );
            setGoals(processedGoals);
          }
        } else {
          throw new Error(data.message || "Failed to fetch employee data");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [id]);

  const processGoals = (achievedGoals: string, nextGoals: string): Goal[] => {
    const completedGoals = achievedGoals
      .split(",")
      .map((goal) => goal.trim())
      .filter((goal) => goal.length > 0)
      .map((goal, index) => ({
        id: index + 1,
        title: goal,
        description: goal,
        progress: 100,
        deadline: new Date(new Date().setMonth(new Date().getMonth() - 1))
          .toISOString()
          .split("T")[0],
        status: "Completed" as const,
      }));

    const inProgressGoals = nextGoals
      .split(",")
      .map((goal) => goal.trim())
      .filter((goal) => goal.length > 0)
      .map((goal, index) => ({
        id: completedGoals.length + index + 1,
        title: goal,
        description: goal,
        progress: Math.floor(Math.random() * 70) + 10, // Random progress between 10-80%
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 3))
          .toISOString()
          .split("T")[0],
        status: "In Progress" as const,
      }));

    return [...completedGoals, ...inProgressGoals];
  };

  const handleDeleteEmployee = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/employee-register/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete employee");
      }

      const data = await response.json();
      if (data.success) {
        toast.success("Employee deleted successfully");
        router.push("/employees"); // Redirect to employees list
      } else {
        throw new Error(data.message || "Failed to delete employee");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete employee"
      );
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge variant="default">Active</Badge>
    ) : (
      <Badge variant="destructive">Inactive</Badge>
    );
  };

  const getGoalStatusBadge = (status: string) => {
    if (status === "Completed")
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    if (status === "In Progress")
      return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            <Skeleton className="h-64" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!employee) {
    return <div className="text-muted-foreground">No employee data found</div>;
  }

  // Get current department details
  const currentDepartment =
    employee.department_history.find((dept) => dept.is_active) ||
    employee.department_history[0];
  // Get latest performance review
  const latestPerformance =
    employee.performance_history.length > 0
      ? employee.performance_history[0]
      : null;

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Employee Details
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Comprehensive view of employee information and performance
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/employees/${employee.personal_details.employee_id}/edit`}
          >
            <Button
              variant="outline"
              className="sm:size-default bg-transparent"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            className="sm:size-default bg-transparent bg-red-500 hover:bg-red-600"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
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
                  <AvatarImage
                    src="/placeholder.svg"
                    alt={`${employee.personal_details.first_name} ${employee.personal_details.last_name}`}
                  />
                  <AvatarFallback className="text-lg">
                    {employee.personal_details.first_name[0]}
                    {employee.personal_details.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg sm:text-xl">
                  {employee.personal_details.first_name}{" "}
                  {employee.personal_details.last_name}
                </CardTitle>
                <CardDescription className="text-sm">
                  {currentDepartment?.designation}
                </CardDescription>
                {getStatusBadge(currentDepartment?.is_active ?? false)}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">
                    {employee.personal_details.email}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{employee.personal_details.phone_number}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">
                    {employee.personal_details.current_address}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>
                    Joined{" "}
                    {new Date(
                      employee.personal_details.created_at
                    ).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  Employee Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Department
                    </h4>
                    <p className="text-sm font-medium">
                      {currentDepartment?.department_name}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Employee ID
                    </h4>
                    <p className="text-sm font-medium">
                      {employee.personal_details.employee_id}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Designation
                    </h4>
                    <p className="text-sm font-medium">
                      {currentDepartment?.designation}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Date of Birth
                    </h4>
                    <p className="text-sm font-medium">
                      {new Date(
                        employee.personal_details.date_of_birth
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Marital Status
                    </h4>
                    <p className="text-sm font-medium">
                      {employee.personal_details.marital_status}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Emergency Contact
                    </h4>
                    <p className="text-sm font-medium">
                      {employee.personal_details.emergency_contact_name} (
                      {employee.personal_details.emergency_contact_phone})
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Blood Group
                    </h4>
                    <p className="text-sm font-medium">
                      {employee.personal_details.blood_group}
                    </p>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Permanent Address
                  </h4>
                  <p className="text-sm">
                    {employee.personal_details.permanent_address}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {latestPerformance ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    Latest Performance Review
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Review from{" "}
                    {new Date(
                      latestPerformance.review_date
                    ).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Performance Score</h4>
                    <div className="flex items-center gap-4">
                      <Progress
                        value={parseFloat(latestPerformance.performance_score)}
                        className="h-2 flex-1"
                      />
                      <span className="font-medium">
                        {latestPerformance.performance_score}%
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Key Strengths
                      </h4>
                      <p className="text-sm">
                        {latestPerformance.key_strengths}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Areas for Improvement
                      </h4>
                      <p className="text-sm">
                        {latestPerformance.areas_for_improvement}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Feedback
                    </h4>
                    <p className="text-sm">{latestPerformance.feedback}</p>
                  </div>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Bonus Awarded
                      </h4>
                      <p className="text-sm">
                        NPR {latestPerformance.bonus_awarded}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Promotion Eligible
                      </h4>
                      <div className="text-sm">
                        {latestPerformance.promotion_eligible ? (
                          <Badge variant="default">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    Performance Review
                  </CardTitle>
                  <CardDescription className="text-sm">
                    No performance reviews available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    No performance data found for this employee
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  Skills Assessment
                </CardTitle>
                <CardDescription className="text-sm">
                  Current skill levels and competencies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {skillsData.map((skill) => (
                  <div key={skill.skill} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="truncate">{skill.skill}</span>
                      <span className="font-medium shrink-0">
                        {skill.score}%
                      </span>
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
              <CardTitle className="text-lg sm:text-xl">
                Goals & Objectives
              </CardTitle>
              <CardDescription className="text-sm">
                Current and completed goals for this employee
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.length > 0 ? (
                goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="font-medium">{goal.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {goal.description}
                        </p>
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
                      <span>
                        Deadline: {new Date(goal.deadline).toLocaleDateString()}
                      </span>
                      <span>{goal.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No goals data found for this employee
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Attendance Overview
              </CardTitle>
              <CardDescription className="text-sm">
                Monthly attendance tracking
              </CardDescription>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              {employee.personal_details.first_name}&apos;s record from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmployee}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
