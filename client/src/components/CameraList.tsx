import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, VideoIcon, Plus, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { maskRtspUrl, isValidRtspUrl } from '@/lib/camera-utils';
import { Camera } from '@shared/schema';

type CameraFormData = {
  name: string;
  rtspUrl: string;
  isDefault: boolean;
  isActive: boolean;
};

export function CameraList({ onSelectCamera }: { onSelectCamera: (camera: Camera) => void }) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [formData, setFormData] = useState<CameraFormData>({
    name: '',
    rtspUrl: '',
    isDefault: false,
    isActive: true
  });

  // Fetch all cameras
  const { data: cameras = [], isLoading, isError } = useQuery({
    queryKey: ['/api/cameras'],
    queryFn: () => apiRequest({ url: '/api/cameras' })
  });

  // Add camera mutation
  const addCamera = useMutation({
    mutationFn: (data: CameraFormData) => 
      apiRequest({
        url: '/api/cameras',
        method: 'POST',
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cameras'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Camera Added",
        description: "Camera has been successfully added",
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to add camera",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  });

  // Update camera mutation
  const updateCamera = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<CameraFormData> }) =>
      apiRequest({
        url: `/api/cameras/${id}`,
        method: 'PATCH',
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cameras'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Camera Updated",
        description: "Camera has been successfully updated",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update camera",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  });

  // Delete camera mutation
  const deleteCamera = useMutation({
    mutationFn: (id: number) =>
      apiRequest({
        url: `/api/cameras/${id}`,
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cameras'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Camera Deleted",
        description: "Camera has been successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete camera",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  });

  // Helper to reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      rtspUrl: '',
      isDefault: false,
      isActive: true
    });
  };

  // Initialize edit form with camera data
  const handleEditClick = (camera: Camera) => {
    setSelectedCamera(camera);
    setFormData({
      name: camera.name,
      rtspUrl: camera.rtspUrl,
      isDefault: camera.isDefault || false,
      isActive: camera.isActive
    });
    setIsEditDialogOpen(true);
  };

  // Prepare for deletion
  const handleDeleteClick = (camera: Camera) => {
    setSelectedCamera(camera);
    setIsDeleteDialogOpen(true);
  };

  // Handle form submission for new camera
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Camera name is required",
      });
      return;
    }

    if (!isValidRtspUrl(formData.rtspUrl)) {
      toast({
        variant: "destructive",
        title: "Invalid RTSP URL",
        description: "Please enter a valid RTSP URL",
      });
      return;
    }

    addCamera.mutate(formData);
  };

  // Handle form submission for updating camera
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCamera) return;
    
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Camera name is required",
      });
      return;
    }

    if (!isValidRtspUrl(formData.rtspUrl)) {
      toast({
        variant: "destructive",
        title: "Invalid RTSP URL",
        description: "Please enter a valid RTSP URL",
      });
      return;
    }

    updateCamera.mutate({ 
      id: selectedCamera.id,
      data: formData
    });
  };

  // Handle camera selection
  const handleSelectCamera = (camera: Camera) => {
    onSelectCamera(camera);
  };

  // Handle setting camera as default
  const handleSetDefault = (camera: Camera) => {
    updateCamera.mutate({
      id: camera.id,
      data: { isDefault: true }
    });
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Failed to load cameras</p>
        <Button 
          variant="outline" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/cameras'] })}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Cameras</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Camera
        </Button>
      </div>

      {cameras.length === 0 ? (
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="p-6 text-center">
            <VideoIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-2">No Cameras Added</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first camera.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Camera
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map((camera: Camera) => (
            <Card 
              key={camera.id} 
              className={`overflow-hidden ${camera.isDefault ? 'border-primary border-2' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {camera.name}
                      {camera.isDefault && (
                        <Badge variant="default" className="ml-2">Default</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1 truncate" title={camera.rtspUrl}>
                      {maskRtspUrl(camera.rtspUrl)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Switch 
                      checked={camera.isActive} 
                      onCheckedChange={(checked) => 
                        updateCamera.mutate({ id: camera.id, data: { isActive: checked } })
                      }
                      aria-label="Toggle camera active state"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>
                    {camera.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    Added {new Date(camera.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(camera)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(camera)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
                <div className="flex space-x-2">
                  {!camera.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(camera)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleSelectCamera(camera)}
                  >
                    <VideoIcon className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add Camera Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Camera</DialogTitle>
            <DialogDescription>
              Enter the details for your new camera.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Camera Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Living Room Camera"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rtspUrl">RTSP URL</Label>
                <Input
                  id="rtspUrl"
                  name="rtspUrl"
                  placeholder="rtsp://username:password@192.168.1.100:554/live/ch00_0"
                  value={formData.rtspUrl}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Format: rtsp://username:password@ip-address:port/path
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  name="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isDefault: checked }))
                  }
                />
                <Label htmlFor="isDefault">Set as default camera</Label>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addCamera.isPending}>
                {addCamera.isPending ? "Adding..." : "Add Camera"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Camera Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Camera</DialogTitle>
            <DialogDescription>
              Update the details for this camera.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Camera Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  placeholder="Living Room Camera"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-rtspUrl">RTSP URL</Label>
                <Input
                  id="edit-rtspUrl"
                  name="rtspUrl"
                  placeholder="rtsp://username:password@192.168.1.100:554/live/ch00_0"
                  value={formData.rtspUrl}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Format: rtsp://username:password@ip-address:port/path
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isDefault"
                  name="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isDefault: checked }))
                  }
                />
                <Label htmlFor="edit-isDefault">Set as default camera</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isActive: checked }))
                  }
                />
                <Label htmlFor="edit-isActive">Camera active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateCamera.isPending}>
                {updateCamera.isPending ? "Updating..." : "Update Camera"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Camera</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this camera? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedCamera && (
              <div className="bg-muted p-3 rounded-md">
                <p className="font-medium">{selectedCamera.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {maskRtspUrl(selectedCamera.rtspUrl)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedCamera && deleteCamera.mutate(selectedCamera.id)}
              disabled={deleteCamera.isPending}
            >
              {deleteCamera.isPending ? "Deleting..." : "Delete Camera"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}