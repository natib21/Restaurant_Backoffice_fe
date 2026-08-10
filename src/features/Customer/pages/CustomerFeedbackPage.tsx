import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { FeedbackResponse } from '@/api/Queries/feedbackQueries';
import { useGetFeedbackList, useRespondToFeedback, useGetFeedbackStats } from '@/api/Queries/feedbackQueries';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Star, 
  Filter, 
  Search, 
  ThumbsUp, 
  ThumbsDown,
  CheckCircle,
  Clock,
  User,
  Reply,
  Download,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

const TYPE_OPTIONS = [
  { id: 'all', label: 'All Types', icon: <MessageSquare className="h-4 w-4" /> },
  { id: 'positive', label: 'Positive', icon: <ThumbsUp className="h-4 w-4" /> },
  { id: 'neutral', label: 'Neutral', icon: <MessageSquare className="h-4 w-4" /> },
  { id: 'negative', label: 'Negative', icon: <ThumbsDown className="h-4 w-4" /> },
];

const CustomerFeedbackPage: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'new' | 'reviewed' | 'resolved'>('reviewed');
  
  // API queries
  const { data: feedbackData, isLoading, error, refetch } = useGetFeedbackList({
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    limit: 50,
  });
  
  const { data: statsData } = useGetFeedbackStats();
  const respondMutation = useRespondToFeedback();
  
  // Use API data
  const feedbackList: FeedbackResponse[] = Array.isArray(feedbackData?.data) ? feedbackData.data : [];
  const stats = statsData?.data;
  
  // Filter feedback based on search
  const filteredFeedback = (feedbackList || []).filter((feedback: FeedbackResponse) => {
    const matchesSearch = 
      (feedback.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (feedback.comment?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (feedback.categories?.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase())));
    
    return matchesSearch;
  });
  
  const selectedFeedbackItem = selectedFeedback 
    ? feedbackList.find(f => f._id === selectedFeedback)
    : null;
  
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedFeedbackItem) return;
    
    try {
      await respondMutation.mutateAsync({
        feedbackId: selectedFeedbackItem._id,
        data: {
          status: replyStatus,
          responseText: replyText.trim(),
          isPublic: true,
        },
      });
      
      setReplyText('');
      refetch();
      toast({
        title: "Success",
        description: "Response sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send response",
        variant: "destructive",
      });
    }
  };
  
  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-500';
    if (rating >= 3) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getStatusBadge = (status?: string) => {
    switch(status) {
      case 'new': return <Badge variant="default" className="bg-blue-500">New</Badge>;
      case 'reviewed': return <Badge variant="secondary">Reviewed</Badge>;
      case 'resolved': return <Badge variant="outline" className="bg-green-500 text-green-900">Resolved</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Feedback</CardTitle>
            <CardDescription>
              Unable to load feedback data. Please try again.
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
          <h1 className="text-2xl font-bold tracking-tight">Customer Feedback & Reviews</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and respond to customer feedback from all channels
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Stats Overview */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Feedback</p>
                  <p className="text-2xl font-bold">{stats?.totalFeedback || 0}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                  <p className="text-2xl font-bold">{stats?.averageRating?.toFixed(1) || '0'}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Positive</p>
                  <p className="text-2xl font-bold text-green-600">{stats?.positive || 0}</p>
                </div>
                <ThumbsUp className="h-8 w-8 text-green-500/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Neutral</p>
                  <p className="text-2xl font-bold text-gray-600">{stats?.neutral || 0}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-gray-500/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Negative</p>
                  <p className="text-2xl font-bold text-red-600">{stats?.negative || 0}</p>
                </div>
                <ThumbsDown className="h-8 w-8 text-red-500/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
                  <p className="text-2xl font-bold">{stats?.responseRate?.toFixed(0) || '0'}%</p>
                </div>
                <Reply className="h-8 w-8 text-blue-500/60" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Feedback List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search feedback by customer, comment, or category..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Advanced Filter
                  </Button>
                </div>
              </div>
              
              {/* Status and Type Filters */}
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {['all', 'new', 'reviewed', 'resolved'].map(status => (
                    <Badge
                      key={status}
                      variant={statusFilter === status ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => setStatusFilter(status)}
                    >
                      {status}
                    </Badge>
                  ))}
                </div>
                
                <Tabs value={typeFilter} onValueChange={setTypeFilter}>
                  <TabsList className="grid grid-cols-4">
                    {TYPE_OPTIONS.map(type => (
                      <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-2">
                        {type.icon}
                        <span className="hidden sm:inline">{type.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>
          
          {/* Feedback List */}
          <div className="space-y-4">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : filteredFeedback.length === 0 ? (
              <Card className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <h3 className="mt-4 text-lg font-medium">No feedback found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? 'Try adjusting your search terms' : 'No customer feedback yet'}
                </p>
              </Card>
            ) : (
              filteredFeedback.map(feedback => (
                <Card 
                  key={feedback._id} 
                  className={`cursor-pointer hover:shadow-md transition-all ${
                    selectedFeedback === feedback._id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedFeedback(selectedFeedback === feedback._id ? null : feedback._id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{feedback.customer?.name || 'Unknown'}</h3>
                              {getStatusBadge(feedback.status)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{format(new Date(feedback.createdAt), 'MMM d, yyyy')}</span>
                              <span>•</span>
                              <span className="capitalize">{feedback.channel || 'app'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${
                                  i < feedback.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                          <span className={`text-sm font-medium ${getRatingColor(feedback.rating)}`}>
                            {feedback.rating}/5
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {feedback.comment || 'No comment provided'}
                        </p>
                        
                        {feedback.categories && feedback.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {feedback.categories.map(cat => (
                              <Badge key={cat} variant="outline" className="text-xs capitalize">
                                {cat.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        {feedback.merchantResponse ? (
                          <Badge variant="outline" className="bg-green-50">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Responded
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-50">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {feedback.merchantResponse && (
                      <>
                        <Separator className="my-4" />
                        <div className="bg-muted/30 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Reply className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Staff Response</span>
                            <span className="text-xs text-muted-foreground">
                              ({feedback.merchantResponse.respondedBy} • {format(new Date(feedback.merchantResponse.respondedAt), 'MMM d')})
                            </span>
                          </div>
                          <p className="text-sm">{feedback.merchantResponse.responseText}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        
        {/* Right Column - Selected Feedback Details & Reply */}
        <div className="space-y-6">
          {selectedFeedbackItem ? (
            <>
              {/* Feedback Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Feedback Details</CardTitle>
                  <CardDescription>
                    Review and respond to this feedback
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{selectedFeedbackItem.customer?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedFeedbackItem.customer?.phone}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(selectedFeedbackItem.status)}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-5 w-5 ${
                                i < selectedFeedbackItem.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-lg font-bold">{selectedFeedbackItem.rating}/5</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Feedback</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedFeedbackItem.comment}</p>
                    </div>
                    
                    {selectedFeedbackItem.categories && selectedFeedbackItem.categories.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Categories</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedFeedbackItem.categories.map(cat => (
                            <Badge key={cat} variant="secondary" className="text-xs capitalize">
                              {cat.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Channel</p>
                      <Badge variant="outline" className="capitalize">
                        {selectedFeedbackItem.channel || 'app'}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date</p>
                      <p className="text-sm">{format(new Date(selectedFeedbackItem.createdAt), 'PPpp')}</p>
                    </div>
                  </div>
                  
                  {selectedFeedbackItem.merchantResponse && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Previous Response</p>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Reply className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{selectedFeedbackItem.merchantResponse.respondedBy}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(selectedFeedbackItem.merchantResponse.respondedAt), 'PPpp')}
                            </span>
                          </div>
                          <p className="text-sm">{selectedFeedbackItem.merchantResponse.responseText}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              {/* Reply Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Respond to Feedback</CardTitle>
                  <CardDescription>
                    Send a response to this customer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Response</label>
                    <Textarea
                      placeholder="Type your response here..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={replyStatus}
                      onChange={(e) => setReplyStatus(e.target.value as any)}
                    >
                      <option value="reviewed">Reviewed</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  
                  <Button 
                    className="w-full gap-2"
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || respondMutation.isPending}
                  >
                    <Reply className="h-4 w-4" />
                    {respondMutation.isPending ? 'Sending...' : 'Send Response'}
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Empty State */
            <Card className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-medium">Select Feedback</h3>
              <p className="text-sm text-muted-foreground mt-1 px-4">
                Click on any customer feedback to view details and respond
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerFeedbackPage;
