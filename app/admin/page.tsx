import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Activity, AlertTriangle, TrendingUp } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default async function AdminPage() {
  const { user, profile } = await requireAdmin()
  const supabase = await createClient()

  // Get admin stats
  const { data: allUsers } = await supabase.from("users").select("*")
  const { data: recentVerifications } = await supabase
    .from("bin_verifications")
    .select("*, users(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(10)

  const { data: suspiciousActivity } = await supabase
    .from("suspicious_sessions")
    .select("*")
    .eq("resolved", false)
    .order("detected_at", { ascending: false })
    .limit(5)

  const totalUsers = allUsers?.length || 0
  const activeUsers = allUsers?.filter((u) => u.is_active).length || 0
  const totalVerifications = recentVerifications?.length || 0

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Admin Dashboard</h1>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">{activeUsers} active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Verifications</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVerifications}</div>
              <p className="text-xs text-muted-foreground">Last 10 verifications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{suspiciousActivity?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Unresolved alerts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">99.9%</div>
              <p className="text-xs text-muted-foreground">Uptime</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>Latest user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allUsers && allUsers.length > 0 ? (
                  allUsers.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.full_name || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.is_active ? "default" : "destructive"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No users found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Verifications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Verifications</CardTitle>
              <CardDescription>Latest BIN verifications across all users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentVerifications && recentVerifications.length > 0 ? (
                  recentVerifications.map((verification) => (
                    <div key={verification.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">BIN: {verification.bin_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {verification.users?.full_name || verification.users?.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{verification.card_brand}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(verification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No verifications found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
