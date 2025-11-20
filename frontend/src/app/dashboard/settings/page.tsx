'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCurrentUser, getApiUrl } from '@/lib/auth';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMessage, setShowMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Get company_id from auth
  const user = getCurrentUser();
  const companyId = user?.companyId;

  useEffect(() => {
    // Check if user just completed OAuth
    const shopifyStatus = searchParams.get('shopify');
    const shop = searchParams.get('shop');
    const message = searchParams.get('message');

    if (shopifyStatus === 'connected' && shop) {
      setShowMessage({
        type: 'success',
        text: `Successfully connected to ${shop}! 🎉`
      });
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/settings');
      checkShopifyStatus();
    } else if (shopifyStatus === 'error') {
      setShowMessage({
        type: 'error',
        text: `Failed to connect: ${message || 'Unknown error'}`
      });
      window.history.replaceState({}, '', '/dashboard/settings');
    } else {
      checkShopifyStatus();
    }
  }, [searchParams]);

  const checkShopifyStatus = async () => {
    try {
      const response = await fetch(
        getApiUrl(`/shopify/status?company_id=${companyId}`)
      );
      const data = await response.json();

      if (data.connected) {
        setShopifyConnected(true);
        setShopInfo(data.shop);
      }
    } catch (error) {
      console.error('Error checking Shopify status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectShopify = () => {
    const shopName = prompt(
      'Enter your Shopify store:\n\n' +
      'Examples:\n' +
      '• my-store\n' +
      '• my-store.myshopify.com\n' +
      '• https://admin.shopify.com/store/my-store\n\n' +
      'Your store:'
    );

    if (!shopName) return;

    // Redirect to Python backend OAuth endpoint
    const oauthUrl = getApiUrl(`/shopify/install?shop=${encodeURIComponent(shopName)}&company_id=${companyId}`);
    window.location.href = oauthUrl;
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Shopify store?')) {
      return;
    }

    try {
      await fetch(getApiUrl('/shopify/disconnect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      });

      setShopifyConnected(false);
      setShopInfo(null);
      setShowMessage({
        type: 'success',
        text: 'Shopify store disconnected successfully'
      });
    } catch (error) {
      setShowMessage({
        type: 'error',
        text: 'Failed to disconnect Shopify store'
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Success/Error Messages */}
      {showMessage && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            showMessage.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <p className="font-medium">{showMessage.text}</p>
          <button
            onClick={() => setShowMessage(null)}
            className="mt-2 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Shopify Integration Section */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Shopify Integration</h2>

        {!shopifyConnected ? (
          <div>
            <p className="text-gray-600 mb-4">
              Connect your Shopify store to automatically sync products and track creator sales.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-blue-900 mb-2">What you'll get:</h3>
              <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm">
                <li>Automatic product syncing to our AI matching system</li>
                <li>Track orders from creator affiliate links</li>
                <li>Generate discount codes for creators</li>
                <li>Revenue attribution and analytics</li>
              </ul>
            </div>

            <button
              onClick={handleConnectShopify}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Connect Shopify Store
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="font-medium text-green-700">Connected</span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Store Name:</span>
                  <span className="font-medium">{shopInfo?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Domain:</span>
                  <span className="font-medium">{shopInfo?.domain || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{shopInfo?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Currency:</span>
                  <span className="font-medium">{shopInfo?.currency || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = '/dashboard/products'}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                View Products
              </button>

              <button
                onClick={handleDisconnect}
                className="px-6 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
              >
                Disconnect Store
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Other Settings Sections */}
      <div className="mt-6 bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
        <p className="text-gray-600">Additional settings coming soon...</p>
      </div>
    </div>
  );
}
