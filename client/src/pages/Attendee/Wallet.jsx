import { useState, useEffect } from 'react';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, Calendar, CreditCard, DollarSign, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import CreditCardForm from '@/components/ui/CreditCardForm.jsx';
import apiClient from '@/helpers/apiCore.js';

export default function Wallet() {
  const [walletInfo, setWalletInfo] = useState({
    balance: 0,
    monthly_spent: 0,
    monthly_added: 0,
    total_transactions: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [loadAmount, setLoadAmount] = useState('');
  const [isLoadingMoney, setIsLoadingMoney] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [filterBy, setFilterBy] = useState('all');
  const [showCreditCardForm, setShowCreditCardForm] = useState(false);
  const [error, setError] = useState(null);

  // Fetch wallet info and transactions on component mount
  useEffect(() => {
    fetchWalletData();
  }, []);

  // Fetch transactions when filter changes
  useEffect(() => {
    fetchTransactions();
  }, [filterBy]);

  const fetchWalletData = async () => {
    try {
      setIsLoadingData(true);
      setError(null);

      // Fetch wallet info
      const walletResponse = await apiClient.get('/users/wallet');
      setWalletInfo(walletResponse.data);

      // Fetch transactions
      await fetchTransactions();

    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError(err.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await apiClient.get('/users/wallet/transactions', { filter: filterBy });
      setTransactions(response.data);

    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
    }
  };

  const handleLoadMoney = () => {
    if (!loadAmount || parseFloat(loadAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setShowCreditCardForm(true);
  };

  const handleCreditCardSubmit = async (cardData) => {
    try {
      setIsLoadingMoney(true);
      setError(null);
      
      const response = await apiClient.post('/users/wallet/topup', {
        amount: parseFloat(loadAmount),
        card_data: cardData
      });

      // Update wallet info with new balance
      setWalletInfo(prev => ({
        ...prev,
        balance: response.data.new_balance,
        monthly_added: prev.monthly_added + response.data.amount
      }));

      // Reset form and close modal
      setLoadAmount('');
      setShowCreditCardForm(false);
      
      // Refresh transactions
      await fetchTransactions();

    } catch (err) {
      console.error('Error processing top-up:', err);
      setError(err.message);
    } finally {
      setIsLoadingMoney(false);
    }
  };

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

  if (isLoadingData) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-96">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Wallet</h1>
          <p className="text-muted-foreground mt-1">Manage your balance and view transaction history</p>
          {error && (
            <div className="mt-2 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
              {error}
            </div>
          )}
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
                ${walletInfo.balance.toFixed(2)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">This Month Spent</p>
                  <p className="font-semibold text-red-600">-${walletInfo.monthly_spent.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">This Month Added</p>
                  <p className="font-semibold text-green-600">+${walletInfo.monthly_added.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Transactions</p>
                  <p className="font-semibold">{walletInfo.total_transactions}</p>
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
                Top up your wallet with credit card
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

              <Dialog open={showCreditCardForm} onOpenChange={setShowCreditCardForm}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full" 
                    onClick={handleLoadMoney}
                    disabled={!loadAmount || parseFloat(loadAmount) <= 0}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Add ${loadAmount || '0'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Money to Wallet</DialogTitle>
                    <DialogDescription>
                      Complete your payment to add funds to your wallet
                    </DialogDescription>
                  </DialogHeader>
                  <CreditCardForm
                    amount={loadAmount}
                    onSubmit={handleCreditCardSubmit}
                    isLoading={isLoadingMoney}
                  />
                </DialogContent>
              </Dialog>
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
              
              <div className="flex gap-2">
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter transactions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="deposits">Deposits & Refunds</SelectItem>
                    <SelectItem value="expenses">Expenses</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={fetchWalletData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-16">
                <WalletIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-500">Your transaction history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction, index) => (
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
                        </div>
                      </div>
                    </div>
                    {index < transactions.length - 1 && <Separator />}
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
