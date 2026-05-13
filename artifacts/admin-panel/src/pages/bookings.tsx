import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAllBookings,
  useUpdateBookingStatus,
  getListAllBookingsQueryKey,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, Search, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20",
  accepted: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
  in_progress: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-600 hover:bg-red-500/20",
};

export default function Bookings() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryParams = {
    page,
    limit: 50,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  };

  const { data, isLoading } = useListAllBookings(queryParams, {
    query: { queryKey: getListAllBookingsQueryKey(queryParams) },
  });

  const updateStatus = useUpdateBookingStatus();

  const handleUpdateStatus = (id: number, newStatus: any) => {
    updateStatus.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAllBookingsQueryKey(queryParams) });
          toast({ title: "Booking status updated" });
        },
      }
    );
  };

  const bookings = data?.bookings || [];
  const filteredBookings = bookings.filter((b) =>
    (b.userName && b.userName.toLowerCase().includes(search.toLowerCase())) ||
    (b.technicianName && b.technicianName.toLowerCase().includes(search.toLowerCase())) ||
    (b.serviceName && b.serviceName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bookings</h2>
          <p className="text-muted-foreground">Monitor platform service requests and their fulfillment status.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, tech or service..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading bookings...
                </TableCell>
              </TableRow>
            ) : filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No bookings found.
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <span className="font-medium text-primary">{booking.serviceName || "Custom Repair"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{booking.userName || `User #${booking.userId}`}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{booking.technicianName || `Tech #${booking.technicianId}`}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">${booking.totalAmount?.toFixed(2) || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[booking.status] || "bg-secondary text-secondary-foreground"}>
                      {booking.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {booking.scheduledAt ? format(new Date(booking.scheduledAt), "MMM d, h:mm a") : format(new Date(booking.createdAt), "MMM d")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled>
                          <Settings className="w-4 h-4 mr-2" />
                          Change Status (Admin override)
                        </DropdownMenuItem>
                        {booking.status !== 'cancelled' && (
                          <DropdownMenuItem onClick={() => handleUpdateStatus(booking.id, "cancelled")} className="text-destructive focus:text-destructive">
                            Mark as Cancelled
                          </DropdownMenuItem>
                        )}
                        {booking.status !== 'completed' && (
                           <DropdownMenuItem onClick={() => handleUpdateStatus(booking.id, "completed")}>
                            Mark as Completed
                           </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
