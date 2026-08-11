import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Plus, 
  Filter,
  UserCheck,
  TrendingUp,
  Target,
  MessageSquare,
  Gift,
  Settings,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '@/components/Layout/PageHeader';

// Mock data for customer groups
const CUSTOMER_GROUPS = [
  {
    id: 'vip',
    name: 'VIP Customers',
    description: 'High-value customers with special privileges',
    icon: '👑',
    memberCount: 24,
    criteria: 'Total spent > ETB 10,000',
    lastUpdated: '2026-08-07T10:30:00Z',
    tags: ['high-value', 'priority'],
    color: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  {
    id: 'loyalty-gold',
    name: 'Gold Tier Loyalty',
    description: 'Customers with gold loyalty status',
    icon: '⭐',
    memberCount: 56,
    criteria: 'Loyalty tier = gold',
    lastUpdated: '2026-08-06T15:45:00Z',
    tags: ['loyalty', 'active'],
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  },
  {
    id: 'monthly-active',
    name: 'Monthly Active',
    description: 'Customers with activity in current month',
    icon: '📊',
    memberCount: 189,
    criteria: 'Last seen within 30 days',
    lastUpdated: '2026-08-08T09:15:00Z',
    tags: ['active', 'recent'],
    color: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    id: 'birthday-month',
    name: 'Birthday Month',
    description: 'Customers with birthdays this month',
    icon: '🎂',
    memberCount: 12,
    criteria: 'Birthday month = current month',
    lastUpdated: '2026-08-01T00:00:00Z',
    tags: ['special', 'marketing'],
    color: 'bg-pink-100 text-pink-800 border-pink-300'
  },
  {
    id: 'prefers-spicy',
    name: 'Spicy Food Lovers',
    description: 'Customers who prefer spicy food',
    icon: '🌶️',
    memberCount: 67,
    criteria: 'Tags include "spicy" or notes mention spicy',
    lastUpdated: '2026-08-05T14:20:00Z',
    tags: ['preference', 'food'],
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  {
    id: 'vegetarian',
    name: 'Vegetarian Customers',
    description: 'Customers with vegetarian preferences',
    icon: '🥗',
    memberCount: 42,
    criteria: 'Tags include "vegetarian"',
    lastUpdated: '2026-08-04T11:30:00Z',
    tags: ['diet', 'preference'],
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  {
    id: 'corporate',
    name: 'Corporate Clients',
    description: 'Business and corporate customers',
    icon: '🏢',
    memberCount: 18,
    criteria: 'Source = corporate or tags include "business"',
    lastUpdated: '2026-08-03T16:40:00Z',
    tags: ['business', 'b2b'],
    color: 'bg-gray-100 text-gray-800 border-gray-300'
  },
  {
    id: 'new-this-month',
    name: 'New This Month',
    description: 'Customers who joined this month',
    icon: '🆕',
    memberCount: 34,
    criteria: 'Created within current month',
    lastUpdated: '2026-08-08T08:00:00Z',
    tags: ['new', 'acquisition'],
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  }
];

const SEGMENT_TYPES = [
  { id: 'all', label: 'All Segments', icon: <Users className="h-4 w-4" /> },
  { id: 'behavior', label: 'Behavior', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'preference', label: 'Preferences', icon: <Target className="h-4 w-4" /> },
  { id: 'demographic', label: 'Demographic', icon: <UserCheck className="h-4 w-4" /> },
  { id: 'loyalty', label: 'Loyalty', icon: <Gift className="h-4 w-4" /> },
];

const CustomerGroupsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSegment, setActiveSegment] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  
  // Filter groups based on search and segment
  const filteredGroups = CUSTOMER_GROUPS.filter(group => {
    const matchesSearch = 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSegment = activeSegment === 'all' || 
      group.tags.some(tag => {
        if (activeSegment === 'behavior') return ['active', 'recent', 'new'].includes(tag);
        if (activeSegment === 'preference') return ['preference', 'food', 'diet'].includes(tag);
        if (activeSegment === 'demographic') return ['business', 'b2b'].includes(tag);
        if (activeSegment === 'loyalty') return ['loyalty', 'high-value'].includes(tag);
        return true;
      });
    
    return matchesSearch && matchesSegment;
  });
  
  const totalCustomers = CUSTOMER_GROUPS.reduce((sum, group) => sum + group.memberCount, 0);
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Customer Groups & Segments"
        subtitle="Create and manage customer segments for targeted marketing and analysis"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search groups..."
        actionLabel="Create New Group"
        onAction={() => {}}
      />
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Groups</p>
                <p className="text-2xl font-bold">{CUSTOMER_GROUPS.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Segmented</p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active This Month</p>
                <p className="text-2xl font-bold">189</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Group Size</p>
                <p className="text-2xl font-bold">
                  {Math.round(totalCustomers / CUSTOMER_GROUPS.length)}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Filters and Segments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search groups by name, description, or tags..."
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
              
              {/* Segment Type Tabs */}
              <div className="mt-4">
                <Tabs value={activeSegment} onValueChange={setActiveSegment}>
                  <TabsList className="grid grid-cols-5">
                    {SEGMENT_TYPES.map(type => (
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
          
          {/* Customer Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGroups.map(group => (
              <Card 
                key={group.id} 
                className={`border-2 hover:shadow-md transition-all cursor-pointer ${
                  selectedGroup === group.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-lg ${group.color} flex items-center justify-center text-xl`}>
                        {group.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <CardDescription className="line-clamp-1">
                          {group.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg px-3">
                      {group.memberCount}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {group.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="text-sm">
                      <p className="font-medium">Criteria:</p>
                      <p className="text-muted-foreground">{group.criteria}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Updated: {format(new Date(group.lastUpdated), 'MMM d')}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Gift className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Create New Group Card */}
            <Card className="border-dashed border-2 hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Create New Group</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a custom customer segment based on your criteria
                </p>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Customer Segment
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {filteredGroups.length === 0 && (
            <Card className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-medium">No groups found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'Try adjusting your search terms' : 'No customer groups created yet'}
              </p>
            </Card>
          )}
        </div>
        
        {/* Right Column - Selected Group Details */}
        <div className="space-y-6">
          {selectedGroup ? (
            <>
              {/* Selected Group Details */}
              {(() => {
                const group = CUSTOMER_GROUPS.find(g => g.id === selectedGroup);
                if (!group) return null;
                
                return (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-lg ${group.color} flex items-center justify-center text-xl`}>
                          {group.icon}
                        </div>
                        <div>
                          <CardTitle>{group.name}</CardTitle>
                          <CardDescription>{group.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Members</p>
                        <p className="text-2xl font-bold">{group.memberCount} customers</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Criteria</p>
                        <p className="text-sm">{group.criteria}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {group.tags.map(tag => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Last Updated</p>
                        <p className="text-sm">
                          {format(new Date(group.lastUpdated), 'PPpp')}
                        </p>
                      </div>
                      
                      <div className="pt-4 space-y-2">
                        <Button className="w-full gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Send Message to Group
                        </Button>
                        <Button variant="outline" className="w-full gap-2">
                          <Gift className="h-4 w-4" />
                          Send Group Promotion
                        </Button>
                        <Button variant="outline" className="w-full gap-2">
                          <Settings className="h-4 w-4" />
                          Edit Group Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
              
              {/* Group Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Group Analytics</CardTitle>
                  <CardDescription>Performance metrics for this segment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Avg Order Value</p>
                      <p className="text-xl font-bold">ETB 1,250</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Monthly Growth</p>
                      <p className="text-xl font-bold text-green-600">+12.5%</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Engagement Rate</p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '78%' }} />
                      </div>
                      <span className="text-sm font-medium">78%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Loyalty Points</p>
                    <p className="text-lg font-medium">Average: 450 points</p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Empty State */
            <Card className="text-center py-12">
              <Target className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-medium">Select a Group</h3>
              <p className="text-sm text-muted-foreground mt-1 px-4">
                Click on any customer group to view detailed analytics and management options
              </p>
            </Card>
          )}
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common group management tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2">
                <MessageSquare className="h-4 w-4" />
                Bulk Message
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Gift className="h-4 w-4" />
                Create Promotion
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" />
                Export Members
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <TrendingUp className="h-4 w-4" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerGroupsPage;