"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { apiAxios } from "@/lib/apiAxios";

interface Employee {
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
    end_date: string;
    reporting_manager_id: string | null;
    is_active: boolean;
    salary_per_month_npr: string;
    created_at: string;
  }[];
  performance_history: {
    performance_id: number;
    performance_score: string;
    review_date: string;
    promotion_eligible: boolean;
    bonus_awarded: string;
  }[];
}

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await apiAxios.get("/get-all-records-of-employee");
        if (response.data.success) {
          setEmployees(response.data.data);
        } else {
          setError(response.data.message || "Failed to fetch employees");
        }
      } catch (err) {
        setError("Failed to fetch employees");
        console.error("Error fetching employees:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter((employee) => {
    const fullName = `${employee.personal_details.first_name} ${employee.personal_details.last_name}`;
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.personal_details.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const currentDepartment =
      employee.department_history.find((d) => d.is_active)?.department_name ||
      "";
    const matchesDepartment =
      departmentFilter === "all" || currentDepartment === departmentFilter;

    // Assuming status is determined by active department history
    const status = employee.department_history.find((d) => d.is_active)
      ? "Active"
      : "Inactive";
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getPerformanceBadge = (score: string | undefined) => {
    if (!score) return <Badge variant="outline">No reviews</Badge>;
    const numericScore = parseFloat(score);
    if (numericScore >= 90)
      return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (numericScore >= 80)
      return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (numericScore >= 70)
      return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  const getStatusBadge = (employee: Employee) => {
    const isActive = employee.department_history.some((d) => d.is_active);
    return isActive ? (
      <Badge variant="default">Active</Badge>
    ) : (
      <Badge variant="destructive">Inactive</Badge>
    );
  };

  const getCurrentDepartment = (employee: Employee) => {
    const currentDept = employee.department_history.find((d) => d.is_active);
    return currentDept?.department_name || "N/A";
  };

  const getCurrentPosition = (employee: Employee) => {
    const currentDept = employee.department_history.find((d) => d.is_active);
    return currentDept?.designation || "N/A";
  };

  const getLatestPerformanceScore = (employee: Employee) => {
    if (employee.performance_history.length === 0) return undefined;
    // Sort by review_date and get the latest
    const sorted = [...employee.performance_history].sort(
      (a, b) =>
        new Date(b.review_date).getTime() - new Date(a.review_date).getTime()
    );
    return sorted[0].performance_score;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
              <Skeleton className="h-10 flex-1" />
              <div className="flex gap-2 sm:gap-4">
                <Skeleton className="h-10 w-[180px]" />
                <Skeleton className="h-10 w-[140px]" />
              </div>
            </div>

            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Employees
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your team members and their information
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get unique departments for filter
  const departments = Array.from(
    new Set(
      employees.flatMap((emp) =>
        emp.department_history.map((dept) => dept.department_name)
      )
    )
  );

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Employees
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your team members and their information
          </p>
        </div>
        <Link href="/employees/add-employee">
        <Button className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Employee Directory
          </CardTitle>
          <CardDescription className="text-sm">
            A comprehensive list of all employees in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 sm:gap-4">
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Employee Table - Mobile Cards on small screens */}
          <div className="hidden md:block">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => {
                    const fullName = `${employee.personal_details.first_name} ${employee.personal_details.last_name}`;
                    const performanceScore =
                      getLatestPerformanceScore(employee);

                    return (
                      <TableRow key={employee.personal_details.employee_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarFallback>
                                {employee.personal_details.first_name[0]}
                                {employee.personal_details.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {fullName}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                {employee.personal_details.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getCurrentDepartment(employee)}</TableCell>
                        <TableCell>{getCurrentPosition(employee)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {performanceScore && (
                              <span className="font-medium">
                                {performanceScore}
                              </span>
                            )}
                            {getPerformanceBadge(performanceScore)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(employee)}</TableCell>
                        <TableCell>
                          {formatDate(employee.personal_details.created_at)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Link
                                  href={`/employees/${employee.personal_details.employee_id}`}
                                >
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link
                                  href={`/employees/${employee.personal_details.employee_id}/edit`}
                                >
                                Edit Employee
                                </Link>
                                </DropdownMenuItem>
                              <DropdownMenuItem>Assign Review</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredEmployees.map((employee) => {
              const fullName = `${employee.personal_details.first_name} ${employee.personal_details.last_name}`;
              const performanceScore = getLatestPerformanceScore(employee);

              return (
                <Card key={employee.personal_details.employee_id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarFallback>
                          {employee.personal_details.first_name[0]}
                          {employee.personal_details.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <h3 className="font-medium truncate">{fullName}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {employee.personal_details.email}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="text-muted-foreground">
                            {getCurrentDepartment(employee)}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            {getCurrentPosition(employee)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {performanceScore && (
                              <span className="text-sm font-medium">
                                {performanceScore}
                              </span>
                            )}
                            {getPerformanceBadge(performanceScore)}
                          </div>
                          {getStatusBadge(employee)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Joined{" "}
                            {formatDate(employee.personal_details.created_at)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/employees/${employee.personal_details.employee_id}`}
                                >
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit Employee</DropdownMenuItem>
                              <DropdownMenuItem>Assign Review</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No employees found matching your criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
