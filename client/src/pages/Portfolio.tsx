import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, TrendingUp, ArrowUpIcon, ArrowDownIcon, Plus, DollarSign, RefreshCw } from "lucide-react";
import { type Property, type Investment, type Transaction } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useICPWallet } from "@/components/ICPWalletProvider";
import { apiRequest } from "@/lib/queryClient";

export default function Portfolio() {
  const { toast } = useToast();
  const { wallet, sellProperty } = useICPWallet();
  const queryClient = useQueryClient();
  
  const { data: properties = [], isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time data
  });

  const { data: investments = [], isLoading: investmentsLoading } = useQuery<Investment[]>({
    queryKey: ["/api/investments"],
    refetchInterval: 10000, // Refresh every 10 seconds for real-time data
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    refetchInterval: 15000, // Refresh every 15 seconds for real-time data
  });

  // Real portfolio investments with enhanced data
  const portfolioInvestments = investments.map(investment => {
    const property = properties.find(p => p.id === investment.propertyId);
    const currentValue = parseFloat(investment.currentValue);
    const investmentAmount = parseFloat(investment.investmentAmount.toString());
    const returns = currentValue - investmentAmount;
    const returnsPercentage = investmentAmount > 0 ? ((returns / investmentAmount) * 100) : 0;

    return {
      ...investment,
      property,
      returns,
      returnsPercentage: Math.round(returnsPercentage * 10) / 10
    };
  });

  // Sell mutation with real-time updates
  const sellMutation = useMutation({
    mutationFn: async (investmentId: number) => {
      if (!wallet.isConnected) {
        throw new Error("Wallet not connected");
      }
      
      const investment = portfolioInvestments.find(inv => inv.id === investmentId);
      if (!investment) {
        throw new Error("Investment not found");
      }
      
      // Create sale transaction first
      const transactionResponse = await fetch('/api/transactions', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 1, // Current user ID
          propertyId: investment.propertyId,
          type: "sale",
          amount: investment.currentValue.toString(),
          tokens: investment.tokensOwned,
        })
      });

      if (!transactionResponse.ok) {
        throw new Error("Failed to create transaction");
      }

      // Use ICP wallet to sell property
      const result = await sellProperty(investmentId);
      
      // Update investment status
      const updateResponse = await fetch(`/api/investments/${investmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: false,
          currentValue: "0",
        })
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update investment");
      }

      return result;
    },
    onSuccess: (result) => {
      toast({
        title: "Property Sold Successfully!",
        description: `Sold ${result.tokensOwned} tokens for ${formatCurrency(result.saleAmount)}. New balance: ${formatCurrency(result.newBalance)}`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sale Failed",
        description: error.message || "Failed to sell property. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mock recent transactions
  const recentTransactions = [
    {
      id: 1,
      type: "Token Purchase",
      property: "Manhattan Luxury Residences",
      amount: "+250 RTC",
      date: "2 days ago",
      icon: Plus,
      color: "text-secondary"
    },
    {
      id: 2,
      type: "Dividend Payment",
      property: "Downtown Business Center",
      amount: "+$127.50",
      date: "5 days ago",
      icon: DollarSign,
      color: "text-accent"
    },
    {
      id: 3,
      type: "Token Sale",
      property: "Oceanview Condominiums",
      amount: "-150 RTC",
      date: "1 week ago",
      icon: TrendingUp,
      color: "text-primary"
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleViewProperty = (property: Property | undefined) => {
    if (!property) {
      toast({
        title: "Property Not Found",
        description: "Property details are not available.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: `${property.title}`,
      description: `${property.location} • ${property.propertyType} • Expected ROI: ${property.expectedROI}%`,
    });
  };

  const handleSellTokens = (investment: any) => {
    if (!wallet.isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your ICP wallet to sell tokens.",
        variant: "destructive",
      });
      return;
    }

    sellMutation.mutate(investment.id);
  };

  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
    queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    
    toast({
      title: "Data Refreshed",
      description: "Portfolio data has been updated with latest information.",
    });
  };

  const totalPortfolioValue = portfolioInvestments.reduce((sum, inv) => sum + parseFloat(inv.currentValue), 0);
  const totalInvested = portfolioInvestments.reduce((sum, inv) => sum + parseFloat(inv.investmentAmount.toString()), 0);
  const totalReturns = totalPortfolioValue - totalInvested;
  const totalReturnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Your Portfolio
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Manage your real estate investments and track performance
          </p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {formatCurrency(totalPortfolioValue)}
              </div>
              <div className="flex items-center text-sm">
                <ArrowUpIcon className="h-4 w-4 text-secondary mr-1" />
                <span className="text-secondary font-medium">
                  {formatCurrency(totalReturns)} ({totalReturnsPercentage.toFixed(1)}%)
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {formatCurrency(totalInvested)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Across {portfolioInvestments.length} properties
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {portfolioInvestments.reduce((sum, inv) => sum + inv.tokensOwned, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                RTC Tokens owned
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Holdings Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Tokens Owned</TableHead>
                    <TableHead>Investment</TableHead>
                    <TableHead>Current Value</TableHead>
                    <TableHead>Returns</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolioInvestments.map((investment) => (
                    <TableRow key={investment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div className="flex items-center">
                          <img 
                            src={investment.property?.imageUrl} 
                            alt={investment.property?.title}
                            className="w-12 h-12 rounded-lg object-cover mr-4"
                          />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {investment.property?.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {investment.property?.location}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {investment.tokensOwned.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(investment.investmentAmount)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(investment.currentValue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <ArrowUpIcon className="h-4 w-4 text-secondary mr-1" />
                          <span className="text-secondary font-medium">
                            {formatCurrency(investment.returns)} ({investment.returnsPercentage}%)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewProperty(investment.property)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleSellTokens(investment)}
                          >
                            Sell
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => {
                const Icon = transaction.icon;
                return (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mr-4">
                        <Icon className={`h-5 w-5 ${transaction.color}`} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {transaction.type}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {transaction.property}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${transaction.color}`}>
                        {transaction.amount}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.date}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
