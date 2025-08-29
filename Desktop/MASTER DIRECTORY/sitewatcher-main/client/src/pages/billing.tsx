import { useState } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Download, 
  Crown,
  Calendar,
  DollarSign,
  CheckCircle,
  Star,
  Zap,
  Users,
  BarChart3
} from "lucide-react";

export default function Billing() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Mock subscription data
  const subscription = {
    plan: "Pro",
    status: "active",
    price: 29,
    billing: "monthly",
    nextBilling: "2025-09-17",
    features: [
      "Unlimited site monitoring",
      "Advanced SEO analytics", 
      "Keyword tracking",
      "White-label reports",
      "Priority support",
      "API access"
    ]
  };

  // Mock billing history
  const billingHistory = [
    { id: 1, date: "2025-08-17", amount: 29.00, status: "paid", invoice: "INV-2025-08-001" },
    { id: 2, date: "2025-07-17", amount: 29.00, status: "paid", invoice: "INV-2025-07-001" },
    { id: 3, date: "2025-06-17", amount: 29.00, status: "paid", invoice: "INV-2025-06-001" },
    { id: 4, date: "2025-05-17", amount: 29.00, status: "paid", invoice: "INV-2025-05-001" },
  ];

  const handleDownloadInvoice = (invoice: string) => {
    toast({
      title: "Downloading Invoice",
      description: `${invoice} will be downloaded shortly.`,
    });
  };

  const handleManagePayment = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Coming Soon",
        description: "Payment management portal will be available soon.",
      });
    }, 1000);
  };

  const handleUpgradePlan = () => {
    toast({
      title: "Already on Pro",
      description: "You're already on our highest tier plan!",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <PageLayout 
      title="Billing & Subscription" 
      description="Manage your subscription, payment methods, and billing history"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Current Plan */}
        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 text-purple-600" />
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Current Plan
                    <Badge className="bg-purple-600 hover:bg-purple-700">
                      <Star className="h-3 w-3 mr-1" />
                      {subscription.plan}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Billed {subscription.billing} • Next billing: {formatDate(subscription.nextBilling)}
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ${subscription.price}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  per month
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  What's Included
                </h4>
                <ul className="space-y-2">
                  {subscription.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  onClick={handleUpgradePlan}
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Manage Plan
                </Button>
                <Button 
                  onClick={handleManagePayment}
                  disabled={isLoading}
                  className="w-full"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isLoading ? "Loading..." : "Manage Payment"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Sites Monitored
                  </p>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    of unlimited
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Analyses This Month
                  </p>
                  <p className="text-2xl font-bold">47</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    of unlimited
                  </p>
                </div>
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    API Calls
                  </p>
                  <p className="text-2xl font-bold">1.2k</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    of unlimited
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Plan Status
                  </p>
                  <p className="text-2xl font-bold text-green-600">Active</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    since May 2025
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
            <CardDescription>
              Your default payment method for subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">
                  VISA
                </div>
                <div>
                  <p className="font-medium">•••• •••• •••• 4242</p>
                  <p className="text-sm text-gray-500">Expires 12/27</p>
                </div>
              </div>
              <Badge variant="secondary">Default</Badge>
            </div>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={handleManagePayment}
              disabled={isLoading}
            >
              Update Payment Method
            </Button>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Billing History
            </CardTitle>
            <CardDescription>
              Your recent invoices and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>{formatDate(bill.date)}</TableCell>
                    <TableCell className="font-mono text-sm">{bill.invoice}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {bill.amount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={bill.status === "paid" ? "default" : "secondary"}
                        className={bill.status === "paid" ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownloadInvoice(bill.invoice)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Next Billing */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  Next Billing Date
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {formatDate(subscription.nextBilling)} • ${subscription.price}.00 will be charged
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}