"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Phone,
  MapPin,
  CalendarDays,
  User,
  Shield,
  Loader2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { apiAxios } from "@/lib/apiAxios";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const maritalStatuses = ["Single", "Married", "Divorced", "Widowed"];

const formSchema = z
  .object({
    first_name: z.string().min(2, "First name must be at least 2 characters"),
    last_name: z.string().min(2, "Last name must be at least 2 characters"),
    phone_number: z.string().min(10, "Phone number must be at least 10 digits"),
    date_of_birth: z.date(),
    emergency_contact_name: z
      .string()
      .min(2, "Emergency contact name is required"),
    emergency_contact_phone: z
      .string()
      .min(10, "Emergency contact phone must be at least 10 digits"),
    current_address: z.string().min(5, "Current address is required"),
    permanent_address: z.string().min(5, "Permanent address is required"),
    marital_status: z.string(),
    blood_group: z.string(),
    promote_to_manager: z.boolean().default(false),
    password: z.string().min(8).optional().or(z.literal("")), // Allow empty string
  })
  .superRefine((data, ctx) => {
    // Only validate password if promoting
    if (data.promote_to_manager && !data.password?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password is required for manager promotion",
        path: ["password"],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

export default function EditEmployeePage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isManager, setIsManager] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone_number: "",
      date_of_birth: new Date(),
      emergency_contact_name: "",
      emergency_contact_phone: "",
      current_address: "",
      permanent_address: "",
      marital_status: "Single",
      blood_group: "A+",
      promote_to_manager: false,
      password: "",
    },
    mode: "onChange", // Add this to validate on change
  });

  // Watch promote_to_manager to conditionally show password field
  const watchPromote = form.watch("promote_to_manager");

  useEffect(() => {
    if (!watchPromote) {
      form.setValue("password", ""); // Clear password field
      form.clearErrors("password"); // Remove validation errors
    }
  }, [watchPromote]);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await apiAxios.get(
          `/get-all-records-of-employee/${id}`
        );

        if (response.data.success && response.data.data) {
          const employee = response.data.data.personal_details;
          setIsManager(!!employee.manager_id);

          form.reset({
            first_name: employee.first_name,
            last_name: employee.last_name,
            phone_number: employee.phone_number,
            date_of_birth: new Date(employee.date_of_birth),
            emergency_contact_name: employee.emergency_contact_name,
            emergency_contact_phone: employee.emergency_contact_phone,
            current_address: employee.current_address,
            permanent_address: employee.permanent_address,
            marital_status: employee.marital_status,
            blood_group: employee.blood_group,
            promote_to_manager: false,
            password: "",
          });
        }
      } catch (error) {
        toast.error("Failed to load employee data");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [id, form]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      // Remove password if not promoting
      const { password, promote_to_manager, ...baseData } = values;
      const payload = promote_to_manager ? values : baseData;

      const response = await apiAxios.patch(
        `/employee-register/${id}`,
        payload
      );

      toast.success("Changes saved successfully!");
      router.push(`/employees/${id}`);
    } catch (error) {
      toast.error("Failed to save changes. Please try again.");
      console.error("API Error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Employee</h1>
        <Button
          variant="outline"
          onClick={() => router.push(`/employees/${id}`)}
        >
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>Phone Number</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>Date of Birth</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date: Date) => date > new Date()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="marital_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marital Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select marital status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {maritalStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="blood_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Group</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bloodGroups.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>Address Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 grid-cols-1">
              <FormField
                control={form.control}
                name="current_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="permanent_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permanent Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>Emergency Contact</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <FormField
                control={form.control}
                name="emergency_contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergency_contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {!isManager && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span>Manager Promotion</span>
                </CardTitle>
                <FormDescription>
                  Promote this employee to a manager role
                </FormDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="promote_to_manager"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Promote to Manager
                        </FormLabel>
                        <FormDescription>
                          This will grant manager privileges to the employee
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {watchPromote && (
                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manager Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormDescription>
                            The employee will use this password to access
                            manager features
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/employees/${id}`)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              // disabled={submitting}
              disabled
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
