import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { 
  ChevronLeft, 
  Ticket,
  Calendar,
  MapPin,
  User,
  Download,
  QrCode
} from 'lucide-react';
import apiClient from '../../helpers/apiCore.js';

const TicketDetails = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactionData, setTransactionData] = useState(null);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      try {
        setLoading(true);
        // For now, let's redirect to My Tickets since we don't have a transaction details endpoint yet
        navigate('/my-tickets');
      } catch (err) {
        console.error('Error fetching transaction details:', err);
        setError('Failed to load ticket details');
      } finally {
        setLoading(false);
      }
    };

    if (transactionId) {
      fetchTransactionDetails();
    }
  }, [transactionId, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading ticket details...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <Ticket className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Redirecting to Your Tickets</h2>
          <p className="text-muted-foreground">You will be redirected to view all your tickets...</p>
        </div>
      </div>
    </Layout>
  );
};

export default TicketDetails; 