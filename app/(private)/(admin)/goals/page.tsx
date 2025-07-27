"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Target, Calendar, CheckCircle, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Mock data
const goals = [
  {
    id: 1,
    title: "Complete React Native certification",
    description: "Obtain certification in React Native development to enhance mobile development skills",
    employee: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      department: "Engineering",
    },
    assignedBy: "John Smith",
    progress: 75,
    deadline: "2024-08-15",
    status: "In Progress",
    priority: "High",
    createdDate: "2024-05-01",
  },
  {
    id: 2,
    title: "Lead team project migration",
    description: "Successfully migrate legacy system to new architecture",
    employee: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      department: "Engineering",
    },
    assignedBy: "John Smith",
    progress: 100,
    deadline: "2024-06-30",
    status: "Completed",
    priority: "High",
    createdDate: "2024-04-15",
  },
  {
    id: 3,
    title: "Increase sales by 20%",
    description: "Achieve 20% increase in quarterly sales compared to previous quarter",
    employee: {
      name: "Mike Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      department: "Sales",
    },
    assignedBy: "Lisa Anderson",
    progress: 60,
    deadline: "2024-09-30",
    status: "In Progress",
    priority: "High",
    createdDate: "2024-06-01",
  },
  {
    id: 4,
    title: "Mentor 2 junior developers",
    description: "Provide guidance and support to junior team members",
    employee: {
      name: "David Wilson",
      avatar: "/placeholder.svg?height=40&width=40",
      department: "Engineering",
    },
    assignedBy: "John Smith",
    progress: 40,
    deadline: "2024-12-31",
    status: "In Progress",
    priority: "Medium",
    createdDate: "2024-06-10",
  },
  {
    id: 5,
    title: "Launch marketing campaign",
    description: "Design and execute comprehensive marketing campaign for new product",
    employee: {
      name: "Emily Davis",
      avatar: "/placeholder.svg?height=40&width=40",
      department: "Marketing",
    },
    assignedBy: "David Wilson",
    progress: 0,
    deadline: "2024-07-31",
    status: "Not Started",
    priority: "Medium",
    createdDate: "2024-06-20",
  },
]

export default function GoalsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const filteredGoals = goals.filter((goal) => {
    const matchesSearch =
      goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goal.employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || goal.status === statusFilter
    const matchesPriority = priorityFilter === "all" || goal.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusBadge = (status: string) => {
    if (status === "Completed") return <Badge className="bg-green-100 text-green-800">Completed</Badge>
    if (status === "In Progress") return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
    return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    if (priority === "High") return <Badge variant="destructive">High</Badge>
    if (priority === "Medium") return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
    return <Badge variant="secondary">Low</Badge>
  }

  const getStatusIcon = (status: string) => {
    if (status === "Completed") return <CheckCircle className="h-4 w-4 text-green-600" />
    if (status === "In Progress") return <Clock className="h-4 w-4 text-blue-600" />
    return <Target className="h-4 w-4 text-gray-600" />
  }

  const isOverdue = (deadline: string, status: string) => {
    return new Date(deadline) < new Date() && status !== "Completed"
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Goals & Objectives</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Track and manage employee goals and objectives</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl mx-4">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>Set a new goal or objective for an employee</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sarah">Sarah Johnson</SelectItem>
                      <SelectItem value="mike">Mike Chen</SelectItem>
                      <SelectItem value="emily">Emily Davis</SelectItem>
                      <SelectItem value="david">David Wilson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Goal Title</Label>
                <Input placeholder="Enter goal title" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Describe the goal in detail..." />
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input type="date" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>Create Goal</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Goal Management</CardTitle>
          <CardDescription className="text-sm">Monitor progress and manage all employee goals</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search goals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 sm:gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Goals Grid */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredGoals.map((goal) => (
              <Card key={goal.id} className={`${isOverdue(goal.deadline, goal.status) ? "border-red-200" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getStatusIcon(goal.status)}
                      <CardTitle className="text-base sm:text-lg truncate">{goal.title}</CardTitle>
                    </div>
                    {getPriorityBadge(goal.priority)}
                  </div>
                  <CardDescription className="text-sm line-clamp-2">{goal.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={goal.employee.avatar || "/placeholder.svg"} alt={goal.employee.name} />
                      <AvatarFallback className="text-xs">
                        {goal.employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{goal.employee.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{goal.employee.department}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span
                        className={`truncate ${isOverdue(goal.deadline, goal.status) ? "text-red-600" : "text-muted-foreground"}`}
                      >
                        {/* {new Date(goal.deadline).toLocaleDateString()} */}
                        {new Date(goal.deadline).toISOString().split('T')[0]}
                      </span>
                    </div>
                    {getStatusBadge(goal.status)}
                  </div>

                  {isOverdue(goal.deadline, goal.status) && (
                    <div className="text-xs text-red-600 font-medium">Overdue</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredGoals.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No goals found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
