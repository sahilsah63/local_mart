import { useGetAdminStats, useGetRevenueStats, useListShops, useListTechnicians } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store, Wrench, CalendarCheck, DollarSign, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: revenue, isLoading: revenueLoading } = useGetRevenueStats();
  const { data: shops } = useListShops({ limit: 100 });
  const { data: technicians } = useListTechnicians({ limit: 100 });

  if (statsLoading || revenueLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading dashboard data...</div>;
  }

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers || 0, icon: Users, sub: `+${stats?.newUsersToday || 0} today` },
    { title: "Active Shops", value: stats?.totalShops || 0, icon: Store, sub: `${stats?.verifiedShops || 0} verified` },
    { title: "Technicians", value: stats?.totalTechnicians || 0, icon: Wrench, sub: `${stats?.verifiedTechnicians || 0} verified` },
    { title: "Bookings", value: stats?.totalBookings || 0, icon: CalendarCheck, sub: `${stats?.bookingsToday || 0} today` },
    { title: "Platform Revenue", value: `$${stats?.totalRevenue?.toFixed(2) || '0.00'}`, icon: DollarSign, sub: "Total volume" },
    { title: "Active Services", value: stats?.activeBookings || 0, icon: Activity, sub: "Currently in progress" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome to the TechniConnect command center.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Bookings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue?.monthly || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue ($)" />
                  <Bar yAxisId="right" dataKey="bookings" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="h-[300px] w-full max-w-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenue?.bookingsByStatus || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="status"
                  >
                    {(revenue?.bookingsByStatus || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform Coverage Map</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[400px] w-full bg-muted z-0">
              <MapContainer center={[37.7749, -122.4194]} zoom={11} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                {shops?.shops?.map(shop => (
                   shop.lat && shop.lng && (
                    <Marker key={`shop-${shop.id}`} position={[shop.lat, shop.lng]}>
                      <Popup>
                        <div className="font-semibold text-primary">{shop.name}</div>
                        <div className="text-xs text-muted-foreground">Shop</div>
                      </Popup>
                    </Marker>
                   )
                ))}
                {technicians?.technicians?.map(tech => (
                   tech.lat && tech.lng && (
                    <Marker key={`tech-${tech.id}`} position={[tech.lat, tech.lng]}>
                      <Popup>
                        <div className="font-semibold text-chart-2">{tech.name}</div>
                        <div className="text-xs text-muted-foreground">Technician</div>
                      </Popup>
                    </Marker>
                   )
                ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Technicians</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Technician</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Jobs</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(revenue?.topTechnicians || []).map((tech) => (
                  <TableRow key={tech.id}>
                    <TableCell className="font-medium">{tech.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                        ⭐ {tech.rating.toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{tech.bookings}</TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      ${tech.revenue.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!revenue?.topTechnicians || revenue.topTechnicians.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Not enough data yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
