"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Star, Calendar, User } from "lucide-react"
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
import { Slider } from "@/components/ui/slider"

// Mock data
const reviews = [
  {
    id: 1,
    employee: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      department: "Engineering",
    },
    reviewer: "John Smith",
    period: "Q2 2024",
    status: "Completed",
    overallScore: 9.2,
    reviewDate: "2024-06-15",
    metrics: {
      communication: 9,
      productivity: 10,
      teamwork: 9,
      problemSolving: 9,
    },
  },
  {
    id: 2,
    employee: {
      name: "Mike Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      department: "Sales",
    },
    reviewer: "Lisa Anderson",
    period: "Q2 2024",
    status: "In Progress",
    overallScore: 8.5,
    reviewDate: "2024-06-20",
    metrics: {
      communication: 8,
      productivity: 9,
      teamwork: 8,
      problemSolving: 9,
    },
  },
  {
    id: 3,
    employee: {
      name: "Emily Davis",
      avatar: "/placeholder.svg?height=40&width=40",
      department: "Marketing",
    },
    reviewer: "David Wilson",
    period: "Q2 2024",
    status: "Pending",
    overallScore: 0,
    reviewDate: "2024-06-25",
    metrics: {
      communication: 0,
      productivity: 0,
      teamwork: 0,
      problemSolving: 0,
    },
  },
]

export default function ReviewsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newReview, setNewReview] = useState({
    communication: [8],
    productivity: [8],
    teamwork: [8],
    problemSolving: [8],
    comments: "",
  })

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = review.employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || review.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    if (status === "Completed") return <Badge className="bg-green-100 text-green-800">Completed</Badge>
    if (status === "In Progress") return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
  }

  const getScoreBadge = (score: number) => {
    if (score >= 9) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (score >= 8) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>
    if (score >= 7) return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>
    if (score > 0) return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>
    return <Badge variant="outline">Not Rated</Badge>
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Reviews</h1>
          <p className="text-muted-foreground">Manage and track employee performance evaluations</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Review
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Performance Review</DialogTitle>
              <DialogDescription>Evaluate employee performance across key metrics</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
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
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Review Period</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="q1-2024">Q1 2024</SelectItem>
                      <SelectItem value="q2-2024">Q2 2024</SelectItem>
                      <SelectItem value="q3-2024">Q3 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Performance Metrics</h4>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Communication</Label>
                      <span className="text-sm font-medium">{newReview.communication[0]}/10</span>
                    </div>
                    <Slider
                      value={newReview.communication}
                      onValueChange={(value) => setNewReview({ ...newReview, communication: value })}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Productivity</Label>
                      <span className="text-sm font-medium">{newReview.productivity[0]}/10</span>
                    </div>
                    <Slider
                      value={newReview.productivity}
                      onValueChange={(value) => setNewReview({ ...newReview, productivity: value })}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Teamwork</Label>
                      <span className="text-sm font-medium">{newReview.teamwork[0]}/10</span>
                    </div>
                    <Slider
                      value={newReview.teamwork}
                      onValueChange={(value) => setNewReview({ ...newReview, teamwork: value })}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Problem Solving</Label>
                      <span className="text-sm font-medium">{newReview.problemSolving[0]}/10</span>
                    </div>
                    <Slider
                      value={newReview.problemSolving}
                      onValueChange={(value) => setNewReview({ ...newReview, problemSolving: value })}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Comments</Label>
                <Textarea
                  placeholder="Add detailed feedback and comments..."
                  value={newReview.comments}
                  onChange={(e) => setNewReview({ ...newReview, comments: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>Create Review</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review Management</CardTitle>
          <CardDescription>Track and manage all performance reviews</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reviews Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Overall Score</TableHead>
                  <TableHead>Review Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.employee.avatar || "/placeholder.svg"} alt={review.employee.name} />
                          <AvatarFallback>
                            {review.employee.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{review.employee.name}</div>
                          <div className="text-sm text-muted-foreground">{review.employee.department}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {review.reviewer}
                      </div>
                    </TableCell>
                    <TableCell>{review.period}</TableCell>
                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {review.overallScore > 0 ? (
                          <>
                            <span className="font-medium">{review.overallScore}</span>
                            {renderStars(review.overallScore)}
                            {getScoreBadge(review.overallScore)}
                          </>
                        ) : (
                          <span className="text-muted-foreground">Not rated</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(review.reviewDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredReviews.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No reviews found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
