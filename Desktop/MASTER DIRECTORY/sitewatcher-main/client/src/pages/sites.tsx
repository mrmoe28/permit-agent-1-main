import { useState } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Globe, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink,
  Calendar,
  Activity,
  Search
} from "lucide-react";

interface Site {
  id: string;
  url: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
}

export default function Sites() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [editForm, setEditForm] = useState({ url: "", domain: "" });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sites
  const { data: sites = [], isLoading } = useQuery({
    queryKey: ["/sites"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update site mutation
  const updateSiteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { url: string; domain: string } }) => {
      const response = await apiRequest("PUT", `/api/sites/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Site Updated",
        description: "Site has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/sites"] });
      setIsEditDialogOpen(false);
      setEditingSite(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update site",
        variant: "destructive",
      });
    },
  });

  // Delete site mutation
  const deleteSiteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/sites?id=${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Site Deleted",
        description: "Site and all related data has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/sites"] });
      queryClient.invalidateQueries({ queryKey: ["/dashboard/metrics"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete site",
        variant: "destructive",
      });
    },
  });

  // Delete all sites mutation
  const deleteAllSitesMutation = useMutation({
    mutationFn: async () => {
      // Delete each site individually since we don't have a bulk delete API
      const deletePromises = sites.map(site => 
        apiRequest("DELETE", `/api/sites?id=${site.id}`).then(r => r.json())
      );
      return Promise.all(deletePromises);
    },
    onSuccess: () => {
      toast({
        title: "All Sites Deleted",
        description: "All sites and their associated data have been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/sites"] });
      queryClient.invalidateQueries({ queryKey: ["/dashboard/metrics"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete all sites",
        variant: "destructive",
      });
    },
  });

  const handleEditSite = (site: Site) => {
    setEditingSite(site);
    setEditForm({ url: site.url, domain: site.domain });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSite = () => {
    if (!editingSite) return;

    // Validate URL format
    try {
      const urlObj = new URL(editForm.url);
      const domain = urlObj.hostname;
      
      updateSiteMutation.mutate({
        id: editingSite.id,
        data: { ...editForm, domain }
      });
    } catch {
      toast({
        title: "Error",
        description: "Please enter a valid URL (e.g., https://example.com)",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSite = (id: string) => {
    deleteSiteMutation.mutate(id);
  };

  const handleDeleteAllSites = () => {
    deleteAllSitesMutation.mutate();
  };

  // Filter sites based on search term
  const filteredSites = sites.filter((site: Site) =>
    site.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <PageLayout 
        title="Manage Sites" 
        description="View and manage all your monitored websites"
      >
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Manage Sites" 
      description="View and manage all your monitored websites"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search sites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => window.location.href = "/add-site"} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Site
            </Button>
            
            {sites.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete All Sites
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete All Sites</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete all {sites.length} sites? This will permanently remove all sites and their associated data including analyses, keywords, and recommendations. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAllSites}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={deleteAllSitesMutation.isPending}
                    >
                      {deleteAllSitesMutation.isPending ? "Deleting..." : "Delete All Sites"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Sites Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Sites
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {sites.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Active Monitoring
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {sites.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Recent Addition
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {sites.length > 0 ? formatDate(sites[0]?.createdAt) : "None"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sites Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              All Sites
            </CardTitle>
            <CardDescription>
              Manage your monitored websites
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSites.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? "No sites found" : "No sites added yet"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm 
                    ? "Try adjusting your search criteria"
                    : "Start monitoring websites by adding your first site"
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => window.location.href = "/add-site"}>
                    Add Your First Site
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSites.map((site: Site) => (
                    <TableRow key={site.id}>
                      <TableCell className="font-medium">{site.domain}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-xs">{site.url}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => window.open(site.url, "_blank")}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(site.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Active</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditSite(site)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Site</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{site.domain}"? This will permanently remove the site and all associated data including analyses, keywords, and recommendations.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteSite(site.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Site
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Site Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Site</DialogTitle>
              <DialogDescription>
                Update the URL for this monitored site
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-url">Website URL</Label>
                <Input
                  id="edit-url"
                  type="url"
                  placeholder="https://example.com"
                  value={editForm.url}
                  onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateSite}
                disabled={updateSiteMutation.isPending || !editForm.url.trim()}
              >
                {updateSiteMutation.isPending ? "Updating..." : "Update Site"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}