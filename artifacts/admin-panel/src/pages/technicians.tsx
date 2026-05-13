import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTechnicians,
  useVerifyTechnician,
  useDeleteTechnician,
  useUpdateTechnician,
  getListTechniciansQueryKey,
} from "@workspace/api-client-react";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, ShieldCheck, Trash2, Search, Star, Power } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Technicians() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryParams = {
    page,
    limit: 50,
  };

  const { data, isLoading } = useListTechnicians(queryParams, {
    query: { queryKey: getListTechniciansQueryKey(queryParams) },
  });

  const verifyTechnician = useVerifyTechnician();
  const deleteTechnician = useDeleteTechnician();
  const updateTechnician = useUpdateTechnician();

  const handleVerify = (id: number) => {
    verifyTechnician.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTechniciansQueryKey(queryParams) });
          toast({ title: "Technician verification toggled" });
        },
      }
    );
  };

  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    updateTechnician.mutate(
      { id, data: { isActive: !currentStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTechniciansQueryKey(queryParams) });
          toast({ title: "Technician status updated" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this technician profile?")) return;
    deleteTechnician.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTechniciansQueryKey(queryParams) });
          toast({ title: "Technician deleted" });
        },
      }
    );
  };

  const technicians = data?.technicians || [];
  const filteredTechs = technicians.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.email && t.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Technicians</h2>
          <p className="text-muted-foreground">Manage freelance repair experts and service providers.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search technicians by name..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Technician</TableHead>
              <TableHead>Expertise</TableHead>
              <TableHead>Rate & Stats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Loading technicians...
                </TableCell>
              </TableRow>
            ) : filteredTechs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No technicians found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTechs.map((tech) => (
                <TableRow key={tech.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">{tech.name}</span>
                      <span className="text-sm text-muted-foreground">{tech.email || "No email"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">{tech.experienceYears}y experience</span>
                      <div className="flex gap-1 flex-wrap">
                        {tech.skills.slice(0, 3).map(skill => (
                          <Badge key={skill} variant="outline" className="text-[10px] py-0 h-4">{skill}</Badge>
                        ))}
                        {tech.skills.length > 3 && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4">+{tech.skills.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">${tech.hourlyRate}/hr</span>
                      <div className="flex items-center text-amber-500 text-sm">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        <span className="text-foreground">{tech.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground ml-1">({tech.ratingCount})</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={tech.isActive ? "default" : "secondary"}>
                        {tech.isActive ? "Active" : "Suspended"}
                      </Badge>
                      <Badge variant={tech.isAvailable ? "outline" : "secondary"} className={tech.isAvailable ? "border-emerald-500 text-emerald-600" : ""}>
                        {tech.isAvailable ? "Available" : "Busy/Offline"}
                      </Badge>
                      {tech.isVerified && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleVerify(tech.id)}>
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          {tech.isVerified ? "Revoke Verification" : "Verify Tech"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(tech.id, tech.isActive)}>
                          <Power className="w-4 h-4 mr-2" />
                          {tech.isActive ? "Suspend Tech" : "Activate Tech"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(tech.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Tech
                        </DropdownMenuItem>
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
