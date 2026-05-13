import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListShops,
  useVerifyShop,
  useDeleteShop,
  getListShopsQueryKey,
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, ShieldCheck, Trash2, Search, MapPin, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Shops() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryParams = {
    page,
    limit: 50,
  };

  const { data, isLoading } = useListShops(queryParams, {
    query: { queryKey: getListShopsQueryKey(queryParams) },
  });

  const verifyShop = useVerifyShop();
  const deleteShop = useDeleteShop();

  const handleVerify = (id: number) => {
    verifyShop.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListShopsQueryKey(queryParams) });
          toast({ title: "Shop verification status toggled" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this shop? This will also remove associated products and bookings.")) return;
    deleteShop.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListShopsQueryKey(queryParams) });
          toast({ title: "Shop deleted" });
        },
      }
    );
  };

  const shops = data?.shops || [];
  const filteredShops = shops.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.ownerName && s.ownerName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Shops</h2>
          <p className="text-muted-foreground">Manage physical repair centers and parts stores.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shops by name or owner..."
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
              <TableHead>Shop Info</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Loading shops...
                </TableCell>
              </TableRow>
            ) : filteredShops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No shops found.
                </TableCell>
              </TableRow>
            ) : (
              filteredShops.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">{shop.name}</span>
                      <span className="text-sm text-muted-foreground">Owner: {shop.ownerName || `ID: ${shop.ownerId}`}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span className="truncate max-w-[200px]" title={shop.address}>{shop.address}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center text-amber-500 text-sm">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        <span className="font-medium text-foreground">{shop.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground ml-1">({shop.ratingCount})</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge variant={shop.isActive ? "default" : "secondary"}>
                        {shop.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {shop.isVerified && (
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
                        <DropdownMenuItem onClick={() => handleVerify(shop.id)}>
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          {shop.isVerified ? "Revoke Verification" : "Verify Shop"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(shop.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Shop
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
