import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import type { Campaign, CampaignAudience } from '@/api/Queries/campaignQueries';
import { 
  useGetCampaignsList, 
  useCreateCampaign, 
  usePreviewCampaignAudience,
  useSendCampaign,
  useDeleteCampaign
} from '@/api/Queries/campaignQueries';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Send, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

const CampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  
  // New campaign form
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    imageUrl: '',
    channels: ['in-app'] as string[],
    audience: {
      loyaltyTier: [],
      minSpent: 0,
      maxSpent: 0,
    } as CampaignAudience,
  });
  
  // API queries
  const { data: campaignsData, isLoading, error, refetch } = useGetCampaignsList();
  const createMutation = useCreateCampaign();
  const sendMutation = useSendCampaign();
  const deleteMutation = useDeleteCampaign();
  const previewMutation = usePreviewCampaignAudience();
  
  const campaigns: Campaign[] = Array.isArray(campaignsData?.data?.campaigns) ? campaignsData.data.campaigns : [];
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'draft': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const handleCreateCampaign = async () => {
    if (!formData.name.trim() || !formData.message.trim()) {
      toast({
        title: "Error",
        description: "Campaign name and message are required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await createMutation.mutateAsync({
        ...formData,
        audience: formData.audience.loyaltyTier?.length > 0 ? formData.audience : undefined,
      });
      
      setFormData({
        name: '',
        message: '',
        imageUrl: '',
        channels: ['in-app'],
        audience: { loyaltyTier: [] },
      });
      setIsCreating(false);
      refetch();
      
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    }
  };
  
  const handleSendCampaign = async (campaignId: string) => {
    try {
      await sendMutation.mutateAsync(campaignId);
      refetch();
      toast({
        title: "Success",
        description: "Campaign sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send campaign",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteCampaign = async (campaignId: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      await deleteMutation.mutateAsync(campaignId);
      refetch();
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    }
  };
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Campaigns</CardTitle>
            <CardDescription>
              Unable to load campaign data. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage customer marketing campaigns
          </p>
        </div>
        
        <Button className="gap-2" onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>
      
      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
                  <p className="text-2xl font-bold">{campaigns.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sent</p>
                  <p className="text-2xl font-bold text-green-600">
                    {campaigns.filter(c => c.status === 'sent').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {campaigns.filter(c => c.status === 'scheduled').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Drafts</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {campaigns.filter(c => c.status === 'draft').length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500/60" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Create Campaign Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
            <CardDescription>
              Set up a new marketing campaign to reach your customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Campaign Name</label>
                <Input
                  placeholder="e.g., Summer Promotion"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Image URL (Optional)</label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Write your campaign message here..."
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Audience - Loyalty Tiers</label>
              <div className="flex gap-2">
                {['bronze', 'silver', 'gold'].map(tier => (
                  <Button
                    key={tier}
                    variant={formData.audience.loyaltyTier?.includes(tier) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const tiers = formData.audience.loyaltyTier || [];
                      setFormData({
                        ...formData,
                        audience: {
                          ...formData.audience,
                          loyaltyTier: tiers.includes(tier)
                            ? tiers.filter(t => t !== tier)
                            : [...tiers, tier],
                        },
                      });
                    }}
                    className="capitalize"
                  >
                    {tier}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to target all customers
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCampaign}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Campaigns List */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))
        ) : campaigns.length === 0 ? (
          <Card className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-medium">No campaigns yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first marketing campaign to reach your customers
            </p>
            <Button className="mt-4 gap-2" onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4" />
              Create Campaign
            </Button>
          </Card>
        ) : (
          campaigns.map(campaign => (
            <Card 
              key={campaign._id}
              className={`hover:shadow-md transition-all ${
                selectedCampaign === campaign._id ? 'ring-2 ring-primary' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{campaign.name}</h3>
                      <Badge className={getStatusColor(campaign.status)} variant="outline">
                        <span className="flex items-center gap-1">
                          {getStatusIcon(campaign.status)}
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {campaign.message}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{campaign.stats?.totalRecipients || 0} recipients</span>
                      </div>
                      
                      {campaign.stats?.delivered !== undefined && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>{campaign.stats.delivered} delivered</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{format(new Date(campaign.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {campaign.status === 'draft' && (
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => handleSendCampaign(campaign._id)}
                        disabled={sendMutation.isPending}
                      >
                        <Send className="h-4 w-4" />
                        Send
                      </Button>
                    )}
                    
                    {campaign.status !== 'sent' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => navigate(`/campaigns/${campaign._id}`)}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteCampaign(campaign._id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CampaignPage;
