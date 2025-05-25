import { useState } from 'react';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, Calendar, CreditCard, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function Wallet() {
  const [balance, setBalance] = useState(245.67);
  const [loadAmount, setLoadAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isLoadingMoney, setIsLoadingMoney] = useState(false);
  const [filterBy, setFilterBy] = useState('all');

  // Mock transaction data - would come from API in real app
  const transactions = [
    {
      id: 1,
      type: 'expense',
      description: 'Summer Music Festival Ticket',
      amount: -75.00,
      date: '2023-07-10',
      time: '14:30',
      status: 'completed',
      eventId: 1
    },
    {
      id: 2,
      type: 'deposit',
      description: 'Wallet Top-up',
      amount: 100.00,
      date: '2023-07-08',
      time: '10:15',
      status: 'completed',
      paymentMethod: 'Credit Card'
    },
    {
      id: 3,
      type: 'expense',
      description: 'Tech Conference 2023 Ticket',
      amount: -250.00,
      date: '2023-07-05',
      time: '09:45',
      status: 'completed',
      eventId: 2
    },
    {
      id: 4,
      type: 'refund',
      description: 'Comedy Night Refund',
      amount: 35.00,
      date: '2023-07-03',
      time: '16:20',
      status: 'completed',
      eventId: 3
    },
    {
      id: 5,
      type: 'deposit',
      description: 'Wallet Top-up',
      amount: 200.00,
      date: '2023-07-01',
      time: '12:00',
      status: 'completed',
      paymentMethod: 'Bank Transfer'
    },
    {
      id: 6,
      type: 'expense',
      description: 'Art Exhibition Ticket',
      amount: -20.00,
      date: '2023-06-28',
      time: '11:30',
      status: 'pending',
      eventId: 4
    },
    {
      id: 7,
      type: 'expense',
      description: 'Jazz in the Garden Ticket',
      amount: -45.00,
      date: '2023-06-25',
      time: '19:15',
      status: 'completed',
      eventId: 5
    }
  ];

  const handleLoadMoney = async () => {
    if (!loadAmount || parseFloat(loadAmount) <= 0) return;
    
    setIsLoadingMoney(true);
    
    // Simulate API call
    setTimeout(() => {
      setBalance(prev => prev + parseFloat(loadAmount));
      setLoadAmount('');
      setIsLoadingMoney(false);
    }, 2000);
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filterBy === 'all') return true;
    if (filterBy === 'deposits') return transaction.type === 'deposit' || transaction.type === 'refund';
    if (filterBy === 'expenses') return transaction.type === 'expense';
    if (filterBy === 'pending') return transaction.status === 'pending';
    return true;
  });

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'expense':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'refund':
        return <ArrowDownLeft className="h-4 w-4 text-blue-600" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type, amount) => {
    if (type === 'expense') return 'text-red-600';
    if (type === 'deposit' || type === 'refund') return 'text-green-600';
    return amount > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="text-green-700 bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-yellow-700 bg-yellow-100"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="text-red-700 bg-red-100"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Wallet</h1>
          <p className="text-muted-foreground mt-1">Manage your balance and view transaction history</p>
        </div>

        {/* Balance Card and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Balance Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <WalletIcon className="h-6 w-6 mr-2" />
                Current Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground mb-4">
                ${balance.toFixed(2)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">This Month Spent</p>
                  <p className="font-semibold text-red-600">-$390.00</p>
                </div>
                <div>
                  <p className="text-muted-foreground">This Month Added</p>
                  <p className="font-semibold text-green-600">+$300.00</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Transactions</p>
                  <p className="font-semibold">{transactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Money Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Add Money
              </CardTitle>
              <CardDescription>
                Top up your wallet instantly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={loadAmount}
                  onChange={(e) => setLoadAmount(e.target.value)}
                  className="text-lg"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <CreditCard size={16} className="mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                {[25, 50, 100, 200].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setLoadAmount(amount.toString())}
                    className="flex-1"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>

              <Button 
                className="w-full" 
                onClick={handleLoadMoney}
                disabled={!loadAmount || parseFloat(loadAmount) <= 0 || isLoadingMoney}
              >
                {isLoadingMoney ? 'Processing...' : `Add $${loadAmount || '0'}`}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Transaction History</CardTitle>
                <CardDescription>View all your wallet transactions</CardDescription>
              </div>
              
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="deposits">Deposits & Refunds</SelectItem>
                  <SelectItem value="expenses">Expenses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-16">
                <WalletIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-500">Your transaction history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction, index) => (
                  <div key={transaction.id}>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {transaction.description}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(transaction.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <Clock className="h-3 w-3" />
                            <span>{transaction.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(transaction.status)}
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getTransactionColor(transaction.type, transaction.amount)}`}>
                            {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                          </div>
                          {transaction.paymentMethod && (
                            <div className="text-xs text-gray-500">{transaction.paymentMethod}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    {index < filteredTransactions.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
